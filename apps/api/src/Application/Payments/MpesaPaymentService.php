<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Payments;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Domain\Enums\FacilityAccessStatus;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Security\SensitiveDataRedactor;
use Afyalink\Core\Infrastructure\Persistence\DataStore;

final readonly class MpesaPaymentService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private SensitiveDataRedactor $redactor = new SensitiveDataRedactor(),
    ) {}

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function handleCallback(array $payload, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $parsed = $this->parseCallback($payload);
        $dedupeKey = $this->dedupeKey($parsed);
        $existing = $this->store->first('payment_provider_events', static fn (array $row): bool => ($row['dedupe_key'] ?? '') === $dedupeKey);
        if ($existing !== null) {
            return [
                'status' => 'duplicate',
                'event' => $this->safeEvent($existing),
            ];
        }

        $payment = $this->findPayment($parsed);
        $subscription = $payment === null ? $this->findFacilitySubscription($parsed) : null;
        $event = $this->store->insert('payment_provider_events', [
            'provider' => 'mpesa',
            'payment_id' => $payment['id'] ?? null,
            'facility_subscription_id' => $subscription['id'] ?? null,
            'checkout_request_id' => $parsed['checkout_request_id'],
            'merchant_request_id' => $parsed['merchant_request_id'],
            'provider_reference' => $parsed['provider_reference'],
            'account_reference' => $parsed['account_reference'],
            'result_code' => $parsed['result_code'],
            'result_description' => $parsed['result_description'],
            'status' => 'received',
            'dedupe_key' => $dedupeKey,
            'payload_redacted' => $this->redactCallbackPayload($payload),
            'received_at' => gmdate(DATE_ATOM),
            'processed_at' => null,
        ]);

        if ($payment !== null) {
            $this->applyPaymentCallback($payment, $parsed);
        }
        if ($subscription !== null) {
            $this->applySubscriptionCallback($subscription, $parsed);
        }

        $updatedEvent = $this->store->update('payment_provider_events', (int) $event['id'], [
            'status' => 'processed',
            'processed_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record(null, 'payment.mpesa_callback_processed', 'PaymentProviderEvent', (string) $event['id'], [
            'provider' => 'mpesa',
            'payment_id' => $payment['id'] ?? null,
            'facility_subscription_id' => $subscription['id'] ?? null,
            'checkout_request_id' => $parsed['checkout_request_id'],
            'merchant_request_id' => $parsed['merchant_request_id'],
            'result_code' => $parsed['result_code'],
            'matched' => $payment !== null || $subscription !== null,
        ], $ipAddress, $userAgent);

        return [
            'status' => 'processed',
            'event' => $this->safeEvent($updatedEvent),
            'matched_payment' => $payment !== null,
            'matched_facility_subscription' => $subscription !== null,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function parseCallback(array $payload): array
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

    /**
     * @param array<string, mixed> $parsed
     */
    private function dedupeKey(array $parsed): string
    {
        return hash('sha256', implode('|', [
            'mpesa',
            $parsed['checkout_request_id'] ?? '',
            $parsed['merchant_request_id'] ?? '',
            $parsed['provider_reference'] ?? '',
            (string) ($parsed['result_code'] ?? ''),
        ]));
    }

    /**
     * @param array<string, mixed> $parsed
     * @return array<string, mixed>|null
     */
    private function findPayment(array $parsed): ?array
    {
        return $this->store->first('payments', static function (array $row) use ($parsed): bool {
            foreach (['checkout_request_id', 'merchant_request_id', 'provider_reference', 'intent_reference'] as $field) {
                $expected = $field === 'intent_reference' ? ($parsed['account_reference'] ?? null) : ($parsed[$field] ?? null);
                if ($expected !== null && $expected !== '' && ($row[$field] ?? null) === $expected) {
                    return true;
                }
            }

            return false;
        });
    }

    /**
     * @param array<string, mixed> $parsed
     * @return array<string, mixed>|null
     */
    private function findFacilitySubscription(array $parsed): ?array
    {
        $reference = $parsed['account_reference'] ?? null;
        if ($reference === null || $reference === '') {
            return null;
        }

        return $this->store->first('facility_access_subscriptions', static fn (array $row): bool => ($row['payment_reference'] ?? '') === $reference);
    }

    /**
     * @param array<string, mixed> $payment
     * @param array<string, mixed> $parsed
     */
    private function applyPaymentCallback(array $payment, array $parsed): void
    {
        $resultCode = (int) ($parsed['result_code'] ?? -1);
        if (($payment['status'] ?? '') === PaymentStatus::Confirmed->value && $resultCode === 0) {
            return;
        }

        $changes = [
            'checkout_request_id' => $parsed['checkout_request_id'] ?? ($payment['checkout_request_id'] ?? null),
            'merchant_request_id' => $parsed['merchant_request_id'] ?? ($payment['merchant_request_id'] ?? null),
            'provider_reference' => $parsed['provider_reference'] ?? ($payment['provider_reference'] ?? null),
            'phone_number' => $parsed['phone_number'] ?? ($payment['phone_number'] ?? null),
            'callback_payload_redacted' => ['last_result_code' => $resultCode, 'last_result_description' => $parsed['result_description'] ?? null],
            'updated_at' => gmdate(DATE_ATOM),
        ];

        if ($resultCode === 0) {
            $changes['status'] = PaymentStatus::Confirmed->value;
            $changes['paid_at'] = gmdate(DATE_ATOM);
            $changes['failure_reason'] = null;
        } else {
            $changes['status'] = PaymentStatus::Failed->value;
            $changes['failure_reason'] = $parsed['result_description'] ?? 'M-PESA payment failed.';
        }

        $this->store->update('payments', (int) $payment['id'], $changes);
    }

    /**
     * @param array<string, mixed> $subscription
     * @param array<string, mixed> $parsed
     */
    private function applySubscriptionCallback(array $subscription, array $parsed): void
    {
        $resultCode = (int) ($parsed['result_code'] ?? -1);
        $changes = [
            'checkout_request_id' => $parsed['checkout_request_id'] ?? ($subscription['checkout_request_id'] ?? null),
            'merchant_request_id' => $parsed['merchant_request_id'] ?? ($subscription['merchant_request_id'] ?? null),
            'provider_reference' => $parsed['provider_reference'] ?? ($subscription['provider_reference'] ?? null),
            'phone_number' => $parsed['phone_number'] ?? ($subscription['phone_number'] ?? null),
            'updated_at' => gmdate(DATE_ATOM),
        ];

        if ($resultCode === 0) {
            $changes['status'] = FacilityAccessStatus::Active->value;
            $changes['starts_at'] = $subscription['starts_at'] ?? gmdate(DATE_ATOM);
            $changes['ends_at'] = $subscription['ends_at'] ?? gmdate(DATE_ATOM, time() + (90 * 86400));
            $changes['paid_at'] = gmdate(DATE_ATOM);
        }

        $this->store->update('facility_access_subscriptions', (int) $subscription['id'], $changes);
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function redactCallbackPayload(array $payload): array
    {
        $redacted = $this->redactor->redact($payload);

        return $this->maskPhoneFields($redacted);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function maskPhoneFields(array $payload): array
    {
        if (isset($payload['Name'], $payload['Value']) && str_contains(strtolower((string) $payload['Name']), 'phone')) {
            $payload['Value'] = $this->maskPhone($payload['Value']);
        }

        foreach ($payload as $key => $value) {
            $normalized = strtolower((string) $key);
            if (is_array($value)) {
                $payload[$key] = $this->maskPhoneFields($value);
                continue;
            }
            if (str_contains($normalized, 'phone') || $normalized === 'msisdn') {
                $payload[$key] = $this->maskPhone($value);
            }
        }

        return $payload;
    }

    private function maskPhone(mixed $phone): ?string
    {
        if ($phone === null || trim((string) $phone) === '') {
            return null;
        }
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
        if (strlen($digits) <= 4) {
            return '****';
        }

        return substr($digits, 0, 3) . '****' . substr($digits, -3);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeEvent(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'provider' => (string) $row['provider'],
            'payment_id' => $row['payment_id'] ?? null,
            'facility_subscription_id' => $row['facility_subscription_id'] ?? null,
            'checkout_request_id' => $row['checkout_request_id'] ?? null,
            'merchant_request_id' => $row['merchant_request_id'] ?? null,
            'provider_reference' => $row['provider_reference'] ?? null,
            'account_reference' => $row['account_reference'] ?? null,
            'result_code' => $row['result_code'] ?? null,
            'status' => (string) ($row['status'] ?? 'received'),
            'received_at' => (string) ($row['received_at'] ?? ''),
            'processed_at' => $row['processed_at'] ?? null,
        ];
    }
}
