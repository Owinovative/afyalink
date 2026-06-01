<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Registration\Payments;

interface RegistrationPaymentProvider
{
    public function providerCode(): string;

    /**
     * @param array<string, mixed> $registration
     * @return array<string, mixed>
     */
    public function initiateStk(array $registration, string $phoneNumber, int $amountCents, string $currency): array;

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function parseCallback(array $payload): array;
}
