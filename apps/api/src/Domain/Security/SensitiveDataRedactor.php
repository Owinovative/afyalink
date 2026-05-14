<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Security;

final class SensitiveDataRedactor
{
    private const SECRET_KEYWORDS = [
        'password',
        'token',
        'secret',
        'passkey',
        'authorization',
        'cookie',
        'database_url',
        'private_key',
        'consumer_secret',
    ];

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function redact(array $payload): array
    {
        $redacted = [];

        foreach ($payload as $key => $value) {
            if ($this->isSecretKey((string) $key)) {
                $redacted[$key] = '[REDACTED]';
                continue;
            }

            if (is_array($value)) {
                $redacted[$key] = $this->redact($value);
                continue;
            }

            $redacted[$key] = $value;
        }

        return $redacted;
    }

    private function isSecretKey(string $key): bool
    {
        $normalized = strtolower($key);

        foreach (self::SECRET_KEYWORDS as $keyword) {
            if (str_contains($normalized, $keyword)) {
                return true;
            }
        }

        return false;
    }
}

