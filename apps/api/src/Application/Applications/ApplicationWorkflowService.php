<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Applications;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Consent\ConsentService;
use Afyalink\Core\Application\Credentials\CredentialService;
use Afyalink\Core\Application\Payments\PaymentService;
use Afyalink\Core\Application\Professionals\ProfessionalProfileService;
use Afyalink\Core\Domain\Applications\AdminReviewService;
use Afyalink\Core\Domain\Applications\ApplicationRecord;
use Afyalink\Core\Domain\Applications\ApplicationSubmissionService;
use Afyalink\Core\Domain\Applications\ApplicationTimelineEvent;
use Afyalink\Core\Domain\Applications\SubmissionReadinessChecker;
use Afyalink\Core\Domain\Credentials\CredentialRequirementRegistry;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use DateTimeImmutable;
use DomainException;

final readonly class ApplicationWorkflowService
{
    public function __construct(
        private DataStore $store,
        private ProfessionalProfileService $profiles,
        private CredentialService $credentials,
        private ConsentService $consents,
        private PaymentService $payments,
        private AuditLogger $audit,
        private ApplicationSubmissionService $submission = new ApplicationSubmissionService(),
        private AdminReviewService $adminReview = new AdminReviewService(),
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function dashboard(AuthenticatedUser $user): array
    {
        $profile = $this->profiles->findForUser($user->id);
        $credentials = $this->credentials->listForUser($user->id);
        $payments = $this->payments->listForUser($user->id);
        $application = $this->latestForUser($user->id);
        $credentialStatuses = [];

        foreach ($credentials as $credential) {
            $credentialStatuses[$credential['document_type']] = CredentialReviewStatus::from((string) $credential['review_status']);
        }

        $readiness = (new SubmissionReadinessChecker(new CredentialRequirementRegistry()))->evaluate(
            profile: $profile ?? [],
            credentialStatuses: $credentialStatuses,
            acceptedCurrentConsent: $this->consents->hasCurrentConsent($user->id),
            paymentStatus: $this->payments->statusForUser($user->id),
        );

        return [
            'user' => $user->toArray(),
            'profile' => $profile,
            'credentials' => $credentials,
            'consent' => [
                'accepted_current' => $this->consents->hasCurrentConsent($user->id),
                'current_version' => ConsentService::CURRENT_VERSION,
                'current_text' => ConsentService::CURRENT_TEXT,
            ],
            'payments' => $payments,
            'application' => $application,
            'readiness' => $readiness->toArray(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function submit(AuthenticatedUser $user, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $existing = $this->latestForUser($user->id);
        if ($existing !== null && !in_array($existing['status'], [
            ApplicationStatus::Draft->value,
            ApplicationStatus::NeedsReplacement->value,
            ApplicationStatus::Rejected->value,
            ApplicationStatus::Withdrawn->value,
        ], true)) {
            throw new DomainException('An active application already exists for this professional.');
        }

        $profile = $this->profiles->requireForUser($user->id);
        $credentialRecords = array_values($this->credentials->latestCredentialRecordsByUser($user->id));
        $application = $this->submission->submit(
            profile: $profile,
            credentials: $credentialRecords,
            acceptedCurrentConsent: $this->consents->hasCurrentConsent($user->id),
            paymentStatus: $this->payments->statusForUser($user->id),
            actorId: $user->id,
        );

        $row = $this->store->insert('applications', [
            'user_id' => $user->id,
            ...$this->applicationToRow($application),
            'created_at' => $application->createdAt->format(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($user->id, 'application.submitted', 'Application', (string) $row['id'], [
            'application_number' => $row['application_number'],
            'status' => $row['status'],
        ], $ipAddress, $userAgent);

        return $row;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForAdmin(?string $status = null, ?string $search = null): array
    {
        $rows = $this->store->all('applications');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }

        if ($search !== null && trim($search) !== '') {
            $needle = strtolower(trim($search));
            $rows = array_values(array_filter($rows, function (array $row) use ($needle): bool {
                $user = $this->store->find('users', (int) $row['user_id']);

                return str_contains(strtolower((string) ($row['application_number'] ?? '')), $needle)
                    || ($user !== null && str_contains(strtolower((string) ($user['name'] ?? '')), $needle))
                    || ($user !== null && str_contains(strtolower((string) ($user['email'] ?? '')), $needle));
            }));
        }

        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return array_map(fn (array $row): array => $this->adminSummary($row), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function adminDetail(int $applicationId): array
    {
        $application = $this->store->find('applications', $applicationId);
        if ($application === null) {
            throw new NotFoundException('Application was not found.');
        }

        $userId = (int) $application['user_id'];

        $user = $this->store->find('users', $userId);

        return [
            'application' => $application,
            'professional' => $user === null ? null : $this->safeUser($user),
            'profile' => $this->profiles->findForUser($userId),
            'credentials' => $this->credentials->listForUser($userId),
            'payments' => $this->payments->listForUser($userId),
            'consent' => $this->consents->latestForUser($userId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminAction(
        AuthenticatedUser $admin,
        int $applicationId,
        string $action,
        ?string $note,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $row = $this->store->find('applications', $applicationId);
        if ($row === null) {
            throw new NotFoundException('Application was not found.');
        }

        $record = $this->rowToApplication($row);
        $updatedRecord = match ($action) {
            'start_review' => $this->adminReview->moveToReview($record, $admin->id),
            'request_replacement' => $this->adminReview->requestReplacement($record, (string) $note, $admin->id),
            'verify' => $this->adminReview->verify($record, (string) $note, $admin->id),
            'approve' => $this->adminReview->approve($record, (string) $note, $admin->id),
            'reject' => $this->adminReview->reject($record, (string) $note, $admin->id),
            default => throw new DomainException('Unsupported application review action.'),
        };

        $updated = $this->store->update('applications', $applicationId, [
            ...$this->applicationToRow($updatedRecord),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'application.admin_action', 'Application', (string) $applicationId, [
            'action' => $action,
            'from' => $row['status'] ?? null,
            'to' => $updated['status'],
            'professional_user_id' => $row['user_id'] ?? null,
            'note' => $note,
        ], $ipAddress, $userAgent);

        return $updated;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function latestForUser(int $userId): ?array
    {
        $rows = $this->store->where('applications', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return $rows[0] ?? null;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function adminSummary(array $row): array
    {
        $user = $this->store->find('users', (int) $row['user_id']);
        $profile = $this->profiles->findForUser((int) $row['user_id']);

        return [
            'id' => (int) $row['id'],
            'application_number' => (string) $row['application_number'],
            'status' => (string) $row['status'],
            'professional' => [
                'id' => (int) $row['user_id'],
                'name' => (string) ($user['name'] ?? $profile['name'] ?? ''),
                'email' => (string) ($user['email'] ?? $profile['email'] ?? ''),
                'profession' => (string) ($profile['profession'] ?? ''),
                'county' => (string) ($profile['county'] ?? ''),
            ],
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function safeUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => (string) $user['name'],
            'email' => (string) $user['email'],
            'phone' => (string) $user['phone'],
            'roles' => $user['roles'] ?? [],
            'is_active' => (bool) ($user['is_active'] ?? false),
            'created_at' => $user['created_at'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function applicationToRow(ApplicationRecord $application): array
    {
        return [
            'application_number' => $application->applicationNumber,
            'status' => $application->status->value,
            'submitted_at' => $application->submittedAt?->format(DATE_ATOM),
            'review_note' => $application->reviewNote,
            'timeline' => array_map(static fn (ApplicationTimelineEvent $event): array => [
                'from' => $event->from?->value,
                'to' => $event->to->value,
                'note' => $event->note,
                'actor_id' => $event->actorId,
                'occurred_at' => $event->occurredAt->format(DATE_ATOM),
            ], $application->timeline),
        ];
    }

    /**
     * @param array<string, mixed> $row
     */
    private function rowToApplication(array $row): ApplicationRecord
    {
        $timeline = [];
        foreach (($row['timeline'] ?? []) as $event) {
            $timeline[] = new ApplicationTimelineEvent(
                from: isset($event['from']) && $event['from'] !== null ? ApplicationStatus::from((string) $event['from']) : null,
                to: ApplicationStatus::from((string) $event['to']),
                note: $event['note'] === null ? null : (string) $event['note'],
                actorId: isset($event['actor_id']) && $event['actor_id'] !== null ? (int) $event['actor_id'] : null,
                occurredAt: new DateTimeImmutable((string) $event['occurred_at']),
            );
        }

        return new ApplicationRecord(
            applicationNumber: (string) $row['application_number'],
            status: ApplicationStatus::from((string) $row['status']),
            createdAt: new DateTimeImmutable((string) $row['created_at']),
            submittedAt: empty($row['submitted_at']) ? null : new DateTimeImmutable((string) $row['submitted_at']),
            reviewNote: $row['review_note'] === null ? null : (string) $row['review_note'],
            timeline: $timeline,
        );
    }
}
