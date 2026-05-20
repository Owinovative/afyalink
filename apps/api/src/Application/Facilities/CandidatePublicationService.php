<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Facilities;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Consent\ConsentService;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\CandidatePublicationStatus;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\InterviewRecommendation;
use Afyalink\Core\Domain\Enums\InterviewStatus;
use Afyalink\Core\Domain\Enums\VerificationStatus;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;
use DomainException;

final readonly class CandidatePublicationService
{
    public function __construct(
        private DataStore $store,
        private FacilityService $facilities,
        private FacilityAccessService $access,
        private ConsentService $consents,
        private AuditLogger $audit,
        private ?NotificationService $notifications = null,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function publish(
        AuthenticatedUser $admin,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['application_id']);
        $applicationId = (int) $input['application_id'];
        $application = $this->requireApplication($applicationId);
        $this->assertPublishable($application);

        $existing = $this->store->first('candidate_publications', static fn (array $row): bool => (int) $row['application_id'] === $applicationId);
        $snapshot = $this->buildSummarySnapshot($application, $input);
        $status = CandidatePublicationStatus::from((string) ($input['status'] ?? CandidatePublicationStatus::Published->value));
        $now = gmdate(DATE_ATOM);
        $payload = [
            'application_id' => $applicationId,
            'professional_user_id' => (int) $application['user_id'],
            'status' => $status->value,
            'summary_snapshot' => $snapshot,
            'private_admin_notes' => [
                'note' => trim((string) ($input['admin_note'] ?? '')),
            ],
            'published_by' => $status === CandidatePublicationStatus::Published ? $admin->id : ($existing['published_by'] ?? null),
            'published_at' => $status === CandidatePublicationStatus::Published ? $now : ($existing['published_at'] ?? null),
            'unpublished_by' => in_array($status, [CandidatePublicationStatus::Paused, CandidatePublicationStatus::Withdrawn], true) ? $admin->id : null,
            'unpublished_at' => in_array($status, [CandidatePublicationStatus::Paused, CandidatePublicationStatus::Withdrawn], true) ? $now : null,
            'updated_at' => $now,
        ];

        $publication = $existing === null
            ? $this->store->insert('candidate_publications', ['created_at' => $now, ...$payload])
            : $this->store->update('candidate_publications', (int) $existing['id'], $payload);

        $this->audit->record($admin->id, 'candidate_publication.saved', 'CandidatePublication', (string) $publication['id'], [
            'application_id' => $applicationId,
            'professional_user_id' => $application['user_id'] ?? null,
            'status' => $publication['status'],
        ], $ipAddress, $userAgent);
        $this->notifications?->candidatePublicationStatusChanged($application, $publication);

        return $this->adminDetail((int) $publication['id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function updateStatus(
        AuthenticatedUser $admin,
        int $publicationId,
        CandidatePublicationStatus $status,
        ?string $note = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $publication = $this->requirePublication($publicationId);
        if ($status === CandidatePublicationStatus::Published) {
            $application = $this->requireApplication((int) $publication['application_id']);
            $this->assertPublishable($application);
        }

        $now = gmdate(DATE_ATOM);
        $updated = $this->store->update('candidate_publications', $publicationId, [
            'status' => $status->value,
            'private_admin_notes' => ['note' => trim((string) $note)],
            'published_by' => $status === CandidatePublicationStatus::Published ? $admin->id : ($publication['published_by'] ?? null),
            'published_at' => $status === CandidatePublicationStatus::Published ? $now : ($publication['published_at'] ?? null),
            'unpublished_by' => in_array($status, [CandidatePublicationStatus::Paused, CandidatePublicationStatus::Withdrawn], true) ? $admin->id : ($publication['unpublished_by'] ?? null),
            'unpublished_at' => in_array($status, [CandidatePublicationStatus::Paused, CandidatePublicationStatus::Withdrawn], true) ? $now : ($publication['unpublished_at'] ?? null),
            'updated_at' => $now,
        ]);

        $this->audit->record($admin->id, 'candidate_publication.status_changed', 'CandidatePublication', (string) $publicationId, [
            'from' => $publication['status'] ?? null,
            'to' => $status->value,
            'professional_user_id' => $publication['professional_user_id'] ?? null,
            'note' => $note,
        ], $ipAddress, $userAgent);
        $application = $this->requireApplication((int) $updated['application_id']);
        $this->notifications?->candidatePublicationStatusChanged($application, $updated);

        return $this->adminDetail($publicationId);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForAdmin(?string $status = null, ?string $search = null): array
    {
        $rows = $this->store->all('candidate_publications');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        if ($search !== null && trim($search) !== '') {
            $needle = strtolower(trim($search));
            $rows = array_values(array_filter($rows, function (array $row) use ($needle): bool {
                $summary = is_array($row['summary_snapshot'] ?? null) ? $row['summary_snapshot'] : [];

                return str_contains(strtolower((string) ($summary['candidate_code'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($summary['name'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($summary['profession'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($summary['county'] ?? '')), $needle);
            }));
        }

        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_map(fn (array $row): array => $this->safePublicationSummary($row), $rows);
    }

    /**
     * @return array<string, int>
     */
    public function overview(): array
    {
        $counts = [
            'total' => 0,
            'draft' => 0,
            'published' => 0,
            'paused' => 0,
            'withdrawn' => 0,
            'candidate_profile_views' => count($this->store->all('candidate_profile_views')),
        ];

        foreach ($this->store->all('candidate_publications') as $row) {
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
    public function adminDetail(int $publicationId): array
    {
        $publication = $this->requirePublication($publicationId);

        return [
            'publication' => $this->safePublicationSummary($publication),
            'application' => $this->requireApplication((int) $publication['application_id']),
            'profile' => $this->profileForUser((int) $publication['professional_user_id']),
            'view_count' => $this->viewCountForPublication($publicationId),
        ];
    }

    /**
     * @param array<string, mixed> $filters
     * @return list<array<string, mixed>>
     */
    public function browseForFacility(AuthenticatedUser $viewer, array $filters = []): array
    {
        $facility = $this->facilities->requireApprovedFacilityForUser($viewer->id);
        $this->access->assertFacilityHasActiveAccess((int) $facility['id']);

        $rows = array_values(array_filter(
            $this->store->all('candidate_publications'),
            static fn (array $row): bool => ($row['status'] ?? '') === CandidatePublicationStatus::Published->value,
        ));
        $rows = $this->filterPublishedRows($rows, $filters);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['published_at'], (string) $a['published_at']));

        return array_map(fn (array $row): array => $this->facilityCandidateSummary($row), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function detailForFacility(
        AuthenticatedUser $viewer,
        int $publicationId,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $facility = $this->facilities->requireApprovedFacilityForUser($viewer->id);
        $this->access->assertFacilityHasActiveAccess((int) $facility['id']);
        $publication = $this->requirePublication($publicationId);
        if (($publication['status'] ?? '') !== CandidatePublicationStatus::Published->value) {
            throw new NotFoundException('Candidate publication was not found.');
        }

        $watermark = [
            'facility' => (string) $facility['display_name'],
            'viewer_email' => $viewer->email,
            'viewed_at' => gmdate(DATE_ATOM),
            'candidate' => (string) (($publication['summary_snapshot']['candidate_code'] ?? null) ?: 'AFYA-CAND-' . $publicationId),
        ];
        $view = $this->store->insert('candidate_profile_views', [
            'candidate_publication_id' => $publicationId,
            'professional_user_id' => (int) $publication['professional_user_id'],
            'facility_id' => (int) $facility['id'],
            'viewer_user_id' => $viewer->id,
            'action' => 'profile_viewed',
            'watermark' => $watermark,
            'metadata' => ['source' => 'facility_marketplace'],
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'created_at' => gmdate(DATE_ATOM),
        ]);
        $this->audit->record($viewer->id, 'candidate.profile_viewed', 'CandidatePublication', (string) $publicationId, [
            'facility_id' => $facility['id'],
            'professional_user_id' => $publication['professional_user_id'] ?? null,
            'view_id' => $view['id'],
        ], $ipAddress, $userAgent);

        return [
            'candidate' => $this->facilityCandidateSummary($publication),
            'profile' => $this->facilitySafeProfile((int) $publication['professional_user_id']),
            'credential_metadata' => $this->safeCredentialMetadata((int) $publication['professional_user_id']),
            'watermark' => $watermark,
            'legal_warning' => 'This profile is view-only. Copying, downloading, or sharing outside the approved facility workflow is prohibited and audited.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function professionalVisibility(int $userId): array
    {
        $rows = $this->store->where('candidate_publications', static fn (array $row): bool => (int) $row['professional_user_id'] === $userId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));
        $publication = $rows[0] ?? null;

        return [
            'published' => $publication !== null && ($publication['status'] ?? '') === CandidatePublicationStatus::Published->value,
            'status' => $publication['status'] ?? null,
            'candidate_code' => is_array($publication['summary_snapshot'] ?? null) ? ($publication['summary_snapshot']['candidate_code'] ?? null) : null,
            'view_count' => $publication === null ? 0 : $this->viewCountForPublication((int) $publication['id']),
        ];
    }

    /**
     * @param list<int> $publicationIds
     */
    public function assertPublishedCandidateIds(array $publicationIds): void
    {
        foreach ($publicationIds as $id) {
            $publication = $this->requirePublication((int) $id);
            if (($publication['status'] ?? '') !== CandidatePublicationStatus::Published->value) {
                throw new DomainException('Candidate reference is not published.');
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function packageCandidateSummary(int $publicationId): array
    {
        return $this->facilityCandidateSummary($this->requirePublication($publicationId));
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @param array<string, mixed> $filters
     * @return list<array<string, mixed>>
     */
    private function filterPublishedRows(array $rows, array $filters): array
    {
        return array_values(array_filter($rows, static function (array $row) use ($filters): bool {
            $summary = is_array($row['summary_snapshot'] ?? null) ? $row['summary_snapshot'] : [];
            foreach (['profession', 'county', 'availability', 'verification_status', 'qualification_status'] as $field) {
                $value = trim((string) ($filters[$field] ?? ''));
                if ($value !== '' && !str_contains(strtolower((string) ($summary[$field] ?? '')), strtolower($value))) {
                    return false;
                }
            }

            $search = trim((string) ($filters['search'] ?? ''));
            if ($search !== '') {
                $haystack = strtolower(implode(' ', [
                    $summary['name'] ?? '',
                    $summary['profession'] ?? '',
                    $summary['county'] ?? '',
                    $summary['candidate_code'] ?? '',
                ]));
                if (!str_contains($haystack, strtolower($search))) {
                    return false;
                }
            }

            if (isset($filters['min_years_experience']) && $filters['min_years_experience'] !== '' && (float) ($summary['years_experience'] ?? 0) < (float) $filters['min_years_experience']) {
                return false;
            }

            return true;
        }));
    }

    /**
     * @param array<string, mixed> $application
     */
    private function assertPublishable(array $application): void
    {
        if (!in_array((string) ($application['status'] ?? ''), [ApplicationStatus::Qualified->value, ApplicationStatus::Approved->value], true)) {
            throw new DomainException('Only qualified or approved candidates can be published.');
        }
        $profile = $this->profileForUser((int) $application['user_id']);
        if ($profile === null) {
            throw new DomainException('Professional profile is required before publication.');
        }
        if (($profile['applicant_track'] ?? ApplicantTrack::LicensedProfessional->value) !== ApplicantTrack::LicensedProfessional->value) {
            throw new DomainException('Waiting-license applicants cannot be published to the facility catalogue.');
        }
        if (!$this->consents->hasCurrentConsent((int) $application['user_id'])) {
            throw new DomainException('Candidate consent must be current before publication.');
        }

        $verification = $this->store->first('verification_cases', static fn (array $row): bool => (int) $row['application_id'] === (int) $application['id'] && ($row['status'] ?? '') === VerificationStatus::Verified->value);
        if ($verification === null) {
            throw new DomainException('Candidate must have a passed verification case before publication.');
        }

        $interview = $this->latestInterview((int) $application['id']);
        if ($interview === null || ($interview['status'] ?? '') !== InterviewStatus::Completed->value) {
            throw new DomainException('Candidate interview must be completed before publication.');
        }
        if (!in_array((string) ($interview['recommendation'] ?? ''), [InterviewRecommendation::Recommend->value, InterviewRecommendation::RecommendWithConditions->value], true)) {
            throw new DomainException('Candidate interview recommendation does not allow publication.');
        }
    }

    /**
     * @param array<string, mixed> $application
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function buildSummarySnapshot(array $application, array $input): array
    {
        $profile = $this->profileForUser((int) $application['user_id']);
        if ($profile === null) {
            throw new DomainException('Professional profile is required before publication.');
        }
        if (($profile['applicant_track'] ?? ApplicantTrack::LicensedProfessional->value) !== ApplicantTrack::LicensedProfessional->value) {
            throw new DomainException('Waiting-license applicants cannot be published to the facility catalogue.');
        }
        $verification = $this->store->first('verification_cases', static fn (array $row): bool => (int) $row['application_id'] === (int) $application['id']);
        $interview = $this->latestInterview((int) $application['id']);

        return [
            'candidate_code' => 'AFYA-CAND-' . (int) $application['id'],
            'name' => (string) $profile['name'],
            'profession' => (string) $profile['profession'],
            'county' => (string) $profile['county'],
            'years_experience' => (float) ($profile['years_experience'] ?? 0),
            'availability' => (string) ($profile['availability'] ?? ''),
            'verification_status' => (string) ($verification['status'] ?? ''),
            'qualification_status' => (string) ($application['status'] ?? ''),
            'recommendation' => (string) ($interview['recommendation'] ?? ''),
            'total_score' => $interview['total_score'] ?? null,
            'average_score' => $interview['average_score'] ?? null,
            'headline' => trim((string) ($input['headline'] ?? 'Verified ' . $profile['profession'])),
            'summary' => trim((string) ($input['summary'] ?? 'Afyalink verified and interview-qualified professional.')),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function requireApplication(int $applicationId): array
    {
        $application = $this->store->find('applications', $applicationId);
        if ($application === null) {
            throw new NotFoundException('Application was not found.');
        }

        return $application;
    }

    /**
     * @return array<string, mixed>
     */
    private function requirePublication(int $publicationId): array
    {
        $publication = $this->store->find('candidate_publications', $publicationId);
        if ($publication === null) {
            throw new NotFoundException('Candidate publication was not found.');
        }

        return $publication;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function profileForUser(int $userId): ?array
    {
        return $this->store->first('profiles', static fn (array $row): bool => (int) $row['user_id'] === $userId);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function latestInterview(int $applicationId): ?array
    {
        $rows = $this->store->where('interviews', static fn (array $row): bool => (int) $row['application_id'] === $applicationId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return $rows[0] ?? null;
    }

    private function viewCountForPublication(int $publicationId): int
    {
        return count($this->store->where('candidate_profile_views', static fn (array $row): bool => (int) $row['candidate_publication_id'] === $publicationId));
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safePublicationSummary(array $row): array
    {
        $summary = is_array($row['summary_snapshot'] ?? null) ? $row['summary_snapshot'] : [];

        return [
            'id' => (int) $row['id'],
            'application_id' => (int) $row['application_id'],
            'professional_user_id' => (int) $row['professional_user_id'],
            'status' => (string) $row['status'],
            'summary' => $summary,
            'published_at' => $row['published_at'] ?? null,
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function facilityCandidateSummary(array $row): array
    {
        $summary = is_array($row['summary_snapshot'] ?? null) ? $row['summary_snapshot'] : [];

        return [
            'id' => (int) $row['id'],
            'candidate_code' => (string) ($summary['candidate_code'] ?? ('AFYA-CAND-' . (int) $row['id'])),
            'name' => (string) ($summary['name'] ?? ''),
            'profession' => (string) ($summary['profession'] ?? ''),
            'county' => (string) ($summary['county'] ?? ''),
            'years_experience' => (float) ($summary['years_experience'] ?? 0),
            'availability' => (string) ($summary['availability'] ?? ''),
            'verification_status' => (string) ($summary['verification_status'] ?? ''),
            'qualification_status' => (string) ($summary['qualification_status'] ?? ''),
            'recommendation' => (string) ($summary['recommendation'] ?? ''),
            'average_score' => $summary['average_score'] ?? null,
            'headline' => (string) ($summary['headline'] ?? ''),
            'summary' => (string) ($summary['summary'] ?? ''),
            'published_at' => $row['published_at'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function facilitySafeProfile(int $userId): array
    {
        $profile = $this->profileForUser($userId);
        if ($profile === null) {
            return [];
        }

        return [
            'name' => (string) $profile['name'],
            'profession' => (string) $profile['profession'],
            'county' => (string) $profile['county'],
            'years_experience' => (float) ($profile['years_experience'] ?? 0),
            'availability' => (string) ($profile['availability'] ?? ''),
            'work_preferences' => is_array($profile['work_preferences'] ?? null) ? $profile['work_preferences'] : [],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function safeCredentialMetadata(int $userId): array
    {
        $rows = $this->store->where('credentials', static fn (array $row): bool => (int) $row['user_id'] === $userId
            && empty($row['superseded_at'])
            && ($row['review_status'] ?? '') === CredentialReviewStatus::Accepted->value);

        return array_map(static fn (array $row): array => [
            'document_type' => (string) $row['document_type'],
            'original_name' => (string) $row['original_name'],
            'mime_type' => (string) $row['mime_type'],
            'review_status' => (string) $row['review_status'],
            'reviewed_at' => $row['reviewed_at'] ?? null,
        ], $rows);
    }
}
