<?php

declare(strict_types=1);

namespace Afyalink\Core\Support\Exceptions;

use RuntimeException;

final class AuthorizationException extends RuntimeException
{
    public function __construct(string $message = 'You are not allowed to perform this action.')
    {
        parent::__construct($message);
    }
}

