<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Professionals;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Domain\Profiles\ProfessionalProfile;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;

final readonly class ProfessionalProfileService
{
    public function __construct(
        private JsonDataStore $store,
        private AuditLogger $audit,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function upsert(AuthenticatedUser $user, array $input, ?string $ipAddress = null, ?string $userAgent = null): array
    {
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
            ...$profile->toSubmissionArray(),
            'availability' => (string) ($input['availability'] ?? ''),
            'updated_at' => gmdate(DATE_ATOM),
        ];

        $existing = $this->store->first('profiles', static fn (array $row): bool => (int) $row['user_id'] === $user->id);
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
