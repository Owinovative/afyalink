<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum FacilityRequestStatus: string
{
    case Submitted = 'submitted';
    case Acknowledged = 'acknowledged';
    case Scheduled = 'scheduled';
    case Completed = 'completed';
    case Closed = 'closed';
}
