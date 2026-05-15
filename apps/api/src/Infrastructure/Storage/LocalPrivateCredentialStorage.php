<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Storage;

use RuntimeException;

final readonly class LocalPrivateCredentialStorage implements CredentialStorage
{
    public function __construct(
        private string $root,
    ) {
        if (!is_dir($this->root) && !mkdir($this->root, 0770, true) && !is_dir($this->root)) {
            throw new RuntimeException('Could not create private credential storage directory.');
        }
    }

    public function put(string $storageKey, string $contents): void
    {
        $path = $this->pathFor($storageKey);
        $directory = dirname($path);

        if (!is_dir($directory) && !mkdir($directory, 0770, true) && !is_dir($directory)) {
            throw new RuntimeException('Could not create private credential subdirectory.');
        }

        if (file_put_contents($path, $contents, LOCK_EX) === false) {
            throw new RuntimeException('Could not store private credential file.');
        }
    }

    public function exists(string $storageKey): bool
    {
        return is_file($this->pathFor($storageKey));
    }

    public function read(string $storageKey): string
    {
        $contents = file_get_contents($this->pathFor($storageKey));
        if ($contents === false) {
            throw new RuntimeException('Could not read private credential file.');
        }

        return $contents;
    }

    private function pathFor(string $storageKey): string
    {
        $normalized = str_replace('\\', '/', $storageKey);
        if (str_contains($normalized, '..') || str_starts_with($normalized, '/') || str_contains($normalized, "\0")) {
            throw new RuntimeException('Unsafe storage key.');
        }

        return rtrim($this->root, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalized);
    }
}
