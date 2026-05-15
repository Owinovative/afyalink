<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Profiles;

use InvalidArgumentException;

final readonly class ProfessionalProfile
{
    /**
     * @param array<string, mixed> $workPreferences
     */
    public function __construct(
        public string $name,
        public string $email,
        public string $phone,
        public string $profession,
        public string $regulatoryBody,
        public string $licenseNumber,
        public string $county,
        public float $yearsExperience,
        public array $workPreferences = [],
    ) {
        foreach ([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'profession' => $profession,
            'regulatoryBody' => $regulatoryBody,
            'licenseNumber' => $licenseNumber,
            'county' => $county,
        ] as $field => $value) {
            if (trim($value) === '') {
                throw new InvalidArgumentException("Professional profile field {$field} is required.");
            }
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Professional email is invalid.');
        }

        if ($yearsExperience < 0) {
            throw new InvalidArgumentException('Years of experience cannot be negative.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toSubmissionArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'profession' => $this->profession,
            'regulatory_body' => $this->regulatoryBody,
            'license_number' => $this->licenseNumber,
            'county' => $this->county,
            'years_experience' => $this->yearsExperience,
            'work_preferences' => $this->workPreferences,
        ];
    }
}

