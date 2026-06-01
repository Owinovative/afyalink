<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Registration\Payments;

use Afyalink\Core\Domain\Enums\PaybillValidationStatus;

final readonly class PaybillValidationResult
{
    public function __construct(
        public PaybillValidationStatus $status,
        public ?string $transactionId = null,
        public ?string $message = null,
    ) {}
}
