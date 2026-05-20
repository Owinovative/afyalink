<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Professionals;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\StudentStatus;
use Afyalink\Core\Domain\Profiles\ProfessionalProfile;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;

final readonly class ProfessionalProfileService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function upsert(AuthenticatedUser $user, array $input, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $existing = $this->store->first('profiles', static fn (array $row): bool => (int) $row['user_id'] === $user->id);
        $track = (string) ($input['applicant_track'] ?? $existing['applicant_track'] ?? ApplicantTrack::LicensedProfessional->value);

        if ($track === ApplicantTrack::StudentAwaitingLicense->value) {
            return $this->upsertStudentProfile($user, $input, $existing, $ipAddress, $userAgent);
        }

        Validator::requireFields($input, [
            'name',
            'phone',
            'profession',
            'regulatory_body',
            'license_number',
            'county',
        ]);

        $profile = new ProfessionalProfile(
            name: trim((string) $input['name']),
            email: $user->email,
            phone: trim((string) $input['phone']),
            profession: trim((string) $input['profession']),
            regulatoryBody: trim((string) $input['regulatory_body']),
            licenseNumber: trim((string) $input['license_number']),
            county: trim((string) $input['county']),
            yearsExperience: (float) ($input['years_experience'] ?? 0),
            workPreferences: is_array($input['work_preferences'] ?? null) ? $input['work_preferences'] : [
                'availability' => (string) ($input['availability'] ?? ''),
                'preferred_counties' => (string) ($input['preferred_counties'] ?? ''),
                'placement_type' => (string) ($input['placement_type'] ?? ''),
            ],
        );

        $payload = [
            'user_id' => $user->id,
            'applicant_track' => ApplicantTrack::LicensedProfessional->value,
            'student_status' => null,
            ...$profile->toSubmissionArray(),
            'target_profession' => trim((string) ($input['profession'] ?? '')),
            'expected_regulatory_body' => trim((string) ($input['regulatory_body'] ?? '')),
            'institution_name' => null,
            'programme_or_course' => null,
            'graduation_or_completion_date' => null,
            'prelicensure_note' => null,
            'conversion_review_status' => (string) ($existing['conversion_review_status'] ?? '') === 'converted'
                ? 'converted'
                : 'not_applicable',
            'license_uploaded_at' => $existing['license_uploaded_at'] ?? null,
            'availability' => (string) ($input['availability'] ?? ''),
            'updated_at' => gmdate(DATE_ATOM),
        ];

        $saved = $existing === null
            ? $this->store->insert('profiles', ['created_at' => gmdate(DATE_ATOM), ...$payload])
            : $this->store->update('profiles', (int) $existing['id'], $payload);

        $this->audit->record($user->id, 'professional.profile_saved', 'ProfessionalProfile', (string) $saved['id'], [
            'profession' => $saved['profession'],
            'county' => $saved['county'],
            'regulatory_body' => $saved['regulatory_body'],
        ], $ipAddress, $userAgent);

        return $saved;
    }

    /**
     * @param array<string, mixed> $input
     * @param array<string, mixed>|null $existing
     * @return array<string, mixed>
     */
    private function upsertStudentProfile(
        AuthenticatedUser $user,
        array $input,
        ?array $existing,
        ?string $ipAddress,
        ?string $userAgent,
    ): array {
        Validator::requireFields($input, [
            'name',
            'phone',
            'student_status',
            'target_profession',
            'institution_name',
            'programme_or_course',
            'county',
        ]);

        $studentStatus = StudentStatus::tryFrom((string) $input['student_status']);
        if ($studentStatus === null) {
            throw new \InvalidArgumentException('Student status is invalid.');
        }

        $licenseNumber = trim((string) ($input['license_number'] ?? $existing['license_number'] ?? ''));
        $regulatoryBody = trim((string) ($input['regulatory_body'] ?? $input['expected_regulatory_body'] ?? $existing['regulatory_body'] ?? ''));
        $conversionStatus = $licenseNumber !== '' && $regulatoryBody !== ''
            ? 'license_submitted'
            : (string) ($existing['conversion_review_status'] ?? 'waiting_for_license');

        $payload = [
            'user_id' => $user->id,
            'applicant_track' => ApplicantTrack::StudentAwaitingLicense->value,
            'student_status' => $studentStatus->value,
            'name' => trim((string) $input['name']),
            'email' => $user->email,
            'phone' => trim((string) $input['phone']),
            'profession' => trim((string) $input['target_profession']),
            'target_profession' => trim((string) $input['target_profession']),
            'regulatory_body' => $regulatoryBody,
            'expected_regulatory_body' => trim((string) ($input['expected_regulatory_body'] ?? $regulatoryBody)),
            'license_number' => $licenseNumber,
            'county' => trim((string) $input['county']),
            'years_experience' => 0,
            'institution_name' => trim((string) $input['institution_name']),
            'programme_or_course' => trim((string) $input['programme_or_course']),
            'graduation_or_completion_date' => trim((string) ($input['graduation_or_completion_date'] ?? '')) ?: null,
            'prelicensure_note' => trim((string) ($input['notes'] ?? $existing['prelicensure_note'] ?? '')),
            'conversion_review_status' => $conversionStatus,
            'license_uploaded_at' => $licenseNumber !== '' ? (string) ($existing['license_uploaded_at'] ?? gmdate(DATE_ATOM)) : null,
            'availability' => (string) ($input['availability_after_licensure'] ?? $input['availability'] ?? ''),
            'work_preferences' => [
                'availability_after_licensure' => (string) ($input['availability_after_licensure'] ?? ''),
                'preferred_counties' => (string) ($input['preferred_counties'] ?? ''),
                'placement_type' => (string) ($input['placement_type'] ?? ''),
            ],
            'updated_at' => gmdate(DATE_ATOM),
        ];

        $saved = $existing === null
            ? $this->store->insert('profiles', ['created_at' => gmdate(DATE_ATOM), ...$payload])
            : $this->store->update('profiles', (int) $existing['id'], $payload);

        $this->audit->record($user->id, 'student_awaiting_license.profile_saved', 'ProfessionalProfile', (string) $saved['id'], [
            'target_profession' => $saved['target_profession'],
            'student_status' => $saved['student_status'],
            'conversion_review_status' => $saved['conversion_review_status'],
        ], $ipAddress, $userAgent);

        return $saved;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findForUser(int $userId): ?array
    {
        return $this->store->first('profiles', static fn (array $row): bool => (int) $row['user_id'] === $userId);
    }

    public function requireForUser(int $userId): ProfessionalProfile
    {
        $profile = $this->findForUser($userId);
        if ($profile === null) {
            throw new NotFoundException('Professional profile has not been completed.');
        }

        return new ProfessionalProfile(
            name: (string) $profile['name'],
            email: (string) $profile['email'],
            phone: (string) $profile['phone'],
            profession: (string) $profile['profession'],
            regulatoryBody: (string) $profile['regulatory_body'],
            licenseNumber: (string) $profile['license_number'],
            county: (string) $profile['county'],
            yearsExperience: (float) ($profile['years_experience'] ?? 0),
            workPreferences: is_array($profile['work_preferences'] ?? null) ? $profile['work_preferences'] : [],
        );
    }
}
