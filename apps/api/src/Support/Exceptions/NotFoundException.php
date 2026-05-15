<?php

declare(strict_types=1);

namespace Afyalink\Core\Support\Exceptions;

use RuntimeException;

final class NotFoundException extends RuntimeException
{
    public function __construct(string $message = 'Record not found.')
    {
        parent::__construct($message);
    }
}

