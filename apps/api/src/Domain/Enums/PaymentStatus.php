<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum PaymentStatus: string
{
    case Initiated = 'initiated';
    case AwaitingProvider = 'awaiting_provider';
    case PendingVerification = 'pending_verification';
    case Confirmed = 'confirmed';
    case Failed = 'failed';
    case Expired = 'expired';
    case Refunded = 'refunded';
}

