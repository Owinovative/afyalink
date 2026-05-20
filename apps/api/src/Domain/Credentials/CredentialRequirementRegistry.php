<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Credentials;

use Afyalink\Core\Domain\Enums\DocumentType;
use Afyalink\Core\Domain\Enums\ApplicantTrack;

final class CredentialRequirementRegistry
{
    /**
     * @return list<DocumentType>
     */
    public function minimumRequiredDocuments(string $profession): array
    {
        return $this->minimumRequiredDocumentsForTrack(ApplicantTrack::LicensedProfessional->value, $profession);
    }

    /**
     * @return list<DocumentType>
     */
    public function minimumRequiredDocumentsForTrack(string $applicantTrack, string $profession): array
    {
        $base = [
            DocumentType::CurriculumVitae,
            DocumentType::NationalIdOrPassport,
            DocumentType::ProfessionalLicense,
            DocumentType::AcademicCertificate,
        ];

        if ($applicantTrack === ApplicantTrack::StudentAwaitingLicense->value) {
            return [
                DocumentType::CurriculumVitae,
                DocumentType::NationalIdOrPassport,
                DocumentType::StudentIdOrTrainingProof,
                DocumentType::TranscriptOrCompletionEvidence,
            ];
        }

        $normalized = strtolower(trim($profession));

        if (str_contains($normalized, 'intern') || str_contains($normalized, 'student')) {
            return [
                DocumentType::NationalIdOrPassport,
                DocumentType::AcademicCertificate,
            ];
        }

        return $base;
    }

    /**
     * @return list<DocumentType>
     */
    public function optionalDocuments(): array
    {
        return [
            DocumentType::ExperienceLetter,
            DocumentType::PassportPhoto,
            DocumentType::PaymentEvidence,
            DocumentType::RegulatoryEvidence,
        ];
    }
}
