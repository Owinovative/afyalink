<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Registration;

use Afyalink\Core\Domain\Enums\RegistrationStatus;
use InvalidArgumentException;

final class RegistrationStateMachine
{
    /** @var array<string, list<RegistrationStatus>> */
    private const ALLOWED = [
        'draft' => [
            RegistrationStatus::PaymentPending,
            RegistrationStatus::Abandoned,
        ],
        'payment_pending' => [
            RegistrationStatus::PaymentVerified,
            RegistrationStatus::Abandoned,
            RegistrationStatus::Rejected,
        ],
        'payment_verified' => [
            RegistrationStatus::PasswordCreated,
        ],
        'password_created' => [
            RegistrationStatus::EmailVerificationPending,
        ],
        'email_verification_pending' => [
            RegistrationStatus::EmailVerified,
        ],
        'email_verified' => [
            RegistrationStatus::ApprovalPending,
            RegistrationStatus::Active,
        ],
        'approval_pending' => [
            RegistrationStatus::Active,
            RegistrationStatus::Rejected,
            RegistrationStatus::InformationRequested,
        ],
        'information_requested' => [
            RegistrationStatus::ApprovalPending,
            RegistrationStatus::Rejected,
        ],
        'rejected' => [],
        'active' => [],
        'abandoned' => [],
    ];

    public function canTransition(RegistrationStatus $from, RegistrationStatus $to): bool
    {
        return in_array($to, self::ALLOWED[$from->value] ?? [], true);
    }

    public function assertTransition(RegistrationStatus $from, RegistrationStatus $to): void
    {
        if (!$this->canTransition($from, $to)) {
            throw new InvalidArgumentException(sprintf(
                'Registration status cannot move from %s to %s.',
                $from->value,
                $to->value,
            ));
        }
    }
}
