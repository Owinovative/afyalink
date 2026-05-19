<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Facilities;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Enums\FacilityReviewStatus;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;
use DomainException;

final readonly class FacilityService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private ?NotificationService $notifications = null,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function upsertForUser(
        AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, [
            'legal_name',
            'display_name',
            'facility_type',
            'county',
            'email',
            'phone',
            'contact_person',
        ]);
        Validator::email('email', $input['email']);

        $membership = $this->membershipForUser($user->id);
        $now = gmdate(DATE_ATOM);
        $payload = [
            'legal_name' => trim((string) $input['legal_name']),
            'display_name' => trim((string) $input['display_name']),
            'facility_type' => trim((string) $input['facility_type']),
            'registration_number' => $this->nullableString($input['registration_number'] ?? null),
            'county' => trim((string) $input['county']),
            'location' => $this->nullableString($input['location'] ?? null),
            'email' => strtolower(trim((string) $input['email'])),
            'phone' => trim((string) $input['phone']),
            'physical_address' => $this->nullableString($input['physical_address'] ?? null),
            'contact_person' => trim((string) $input['contact_person']),
            'updated_at' => $now,
        ];

        if ($membership === null) {
            $facility = $this->store->insert('facilities', [
                ...$payload,
                'operational_status' => 'pending_onboarding',
                'review_status' => FacilityReviewStatus::Draft->value,
                'created_by' => $user->id,
                'reviewed_by' => null,
                'review_note' => null,
                'submitted_at' => null,
                'reviewed_at' => null,
                'created_at' => $now,
            ]);
            $this->store->insert('facility_memberships', [
                'facility_id' => (int) $facility['id'],
                'user_id' => $user->id,
                'role' => UserRole::FacilityAdmin->value,
                'status' => 'active',
                'invited_by' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $action = 'facility.created';
        } else {
            $facility = $this->requireFacility((int) $membership['facility_id']);
            $facility = $this->store->update('facilities', (int) $facility['id'], $payload);
            $action = 'facility.updated';
        }

        $this->audit->record($user->id, $action, 'Facility', (string) $facility['id'], [
            'review_status' => $facility['review_status'] ?? null,
            'county' => $facility['county'] ?? null,
            'facility_type' => $facility['facility_type'] ?? null,
        ], $ipAddress, $userAgent);

        return $this->detailForFacilityUser($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function submitForReview(AuthenticatedUser $user, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $facility = $this->facilityForUser($user->id);
        if ($facility === null) {
            throw new DomainException('Facility details are required before review submission.');
        }

        $status = FacilityReviewStatus::from((string) $facility['review_status']);
        if (!in_array($status, [
            FacilityReviewStatus::Draft,
            FacilityReviewStatus::Rejected,
            FacilityReviewStatus::ClarificationRequested,
        ], true)) {
            throw new DomainException('Facility is already submitted or approved.');
        }

        $updated = $this->store->update('facilities', (int) $facility['id'], [
            'review_status' => FacilityReviewStatus::Submitted->value,
            'operational_status' => 'pending_review',
            'submitted_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($user->id, 'facility.submitted', 'Facility', (string) $updated['id'], [
            'review_status' => $updated['review_status'],
        ], $ipAddress, $userAgent);
        $this->notifications?->facilityOnboardingSubmitted($updated);

        return $this->detailForFacilityUser($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function detailForFacilityUser(AuthenticatedUser $user): array
    {
        $membership = $this->membershipForUser($user->id);
        $facility = $membership === null ? null : $this->safeFacility($this->requireFacility((int) $membership['facility_id']));

        return [
            'facility' => $facility,
            'membership' => $membership === null ? null : $this->safeMembership($membership),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function facilityForUser(int $userId): ?array
    {
        $membership = $this->membershipForUser($userId);
        if ($membership === null) {
            return null;
        }

        return $this->store->find('facilities', (int) $membership['facility_id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function requireApprovedFacilityForUser(int $userId): array
    {
        $facility = $this->facilityForUser($userId);
        if ($facility === null) {
            throw new DomainException('Facility onboarding is required.');
        }

        if (($facility['review_status'] ?? '') !== FacilityReviewStatus::Approved->value) {
            throw new DomainException('Facility must be approved by Afyalink before accessing candidates.');
        }

        return $facility;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForAdmin(?string $status = null, ?string $search = null): array
    {
        $rows = $this->store->all('facilities');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['review_status'] ?? '') === $status));
        }
        if ($search !== null && trim($search) !== '') {
            $needle = strtolower(trim($search));
            $rows = array_values(array_filter($rows, static fn (array $row): bool => str_contains(strtolower((string) ($row['display_name'] ?? '')), $needle)
                || str_contains(strtolower((string) ($row['legal_name'] ?? '')), $needle)
                || str_contains(strtolower((string) ($row['email'] ?? '')), $needle)
                || str_contains(strtolower((string) ($row['registration_number'] ?? '')), $needle)));
        }

        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeFacility($row), $rows);
    }

    /**
     * @return array<string, int>
     */
    public function overview(): array
    {
        $counts = [
            'total' => 0,
            'pending_approval' => 0,
            'active_facilities' => 0,
            'clarification_requested' => 0,
            'rejected' => 0,
        ];

        foreach ($this->store->all('facilities') as $row) {
            $counts['total']++;
            $status = (string) ($row['review_status'] ?? '');
            if (in_array($status, [FacilityReviewStatus::Submitted->value, FacilityReviewStatus::UnderReview->value], true)) {
                $counts['pending_approval']++;
            }
            if ($status === FacilityReviewStatus::Approved->value) {
                $counts['active_facilities']++;
            }
            if ($status === FacilityReviewStatus::ClarificationRequested->value) {
                $counts['clarification_requested']++;
            }
            if ($status === FacilityReviewStatus::Rejected->value) {
                $counts['rejected']++;
            }
        }

        return $counts;
    }

    /**
     * @return array<string, mixed>
     */
    public function adminDetail(int $facilityId): array
    {
        $facility = $this->requireFacility($facilityId);
        $memberships = $this->store->where('facility_memberships', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId);

        return [
            'facility' => $this->safeFacility($facility),
            'memberships' => array_map(fn (array $row): array => $this->safeMembership($row), $memberships),
            'documents' => $this->store->where('facility_documents', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function review(
        AuthenticatedUser $admin,
        int $facilityId,
        string $action,
        ?string $note,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $facility = $this->requireFacility($facilityId);
        $from = FacilityReviewStatus::from((string) $facility['review_status']);
        $to = match ($action) {
            'start_review' => FacilityReviewStatus::UnderReview,
            'approve' => FacilityReviewStatus::Approved,
            'reject' => FacilityReviewStatus::Rejected,
            'request_clarification' => FacilityReviewStatus::ClarificationRequested,
            default => throw new DomainException('Unsupported facility review action.'),
        };
        $this->assertReviewTransition($from, $to);
        if (in_array($to, [FacilityReviewStatus::Rejected, FacilityReviewStatus::ClarificationRequested], true) && trim((string) $note) === '') {
            throw new DomainException('A review note is required for rejection or clarification.');
        }

        $updated = $this->store->update('facilities', $facilityId, [
            'review_status' => $to->value,
            'operational_status' => $to === FacilityReviewStatus::Approved ? 'active' : ($to === FacilityReviewStatus::Rejected ? 'inactive' : 'pending_review'),
            'reviewed_by' => $admin->id,
            'review_note' => $note,
            'reviewed_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'facility.review_status_changed', 'Facility', (string) $facilityId, [
            'from' => $from->value,
            'to' => $to->value,
            'note' => $note,
        ], $ipAddress, $userAgent);
        $this->notifications?->facilityReviewDecision($updated, $to->value, $note);

        return $this->adminDetail($facilityId);
    }

    /**
     * @return array<string, mixed>
     */
    public function requireFacility(int $facilityId): array
    {
        $facility = $this->store->find('facilities', $facilityId);
        if ($facility === null) {
            throw new NotFoundException('Facility was not found.');
        }

        return $facility;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function membershipForUser(int $userId): ?array
    {
        return $this->store->first('facility_memberships', static fn (array $row): bool => (int) $row['user_id'] === $userId && ($row['status'] ?? '') === 'active');
    }

    private function assertReviewTransition(FacilityReviewStatus $from, FacilityReviewStatus $to): void
    {
        $allowed = [
            FacilityReviewStatus::Draft->value => [FacilityReviewStatus::Submitted],
            FacilityReviewStatus::Submitted->value => [FacilityReviewStatus::UnderReview, FacilityReviewStatus::Approved, FacilityReviewStatus::Rejected, FacilityReviewStatus::ClarificationRequested],
            FacilityReviewStatus::UnderReview->value => [FacilityReviewStatus::Approved, FacilityReviewStatus::Rejected, FacilityReviewStatus::ClarificationRequested],
            FacilityReviewStatus::ClarificationRequested->value => [FacilityReviewStatus::Submitted, FacilityReviewStatus::UnderReview, FacilityReviewStatus::Rejected],
            FacilityReviewStatus::Rejected->value => [FacilityReviewStatus::Submitted, FacilityReviewStatus::UnderReview],
            FacilityReviewStatus::Approved->value => [FacilityReviewStatus::ClarificationRequested],
        ];

        if (!in_array($to, $allowed[$from->value] ?? [], true)) {
            throw new DomainException(sprintf('Facility review status cannot move from %s to %s.', $from->value, $to->value));
        }
    }

    private function nullableString(mixed $value): ?string
    {
        $string = trim((string) ($value ?? ''));

        return $string === '' ? null : $string;
    }

    /**
     * @param array<string, mixed> $facility
     * @return array<string, mixed>
     */
    private function safeFacility(array $facility): array
    {
        return [
            'id' => (int) $facility['id'],
            'legal_name' => (string) $facility['legal_name'],
            'display_name' => (string) $facility['display_name'],
            'facility_type' => (string) $facility['facility_type'],
            'registration_number' => $facility['registration_number'] ?? null,
            'county' => (string) $facility['county'],
            'location' => $facility['location'] ?? null,
            'email' => (string) $facility['email'],
            'phone' => (string) $facility['phone'],
            'physical_address' => $facility['physical_address'] ?? null,
            'contact_person' => (string) $facility['contact_person'],
            'operational_status' => (string) $facility['operational_status'],
            'review_status' => (string) $facility['review_status'],
            'review_note' => $facility['review_note'] ?? null,
            'submitted_at' => $facility['submitted_at'] ?? null,
            'reviewed_at' => $facility['reviewed_at'] ?? null,
            'created_at' => (string) $facility['created_at'],
            'updated_at' => (string) $facility['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $membership
     * @return array<string, mixed>
     */
    private function safeMembership(array $membership): array
    {
        $user = $this->store->find('users', (int) $membership['user_id']);

        return [
            'id' => (int) $membership['id'],
            'facility_id' => (int) $membership['facility_id'],
            'user_id' => (int) $membership['user_id'],
            'role' => (string) $membership['role'],
            'status' => (string) $membership['status'],
            'user' => $user === null ? null : [
                'id' => (int) $user['id'],
                'name' => (string) $user['name'],
                'email' => (string) $user['email'],
            ],
        ];
    }
}
