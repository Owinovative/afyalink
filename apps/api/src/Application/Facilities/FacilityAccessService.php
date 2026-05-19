<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Facilities;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Enums\FacilityAccessStatus;
use Afyalink\Core\Domain\Enums\FacilityReviewStatus;
use Afyalink\Core\Domain\Payments\PaymentIntentFactory;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;
use DateTimeImmutable;
use DomainException;

final readonly class FacilityAccessService
{
    public function __construct(
        private DataStore $store,
        private FacilityService $facilities,
        private AuditLogger $audit,
        private ?NotificationService $notifications = null,
        private PaymentIntentFactory $factory = new PaymentIntentFactory(),
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createPaymentIntent(
        AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['idempotency_key']);
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);
        $idempotencyKey = trim((string) $input['idempotency_key']);

        $existing = $this->store->first('facility_access_subscriptions', static fn (array $row): bool => (
            (int) $row['facility_id'] === (int) $facility['id']
            && ($row['idempotency_key'] ?? '') === $idempotencyKey
        ));
        if ($existing !== null) {
            return $this->safeSubscription($existing);
        }

        $amountCents = (int) ($input['amount_cents'] ?? 500000);
        $currency = strtoupper((string) ($input['currency'] ?? 'KES'));
        $method = strtolower((string) ($input['method'] ?? 'mpesa_manual_reference'));
        $intent = $this->factory->create($user->id, $amountCents, $currency, 'facility_' . $method, $idempotencyKey);
        $now = gmdate(DATE_ATOM);
        $subscription = $this->store->insert('facility_access_subscriptions', [
            'facility_id' => (int) $facility['id'],
            'plan_code' => trim((string) ($input['plan_code'] ?? 'staging_manual_access')),
            'status' => FacilityAccessStatus::PendingPayment->value,
            'payment_reference' => $intent->intentReference,
            'idempotency_key' => $idempotencyKey,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'method' => $method,
            'external_reference' => isset($input['external_reference']) ? trim((string) $input['external_reference']) : null,
            'starts_at' => null,
            'ends_at' => null,
            'admin_override' => false,
            'note' => null,
            'created_by' => $user->id,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->audit->record($user->id, 'facility_subscription.payment_intent_created', 'FacilityAccessSubscription', (string) $subscription['id'], [
            'facility_id' => $facility['id'],
            'status' => $subscription['status'],
            'payment_reference' => $subscription['payment_reference'],
        ], $ipAddress, $userAgent);

        return $this->safeSubscription($subscription);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function activeForFacility(int $facilityId): ?array
    {
        $subscriptions = $this->subscriptionsForFacility($facilityId);
        foreach ($subscriptions as $subscription) {
            if ($this->isActive($subscription)) {
                return $subscription;
            }
        }

        return null;
    }

    public function assertFacilityHasActiveAccess(int $facilityId): void
    {
        if ($this->activeForFacility($facilityId) === null) {
            throw new DomainException('Facility access subscription must be active before browsing candidates.');
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function subscriptionsForFacility(int $facilityId): array
    {
        $rows = $this->store->where('facility_access_subscriptions', static fn (array $row): bool => (int) $row['facility_id'] === $facilityId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return array_map(fn (array $row): array => $this->safeSubscription($row), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function accessSummary(int $facilityId): array
    {
        $subscriptions = $this->subscriptionsForFacility($facilityId);
        $active = $this->activeForFacility($facilityId);

        return [
            'active' => $active !== null,
            'active_subscription' => $active,
            'subscriptions' => $subscriptions,
        ];
    }

    /**
     * @return array<string, int>
     */
    public function overview(): array
    {
        $counts = [
            'pending_payment' => 0,
            'active' => 0,
            'suspended' => 0,
            'expired' => 0,
            'cancelled' => 0,
        ];

        foreach ($this->store->all('facility_access_subscriptions') as $row) {
            $status = (string) ($row['status'] ?? '');
            if ($status === FacilityAccessStatus::Active->value && !$this->isActive($row)) {
                $counts['expired']++;
                continue;
            }
            if (array_key_exists($status, $counts)) {
                $counts[$status]++;
            }
        }

        return $counts;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function adminUpdate(
        AuthenticatedUser $admin,
        int $facilityId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['status']);
        $facility = $this->facilities->requireFacility($facilityId);
        if (($facility['review_status'] ?? '') !== FacilityReviewStatus::Approved->value) {
            throw new DomainException('Facility must be approved before access can be activated.');
        }

        $status = FacilityAccessStatus::from((string) $input['status']);
        $subscription = null;
        if (isset($input['subscription_id']) && $input['subscription_id'] !== '') {
            $subscription = $this->store->find('facility_access_subscriptions', (int) $input['subscription_id']);
            if ($subscription === null || (int) $subscription['facility_id'] !== $facilityId) {
                throw new NotFoundException('Facility subscription was not found.');
            }
        } else {
            $subscription = $this->latestSubscriptionOrCreate($facilityId, $admin->id);
        }

        $now = gmdate(DATE_ATOM);
        $startsAt = $input['starts_at'] ?? ($status === FacilityAccessStatus::Active ? $now : ($subscription['starts_at'] ?? null));
        $endsAt = $input['ends_at'] ?? ($status === FacilityAccessStatus::Active ? gmdate(DATE_ATOM, time() + (90 * 86400)) : ($subscription['ends_at'] ?? null));
        $updated = $this->store->update('facility_access_subscriptions', (int) $subscription['id'], [
            'status' => $status->value,
            'external_reference' => array_key_exists('external_reference', $input) ? trim((string) $input['external_reference']) : ($subscription['external_reference'] ?? null),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'admin_override' => (bool) ($input['admin_override'] ?? ($subscription['admin_override'] ?? false)),
            'note' => isset($input['note']) ? trim((string) $input['note']) : ($subscription['note'] ?? null),
            'reviewed_by' => $admin->id,
            'reviewed_at' => $now,
            'updated_at' => $now,
        ]);

        $this->audit->record($admin->id, 'facility_subscription.status_changed', 'FacilityAccessSubscription', (string) $updated['id'], [
            'facility_id' => $facilityId,
            'status' => $status->value,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
        ], $ipAddress, $userAgent);
        $this->notifications?->facilitySubscriptionStatusChanged($facility, $updated);

        return [
            'facility' => $facility,
            'access' => $this->accessSummary($facilityId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function latestSubscriptionOrCreate(int $facilityId, int $adminId): array
    {
        $existing = $this->subscriptionsForFacility($facilityId)[0] ?? null;
        if ($existing !== null) {
            return $existing;
        }

        $reference = 'AFYA-FAC-' . strtoupper(substr(hash('sha256', "{$facilityId}|{$adminId}|" . microtime(true)), 0, 16));
        $now = gmdate(DATE_ATOM);

        return $this->store->insert('facility_access_subscriptions', [
            'facility_id' => $facilityId,
            'plan_code' => 'admin_manual_access',
            'status' => FacilityAccessStatus::PendingPayment->value,
            'payment_reference' => $reference,
            'idempotency_key' => 'admin-' . $reference,
            'amount_cents' => 0,
            'currency' => 'KES',
            'method' => 'admin_override',
            'external_reference' => null,
            'starts_at' => null,
            'ends_at' => null,
            'admin_override' => true,
            'note' => null,
            'created_by' => $adminId,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * @param array<string, mixed> $subscription
     */
    private function isActive(array $subscription): bool
    {
        if (($subscription['status'] ?? '') !== FacilityAccessStatus::Active->value) {
            return false;
        }

        $now = new DateTimeImmutable();
        if (!empty($subscription['starts_at']) && new DateTimeImmutable((string) $subscription['starts_at']) > $now) {
            return false;
        }
        if (!empty($subscription['ends_at']) && new DateTimeImmutable((string) $subscription['ends_at']) < $now) {
            return false;
        }

        return true;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeSubscription(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'facility_id' => (int) $row['facility_id'],
            'plan_code' => (string) $row['plan_code'],
            'status' => (string) $row['status'],
            'payment_reference' => (string) $row['payment_reference'],
            'amount_cents' => (int) $row['amount_cents'],
            'currency' => (string) $row['currency'],
            'method' => (string) $row['method'],
            'external_reference' => $row['external_reference'] ?? null,
            'starts_at' => $row['starts_at'] ?? null,
            'ends_at' => $row['ends_at'] ?? null,
            'admin_override' => (bool) ($row['admin_override'] ?? false),
            'note' => $row['note'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }
}
