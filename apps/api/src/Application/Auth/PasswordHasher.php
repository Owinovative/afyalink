<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Auth;

final class PasswordHasher
{
    public function hash(string $password): string
    {
        $algorithm = \defined('PASSWORD_ARGON2ID') ? \PASSWORD_ARGON2ID : \PASSWORD_BCRYPT;

        return \password_hash($password, $algorithm);
    }

    public function verify(string $password, string $hash): bool
    {
        return \password_verify($password, $hash);
    }
}
