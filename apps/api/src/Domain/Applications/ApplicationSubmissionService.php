<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Applications;

use Afyalink\Core\Domain\Credentials\CredentialRecord;
use Afyalink\Core\Domain\Credentials\CredentialRequirementRegistry;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Profiles\ProfessionalProfile;
use DateTimeImmutable;
use DomainException;

final readonly class ApplicationSubmissionService
{
    public function __construct(
        private CredentialRequirementRegistry $requirements = new CredentialRequirementRegistry(),
    ) {}

    /**
     * @param list<CredentialRecord> $credentials
     */
    public function submit(
        ProfessionalProfile $profile,
        array $credentials,
        bool $acceptedCurrentConsent,
        PaymentStatus $paymentStatus,
        ?int $actorId = null,
    ): ApplicationRecord {
        $credentialStatuses = [];
        foreach ($credentials as $credential) {
            $credentialStatuses[$credential->documentType->value] = $credential->reviewStatus;
        }

        $readiness = (new SubmissionReadinessChecker($this->requirements))->evaluate(
            profile: $profile->toSubmissionArray(),
            credentialStatuses: $credentialStatuses,
            acceptedCurrentConsent: $acceptedCurrentConsent,
            paymentStatus: $paymentStatus,
        );

        if (!$readiness->ready) {
            throw new DomainException('Professional application is not ready for submission: ' . implode(', ', [
                ...$readiness->missing,
                ...$readiness->warnings,
            ]));
        }

        $created = new DateTimeImmutable();
        $application = new ApplicationRecord(
            applicationNumber: $this->makeApplicationNumber($profile, $created),
            status: ApplicationStatus::Draft,
            createdAt: $created,
            timeline: [],
        );

        return $application->withStatus(
            status: ApplicationStatus::Submitted,
            note: 'Professional submitted complete credential package.',
            actorId: $actorId,
        );
    }

    private function makeApplicationNumber(ProfessionalProfile $profile, DateTimeImmutable $created): string
    {
        $seed = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $profile->licenseNumber), 0, 8));
        $date = $created->format('Ymd');
        $fingerprint = strtoupper(substr(hash('crc32b', $profile->email . $profile->phone . $created->format('c')), 0, 6));

        return sprintf('AFYA-%s-%s-%s', $date, $seed ?: 'PRO', $fingerprint);
    }
}

