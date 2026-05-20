<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum DocumentType: string
{
    case CurriculumVitae = 'cv';
    case NationalIdOrPassport = 'national_id_or_passport';
    case ProfessionalLicense = 'professional_license';
    case AcademicCertificate = 'academic_certificate';
    case StudentIdOrTrainingProof = 'student_id_or_training_proof';
    case TranscriptOrCompletionEvidence = 'transcript_or_completion_evidence';
    case InternshipOrAttachmentEvidence = 'internship_or_attachment_evidence';
    case ExperienceLetter = 'experience_letter';
    case PassportPhoto = 'passport_photo';
    case PaymentEvidence = 'payment_evidence';
    case RegulatoryEvidence = 'regulatory_evidence';
}
