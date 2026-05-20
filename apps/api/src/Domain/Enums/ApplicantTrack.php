<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum ApplicantTrack: string
{
    case LicensedProfessional = 'licensed_professional';
    case StudentAwaitingLicense = 'student_awaiting_license';
}

