<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum PaybillValidationStatus: string
{
    case PendingValidation = 'pending_validation';
    case Validated = 'validated';
    case Rejected = 'rejected';
}
