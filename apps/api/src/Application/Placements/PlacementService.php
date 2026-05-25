<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Placements;

use Afyalink\Core\Application\AI\RecommendationAssistant;
use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Facilities\CandidatePublicationService;
use Afyalink\Core\Application\Facilities\FacilityAccessService;
use Afyalink\Core\Application\Facilities\FacilityService;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\CandidatePublicationStatus;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;
use DateTimeImmutable;
use DomainException;

final readonly class PlacementService
{
    private const REQUISITION_STATUSES = [
        'draft',
        'submitted',
        'under_review',
        'matching',
        'shortlist_ready',
        'interviews_requested',
        'filled',
        'cancelled',
        'closed',
    ];

    private const PLACEMENT_STATUSES = [
        'proposed',
        'facility_interested',
        'professional_contacted',
        'interview_requested',
        'interview_scheduled',
        'offer_pending',
        'offer_made',
        'offer_accepted',
        'offer_declined',
        'onboarding',
        'placed',
        'completed',
        'cancelled',
    ];

    public function __construct(
        private DataStore $store,
        private FacilityService $facilities,
        private FacilityAccessService $access,
        private CandidatePublicationService $publications,
        private AuditLogger $audit,
        private ?NotificationService $notifications,
        private RecommendationAssistant $assistant,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function savePlacementPreferences(
        AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $profile = $this->profileForUser($user->id);
        $isStudent = ($profile['applicant_track'] ?? '') === ApplicantTrack::StudentAwaitingLicense->value;
        $existing = $this->store->first('professional_placement_preferences', static fn (array $row): bool => (int) $row['user_id'] === $user->id);
        $now = gmdate(DATE_ATOM);
        $openToWork = !$isStudent && filter_var($input['open_to_work'] ?? false, FILTER_VALIDATE_BOOL);
        $payload = [
            'user_id' => $user->id,
            'open_to_work' => $openToWork,
            'availability_status' => $isStudent ? 'student_waiting_license' : $this->oneOf((string) ($input['availability_status'] ?? 'not_available'), ['available_now', 'available_from_date', 'not_available', 'student_waiting_license'], 'not_available'),
            'available_from' => $this->dateOrNull($input['available_from'] ?? null),
            'preferred_counties' => $this->stringList($input['preferred_counties'] ?? []),
            'preferred_facility_types' => $this->stringList($input['preferred_facility_types'] ?? []),
            'employment_types' => $this->stringList($input['employment_types'] ?? []),
            'shift_preferences' => $this->stringList($input['shift_preferences'] ?? []),
            'desired_roles' => $this->stringList($input['desired_roles'] ?? []),
            'minimum_rate_or_salary' => $this->nullableString($input['minimum_rate_or_salary'] ?? null),
            'relocation_willingness' => $this->nullableString($input['relocation_willingness'] ?? null),
            'remote_or_telehealth_interest' => filter_var($input['remote_or_telehealth_interest'] ?? false, FILTER_VALIDATE_BOOL),
            'notes' => $this->nullableString($input['notes'] ?? null),
            'student_future_preferences' => $isStudent ? [
                'available_after_license' => $this->dateOrNull($input['available_after_license'] ?? null),
                'target_profession' => $profile['target_profession'] ?? $profile['profession'] ?? null,
                'internship_or_attachment_interest' => filter_var($input['internship_or_attachment_interest'] ?? false, FILTER_VALIDATE_BOOL),
                'expected_license_date' => $this->dateOrNull($profile['graduation_or_completion_date'] ?? null),
            ] : [],
            'updated_at' => $now,
        ];

        $saved = $existing === null
            ? $this->store->insert('professional_placement_preferences', ['created_at' => $now, ...$payload])
            : $this->store->update('professional_placement_preferences', (int) $existing['id'], $payload);

        $this->audit->record($user->id, 'placement_preferences.saved', 'ProfessionalPlacementPreference', (string) $saved['id'], [
            'open_to_work' => $saved['open_to_work'],
            'availability_status' => $saved['availability_status'],
            'student_track' => $isStudent,
        ], $ipAddress, $userAgent);

        return $this->safePreference($saved, $profile);
    }

    /**
     * @return array<string, mixed>
     */
    public function professionalPlacementDashboard(AuthenticatedUser $user): array
    {
        $profile = $this->profileForUser($user->id);
        $preference = $this->store->first('professional_placement_preferences', static fn (array $row): bool => (int) $row['user_id'] === $user->id);
        $opportunities = $this->professionalOpportunities($user);
        $isStudent = ($profile['applicant_track'] ?? '') === ApplicantTrack::StudentAwaitingLicense->value;

        return [
            'profile' => $profile,
            'preferences' => $preference === null ? null : $this->safePreference($preference, $profile),
            'match_ready' => !$isStudent && $preference !== null && ($preference['open_to_work'] ?? false) === true,
            'student_notice' => $isStudent ? 'You can set future preferences, but licensed matching unlocks only after Afyalink converts your account after license review.' : null,
            'opportunities' => $opportunities,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function professionalOpportunities(AuthenticatedUser $user): array
    {
        $rows = $this->store->where('placements', static fn (array $row): bool => (int) $row['professional_user_id'] === $user->id);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safePlacement($row, audience: 'professional'), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function professionalOpportunity(AuthenticatedUser $user, int $placementId): array
    {
        $placement = $this->requirePlacement($placementId);
        if ((int) $placement['professional_user_id'] !== $user->id) {
            throw new NotFoundException('Placement opportunity was not found.');
        }

        return $this->placementDetail($placementId, 'professional');
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createFacilityRequisition(
        AuthenticatedUser $user,
        array $input,
        bool $submit = false,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['title', 'profession_required', 'employment_type', 'county']);
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $this->access->assertFacilityHasActiveAccess((int) $facility['id']);
        $now = gmdate(DATE_ATOM);
        $status = $submit ? 'submitted' : 'draft';
        $row = $this->store->insert('facility_requisitions', [
            'facility_id' => (int) $facility['id'],
            'created_by_user_id' => $user->id,
            ...$this->requisitionPayload($input),
            'status' => $status,
            'assigned_admin_id' => null,
            'submitted_at' => $submit ? $now : null,
            'closed_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->audit->record($user->id, 'facility_requisition.created', 'FacilityRequisition', (string) $row['id'], [
            'facility_id' => $facility['id'],
            'status' => $status,
            'profession_required' => $row['profession_required'],
        ], $ipAddress, $userAgent);
        if ($submit) {
            $this->notifications?->facilityRequisitionSubmitted($facility, $row);
        }

        return $this->safeRequisition($row, includeFacility: false);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function facilityRequisitions(AuthenticatedUser $user): array
    {
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $rows = $this->store->where('facility_requisitions', static fn (array $row): bool => (int) $row['facility_id'] === (int) $facility['id']);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeRequisition($row, includeFacility: false), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function facilityRequisitionDetail(AuthenticatedUser $user, int $requisitionId): array
    {
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $requisition = $this->requireRequisition($requisitionId);
        if ((int) $requisition['facility_id'] !== (int) $facility['id']) {
            throw new NotFoundException('Requisition was not found.');
        }

        return [
            'requisition' => $this->safeRequisition($requisition, includeFacility: false),
            'shortlists' => $this->shortlistsForFacility((int) $facility['id'], $requisitionId),
            'placements' => $this->placementsForFacility((int) $facility['id'], $requisitionId),
            'interview_requests' => $this->facilityInterviewRequests((int) $facility['id'], $requisitionId),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function adminRequisitions(?string $status = null): array
    {
        $rows = $this->store->all('facility_requisitions');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeRequisition($row, includeFacility: true), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function adminRequisitionDetail(int $requisitionId): array
    {
        $requisition = $this->requireRequisition($requisitionId);

        return [
            'requisition' => $this->safeRequisition($requisition, includeFacility: true),
            'matches' => $this->matchesForRequisition($requisitionId),
            'shortlists' => $this->shortlistsForRequisition($requisitionId, includeDraft: true),
            'placements' => $this->placementsForRequisition($requisitionId),
            'interview_requests' => $this->facilityInterviewRequests((int) $requisition['facility_id'], $requisitionId),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function updateRequisition(
        AuthenticatedUser $admin,
        int $requisitionId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $requisition = $this->requireRequisition($requisitionId);
        $status = isset($input['status']) ? $this->oneOf((string) $input['status'], self::REQUISITION_STATUSES, (string) $requisition['status']) : (string) $requisition['status'];
        $updated = $this->store->update('facility_requisitions', $requisitionId, [
            'status' => $status,
            'assigned_admin_id' => isset($input['assigned_admin_id']) && $input['assigned_admin_id'] !== '' ? (int) $input['assigned_admin_id'] : ($requisition['assigned_admin_id'] ?? null),
            'notes' => array_key_exists('notes', $input) ? $this->nullableString($input['notes']) : ($requisition['notes'] ?? null),
            'closed_at' => in_array($status, ['filled', 'cancelled', 'closed'], true) ? gmdate(DATE_ATOM) : ($requisition['closed_at'] ?? null),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'facility_requisition.status_changed', 'FacilityRequisition', (string) $requisitionId, [
            'from' => $requisition['status'] ?? null,
            'to' => $status,
            'facility_id' => $requisition['facility_id'] ?? null,
        ], $ipAddress, $userAgent);
        if ($status === 'under_review') {
            $facility = $this->facilities->requireFacility((int) $updated['facility_id']);
            $this->notifications?->facilityRequisitionUnderReview($facility, $updated);
        }

        return $this->adminRequisitionDetail($requisitionId);
    }

    /**
     * @return array<string, mixed>
     */
    public function runMatching(
        AuthenticatedUser $admin,
        int $requisitionId,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $requisition = $this->requireRequisition($requisitionId);
        $generated = [];
        foreach ($this->store->all('candidate_publications') as $publication) {
            $result = $this->scoreCandidate($requisition, $publication);
            $existing = $this->store->first('candidate_matches', static fn (array $row): bool => (int) $row['requisition_id'] === $requisitionId && (int) $row['professional_user_id'] === (int) $publication['professional_user_id']);
            $payload = [
                'requisition_id' => $requisitionId,
                'candidate_publication_id' => (int) $publication['id'],
                'professional_user_id' => (int) $publication['professional_user_id'],
                'application_id' => (int) ($publication['application_id'] ?? 0),
                'match_score' => $result['score'],
                'match_band' => $result['band'],
                'score_breakdown' => $result['breakdown'],
                'eligibility_reasons' => $result['eligibility_reasons'],
                'risk_flags' => $result['risk_flags'],
                'generated_by' => $admin->id,
                'updated_at' => gmdate(DATE_ATOM),
            ];
            $generated[] = $existing === null
                ? $this->store->insert('candidate_matches', ['status' => 'generated', 'reviewed_by' => null, 'reviewed_at' => null, 'created_at' => gmdate(DATE_ATOM), ...$payload])
                : $this->store->update('candidate_matches', (int) $existing['id'], $payload);
        }

        $this->store->update('facility_requisitions', $requisitionId, [
            'status' => 'matching',
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $eligibleCount = count(array_filter($generated, static fn (array $row): bool => ($row['match_band'] ?? '') !== 'ineligible'));
        $this->audit->record($admin->id, 'matching.run_completed', 'FacilityRequisition', (string) $requisitionId, [
            'generated_count' => count($generated),
            'eligible_count' => $eligibleCount,
        ], $ipAddress, $userAgent);
        $this->notifications?->matchingRunCompleted($admin->email, $admin->id, $requisition, count($generated));

        return [
            'generated_count' => count($generated),
            'eligible_count' => $eligibleCount,
            'matches' => $this->matchesForRequisition($requisitionId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function draftAiRationale(
        AuthenticatedUser $admin,
        int $matchId,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $match = $this->requireMatch($matchId);
        $requisition = $this->requireRequisition((int) $match['requisition_id']);
        $draft = $this->assistant->draftShortlistRationale($requisition, $this->safeMatch($match));
        $log = $this->store->insert('ai_assistance_logs', [
            'context_type' => 'candidate_match',
            'context_id' => $matchId,
            'requested_by' => $admin->id,
            'provider' => (string) $draft['provider'],
            'model' => (string) $draft['model'],
            'prompt_redacted' => [
                'requisition_id' => $requisition['id'],
                'match_id' => $matchId,
                'input_fields' => ['score_breakdown', 'eligibility_reasons'],
            ],
            'output_redacted' => $draft,
            'status' => 'draft_generated',
            'reviewed_by' => null,
            'approved_at' => null,
            'created_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'ai_assistance.draft_generated', 'CandidateMatch', (string) $matchId, [
            'ai_assistance_log_id' => $log['id'],
            'provider' => $draft['provider'],
            'final_decision' => false,
        ], $ipAddress, $userAgent);

        return [
            'ai_assistance_log' => $log,
            'draft' => $draft,
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createShortlist(
        AuthenticatedUser $admin,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['requisition_id', 'title']);
        $requisition = $this->requireRequisition((int) $input['requisition_id']);
        $status = $this->oneOf((string) ($input['status'] ?? 'draft'), ['draft', 'under_review', 'shared', 'accepted', 'archived'], 'draft');
        $now = gmdate(DATE_ATOM);
        $shortlist = $this->store->insert('placement_shortlists', [
            'requisition_id' => (int) $requisition['id'],
            'facility_id' => (int) $requisition['facility_id'],
            'title' => trim((string) $input['title']),
            'summary' => $this->nullableString($input['summary'] ?? null),
            'status' => $status,
            'created_by' => $admin->id,
            'reviewed_by' => $status === 'shared' ? $admin->id : null,
            'shared_at' => $status === 'shared' ? $now : null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->attachShortlistCandidates((int) $shortlist['id'], $input['candidate_match_ids'] ?? [], $input['admin_rationale'] ?? null);
        if ($status === 'shared') {
            $this->store->update('facility_requisitions', (int) $requisition['id'], [
                'status' => 'shortlist_ready',
                'updated_at' => $now,
            ]);
            $facility = $this->facilities->requireFacility((int) $requisition['facility_id']);
            $this->notifications?->shortlistShared($facility, $shortlist, $requisition);
        }
        $this->audit->record($admin->id, 'placement_shortlist.created', 'PlacementShortlist', (string) $shortlist['id'], [
            'requisition_id' => $requisition['id'],
            'facility_id' => $requisition['facility_id'],
            'status' => $status,
        ], $ipAddress, $userAgent);

        return $this->shortlistDetail((int) $shortlist['id'], includeDraft: true);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function facilityShortlists(AuthenticatedUser $user): array
    {
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);

        return $this->shortlistsForFacility((int) $facility['id']);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createPlacement(
        AuthenticatedUser $admin,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['facility_id', 'professional_user_id']);
        $status = $this->oneOf((string) ($input['status'] ?? 'proposed'), self::PLACEMENT_STATUSES, 'proposed');
        $now = gmdate(DATE_ATOM);
        $placement = $this->store->insert('placements', [
            'facility_id' => (int) $input['facility_id'],
            'requisition_id' => isset($input['requisition_id']) && $input['requisition_id'] !== '' ? (int) $input['requisition_id'] : null,
            'professional_user_id' => (int) $input['professional_user_id'],
            'candidate_publication_id' => isset($input['candidate_publication_id']) && $input['candidate_publication_id'] !== '' ? (int) $input['candidate_publication_id'] : null,
            'shortlist_candidate_id' => isset($input['shortlist_candidate_id']) && $input['shortlist_candidate_id'] !== '' ? (int) $input['shortlist_candidate_id'] : null,
            'status' => $status,
            'start_date' => $this->dateOrNull($input['start_date'] ?? null),
            'end_date' => $this->dateOrNull($input['end_date'] ?? null),
            'employment_type' => $this->nullableString($input['employment_type'] ?? null),
            'facility_note' => $this->nullableString($input['facility_note'] ?? null),
            'admin_note' => $this->nullableString($input['admin_note'] ?? null),
            'professional_note' => null,
            'created_by' => $admin->id,
            'assigned_admin_id' => isset($input['assigned_admin_id']) && $input['assigned_admin_id'] !== '' ? (int) $input['assigned_admin_id'] : $admin->id,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->recordPlacementEvent((int) $placement['id'], $admin->id, 'placement.created', null, $status, $input['admin_note'] ?? null);
        $this->audit->record($admin->id, 'placement.created', 'Placement', (string) $placement['id'], [
            'facility_id' => $placement['facility_id'],
            'professional_user_id' => $placement['professional_user_id'],
            'status' => $status,
        ], $ipAddress, $userAgent);
        $this->notifyProfessionalOpportunity($placement, 'professional_opportunity_available');

        return $this->placementDetail((int) $placement['id'], 'admin');
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function updatePlacement(
        AuthenticatedUser $actor,
        int $placementId,
        array $input,
        string $audience,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $placement = $this->requirePlacement($placementId);
        $status = $this->oneOf((string) ($input['status'] ?? $placement['status']), self::PLACEMENT_STATUSES, (string) $placement['status']);
        $this->assertPlacementAccess($actor, $placement, $audience);
        $updated = $this->store->update('placements', $placementId, [
            'status' => $status,
            'facility_note' => array_key_exists('facility_note', $input) ? $this->nullableString($input['facility_note']) : ($placement['facility_note'] ?? null),
            'admin_note' => array_key_exists('admin_note', $input) ? $this->nullableString($input['admin_note']) : ($placement['admin_note'] ?? null),
            'professional_note' => array_key_exists('professional_note', $input) ? $this->nullableString($input['professional_note']) : ($placement['professional_note'] ?? null),
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $this->recordPlacementEvent($placementId, $actor->id, 'placement.status_changed', (string) $placement['status'], $status, $input['note'] ?? null);
        $this->audit->record($actor->id, 'placement.status_changed', 'Placement', (string) $placementId, [
            'from' => $placement['status'] ?? null,
            'to' => $status,
            'audience' => $audience,
        ], $ipAddress, $userAgent);
        $this->notifyProfessionalOpportunity($updated, 'professional_opportunity_status_changed');

        return $this->placementDetail($placementId, $audience);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function adminPlacements(?string $status = null): array
    {
        $rows = $this->store->all('placements');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safePlacement($row, audience: 'admin'), $rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function facilityPlacements(AuthenticatedUser $user): array
    {
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);

        return $this->placementsForFacility((int) $facility['id']);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createCommunicationThread(
        AuthenticatedUser $actor,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['context_type', 'context_id', 'subject', 'body']);
        $visibility = $this->oneOf((string) ($input['visibility'] ?? 'internal_admin'), ['internal_admin', 'facility_visible', 'professional_visible', 'shared'], 'internal_admin');
        $now = gmdate(DATE_ATOM);
        $thread = $this->store->insert('communication_threads', [
            'context_type' => trim((string) $input['context_type']),
            'context_id' => (int) $input['context_id'],
            'facility_id' => isset($input['facility_id']) && $input['facility_id'] !== '' ? (int) $input['facility_id'] : null,
            'professional_user_id' => isset($input['professional_user_id']) && $input['professional_user_id'] !== '' ? (int) $input['professional_user_id'] : null,
            'status' => 'open',
            'subject' => trim((string) $input['subject']),
            'created_by' => $actor->id,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $message = $this->store->insert('communication_messages', [
            'thread_id' => (int) $thread['id'],
            'sender_user_id' => $actor->id,
            'body' => trim((string) $input['body']),
            'visibility' => $visibility,
            'created_at' => $now,
            'read_at' => null,
        ]);
        $this->audit->record($actor->id, 'communication.thread_created', 'CommunicationThread', (string) $thread['id'], [
            'context_type' => $thread['context_type'],
            'context_id' => $thread['context_id'],
            'visibility' => $visibility,
        ], $ipAddress, $userAgent);

        return [
            'thread' => $this->safeThread($thread, 'admin'),
            'messages' => [$this->safeMessage($message, 'admin')],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function adminThreads(): array
    {
        $rows = $this->store->all('communication_threads');
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeThread($row, 'admin'), $rows);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function requestFacilityInterview(
        AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['candidate_publication_id']);
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $this->access->assertFacilityHasActiveAccess((int) $facility['id']);
        $request = $this->store->insert('facility_interview_requests', [
            'facility_id' => (int) $facility['id'],
            'requisition_id' => isset($input['requisition_id']) && $input['requisition_id'] !== '' ? (int) $input['requisition_id'] : null,
            'candidate_publication_id' => (int) $input['candidate_publication_id'],
            'placement_id' => isset($input['placement_id']) && $input['placement_id'] !== '' ? (int) $input['placement_id'] : null,
            'preferred_times' => is_array($input['preferred_times'] ?? null) ? $input['preferred_times'] : [],
            'mode' => trim((string) ($input['mode'] ?? 'remote')),
            'notes' => $this->nullableString($input['notes'] ?? null),
            'status' => 'requested',
            'created_by' => $user->id,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $this->audit->record($user->id, 'facility_interview_request.created', 'FacilityInterviewRequest', (string) $request['id'], [
            'facility_id' => $facility['id'],
            'candidate_publication_id' => $request['candidate_publication_id'],
        ], $ipAddress, $userAgent);
        $this->notifications?->facilityInterviewRequested($facility, $request);

        return $this->safeFacilityInterviewRequest($request);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function inviteFacilityMember(
        AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['email', 'role']);
        Validator::email('email', $input['email']);
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $token = bin2hex(random_bytes(24));
        $expiresAt = (new DateTimeImmutable('+7 days'))->format(DATE_ATOM);
        $invitation = $this->store->insert('facility_invitations', [
            'facility_id' => (int) $facility['id'],
            'email' => strtolower(trim((string) $input['email'])),
            'role' => $this->oneOf((string) $input['role'], ['owner', 'admin', 'recruiter', 'viewer', 'billing_manager'], 'viewer'),
            'invited_by' => $user->id,
            'token_hash' => hash('sha256', $token),
            'status' => 'pending',
            'expires_at' => $expiresAt,
            'accepted_at' => null,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $this->audit->record($user->id, 'facility_invitation.created', 'FacilityInvitation', (string) $invitation['id'], [
            'facility_id' => $facility['id'],
            'role' => $invitation['role'],
        ], $ipAddress, $userAgent);
        $this->notifications?->facilityTeamInvitation((string) $invitation['email'], $facility, $invitation);

        return $this->safeInvitation($invitation);
    }

    /**
     * @return array<string, mixed>
     */
    public function integrationReadiness(): array
    {
        return [
            'connections' => $this->store->all('integration_connections'),
            'fhir_readiness' => [
                'practitioner_mapping' => true,
                'organization_mapping' => true,
                'appointment_mapping' => 'metadata_ready',
                'document_reference_mapping' => 'credential_metadata_only',
                'smart_app_launch' => 'planned_oauth_foundation',
                'clinical_data_storage' => 'not_supported',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function securityReadiness(): array
    {
        return [
            'asvs_readiness' => [
                'auth' => 'session tokens are revocable and expiry-bound',
                'access_control' => 'route-level permissions plus service-owned facility/professional checks',
                'documents' => 'private storage only; no credential file exposure in placement APIs',
                'matching' => 'protected traits excluded; explanations required; human review required',
                'ai' => 'draft-only deterministic adapter by default',
                'audit' => 'requisitions, matches, shortlists, placements, communications, invitations audited',
            ],
        ];
    }

    /**
     * @return array<string, int>
     */
    public function reportCounts(): array
    {
        return [
            'requisitions_total' => count($this->store->all('facility_requisitions')),
            'matches_total' => count($this->store->all('candidate_matches')),
            'shortlists_total' => count($this->store->all('placement_shortlists')),
            'placements_total' => count($this->store->all('placements')),
            'facility_interview_requests_total' => count($this->store->all('facility_interview_requests')),
            'communication_threads_total' => count($this->store->all('communication_threads')),
            'ai_drafts_total' => count($this->store->all('ai_assistance_logs')),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function requisitionPayload(array $input): array
    {
        $employmentTypes = ['full_time', 'part_time', 'locum', 'contract', 'internship', 'attachment', 'temporary'];
        $urgencies = ['low', 'normal', 'high', 'critical'];

        return [
            'title' => trim((string) $input['title']),
            'profession_required' => trim((string) $input['profession_required']),
            'specialty_required' => $this->nullableString($input['specialty_required'] ?? null),
            'facility_department' => $this->nullableString($input['facility_department'] ?? null),
            'employment_type' => $this->oneOf((string) $input['employment_type'], $employmentTypes, 'full_time'),
            'number_of_positions' => max(1, (int) ($input['number_of_positions'] ?? 1)),
            'county' => trim((string) $input['county']),
            'facility_site' => $this->nullableString($input['facility_site'] ?? null),
            'required_start_date' => $this->dateOrNull($input['required_start_date'] ?? null),
            'end_date' => $this->dateOrNull($input['end_date'] ?? null),
            'shift_pattern' => $this->nullableString($input['shift_pattern'] ?? null),
            'urgency' => $this->oneOf((string) ($input['urgency'] ?? 'normal'), $urgencies, 'normal'),
            'minimum_experience_years' => isset($input['minimum_experience_years']) && $input['minimum_experience_years'] !== '' ? (float) $input['minimum_experience_years'] : null,
            'required_credentials' => $this->stringList($input['required_credentials'] ?? []),
            'preferred_skills' => $this->stringList($input['preferred_skills'] ?? []),
            'language_preferences' => $this->stringList($input['language_preferences'] ?? []),
            'salary_or_rate_range' => $this->nullableString($input['salary_or_rate_range'] ?? null),
            'notes' => $this->nullableString($input['notes'] ?? null),
        ];
    }

    /**
     * @param array<string, mixed> $requisition
     * @param array<string, mixed> $publication
     * @return array<string, mixed>
     */
    private function scoreCandidate(array $requisition, array $publication): array
    {
        $userId = (int) $publication['professional_user_id'];
        $application = $this->store->find('applications', (int) ($publication['application_id'] ?? 0));
        $profile = $this->profileForUser($userId);
        $user = $this->store->find('users', $userId);
        $preference = $this->store->first('professional_placement_preferences', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        $eligibility = [];
        $risks = [];
        $eligible = true;

        $checks = [
            'candidate publication is published' => ($publication['status'] ?? '') === CandidatePublicationStatus::Published->value,
            'applicant is licensed professional track' => ($profile['applicant_track'] ?? ApplicantTrack::LicensedProfessional->value) !== ApplicantTrack::StudentAwaitingLicense->value,
            'email is verified' => !empty($user['email_verified_at'] ?? null),
            'application is qualified or approved' => in_array((string) ($application['status'] ?? ''), [ApplicationStatus::Qualified->value, ApplicationStatus::Approved->value], true),
            'current consent is present' => $this->hasConsent($userId),
            'regulatory verification passed' => $this->hasPassedVerification($userId, (int) ($application['id'] ?? 0)),
            'interview recommendation allows matching' => $this->hasPositiveInterview($userId, (int) ($application['id'] ?? 0)),
            'professional is open to work' => $preference !== null && ($preference['open_to_work'] ?? false) === true,
        ];

        foreach ($checks as $reason => $passed) {
            if (!$passed) {
                $eligible = false;
                $eligibility[] = $reason;
            }
        }

        if (!$eligible) {
            return [
                'score' => 0,
                'band' => 'ineligible',
                'breakdown' => [],
                'eligibility_reasons' => $eligibility,
                'risk_flags' => ['human_review_required', 'not_facility_visible_until_eligible'],
            ];
        }

        $breakdown = [];
        $score = 0;
        $score += $this->dimension($breakdown, 'profession_match', $this->matchesText($profile['profession'] ?? '', $requisition['profession_required'] ?? ''), 25, 'Profession aligns with requisition.');
        $score += $this->dimension($breakdown, 'location_match', $this->matchesLocation($profile, $preference, (string) $requisition['county']), 15, 'County or preference aligns with facility location.');
        $score += $this->dimension($breakdown, 'availability_match', in_array((string) ($preference['availability_status'] ?? ''), ['available_now', 'available_from_date'], true), 15, 'Availability can support placement.');
        $score += $this->dimension($breakdown, 'experience_match', (float) ($profile['years_experience'] ?? 0) >= (float) ($requisition['minimum_experience_years'] ?? 0), 15, 'Experience meets or exceeds minimum.');
        $score += $this->dimension($breakdown, 'employment_type_match', in_array((string) $requisition['employment_type'], $preference['employment_types'] ?? [], true), 10, 'Employment type preference aligns.');
        $score += $this->dimension($breakdown, 'verified_publication_ready', true, 10, 'Candidate is verified, interview-reviewed, and published.');
        $score += $this->dimension($breakdown, 'urgency_fit', (string) ($preference['availability_status'] ?? '') === 'available_now' || !in_array((string) $requisition['urgency'], ['high', 'critical'], true), 10, 'Candidate availability fits urgency.');

        if (($breakdown['employment_type_match']['matched'] ?? false) === false) {
            $risks[] = 'employment_type_preference_mismatch';
        }
        if (($breakdown['location_match']['matched'] ?? false) === false) {
            $risks[] = 'location_preference_mismatch';
        }

        return [
            'score' => min(100, $score),
            'band' => $this->band($score),
            'breakdown' => $breakdown,
            'eligibility_reasons' => ['eligible_for_human_review'],
            'risk_flags' => $risks,
        ];
    }

    private function dimension(array &$breakdown, string $key, bool $matched, int $points, string $reason): int
    {
        $breakdown[$key] = [
            'matched' => $matched,
            'points' => $matched ? $points : 0,
            'max_points' => $points,
            'reason' => $reason,
        ];

        return $matched ? $points : 0;
    }

    private function band(int|float $score): string
    {
        return match (true) {
            $score >= 85 => 'excellent',
            $score >= 70 => 'strong',
            $score >= 50 => 'moderate',
            $score > 0 => 'weak',
            default => 'ineligible',
        };
    }

    private function hasConsent(int $userId): bool
    {
        return $this->store->first('consents', static fn (array $row): bool => (int) $row['user_id'] === $userId) !== null;
    }

    private function hasPassedVerification(int $userId, int $applicationId): bool
    {
        return $this->store->first('verification_cases', static fn (array $row): bool => ((int) ($row['professional_user_id'] ?? 0) === $userId || (int) ($row['application_id'] ?? 0) === $applicationId) && ($row['status'] ?? '') === 'verified') !== null;
    }

    private function hasPositiveInterview(int $userId, int $applicationId): bool
    {
        return $this->store->first('interviews', static fn (array $row): bool => ((int) ($row['professional_user_id'] ?? 0) === $userId || (int) ($row['application_id'] ?? 0) === $applicationId)
            && ($row['status'] ?? '') === 'completed'
            && in_array((string) ($row['recommendation'] ?? ''), ['recommend', 'recommend_with_conditions'], true)) !== null;
    }

    private function matchesText(mixed $left, mixed $right): bool
    {
        $left = strtolower(trim((string) $left));
        $right = strtolower(trim((string) $right));

        return $left !== '' && $right !== '' && (str_contains($left, $right) || str_contains($right, $left));
    }

    /**
     * @param array<string, mixed>|null $preference
     */
    private function matchesLocation(array $profile, ?array $preference, string $county): bool
    {
        $county = strtolower(trim($county));
        if ($county === '') {
            return false;
        }

        if (strtolower(trim((string) ($profile['county'] ?? ''))) === $county) {
            return true;
        }

        foreach ($preference['preferred_counties'] ?? [] as $preferred) {
            if (strtolower(trim((string) $preferred)) === $county) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safePreference(array $row, array $profile): array
    {
        return [
            'id' => (int) $row['id'],
            'user_id' => (int) $row['user_id'],
            'applicant_track' => $profile['applicant_track'] ?? ApplicantTrack::LicensedProfessional->value,
            'open_to_work' => (bool) $row['open_to_work'],
            'availability_status' => (string) $row['availability_status'],
            'available_from' => $row['available_from'] ?? null,
            'preferred_counties' => is_array($row['preferred_counties'] ?? null) ? $row['preferred_counties'] : [],
            'preferred_facility_types' => is_array($row['preferred_facility_types'] ?? null) ? $row['preferred_facility_types'] : [],
            'employment_types' => is_array($row['employment_types'] ?? null) ? $row['employment_types'] : [],
            'shift_preferences' => is_array($row['shift_preferences'] ?? null) ? $row['shift_preferences'] : [],
            'desired_roles' => is_array($row['desired_roles'] ?? null) ? $row['desired_roles'] : [],
            'minimum_rate_or_salary' => $row['minimum_rate_or_salary'] ?? null,
            'relocation_willingness' => $row['relocation_willingness'] ?? null,
            'remote_or_telehealth_interest' => (bool) ($row['remote_or_telehealth_interest'] ?? false),
            'notes' => $row['notes'] ?? null,
            'student_future_preferences' => is_array($row['student_future_preferences'] ?? null) ? $row['student_future_preferences'] : [],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeRequisition(array $row, bool $includeFacility): array
    {
        return [
            'id' => (int) $row['id'],
            'facility_id' => (int) $row['facility_id'],
            'facility' => $includeFacility ? $this->facilityLabel((int) $row['facility_id']) : null,
            'title' => (string) $row['title'],
            'profession_required' => (string) $row['profession_required'],
            'specialty_required' => $row['specialty_required'] ?? null,
            'facility_department' => $row['facility_department'] ?? null,
            'employment_type' => (string) $row['employment_type'],
            'number_of_positions' => (int) $row['number_of_positions'],
            'county' => (string) $row['county'],
            'facility_site' => $row['facility_site'] ?? null,
            'required_start_date' => $row['required_start_date'] ?? null,
            'end_date' => $row['end_date'] ?? null,
            'shift_pattern' => $row['shift_pattern'] ?? null,
            'urgency' => (string) $row['urgency'],
            'minimum_experience_years' => $row['minimum_experience_years'] ?? null,
            'required_credentials' => is_array($row['required_credentials'] ?? null) ? $row['required_credentials'] : [],
            'preferred_skills' => is_array($row['preferred_skills'] ?? null) ? $row['preferred_skills'] : [],
            'language_preferences' => is_array($row['language_preferences'] ?? null) ? $row['language_preferences'] : [],
            'salary_or_rate_range' => $row['salary_or_rate_range'] ?? null,
            'notes' => $includeFacility ? ($row['notes'] ?? null) : null,
            'status' => (string) $row['status'],
            'assigned_admin_id' => $includeFacility ? ($row['assigned_admin_id'] ?? null) : null,
            'submitted_at' => $row['submitted_at'] ?? null,
            'closed_at' => $row['closed_at'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeMatch(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'requisition_id' => (int) $row['requisition_id'],
            'candidate_publication_id' => $row['candidate_publication_id'] === null ? null : (int) $row['candidate_publication_id'],
            'professional_user_id' => (int) $row['professional_user_id'],
            'application_id' => $row['application_id'] === null ? null : (int) $row['application_id'],
            'match_score' => (float) $row['match_score'],
            'match_band' => (string) $row['match_band'],
            'status' => (string) $row['status'],
            'score_breakdown' => is_array($row['score_breakdown'] ?? null) ? $row['score_breakdown'] : [],
            'eligibility_reasons' => is_array($row['eligibility_reasons'] ?? null) ? $row['eligibility_reasons'] : [],
            'risk_flags' => is_array($row['risk_flags'] ?? null) ? $row['risk_flags'] : [],
            'candidate' => empty($row['candidate_publication_id']) ? null : $this->publications->packageCandidateSummary((int) $row['candidate_publication_id']),
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function matchesForRequisition(int $requisitionId): array
    {
        $rows = $this->store->where('candidate_matches', static fn (array $row): bool => (int) $row['requisition_id'] === $requisitionId);
        usort($rows, static fn (array $a, array $b): int => (int) ((float) $b['match_score'] <=> (float) $a['match_score']));

        return array_map(fn (array $row): array => $this->safeMatch($row), $rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function shortlistsForFacility(int $facilityId, ?int $requisitionId = null): array
    {
        $rows = $this->store->where('placement_shortlists', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId
            && ($row['status'] ?? '') === 'shared'
            && ($requisitionId === null || (int) $row['requisition_id'] === $requisitionId));
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeShortlist($row, includeCandidates: true, audience: 'facility'), $rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function shortlistsForRequisition(int $requisitionId, bool $includeDraft): array
    {
        $rows = $this->store->where('placement_shortlists', static fn (array $row): bool => (int) $row['requisition_id'] === $requisitionId && ($includeDraft || ($row['status'] ?? '') === 'shared'));
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeShortlist($row, includeCandidates: true, audience: 'admin'), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    private function shortlistDetail(int $shortlistId, bool $includeDraft): array
    {
        $shortlist = $this->store->find('placement_shortlists', $shortlistId);
        if ($shortlist === null || (!$includeDraft && ($shortlist['status'] ?? '') !== 'shared')) {
            throw new NotFoundException('Placement shortlist was not found.');
        }

        return $this->safeShortlist($shortlist, includeCandidates: true, audience: $includeDraft ? 'admin' : 'facility');
    }

    private function attachShortlistCandidates(int $shortlistId, mixed $matchIds, mixed $rationale): void
    {
        $ids = array_values(array_unique(array_filter(array_map(static fn (mixed $id): int => (int) $id, is_array($matchIds) ? $matchIds : explode(',', (string) $matchIds)), static fn (int $id): bool => $id > 0)));
        $rank = 1;
        foreach ($ids as $matchId) {
            $match = $this->requireMatch($matchId);
            $existing = $this->store->first('placement_shortlist_candidates', static fn (array $row): bool => (int) $row['shortlist_id'] === $shortlistId && (int) $row['professional_user_id'] === (int) $match['professional_user_id']);
            if ($existing !== null) {
                $rank++;
                continue;
            }
            $summary = $this->publications->packageCandidateSummary((int) $match['candidate_publication_id']);
            $this->store->insert('placement_shortlist_candidates', [
                'shortlist_id' => $shortlistId,
                'candidate_match_id' => $matchId,
                'candidate_publication_id' => (int) $match['candidate_publication_id'],
                'professional_user_id' => (int) $match['professional_user_id'],
                'rank_order' => $rank++,
                'admin_rationale' => is_array($rationale) ? ($rationale[$matchId] ?? null) : ($rationale === null ? null : (string) $rationale),
                'ai_draft_rationale' => null,
                'facility_visible_summary' => sprintf('%s match for %s. Afyalink admin reviewed suitability before sharing.', ucfirst((string) $match['match_band']), (string) ($summary['visible_profession'] ?? $summary['profession'] ?? 'role')),
                'status' => 'included',
                'created_at' => gmdate(DATE_ATOM),
                'updated_at' => gmdate(DATE_ATOM),
            ]);
        }
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeShortlist(array $row, bool $includeCandidates, string $audience): array
    {
        $candidateRows = $includeCandidates
            ? $this->store->where('placement_shortlist_candidates', static fn (array $candidate): bool => (int) $candidate['shortlist_id'] === (int) $row['id'])
            : [];
        usort($candidateRows, static fn (array $a, array $b): int => (int) $a['rank_order'] <=> (int) $b['rank_order']);

        return [
            'id' => (int) $row['id'],
            'requisition_id' => (int) $row['requisition_id'],
            'facility_id' => (int) $row['facility_id'],
            'facility' => $this->facilityLabel((int) $row['facility_id']),
            'title' => (string) $row['title'],
            'summary' => $row['summary'] ?? null,
            'status' => (string) $row['status'],
            'shared_at' => $row['shared_at'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
            'candidates' => array_map(fn (array $candidate): array => [
                'id' => (int) $candidate['id'],
                'rank_order' => (int) $candidate['rank_order'],
                'candidate' => empty($candidate['candidate_publication_id']) ? null : $this->publications->packageCandidateSummary((int) $candidate['candidate_publication_id']),
                'rationale' => $audience === 'admin' ? ($candidate['admin_rationale'] ?? null) : ($candidate['facility_visible_summary'] ?? null),
                'status' => (string) $candidate['status'],
            ], $candidateRows),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function placementsForFacility(int $facilityId, ?int $requisitionId = null): array
    {
        $rows = $this->store->where('placements', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId && ($requisitionId === null || (int) ($row['requisition_id'] ?? 0) === $requisitionId));
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safePlacement($row, audience: 'facility'), $rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function placementsForRequisition(int $requisitionId): array
    {
        $rows = $this->store->where('placements', static fn (array $row): bool => (int) ($row['requisition_id'] ?? 0) === $requisitionId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safePlacement($row, audience: 'admin'), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    private function placementDetail(int $placementId, string $audience): array
    {
        $placement = $this->requirePlacement($placementId);
        $events = $this->store->where('placement_events', static fn (array $row): bool => (int) $row['placement_id'] === $placementId);
        usort($events, static fn (array $a, array $b): int => strcmp((string) $a['created_at'], (string) $b['created_at']));

        return [
            'placement' => $this->safePlacement($placement, $audience),
            'events' => array_map(static fn (array $row): array => [
                'id' => (int) $row['id'],
                'event_type' => (string) $row['event_type'],
                'from_status' => $row['from_status'] ?? null,
                'to_status' => $row['to_status'] ?? null,
                'note' => $audience === 'admin' ? ($row['note'] ?? null) : null,
                'created_at' => (string) $row['created_at'],
            ], $events),
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safePlacement(array $row, string $audience): array
    {
        $safe = [
            'id' => (int) $row['id'],
            'facility_id' => (int) $row['facility_id'],
            'facility' => $this->facilityLabel((int) $row['facility_id']),
            'requisition_id' => $row['requisition_id'] === null ? null : (int) $row['requisition_id'],
            'professional_user_id' => (int) $row['professional_user_id'],
            'candidate_publication_id' => $row['candidate_publication_id'] === null ? null : (int) $row['candidate_publication_id'],
            'status' => (string) $row['status'],
            'start_date' => $row['start_date'] ?? null,
            'end_date' => $row['end_date'] ?? null,
            'employment_type' => $row['employment_type'] ?? null,
            'facility_note' => in_array($audience, ['admin', 'facility'], true) ? ($row['facility_note'] ?? null) : null,
            'admin_note' => $audience === 'admin' ? ($row['admin_note'] ?? null) : null,
            'professional_note' => in_array($audience, ['admin', 'professional'], true) ? ($row['professional_note'] ?? null) : null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
        if (!empty($row['candidate_publication_id'])) {
            $safe['candidate'] = $this->publications->packageCandidateSummary((int) $row['candidate_publication_id']);
        }

        return $safe;
    }

    private function recordPlacementEvent(int $placementId, int $actorId, string $type, ?string $from, ?string $to, mixed $note): void
    {
        $this->store->insert('placement_events', [
            'placement_id' => $placementId,
            'actor_user_id' => $actorId,
            'event_type' => $type,
            'from_status' => $from,
            'to_status' => $to,
            'note' => $this->nullableString($note),
            'metadata' => [],
            'created_at' => gmdate(DATE_ATOM),
        ]);
    }

    private function assertPlacementAccess(AuthenticatedUser $actor, array $placement, string $audience): void
    {
        if ($audience === 'professional' && (int) $placement['professional_user_id'] !== $actor->id) {
            throw new NotFoundException('Placement opportunity was not found.');
        }
        if ($audience === 'facility') {
            $facility = $this->facilities->facilityForUser($actor->id);
            if ($facility === null || (int) $facility['id'] !== (int) $placement['facility_id']) {
                throw new NotFoundException('Placement was not found.');
            }
        }
    }

    private function notifyProfessionalOpportunity(array $placement, string $type): void
    {
        $user = $this->store->find('users', (int) $placement['professional_user_id']);
        if ($user === null) {
            return;
        }

        $this->notifications?->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: $type,
            subject: 'Afyalink placement opportunity update',
            body: 'A placement opportunity status has changed in your Afyalink professional portal.',
            metadata: [
                'placement_id' => $placement['id'] ?? null,
                'status' => $placement['status'] ?? null,
            ],
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function facilityInterviewRequests(int $facilityId, ?int $requisitionId = null): array
    {
        $rows = $this->store->where('facility_interview_requests', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId && ($requisitionId === null || (int) ($row['requisition_id'] ?? 0) === $requisitionId));
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safeFacilityInterviewRequest($row), $rows);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeFacilityInterviewRequest(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'facility_id' => (int) $row['facility_id'],
            'requisition_id' => $row['requisition_id'] === null ? null : (int) $row['requisition_id'],
            'candidate_publication_id' => $row['candidate_publication_id'] === null ? null : (int) $row['candidate_publication_id'],
            'placement_id' => $row['placement_id'] === null ? null : (int) $row['placement_id'],
            'preferred_times' => is_array($row['preferred_times'] ?? null) ? $row['preferred_times'] : [],
            'mode' => (string) $row['mode'],
            'notes' => $row['notes'] ?? null,
            'status' => (string) $row['status'],
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeThread(array $row, string $audience): array
    {
        return [
            'id' => (int) $row['id'],
            'context_type' => (string) $row['context_type'],
            'context_id' => (int) $row['context_id'],
            'facility_id' => $row['facility_id'] === null ? null : (int) $row['facility_id'],
            'professional_user_id' => $row['professional_user_id'] === null ? null : (int) $row['professional_user_id'],
            'status' => (string) $row['status'],
            'subject' => (string) $row['subject'],
            'audience' => $audience,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeMessage(array $row, string $audience): array
    {
        $visibility = (string) $row['visibility'];
        if ($audience !== 'admin' && $visibility === 'internal_admin') {
            throw new NotFoundException('Message was not found.');
        }

        return [
            'id' => (int) $row['id'],
            'thread_id' => (int) $row['thread_id'],
            'sender_user_id' => $row['sender_user_id'] === null ? null : (int) $row['sender_user_id'],
            'body' => (string) $row['body'],
            'visibility' => $visibility,
            'created_at' => (string) $row['created_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeInvitation(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'facility_id' => (int) $row['facility_id'],
            'email' => (string) $row['email'],
            'role' => (string) $row['role'],
            'status' => (string) $row['status'],
            'expires_at' => (string) $row['expires_at'],
            'accepted_at' => $row['accepted_at'] ?? null,
            'created_at' => (string) $row['created_at'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function requireRequisition(int $id): array
    {
        $row = $this->store->find('facility_requisitions', $id);
        if ($row === null) {
            throw new NotFoundException('Facility requisition was not found.');
        }

        return $row;
    }

    /**
     * @return array<string, mixed>
     */
    private function requireMatch(int $id): array
    {
        $row = $this->store->find('candidate_matches', $id);
        if ($row === null) {
            throw new NotFoundException('Candidate match was not found.');
        }

        return $row;
    }

    /**
     * @return array<string, mixed>
     */
    private function requirePlacement(int $id): array
    {
        $row = $this->store->find('placements', $id);
        if ($row === null) {
            throw new NotFoundException('Placement was not found.');
        }

        return $row;
    }

    /**
     * @return array<string, mixed>
     */
    private function profileForUser(int $userId): array
    {
        $profile = $this->store->first('profiles', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        if ($profile === null) {
            throw new DomainException('Professional profile is required before placement matching.');
        }

        return $profile;
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
            'facility_type' => (string) $facility['facility_type'],
        ];
    }

    /**
     * @return list<string>
     */
    private function stringList(mixed $value): array
    {
        if (is_string($value)) {
            $value = preg_split('/[,;\n]/', $value) ?: [];
        }
        if (!is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(static fn (mixed $item): string => trim((string) $item), $value), static fn (string $item): bool => $item !== '')));
    }

    private function oneOf(string $value, array $allowed, string $fallback): string
    {
        return in_array($value, $allowed, true) ? $value : $fallback;
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));

        return $value === '' ? null : $value;
    }

    private function dateOrNull(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));
        if ($value === '') {
            return null;
        }

        return (new DateTimeImmutable($value))->format('Y-m-d');
    }
}
