<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Registration\Payments;

final readonly class MpesaRegistrationPaymentProvider implements RegistrationPaymentProvider
{
    public function providerCode(): string
    {
        return 'mpesa';
    }

    /**
     * @param array<string, mixed> $registration
     * @return array<string, mixed>
     */
    public function initiateStk(array $registration, string $phoneNumber, int $amountCents, string $currency): array
    {
        $seed = hash('sha256', implode('|', [
            $registration['registration_reference'] ?? '',
            $phoneNumber,
            (string) $amountCents,
            microtime(true),
        ]));

        return [
            'provider' => $this->providerCode(),
            'checkout_request_id' => 'AFYA-STK-' . strtoupper(substr($seed, 0, 18)),
            'merchant_request_id' => 'AFYA-MER-' . strtoupper(substr($seed, 18, 18)),
            'account_reference' => (string) ($registration['registration_reference'] ?? ''),
            'customer_message' => sprintf(
                'M-PESA STK prompt initiated for %s %.2f. Complete payment on the handset to continue Afyalink registration.',
                $currency,
                $amountCents / 100,
            ),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function parseCallback(array $payload): array
    {
        $stk = (array) ($payload['Body']['stkCallback'] ?? $payload['stkCallback'] ?? $payload);
        $metadataItems = (array) ($stk['CallbackMetadata']['Item'] ?? []);
        $metadata = [];
        foreach ($metadataItems as $item) {
            if (is_array($item) && isset($item['Name'])) {
                $metadata[(string) $item['Name']] = $item['Value'] ?? null;
            }
        }

        return [
            'checkout_request_id' => $this->nullableString($stk['CheckoutRequestID'] ?? $payload['CheckoutRequestID'] ?? null),
            'merchant_request_id' => $this->nullableString($stk['MerchantRequestID'] ?? $payload['MerchantRequestID'] ?? null),
            'provider_reference' => $this->nullableString($metadata['MpesaReceiptNumber'] ?? $payload['MpesaReceiptNumber'] ?? null),
            'account_reference' => $this->nullableString($metadata['BillRefNumber'] ?? $payload['AccountReference'] ?? $payload['account_reference'] ?? null),
            'phone_number' => $this->nullableString($metadata['PhoneNumber'] ?? $payload['PhoneNumber'] ?? null),
            'amount' => isset($metadata['Amount']) ? (float) $metadata['Amount'] : null,
            'result_code' => (int) ($stk['ResultCode'] ?? $payload['ResultCode'] ?? -1),
            'result_description' => $this->nullableString($stk['ResultDesc'] ?? $payload['ResultDesc'] ?? null),
        ];
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }
}
