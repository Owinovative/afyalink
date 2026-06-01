<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum RegistrationStatus: string
{
    case Draft = 'draft';
    case PaymentPending = 'payment_pending';
    case PaymentVerified = 'payment_verified';
    case PasswordCreated = 'password_created';
    case EmailVerificationPending = 'email_verification_pending';
    case EmailVerified = 'email_verified';
    case ApprovalPending = 'approval_pending';
    case InformationRequested = 'information_requested';
    case Rejected = 'rejected';
    case Active = 'active';
    case Abandoned = 'abandoned';
}
