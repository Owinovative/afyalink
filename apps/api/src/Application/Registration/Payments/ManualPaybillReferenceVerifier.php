<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Registration\Payments;

use Afyalink\Core\Domain\Enums\PaybillValidationStatus;

final readonly class ManualPaybillReferenceVerifier implements PaybillReferenceVerifier
{
    public function verify(string $reference, int $amountCents, string $currency, ?string $payerPhone): PaybillValidationResult
    {
        return new PaybillValidationResult(
            status: PaybillValidationStatus::PendingValidation,
            transactionId: null,
            message: 'Reference queued for automated validation or admin review.',
        );
    }
}
