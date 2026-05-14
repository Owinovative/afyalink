<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum UserRole: string
{
    case Professional = 'professional';
    case VerificationOfficer = 'verification_officer';
    case Interviewer = 'interviewer';
    case FacilityAdmin = 'facility_admin';
    case FacilityViewer = 'facility_viewer';
    case SupportAgent = 'support_agent';
    case Admin = 'admin';
    case SuperAdmin = 'super_admin';
}

