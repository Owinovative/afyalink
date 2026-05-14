<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Credentials;

use Afyalink\Core\Domain\Enums\DocumentType;

final class CredentialRequirementRegistry
{
    /**
     * @return list<DocumentType>
     */
    public function minimumRequiredDocuments(string $profession): array
    {
        $base = [
            DocumentType::CurriculumVitae,
            DocumentType::NationalIdOrPassport,
            DocumentType::ProfessionalLicense,
            DocumentType::AcademicCertificate,
        ];

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

