<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Security;

use InvalidArgumentException;
use RuntimeException;

final readonly class FileUploadPolicy
{
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ];

    public function __construct(
        private int $maxBytes = 8_388_608,
    ) {}

    public function assertAllowed(string $mimeType, int $sizeBytes, string $storageKey): void
    {
        if (!in_array(strtolower($mimeType), self::ALLOWED_MIME_TYPES, true)) {
            throw new InvalidArgumentException('Unsupported credential document type.');
        }

        if ($sizeBytes <= 0 || $sizeBytes > $this->maxBytes) {
            throw new InvalidArgumentException('Credential document size is outside allowed limits.');
        }

        if ($this->looksPublic($storageKey)) {
            throw new InvalidArgumentException('Credential documents must not be stored under public paths.');
        }
    }

    public function checksum(string $filePath): string
    {
        if (!is_file($filePath) || !is_readable($filePath)) {
            throw new RuntimeException('File cannot be read for checksum calculation.');
        }

        return hash_file('sha256', $filePath);
    }

    private function looksPublic(string $storageKey): bool
    {
        $normalized = strtolower(str_replace('\\', '/', $storageKey));

        return str_starts_with($normalized, 'public/')
            || str_contains($normalized, '/public/')
            || str_contains($normalized, 'public_html')
            || str_contains($normalized, 'wwwroot');
    }
}

