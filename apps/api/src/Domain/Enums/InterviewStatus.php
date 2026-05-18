<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum InterviewStatus: string
{
    case PendingSchedule = 'pending_schedule';
    case Scheduled = 'scheduled';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';
}

