<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Notifications;

interface EmailProvider
{
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
    ): array;

    public function name(): string;
}
