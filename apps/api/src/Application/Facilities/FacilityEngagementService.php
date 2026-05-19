<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Facilities;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Enums\FacilityRequestStatus;
use Afyalink\Core\Domain\Enums\RecommendationPackageStatus;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;
use DateTimeImmutable;
use DomainException;

final readonly class FacilityEngagementService
{
    public function __construct(
        private DataStore $store,
        private FacilityService $facilities,
        private FacilityAccessService $access,
        private CandidatePublicationService $publications,
        private AuditLogger $audit,
        private ?NotificationService $notifications = null,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function submitAppointmentRequest(
        AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['title']);
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $candidateIds = $this->candidateIds($input['candidate_publication_ids'] ?? []);
        if ($candidateIds !== []) {
            $this->access->assertFacilityHasActiveAccess((int) $facility['id']);
            $this->publications->assertPublishedCandidateIds($candidateIds);
        }

        $now = gmdate(DATE_ATOM);
        $request = $this->store->insert('facility_requests', [
            'facility_id' => (int) $facility['id'],
            'requester_user_id' => $user->id,
            'request_type' => trim((string) ($input['request_type'] ?? 'appointment_consultation')),
            'title' => trim((string) $input['title']),
            'role_needed' => $this->nullableString($input['role_needed'] ?? null),
            'county' => $this->nullableString($input['county'] ?? null),
            'urgency' => $this->nullableString($input['urgency'] ?? null),
            'experience_level' => $this->nullableString($input['experience_level'] ?? null),
            'preferred_timing' => $this->nullableString($input['preferred_timing'] ?? null),
            'contact_preference' => $this->nullableString($input['contact_preference'] ?? null),
            'notes' => $this->nullableString($input['notes'] ?? null),
            'candidate_publication_ids' => $candidateIds,
            'status' => FacilityRequestStatus::Submitted->value,
            'assigned_to' => null,
            'admin_note' => null,
            'metadata' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->audit->record($user->id, 'facility_request.submitted', 'FacilityRequest', (string) $request['id'], [
            'facility_id' => $facility['id'],
            'request_type' => $request['request_type'],
            'candidate_publication_ids' => $candidateIds,
        ], $ipAddress, $userAgent);
        $this->notifications?->facilityAppointmentCreated($facility, $request);

        return $this->safeFacilityRequest($request);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function submitRecommendationRequest(
        AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['role_needed']);
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $this->access->assertFacilityHasActiveAccess((int) $facility['id']);
        $candidateIds = $this->candidateIds($input['candidate_publication_ids'] ?? []);
        $this->publications->assertPublishedCandidateIds($candidateIds);
        $now = gmdate(DATE_ATOM);
        $request = $this->store->insert('recommendation_requests', [
            'facility_id' => (int) $facility['id'],
            'requester_user_id' => $user->id,
            'role_needed' => trim((string) $input['role_needed']),
            'county' => $this->nullableString($input['county'] ?? null),
            'urgency' => $this->nullableString($input['urgency'] ?? null),
            'experience_level' => $this->nullableString($input['experience_level'] ?? null),
            'notes' => $this->nullableString($input['notes'] ?? null),
            'criteria' => is_array($input['criteria'] ?? null) ? $input['criteria'] : [],
            'candidate_publication_ids' => $candidateIds,
            'status' => FacilityRequestStatus::Submitted->value,
            'assigned_to' => null,
            'admin_note' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->audit->record($user->id, 'recommendation_request.submitted', 'RecommendationRequest', (string) $request['id'], [
            'facility_id' => $facility['id'],
            'role_needed' => $request['role_needed'],
        ], $ipAddress, $userAgent);

        return $this->safeRecommendationRequest($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function facilityDashboard(AuthenticatedUser $user): array
    {
        $facility = $this->facilities->facilityForUser($user->id);
        $facilityId = $facility === null ? null : (int) $facility['id'];

        return [
            'requests' => $facilityId === null ? [] : array_map(fn (array $row): array => $this->safeFacilityRequest($row), $this->requestsForFacility($facilityId)),
            'recommendation_requests' => $facilityId === null ? [] : array_map(fn (array $row): array => $this->safeRecommendationRequest($row), $this->recommendationRequestsForFacility($facilityId)),
            'recommendation_packages' => $facilityId === null ? [] : $this->packagesForFacility($facilityId),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function overview(): array
    {
        $openRequestStatuses = [FacilityRequestStatus::Submitted->value, FacilityRequestStatus::Acknowledged->value, FacilityRequestStatus::Scheduled->value];
        $counts = [
            'open_facility_requests' => 0,
            'pending_appointments' => 0,
            'open_recommendation_requests' => 0,
            'shared_recommendation_packages' => 0,
        ];

        foreach ($this->store->all('facility_requests') as $row) {
            if (in_array((string) ($row['status'] ?? ''), $openRequestStatuses, true)) {
                $counts['open_facility_requests']++;
            }
        }
        foreach ($this->store->all('facility_appointments') as $row) {
            if (($row['status'] ?? '') === FacilityRequestStatus::Scheduled->value) {
                $counts['pending_appointments']++;
            }
        }
        foreach ($this->store->all('recommendation_requests') as $row) {
            if (in_array((string) ($row['status'] ?? ''), [FacilityRequestStatus::Submitted->value, FacilityRequestStatus::Acknowledged->value], true)) {
                $counts['open_recommendation_requests']++;
            }
        }
        foreach ($this->store->all('recommendation_packages') as $row) {
            if (($row['status'] ?? '') === RecommendationPackageStatus::Shared->value) {
                $counts['shared_recommendation_packages']++;
            }
        }

        return $counts;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listFacilityRequests(?string $status = null): array
    {
        $rows = $this->store->all('facility_requests');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeFacilityRequest($row, includeFacility: true), $rows);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function updateFacilityRequest(
        AuthenticatedUser $admin,
        int $requestId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['status']);
        $request = $this->requireFacilityRequest($requestId);
        $status = FacilityRequestStatus::from((string) $input['status']);
        $updated = $this->store->update('facility_requests', $requestId, [
            'status' => $status->value,
            'assigned_to' => isset($input['assigned_to']) && $input['assigned_to'] !== '' ? (int) $input['assigned_to'] : ($request['assigned_to'] ?? null),
            'admin_note' => isset($input['admin_note']) ? trim((string) $input['admin_note']) : ($request['admin_note'] ?? null),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'facility_request.status_changed', 'FacilityRequest', (string) $requestId, [
            'from' => $request['status'] ?? null,
            'to' => $status->value,
            'facility_id' => $request['facility_id'] ?? null,
        ], $ipAddress, $userAgent);

        return $this->safeFacilityRequest($updated, includeFacility: true);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function scheduleAppointment(
        AuthenticatedUser $admin,
        int $requestId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['scheduled_start_at', 'scheduled_end_at']);
        $request = $this->requireFacilityRequest($requestId);
        $start = new DateTimeImmutable((string) $input['scheduled_start_at']);
        $end = new DateTimeImmutable((string) $input['scheduled_end_at']);
        if ($end <= $start) {
            throw new DomainException('Appointment end time must be after the start time.');
        }

        $now = gmdate(DATE_ATOM);
        $appointment = $this->store->insert('facility_appointments', [
            'facility_request_id' => $requestId,
            'facility_id' => (int) $request['facility_id'],
            'scheduled_start_at' => $start->format(DATE_ATOM),
            'scheduled_end_at' => $end->format(DATE_ATOM),
            'mode' => trim((string) ($input['mode'] ?? 'remote')),
            'location' => $this->nullableString($input['location'] ?? null),
            'status' => FacilityRequestStatus::Scheduled->value,
            'notes' => $this->nullableString($input['notes'] ?? null),
            'created_by' => $admin->id,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->store->update('facility_requests', $requestId, [
            'status' => FacilityRequestStatus::Scheduled->value,
            'updated_at' => $now,
        ]);

        $this->audit->record($admin->id, 'facility_appointment.scheduled', 'FacilityAppointment', (string) $appointment['id'], [
            'facility_request_id' => $requestId,
            'facility_id' => $request['facility_id'] ?? null,
            'scheduled_start_at' => $appointment['scheduled_start_at'],
        ], $ipAddress, $userAgent);
        $facility = $this->facilities->requireFacility((int) $request['facility_id']);
        $this->notifications?->facilityAppointmentScheduled($facility, $appointment);

        return [
            'request' => $this->safeFacilityRequest($this->requireFacilityRequest($requestId), includeFacility: true),
            'appointment' => $this->safeAppointment($appointment),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listRecommendationRequests(?string $status = null): array
    {
        $rows = $this->store->all('recommendation_requests');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeRecommendationRequest($row, includeFacility: true), $rows);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function updateRecommendationRequest(
        AuthenticatedUser $admin,
        int $requestId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['status']);
        $request = $this->requireRecommendationRequest($requestId);
        $status = FacilityRequestStatus::from((string) $input['status']);
        $updated = $this->store->update('recommendation_requests', $requestId, [
            'status' => $status->value,
            'assigned_to' => isset($input['assigned_to']) && $input['assigned_to'] !== '' ? (int) $input['assigned_to'] : ($request['assigned_to'] ?? null),
            'admin_note' => isset($input['admin_note']) ? trim((string) $input['admin_note']) : ($request['admin_note'] ?? null),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'recommendation_request.status_changed', 'RecommendationRequest', (string) $requestId, [
            'from' => $request['status'] ?? null,
            'to' => $status->value,
            'facility_id' => $request['facility_id'] ?? null,
        ], $ipAddress, $userAgent);

        return $this->safeRecommendationRequest($updated, includeFacility: true);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createPackage(
        AuthenticatedUser $admin,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['title']);
        $request = null;
        if (isset($input['recommendation_request_id']) && $input['recommendation_request_id'] !== '') {
            $request = $this->requireRecommendationRequest((int) $input['recommendation_request_id']);
            $facilityId = (int) $request['facility_id'];
        } else {
            Validator::requireFields($input, ['facility_id']);
            $facilityId = (int) $input['facility_id'];
            $this->facilities->requireFacility($facilityId);
        }

        $candidateIds = $this->candidateIds($input['candidate_publication_ids'] ?? []);
        $this->publications->assertPublishedCandidateIds($candidateIds);
        $status = RecommendationPackageStatus::from((string) ($input['status'] ?? RecommendationPackageStatus::Draft->value));
        $now = gmdate(DATE_ATOM);
        $package = $this->store->insert('recommendation_packages', [
            'recommendation_request_id' => $request === null ? null : (int) $request['id'],
            'facility_id' => $facilityId,
            'title' => trim((string) $input['title']),
            'rationale' => $this->nullableString($input['rationale'] ?? null),
            'status' => $status->value,
            'created_by' => $admin->id,
            'shared_at' => $status === RecommendationPackageStatus::Shared ? $now : null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->attachPackageCandidates((int) $package['id'], $candidateIds, $input['candidate_rationale'] ?? null);

        if ($request !== null && $status === RecommendationPackageStatus::Shared) {
            $this->store->update('recommendation_requests', (int) $request['id'], [
                'status' => FacilityRequestStatus::Completed->value,
                'updated_at' => $now,
            ]);
        }

        $this->audit->record($admin->id, 'recommendation_package.created', 'RecommendationPackage', (string) $package['id'], [
            'facility_id' => $facilityId,
            'status' => $status->value,
            'candidate_publication_ids' => $candidateIds,
        ], $ipAddress, $userAgent);
        if ($status === RecommendationPackageStatus::Shared) {
            $facility = $this->facilities->requireFacility($facilityId);
            $this->notifications?->recommendationPackageShared($facility, $package);
        }

        return $this->packageDetail((int) $package['id'], includeDraft: true);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function updatePackage(
        AuthenticatedUser $admin,
        int $packageId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $package = $this->requirePackage($packageId);
        $status = isset($input['status']) && $input['status'] !== ''
            ? RecommendationPackageStatus::from((string) $input['status'])
            : RecommendationPackageStatus::from((string) $package['status']);
        $candidateIds = $this->candidateIds($input['candidate_publication_ids'] ?? []);
        if ($candidateIds !== []) {
            $this->publications->assertPublishedCandidateIds($candidateIds);
        }
        $now = gmdate(DATE_ATOM);
        $updated = $this->store->update('recommendation_packages', $packageId, [
            'title' => isset($input['title']) ? trim((string) $input['title']) : $package['title'],
            'rationale' => array_key_exists('rationale', $input) ? $this->nullableString($input['rationale']) : ($package['rationale'] ?? null),
            'status' => $status->value,
            'shared_at' => $status === RecommendationPackageStatus::Shared && empty($package['shared_at']) ? $now : ($package['shared_at'] ?? null),
            'updated_at' => $now,
        ]);
        $this->attachPackageCandidates($packageId, $candidateIds, $input['candidate_rationale'] ?? null);

        $this->audit->record($admin->id, 'recommendation_package.updated', 'RecommendationPackage', (string) $packageId, [
            'from' => $package['status'] ?? null,
            'to' => $status->value,
            'facility_id' => $package['facility_id'] ?? null,
        ], $ipAddress, $userAgent);
        if ($status === RecommendationPackageStatus::Shared && ($package['status'] ?? '') !== RecommendationPackageStatus::Shared->value) {
            $facility = $this->facilities->requireFacility((int) $updated['facility_id']);
            $this->notifications?->recommendationPackageShared($facility, $updated);
        }

        return $this->packageDetail($packageId, includeDraft: true);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listPackagesForAdmin(?string $status = null): array
    {
        $rows = $this->store->all('recommendation_packages');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safePackage($row, includeCandidates: false), $rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function packagesForFacility(int $facilityId): array
    {
        $rows = $this->store->where('recommendation_packages', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId && ($row['status'] ?? '') === RecommendationPackageStatus::Shared->value);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['shared_at'] ?? $b['updated_at']), (string) ($a['shared_at'] ?? $a['updated_at'])));

        return array_map(fn (array $row): array => $this->safePackage($row, includeCandidates: true), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function packageDetail(int $packageId, bool $includeDraft = false): array
    {
        $package = $this->requirePackage($packageId);
        if (!$includeDraft && ($package['status'] ?? '') !== RecommendationPackageStatus::Shared->value) {
            throw new NotFoundException('Recommendation package was not found.');
        }

        return $this->safePackage($package, includeCandidates: true);
    }

    /**
     * @return list<int>
     */
    private function candidateIds(mixed $value): array
    {
        if (is_string($value)) {
            $value = array_filter(array_map('trim', explode(',', $value)));
        }
        if (!is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(static fn (mixed $id): int => (int) $id, $value), static fn (int $id): bool => $id > 0)));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function requestsForFacility(int $facilityId): array
    {
        $rows = $this->store->where('facility_requests', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return $rows;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recommendationRequestsForFacility(int $facilityId): array
    {
        $rows = $this->store->where('recommendation_requests', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return $rows;
    }

    /**
     * @return array<string, mixed>
     */
    private function requireFacilityRequest(int $requestId): array
    {
        $request = $this->store->find('facility_requests', $requestId);
        if ($request === null) {
            throw new NotFoundException('Facility request was not found.');
        }

        return $request;
    }

    /**
     * @return array<string, mixed>
     */
    private function requireRecommendationRequest(int $requestId): array
    {
        $request = $this->store->find('recommendation_requests', $requestId);
        if ($request === null) {
            throw new NotFoundException('Recommendation request was not found.');
        }

        return $request;
    }

    /**
     * @return array<string, mixed>
     */
    private function requirePackage(int $packageId): array
    {
        $package = $this->store->find('recommendation_packages', $packageId);
        if ($package === null) {
            throw new NotFoundException('Recommendation package was not found.');
        }

        return $package;
    }

    /**
     * @param list<int> $candidateIds
     */
    private function attachPackageCandidates(int $packageId, array $candidateIds, mixed $rationale): void
    {
        foreach ($candidateIds as $candidateId) {
            $existing = $this->store->first('recommendation_package_candidates', static fn (array $row): bool => (int) $row['recommendation_package_id'] === $packageId && (int) $row['candidate_publication_id'] === $candidateId);
            if ($existing !== null) {
                continue;
            }
            $this->store->insert('recommendation_package_candidates', [
                'recommendation_package_id' => $packageId,
                'candidate_publication_id' => $candidateId,
                'rationale' => is_array($rationale) ? ($rationale[$candidateId] ?? null) : ($rationale === null ? null : (string) $rationale),
                'created_at' => gmdate(DATE_ATOM),
            ]);
        }
    }

    private function nullableString(mixed $value): ?string
    {
        $string = trim((string) ($value ?? ''));

        return $string === '' ? null : $string;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeFacilityRequest(array $row, bool $includeFacility = false): array
    {
        return [
            'id' => (int) $row['id'],
            'facility_id' => (int) $row['facility_id'],
            'facility' => $includeFacility ? $this->facilityLabel((int) $row['facility_id']) : null,
            'request_type' => (string) $row['request_type'],
            'title' => (string) $row['title'],
            'role_needed' => $row['role_needed'] ?? null,
            'county' => $row['county'] ?? null,
            'urgency' => $row['urgency'] ?? null,
            'experience_level' => $row['experience_level'] ?? null,
            'preferred_timing' => $row['preferred_timing'] ?? null,
            'contact_preference' => $row['contact_preference'] ?? null,
            'notes' => $row['notes'] ?? null,
            'candidate_publication_ids' => is_array($row['candidate_publication_ids'] ?? null) ? $row['candidate_publication_ids'] : [],
            'status' => (string) $row['status'],
            'admin_note' => $row['admin_note'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeRecommendationRequest(array $row, bool $includeFacility = false): array
    {
        return [
            'id' => (int) $row['id'],
            'facility_id' => (int) $row['facility_id'],
            'facility' => $includeFacility ? $this->facilityLabel((int) $row['facility_id']) : null,
            'role_needed' => (string) $row['role_needed'],
            'county' => $row['county'] ?? null,
            'urgency' => $row['urgency'] ?? null,
            'experience_level' => $row['experience_level'] ?? null,
            'notes' => $row['notes'] ?? null,
            'criteria' => is_array($row['criteria'] ?? null) ? $row['criteria'] : [],
            'candidate_publication_ids' => is_array($row['candidate_publication_ids'] ?? null) ? $row['candidate_publication_ids'] : [],
            'status' => (string) $row['status'],
            'admin_note' => $row['admin_note'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeAppointment(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'facility_request_id' => (int) $row['facility_request_id'],
            'facility_id' => (int) $row['facility_id'],
            'scheduled_start_at' => $row['scheduled_start_at'] ?? null,
            'scheduled_end_at' => $row['scheduled_end_at'] ?? null,
            'mode' => (string) $row['mode'],
            'location' => $row['location'] ?? null,
            'status' => (string) $row['status'],
            'notes' => $row['notes'] ?? null,
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safePackage(array $row, bool $includeCandidates): array
    {
        $candidateLinks = $this->store->where('recommendation_package_candidates', static fn (array $candidate): bool => (int) $candidate['recommendation_package_id'] === (int) $row['id']);

        return [
            'id' => (int) $row['id'],
            'recommendation_request_id' => $row['recommendation_request_id'] === null ? null : (int) $row['recommendation_request_id'],
            'facility_id' => (int) $row['facility_id'],
            'facility' => $this->facilityLabel((int) $row['facility_id']),
            'title' => (string) $row['title'],
            'rationale' => $row['rationale'] ?? null,
            'status' => (string) $row['status'],
            'shared_at' => $row['shared_at'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
            'candidates' => $includeCandidates
                ? array_map(fn (array $link): array => [
                    'candidate' => $this->publications->packageCandidateSummary((int) $link['candidate_publication_id']),
                    'rationale' => $link['rationale'] ?? null,
                ], $candidateLinks)
                : [],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function facilityLabel(int $facilityId): ?array
    {
        try {
            $facility = $this->facilities->requireFacility($facilityId);
        } catch (NotFoundException) {
            return null;
        }

        return [
            'id' => (int) $facility['id'],
            'display_name' => (string) $facility['display_name'],
            'county' => (string) $facility['county'],
            'review_status' => (string) $facility['review_status'],
        ];
    }
}
