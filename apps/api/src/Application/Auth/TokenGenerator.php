<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Auth;

final class TokenGenerator
{
    public function createPlainToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }
}

