<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Registration\Payments;

interface PaybillReferenceVerifier
{
    public function verify(string $reference, int $amountCents, string $currency, ?string $payerPhone): PaybillValidationResult;
}
