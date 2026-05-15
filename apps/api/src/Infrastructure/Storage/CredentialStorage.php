<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Storage;

interface CredentialStorage
{
    public function put(string $storageKey, string $contents): void;

    public function exists(string $storageKey): bool;

    public function read(string $storageKey): string;
}
