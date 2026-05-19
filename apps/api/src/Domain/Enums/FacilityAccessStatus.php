<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum FacilityAccessStatus: string
{
    case PendingPayment = 'pending_payment';
    case Active = 'active';
    case Suspended = 'suspended';
    case Expired = 'expired';
    case Cancelled = 'cancelled';
}
