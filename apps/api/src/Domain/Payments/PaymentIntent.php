<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Payments;

use Afyalink\Core\Domain\Enums\PaymentStatus;

final readonly class PaymentIntent
{
    public function __construct(
        public string $intentReference,
        public int $userId,
        public int $amountCents,
        public string $currency,
        public string $method,
        public PaymentStatus $status,
        public string $idempotencyKey,
    ) {}
}

