<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Payments;

use Afyalink\Core\Domain\Enums\PaymentStatus;
use InvalidArgumentException;

final class PaymentIntentFactory
{
    public function create(
        int $userId,
        int $amountCents,
        string $currency,
        string $method,
        string $idempotencyKey,
    ): PaymentIntent {
        if ($userId <= 0) {
            throw new InvalidArgumentException('Payment user id is invalid.');
        }

        if ($amountCents <= 0) {
            throw new InvalidArgumentException('Payment amount must be positive.');
        }

        if (!preg_match('/^[A-Z]{3}$/', $currency)) {
            throw new InvalidArgumentException('Payment currency must be a 3-letter ISO code.');
        }

        if (trim($idempotencyKey) === '') {
            throw new InvalidArgumentException('Payment idempotency key is required.');
        }

        $reference = strtoupper(substr(hash('sha256', "{$userId}|{$amountCents}|{$currency}|{$method}|{$idempotencyKey}"), 0, 18));

        return new PaymentIntent(
            intentReference: "AFYA-PAY-{$reference}",
            userId: $userId,
            amountCents: $amountCents,
            currency: $currency,
            method: strtolower($method),
            status: PaymentStatus::Initiated,
            idempotencyKey: $idempotencyKey,
        );
    }
}

