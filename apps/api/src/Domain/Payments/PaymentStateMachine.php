<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Payments;

use Afyalink\Core\Domain\Enums\PaymentStatus;
use InvalidArgumentException;

final class PaymentStateMachine
{
    /** @var array<string, list<PaymentStatus>> */
    private const ALLOWED = [
        'initiated' => [
            PaymentStatus::AwaitingProvider,
            PaymentStatus::PendingVerification,
            PaymentStatus::Confirmed,
            PaymentStatus::Failed,
            PaymentStatus::Expired,
        ],
        'awaiting_provider' => [
            PaymentStatus::Confirmed,
            PaymentStatus::Failed,
            PaymentStatus::Expired,
        ],
        'pending_verification' => [
            PaymentStatus::Confirmed,
            PaymentStatus::Failed,
        ],
        'confirmed' => [
            PaymentStatus::Refunded,
        ],
        'failed' => [
            PaymentStatus::Initiated,
        ],
        'expired' => [
            PaymentStatus::Initiated,
        ],
        'refunded' => [],
    ];

    public function canTransition(PaymentStatus $from, PaymentStatus $to): bool
    {
        return in_array($to, self::ALLOWED[$from->value] ?? [], true);
    }

    public function assertTransition(PaymentStatus $from, PaymentStatus $to): void
    {
        if (!$this->canTransition($from, $to)) {
            throw new InvalidArgumentException(sprintf(
                'Payment status cannot move from %s to %s.',
                $from->value,
                $to->value,
            ));
        }
    }
}
