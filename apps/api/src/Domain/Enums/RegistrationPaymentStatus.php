<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum RegistrationPaymentStatus: string
{
    case Pending = 'pending';
    case Verified = 'verified';
    case Rejected = 'rejected';
    case Refunded = 'refunded';
}
