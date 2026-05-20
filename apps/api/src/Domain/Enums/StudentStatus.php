<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum StudentStatus: string
{
    case CurrentlyStudying = 'currently_studying';
    case CompletedTrainingWaitingLicense = 'completed_training_waiting_license';
    case InternshipOrAttachment = 'internship_or_attachment';
}

