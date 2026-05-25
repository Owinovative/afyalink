<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Notifications;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Infrastructure\Notifications\EmailProvider;
use Afyalink\Core\Infrastructure\Notifications\LogEmailProvider;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Throwable;

final readonly class NotificationDeliveryService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private EmailProvider $emailProvider = new LogEmailProvider(),
        private int $maxAttempts = 5,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $counts = [
            'pending' => 0,
            'processing' => 0,
            'sent' => 0,
            'failed' => 0,
            'retry_scheduled' => 0,
            'cancelled' => 0,
        ];

        foreach ($this->store->all('notification_outbox') as $row) {
            $status = $this->normalizeStatus((string) ($row['status'] ?? 'pending'));
            if (array_key_exists($status, $counts)) {
                $counts[$status]++;
            }
        }

        return [
            'counts' => $counts,
            'provider' => $this->emailProvider->name(),
            'max_attempts' => $this->maxAttempts,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function failed(int $limit = 50): array
    {
        $rows = array_filter($this->store->all('notification_outbox'), fn (array $row): bool => in_array(
            $this->normalizeStatus((string) ($row['status'] ?? '')),
            ['failed', 'retry_scheduled'],
            true,
        ));
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['updated_at'] ?? $b['created_at'] ?? ''), (string) ($a['updated_at'] ?? $a['created_at'] ?? '')));

        return array_map(fn (array $row): array => $this->safeNotification($row), array_slice(array_values($rows), 0, $limit));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recent(int $limit = 50): array
    {
        $rows = $this->store->all('notification_outbox');
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));

        return array_map(fn (array $row): array => $this->safeNotification($row), array_slice($rows, 0, $limit));
    }

    /**
     * @return array<string, mixed>
     */
    public function processPending(int $limit = 25): array
    {
        $now = time();
        $candidates = array_filter($this->store->all('notification_outbox'), function (array $row) use ($now): bool {
            $status = $this->normalizeStatus((string) ($row['status'] ?? ''));
            if (!in_array($status, ['pending', 'retry_scheduled'], true)) {
                return false;
            }

            if (empty($row['next_attempt_at'])) {
                return true;
            }

            return strtotime((string) $row['next_attempt_at']) <= $now;
        });
        usort($candidates, static fn (array $a, array $b): int => strcmp((string) ($a['created_at'] ?? ''), (string) ($b['created_at'] ?? '')));

        $processed = [];
        foreach (array_slice(array_values($candidates), 0, $limit) as $notification) {
            $processed[] = $this->deliver($notification);
        }

        return [
            'processed_count' => count($processed),
            'processed' => $processed,
            'overview' => $this->overview(),
        ];
    }

    /**
     * @param array<string, mixed> $notification
     * @return array<string, mixed>
     */
    private function deliver(array $notification): array
    {
        $id = (int) $notification['id'];
        $attemptNumber = (int) ($notification['attempt_count'] ?? 0) + 1;
        $now = gmdate(DATE_ATOM);
        $this->store->update('notification_outbox', $id, [
            'status' => 'processing',
            'attempt_count' => $attemptNumber,
            'updated_at' => $now,
        ]);

        try {
            if ((string) ($notification['channel'] ?? 'email') !== 'email') {
                throw new \RuntimeException('Notification channel is not configured for live delivery yet.');
            }

            $result = $this->emailProvider->send(
                to: (string) $notification['recipient_email'],
                subject: (string) $notification['subject'],
                body: (string) $notification['body'],
                actionUrl: $notification['action_url'] ?? null,
                metadata: (array) ($notification['metadata'] ?? []),
            );

            $this->recordAttempt($notification, $attemptNumber, 'sent', $result);
            $updated = $this->store->update('notification_outbox', $id, [
                'status' => 'sent',
                'sent_at' => gmdate(DATE_ATOM),
                'last_error' => null,
                'updated_at' => gmdate(DATE_ATOM),
            ]);
            $this->audit->record(null, 'notification.sent', 'Notification', (string) $id, [
                'channel' => $notification['channel'] ?? 'email',
                'type' => $notification['type'] ?? null,
                'provider' => $this->emailProvider->name(),
            ]);

            return $this->safeNotification($updated);
        } catch (Throwable $exception) {
            $retry = $attemptNumber < $this->maxAttempts;
            $status = $retry ? 'retry_scheduled' : 'failed';
            $nextAttempt = $retry ? gmdate(DATE_ATOM, time() + $this->backoffSeconds($attemptNumber)) : null;
            $this->recordAttempt($notification, $attemptNumber, $status, [
                'error' => $exception->getMessage(),
                'exception' => $exception::class,
            ]);
            $updated = $this->store->update('notification_outbox', $id, [
                'status' => $status,
                'last_error' => $exception->getMessage(),
                'next_attempt_at' => $nextAttempt,
                'updated_at' => gmdate(DATE_ATOM),
            ]);
            $this->audit->record(null, 'notification.delivery_failed', 'Notification', (string) $id, [
                'channel' => $notification['channel'] ?? 'email',
                'type' => $notification['type'] ?? null,
                'status' => $status,
                'attempt' => $attemptNumber,
                'exception' => $exception::class,
            ]);

            return $this->safeNotification($updated);
        }
    }

    /**
     * @param array<string, mixed> $notification
     * @param array<string, mixed> $providerResponse
     */
    private function recordAttempt(array $notification, int $attemptNumber, string $status, array $providerResponse): void
    {
        $this->store->insert('notification_delivery_attempts', [
            'notification_outbox_id' => (int) $notification['id'],
            'channel' => (string) ($notification['channel'] ?? 'email'),
            'provider' => $this->emailProvider->name(),
            'status' => $status,
            'attempt_number' => $attemptNumber,
            'provider_response' => $providerResponse,
            'error_message' => $providerResponse['error'] ?? null,
            'attempted_at' => gmdate(DATE_ATOM),
            'next_retry_at' => $status === 'retry_scheduled' ? gmdate(DATE_ATOM, time() + $this->backoffSeconds($attemptNumber)) : null,
        ]);
    }

    private function backoffSeconds(int $attemptNumber): int
    {
        return min(3600, 60 * (2 ** max(0, $attemptNumber - 1)));
    }

    private function normalizeStatus(string $status): string
    {
        return match ($status) {
            'queued' => 'pending',
            default => $status,
        };
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeNotification(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'recipient_user_id' => $row['recipient_user_id'] ?? null,
            'recipient_email' => $this->maskEmail((string) ($row['recipient_email'] ?? '')),
            'channel' => (string) ($row['channel'] ?? 'email'),
            'type' => (string) ($row['type'] ?? ''),
            'subject' => (string) ($row['subject'] ?? ''),
            'status' => $this->normalizeStatus((string) ($row['status'] ?? 'pending')),
            'attempt_count' => (int) ($row['attempt_count'] ?? 0),
            'last_error' => $row['last_error'] ?? null,
            'next_attempt_at' => $row['next_attempt_at'] ?? null,
            'created_at' => (string) ($row['created_at'] ?? ''),
            'sent_at' => $row['sent_at'] ?? null,
        ];
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');
        if ($domain === '') {
            return '[invalid-email]';
        }

        return substr($local, 0, 1) . '***@' . $domain;
    }
}
