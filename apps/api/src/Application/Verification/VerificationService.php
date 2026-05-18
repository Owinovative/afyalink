<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Verification;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\VerificationStatus;
use Afyalink\Core\Domain\Regulatory\RegulatoryBodyRegistry;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use DomainException;

final readonly class VerificationService
{
    /** @var array<string, list<VerificationStatus>> */
    private const ALLOWED = [
        'pending' => [
            VerificationStatus::Assigned,
            VerificationStatus::InProgress,
            VerificationStatus::NeedsClarification,
        ],
        'assigned' => [
            VerificationStatus::InProgress,
            VerificationStatus::AwaitingExternalResponse,
            VerificationStatus::NeedsClarification,
            VerificationStatus::Verified,
            VerificationStatus::Failed,
        ],
        'in_progress' => [
            VerificationStatus::AwaitingExternalResponse,
            VerificationStatus::NeedsClarification,
            VerificationStatus::Verified,
            VerificationStatus::Failed,
        ],
        'awaiting_external_response' => [
            VerificationStatus::InProgress,
            VerificationStatus::NeedsClarification,
            VerificationStatus::Verified,
            VerificationStatus::Failed,
        ],
        'needs_clarification' => [
            VerificationStatus::InProgress,
            VerificationStatus::Verified,
            VerificationStatus::Failed,
        ],
        'verified' => [],
        'failed' => [],
    ];

    public function __construct(
        private DataStore $store,
        private ApplicationWorkflowService $workflow,
        private AuditLogger $audit,
        private ?NotificationService $notifications = null,
        private RegulatoryBodyRegistry $registry = new RegulatoryBodyRegistry(),
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function regulatoryBodies(): array
    {
        $this->ensureDefaultRegulatoryBodies();

        return array_values(array_filter(
            $this->store->all('regulatory_bodies'),
            static fn (array $row): bool => (bool) ($row['active'] ?? false),
        ));
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createCase(
        AuthenticatedUser $admin,
        int $applicationId,
        array $input = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $this->ensureDefaultRegulatoryBodies();
        $application = $this->workflow->findApplication($applicationId);
        $profile = $this->profileForApplication($application);
        $body = $this->resolveRegulatoryBody($input, $profile);

        $existing = $this->store->first('verification_cases', static fn (array $row): bool => (
            (int) $row['application_id'] === $applicationId
            && (string) $row['regulatory_body_code'] === (string) $body['code']
        ));
        if ($existing !== null) {
            return $this->detail((int) $existing['id']);
        }

        $now = gmdate(DATE_ATOM);
        $case = $this->store->insert('verification_cases', [
            'application_id' => $applicationId,
            'user_id' => (int) $application['user_id'],
            'regulatory_body_id' => (int) $body['id'],
            'regulatory_body_code' => (string) $body['code'],
            'regulatory_body_name' => (string) $body['name'],
            'license_number' => trim((string) ($input['license_number'] ?? $profile['license_number'] ?? '')),
            'verification_method' => trim((string) ($input['verification_method'] ?? $body['default_verification_method'] ?? 'manual_registry_check')),
            'reviewer_id' => isset($input['reviewer_id']) && $input['reviewer_id'] !== '' ? (int) $input['reviewer_id'] : null,
            'status' => empty($input['reviewer_id']) ? VerificationStatus::Pending->value : VerificationStatus::Assigned->value,
            'evidence_reference' => isset($input['evidence_reference']) ? trim((string) $input['evidence_reference']) : null,
            'evidence_notes' => isset($input['evidence_notes']) ? trim((string) $input['evidence_notes']) : null,
            'final_decision_notes' => null,
            'timeline' => [[
                'from' => null,
                'to' => empty($input['reviewer_id']) ? VerificationStatus::Pending->value : VerificationStatus::Assigned->value,
                'note' => 'Verification case opened.',
                'actor_id' => $admin->id,
                'occurred_at' => $now,
            ]],
            'decided_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if (in_array((string) $application['status'], [ApplicationStatus::Submitted->value, ApplicationStatus::UnderReview->value], true)) {
            $this->workflow->transitionStatus(
                applicationId: $applicationId,
                to: ApplicationStatus::AwaitingVerification,
                note: 'Regulatory verification case opened.',
                actorId: $admin->id,
                ipAddress: $ipAddress,
                userAgent: $userAgent,
                auditAction: 'verification.application_advanced',
            );
        }

        $this->audit->record($admin->id, 'verification.created', 'VerificationCase', (string) $case['id'], [
            'application_id' => $applicationId,
            'professional_user_id' => $application['user_id'] ?? null,
            'regulatory_body_code' => $case['regulatory_body_code'],
            'status' => $case['status'],
        ], $ipAddress, $userAgent);

        return $this->detail((int) $case['id']);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(?string $status = null, ?string $regulatoryBodyCode = null, ?string $profession = null): array
    {
        $rows = $this->store->all('verification_cases');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        if ($regulatoryBodyCode !== null && $regulatoryBodyCode !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => strcasecmp((string) ($row['regulatory_body_code'] ?? ''), $regulatoryBodyCode) === 0));
        }
        if ($profession !== null && trim($profession) !== '') {
            $needle = strtolower(trim($profession));
            $rows = array_values(array_filter($rows, function (array $row) use ($needle): bool {
                $profile = $this->profileForUser((int) $row['user_id']);

                return $profile !== null && str_contains(strtolower((string) ($profile['profession'] ?? '')), $needle);
            }));
        }

        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->summary($row), $rows);
    }

    /**
     * @return array<string, int>
     */
    public function overview(): array
    {
        $counts = [
            'total' => 0,
            'pending' => 0,
            'assigned' => 0,
            'in_progress' => 0,
            'awaiting_external_response' => 0,
            'needs_clarification' => 0,
            'verified' => 0,
            'failed' => 0,
        ];

        foreach ($this->store->all('verification_cases') as $row) {
            $counts['total']++;
            $status = (string) ($row['status'] ?? '');
            if (array_key_exists($status, $counts)) {
                $counts[$status]++;
            }
        }

        return $counts;
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(int $caseId): array
    {
        $case = $this->findCase($caseId);

        return [
            'case' => $case,
            'application' => $this->workflow->findApplication((int) $case['application_id']),
            'professional' => $this->safeUser((int) $case['user_id']),
            'profile' => $this->profileForUser((int) $case['user_id']),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function updateStatus(
        AuthenticatedUser $admin,
        int $caseId,
        VerificationStatus $status,
        array $input = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        return $this->store->transaction(function () use ($admin, $caseId, $status, $input, $ipAddress, $userAgent): array {
            $case = $this->findCase($caseId);
            $from = VerificationStatus::from((string) $case['status']);
            $this->assertTransition($from, $status);
            $now = gmdate(DATE_ATOM);
            $timeline = $case['timeline'] ?? [];
            $timeline[] = [
                'from' => $from->value,
                'to' => $status->value,
                'note' => isset($input['note']) ? trim((string) $input['note']) : null,
                'actor_id' => $admin->id,
                'occurred_at' => $now,
            ];

            $updated = $this->store->update('verification_cases', $caseId, [
                'reviewer_id' => isset($input['reviewer_id']) && $input['reviewer_id'] !== '' ? (int) $input['reviewer_id'] : ($case['reviewer_id'] ?? null),
                'status' => $status->value,
                'evidence_reference' => array_key_exists('evidence_reference', $input) ? trim((string) $input['evidence_reference']) : ($case['evidence_reference'] ?? null),
                'evidence_notes' => array_key_exists('evidence_notes', $input) ? trim((string) $input['evidence_notes']) : ($case['evidence_notes'] ?? null),
                'final_decision_notes' => in_array($status, [VerificationStatus::Verified, VerificationStatus::Failed], true)
                    ? trim((string) ($input['final_decision_notes'] ?? $input['note'] ?? ''))
                    : ($case['final_decision_notes'] ?? null),
                'timeline' => $timeline,
                'decided_at' => in_array($status, [VerificationStatus::Verified, VerificationStatus::Failed], true) ? $now : ($case['decided_at'] ?? null),
                'updated_at' => $now,
            ]);

            $this->advanceApplicationForVerification($admin, $updated, $status, $input, $ipAddress, $userAgent);
            $this->audit->record($admin->id, 'verification.status_changed', 'VerificationCase', (string) $caseId, [
                'from' => $from->value,
                'to' => $status->value,
                'application_id' => $case['application_id'] ?? null,
                'professional_user_id' => $case['user_id'] ?? null,
            ], $ipAddress, $userAgent);

            return $this->detail($caseId);
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function professionalCases(int $userId): array
    {
        $rows = $this->store->where('verification_cases', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'regulatory_body_code' => (string) $row['regulatory_body_code'],
            'regulatory_body_name' => (string) $row['regulatory_body_name'],
            'status' => (string) $row['status'],
            'license_number' => (string) $row['license_number'],
            'updated_at' => (string) $row['updated_at'],
        ], $rows);
    }

    /**
     * @param array<string, mixed> $case
     * @param array<string, mixed> $input
     */
    private function advanceApplicationForVerification(
        AuthenticatedUser $admin,
        array $case,
        VerificationStatus $status,
        array $input,
        ?string $ipAddress,
        ?string $userAgent,
    ): void {
        $applicationId = (int) $case['application_id'];
        $application = $this->workflow->findApplication($applicationId);
        $target = match ($status) {
            VerificationStatus::Assigned,
            VerificationStatus::InProgress,
            VerificationStatus::AwaitingExternalResponse => ApplicationStatus::VerificationInProgress,
            VerificationStatus::NeedsClarification => ApplicationStatus::NeedsReplacement,
            VerificationStatus::Verified => ApplicationStatus::VerificationPassed,
            VerificationStatus::Failed => ApplicationStatus::VerificationFailed,
            VerificationStatus::Pending => null,
        };

        if ($target === null || (string) $application['status'] === $target->value) {
            return;
        }

        $this->workflow->transitionStatus(
            applicationId: $applicationId,
            to: $target,
            note: trim((string) ($input['note'] ?? 'Verification status updated.')),
            actorId: $admin->id,
            ipAddress: $ipAddress,
            userAgent: $userAgent,
            auditAction: 'verification.application_status_changed',
        );

        if ($status === VerificationStatus::Verified || $status === VerificationStatus::Failed) {
            $user = $this->store->find('users', (int) $case['user_id']);
            if ($user !== null && $this->notifications !== null) {
                $this->notifications->verificationStatusChanged($user, $case, $status->value);
            }
        }
    }

    private function assertTransition(VerificationStatus $from, VerificationStatus $to): void
    {
        if (!in_array($to, self::ALLOWED[$from->value] ?? [], true)) {
            throw new DomainException(sprintf('Verification status cannot move from %s to %s.', $from->value, $to->value));
        }
    }

    private function ensureDefaultRegulatoryBodies(): void
    {
        foreach ($this->registry->priorityBodies() as $body) {
            $existing = $this->store->first('regulatory_bodies', static fn (array $row): bool => (string) ($row['code'] ?? '') === $body->code);
            if ($existing !== null) {
                continue;
            }

            $this->store->insert('regulatory_bodies', [
                'code' => $body->code,
                'name' => $body->name,
                'profession_coverage' => $body->supportedProfessions,
                'country' => 'Kenya',
                'region' => null,
                'active' => true,
                'default_verification_method' => 'manual_registry_check',
                'verification_instructions' => 'Confirm registration details against the regulator record, document evidence, and record the final decision.',
                'contact_reference' => $body->publicLookupUrl,
                'created_at' => gmdate(DATE_ATOM),
                'updated_at' => gmdate(DATE_ATOM),
            ]);
        }
    }

    /**
     * @param array<string, mixed> $input
     * @param array<string, mixed> $profile
     * @return array<string, mixed>
     */
    private function resolveRegulatoryBody(array $input, array $profile): array
    {
        $code = trim((string) ($input['regulatory_body_code'] ?? ''));
        $body = $code === '' ? null : $this->store->first('regulatory_bodies', static fn (array $row): bool => strcasecmp((string) ($row['code'] ?? ''), $code) === 0);
        if ($body !== null) {
            return $body;
        }

        $profileBody = strtoupper(trim((string) ($profile['regulatory_body'] ?? '')));
        if ($profileBody !== '') {
            $body = $this->store->first('regulatory_bodies', static fn (array $row): bool => strcasecmp((string) ($row['code'] ?? ''), $profileBody) === 0);
            if ($body !== null) {
                return $body;
            }
        }

        $matched = $this->registry->findByProfession((string) ($profile['profession'] ?? ''));
        if ($matched !== null) {
            $body = $this->store->first('regulatory_bodies', static fn (array $row): bool => (string) ($row['code'] ?? '') === $matched->code);
            if ($body !== null) {
                return $body;
            }
        }

        $fallback = $this->store->first('regulatory_bodies', static fn (array $row): bool => (string) ($row['code'] ?? '') === 'OTHER');
        if ($fallback === null) {
            throw new DomainException('No active regulatory body could be resolved for this professional.');
        }

        return $fallback;
    }

    /**
     * @param array<string, mixed> $application
     * @return array<string, mixed>
     */
    private function profileForApplication(array $application): array
    {
        $profile = $this->profileForUser((int) $application['user_id']);
        if ($profile === null) {
            throw new DomainException('Professional profile is required before verification.');
        }

        return $profile;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function profileForUser(int $userId): ?array
    {
        return $this->store->first('profiles', static fn (array $row): bool => (int) $row['user_id'] === $userId);
    }

    /**
     * @return array<string, mixed>
     */
    private function findCase(int $caseId): array
    {
        $case = $this->store->find('verification_cases', $caseId);
        if ($case === null) {
            throw new NotFoundException('Verification case was not found.');
        }

        return $case;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function summary(array $row): array
    {
        $profile = $this->profileForUser((int) $row['user_id']);
        $user = $this->store->find('users', (int) $row['user_id']);

        return [
            'id' => (int) $row['id'],
            'application_id' => (int) $row['application_id'],
            'status' => (string) $row['status'],
            'regulatory_body_code' => (string) $row['regulatory_body_code'],
            'regulatory_body_name' => (string) $row['regulatory_body_name'],
            'license_number' => (string) $row['license_number'],
            'professional' => [
                'id' => (int) $row['user_id'],
                'name' => (string) ($user['name'] ?? $profile['name'] ?? ''),
                'email' => (string) ($user['email'] ?? $profile['email'] ?? ''),
                'profession' => (string) ($profile['profession'] ?? ''),
            ],
            'reviewer_id' => isset($row['reviewer_id']) && $row['reviewer_id'] !== null ? (int) $row['reviewer_id'] : null,
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function safeUser(int $userId): ?array
    {
        $user = $this->store->find('users', $userId);
        if ($user === null) {
            return null;
        }

        return [
            'id' => (int) $user['id'],
            'name' => (string) $user['name'],
            'email' => (string) $user['email'],
            'phone' => (string) $user['phone'],
        ];
    }
}

