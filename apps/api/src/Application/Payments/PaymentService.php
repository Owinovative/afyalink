<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Payments;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Payments\PaymentIntentFactory;
use Afyalink\Core\Domain\Payments\PaymentStateMachine;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;

final readonly class PaymentService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private PaymentIntentFactory $factory = new PaymentIntentFactory(),
        private PaymentStateMachine $stateMachine = new PaymentStateMachine(),
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createIntent(AuthenticatedUser $user, array $input, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        Validator::requireFields($input, ['method', 'idempotency_key']);

        $amountCents = (int) ($input['amount_cents'] ?? 250000);
        $currency = strtoupper((string) ($input['currency'] ?? 'KES'));
        $method = strtolower((string) $input['method']);
        $idempotencyKey = trim((string) $input['idempotency_key']);

        $existing = $this->store->first(
            'payments',
            static fn (array $row): bool => (int) $row['user_id'] === $user->id
                && ($row['idempotency_key'] ?? '') === $idempotencyKey,
        );
        if ($existing !== null) {
            return $this->safePayment($existing);
        }

        $intent = $this->factory->create($user->id, $amountCents, $currency, $method, $idempotencyKey);
        $row = $this->store->insert('payments', [
            'user_id' => $user->id,
            'intent_reference' => $intent->intentReference,
            'amount_cents' => $intent->amountCents,
            'currency' => $intent->currency,
            'method' => $intent->method,
            'status' => $intent->status->value,
            'idempotency_key' => $intent->idempotencyKey,
            'external_reference' => trim((string) ($input['external_reference'] ?? '')),
            'review_note' => null,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($user->id, 'payment.intent_created', 'Payment', (string) $row['id'], [
            'intent_reference' => $row['intent_reference'],
            'amount_cents' => $row['amount_cents'],
            'currency' => $row['currency'],
            'method' => $row['method'],
            'status' => $row['status'],
        ], $ipAddress, $userAgent);

        return $this->safePayment($row);
    }

    public function statusForUser(int $userId): PaymentStatus
    {
        $rows = $this->store->where('payments', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        if ($rows === []) {
            return PaymentStatus::Initiated;
        }

        foreach ($rows as $row) {
            if (($row['status'] ?? '') === PaymentStatus::Confirmed->value) {
                return PaymentStatus::Confirmed;
            }
        }

        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return PaymentStatus::from((string) $rows[0]['status']);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForUser(int $userId): array
    {
        $rows = $this->store->where('payments', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return array_map(fn (array $row): array => $this->safePayment($row), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function updateStatus(
        AuthenticatedUser $admin,
        int $paymentId,
        PaymentStatus $status,
        ?string $note,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $payment = $this->store->find('payments', $paymentId);
        if ($payment === null) {
            throw new NotFoundException('Payment was not found.');
        }

        $current = PaymentStatus::from((string) $payment['status']);
        $this->stateMachine->assertTransition($current, $status);

        $updated = $this->store->update('payments', $paymentId, [
            'status' => $status->value,
            'review_note' => $note,
            'reviewed_by' => $admin->id,
            'reviewed_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'payment.status_changed', 'Payment', (string) $paymentId, [
            'from' => $current->value,
            'to' => $status->value,
            'professional_user_id' => $payment['user_id'] ?? null,
            'note' => $note,
        ], $ipAddress, $userAgent);

        return $this->safePayment($updated);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safePayment(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'user_id' => (int) $row['user_id'],
            'intent_reference' => (string) $row['intent_reference'],
            'amount_cents' => (int) $row['amount_cents'],
            'currency' => (string) $row['currency'],
            'method' => (string) $row['method'],
            'status' => (string) $row['status'],
            'external_reference' => $row['external_reference'] ?? null,
            'review_note' => $row['review_note'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }
}
