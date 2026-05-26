<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Notifications;

final readonly class LogEmailProvider implements EmailProvider
{
    public function __construct(
        private string $fromAddress = 'no-reply@afyalinks.org',
        private string $fromName = 'Afyalink',
        private bool $writeToErrorLog = false,
    ) {}

    public function name(): string
    {
        return 'log';
    }

    /**
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    public function send(
        string $to,
        string $subject,
        string $body,
        ?string $actionUrl = null,
        array $metadata = [],
    ): array {
        if ($this->writeToErrorLog) {
            error_log(json_encode([
                'event' => 'notification.email.log_delivery',
                'provider' => $this->name(),
                'from' => $this->fromAddress,
                'from_name' => $this->fromName,
                'to' => $this->maskEmail($to),
                'subject' => $subject,
                'action_url_present' => $actionUrl !== null && $actionUrl !== '',
                'template' => $metadata['template'] ?? $metadata['type'] ?? null,
            ], JSON_UNESCAPED_SLASHES));
        }

        return [
            'provider' => $this->name(),
            'delivered' => true,
            'mode' => 'log',
            'recipient' => $this->maskEmail($to),
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
