<?php

declare(strict_types=1);

namespace Afyalink\Core\Support\Exceptions;

use RuntimeException;

final class AuthenticationException extends RuntimeException
{
    public function __construct(string $message = 'Authentication required.')
    {
        parent::__construct($message);
    }
}
