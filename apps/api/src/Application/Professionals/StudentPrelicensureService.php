<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Professionals;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Domain\Credentials\CredentialRequirementRegistry;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\DocumentType;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use DomainException;

final readonly class StudentPrelicensureService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private CredentialRequirementRegistry $requirements = new CredentialRequirementRegistry(),
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function listForAdmin(?string $search = null, ?string $status = null): array
    {
        $rows = $this->store->where('profiles', static fn (array $row): bool => ($row['applicant_track'] ?? '') === ApplicantTrack::StudentAwaitingLicense->value);

        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['conversion_review_status'] ?? '') === $status || ($row['student_status'] ?? '') === $status));
        }

        if ($search !== null && trim($search) !== '') {
            $needle = strtolower(trim($search));
            $rows = array_values(array_filter($rows, static function (array $row) use ($needle): bool {
                return str_contains(strtolower((string) ($row['name'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($row['email'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($row['target_profession'] ?? $row['profession'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($row['institution_name'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($row['county'] ?? '')), $needle);
            }));
        }

        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['updated_at'] ?? ''), (string) ($a['updated_at'] ?? '')));

        return array_map(fn (array $row): array => $this->summary($row), $rows);
    }

    /**
     * @return array<string, int>
     */
    public function overview(): array
    {
        $counts = [
            'total' => 0,
            'waiting_for_license' => 0,
            'license_submitted' => 0,
            'converted' => 0,
        ];

        foreach ($this->store->where('profiles', static fn (array $row): bool => ($row['applicant_track'] ?? '') === ApplicantTrack::StudentAwaitingLicense->value) as $row) {
            $counts['total']++;
            $status = (string) ($row['conversion_review_status'] ?? 'waiting_for_license');
            if (array_key_exists($status, $counts)) {
                $counts[$status]++;
            }
        }

        return $counts;
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboardState(?array $profile, array $credentials): array
    {
        if ($profile === null || ($profile['applicant_track'] ?? ApplicantTrack::LicensedProfessional->value) !== ApplicantTrack::StudentAwaitingLicense->value) {
            return [
                'active' => false,
                'track' => ApplicantTrack::LicensedProfessional->value,
            ];
        }

        return [
            'active' => true,
            'track' => ApplicantTrack::StudentAwaitingLicense->value,
            'student_status' => $profile['student_status'] ?? null,
            'conversion_review_status' => $profile['conversion_review_status'] ?? 'waiting_for_license',
            'license_pending' => trim((string) ($profile['license_number'] ?? '')) === '',
            'required_documents' => $this->documentChecklist($profile, $credentials),
            'can_request_conversion' => $this->hasLicenseReady($profile, $credentials),
            'message' => 'Waiting-license applicants can prepare their Afyalink profile now, but cannot enter facility publication until converted to the licensed professional track.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function convertToLicensed(
        AuthenticatedUser $admin,
        int $profileId,
        ?string $note,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $profile = $this->store->find('profiles', $profileId);
        if ($profile === null || ($profile['applicant_track'] ?? '') !== ApplicantTrack::StudentAwaitingLicense->value) {
            throw new NotFoundException('Pre-licensure profile was not found.');
        }

        $credentials = $this->credentialsForUser((int) $profile['user_id']);
        if (!$this->hasLicenseReady($profile, $credentials)) {
            throw new DomainException('Professional license details and a non-rejected license document are required before conversion.');
        }

        $updated = $this->store->update('profiles', $profileId, [
            'applicant_track' => ApplicantTrack::LicensedProfessional->value,
            'profession' => (string) ($profile['target_profession'] ?? $profile['profession']),
            'conversion_review_status' => 'converted',
            'converted_to_licensed_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'student_awaiting_license.converted', 'ProfessionalProfile', (string) $profileId, [
            'professional_user_id' => $profile['user_id'] ?? null,
            'target_profession' => $profile['target_profession'] ?? null,
            'note' => $note,
        ], $ipAddress, $userAgent);

        return $this->summary($updated);
    }

    /**
     * @param array<string, mixed> $profile
     * @param list<array<string, mixed>> $credentials
     * @return list<array<string, mixed>>
     */
    private function documentChecklist(array $profile, array $credentials): array
    {
        $latest = [];
        foreach ($credentials as $credential) {
            $latest[(string) $credential['document_type']] = $credential;
        }

        $checklist = [];
        foreach ($this->requirements->minimumRequiredDocumentsForTrack(ApplicantTrack::StudentAwaitingLicense->value, (string) ($profile['target_profession'] ?? '')) as $type) {
            $row = $latest[$type->value] ?? null;
            $checklist[] = [
                'document_type' => $type->value,
                'uploaded' => $row !== null,
                'review_status' => $row['review_status'] ?? null,
            ];
        }

        $license = $latest[DocumentType::ProfessionalLicense->value] ?? null;
        $checklist[] = [
            'document_type' => DocumentType::ProfessionalLicense->value,
            'uploaded' => $license !== null,
            'review_status' => $license['review_status'] ?? null,
            'unlocks' => 'licensed_professional_conversion',
        ];

        return $checklist;
    }

    /**
     * @param array<string, mixed> $profile
     * @param list<array<string, mixed>> $credentials
     */
    private function hasLicenseReady(array $profile, array $credentials): bool
    {
        $hasLicenseDetails = trim((string) ($profile['license_number'] ?? '')) !== ''
            && trim((string) ($profile['regulatory_body'] ?? '')) !== '';

        $license = null;
        foreach ($credentials as $credential) {
            if (($credential['document_type'] ?? '') === DocumentType::ProfessionalLicense->value) {
                $license = $credential;
                break;
            }
        }

        return $hasLicenseDetails
            && $license !== null
            && !in_array((string) ($license['review_status'] ?? ''), [
                CredentialReviewStatus::Rejected->value,
                CredentialReviewStatus::NeedsReplacement->value,
                CredentialReviewStatus::Expired->value,
            ], true);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function credentialsForUser(int $userId): array
    {
        return $this->store->where('credentials', static fn (array $row): bool => (int) $row['user_id'] === $userId && empty($row['superseded_at']));
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function summary(array $row): array
    {
        $credentials = $this->credentialsForUser((int) $row['user_id']);

        return [
            'id' => (int) $row['id'],
            'user_id' => (int) $row['user_id'],
            'name' => (string) ($row['name'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'phone' => (string) ($row['phone'] ?? ''),
            'applicant_track' => (string) ($row['applicant_track'] ?? ''),
            'student_status' => $row['student_status'] ?? null,
            'target_profession' => (string) ($row['target_profession'] ?? $row['profession'] ?? ''),
            'institution_name' => (string) ($row['institution_name'] ?? ''),
            'programme_or_course' => (string) ($row['programme_or_course'] ?? ''),
            'county' => (string) ($row['county'] ?? ''),
            'expected_regulatory_body' => (string) ($row['expected_regulatory_body'] ?? $row['regulatory_body'] ?? ''),
            'license_number' => (string) ($row['license_number'] ?? ''),
            'conversion_review_status' => (string) ($row['conversion_review_status'] ?? 'waiting_for_license'),
            'license_uploaded_at' => $row['license_uploaded_at'] ?? null,
            'converted_to_licensed_at' => $row['converted_to_licensed_at'] ?? null,
            'document_checklist' => $this->documentChecklist($row, $credentials),
            'can_convert' => $this->hasLicenseReady($row, $credentials),
            'updated_at' => (string) ($row['updated_at'] ?? ''),
        ];
    }
}

