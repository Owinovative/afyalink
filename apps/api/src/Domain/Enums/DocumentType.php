<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum DocumentType: string
{
    case CurriculumVitae = 'cv';
    case NationalIdOrPassport = 'national_id_or_passport';
    case ProfessionalLicense = 'professional_license';
    case AcademicCertificate = 'academic_certificate';
    case ExperienceLetter = 'experience_letter';
    case PassportPhoto = 'passport_photo';
    case PaymentEvidence = 'payment_evidence';
    case RegulatoryEvidence = 'regulatory_evidence';
}

