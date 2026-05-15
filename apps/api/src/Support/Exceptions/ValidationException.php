<?php

declare(strict_types=1);

namespace Afyalink\Core\Support\Exceptions;

use RuntimeException;

final class ValidationException extends RuntimeException
{
    /**
     * @param array<string, list<string>> $errors
     */
    public function __construct(
        public readonly array $errors,
        string $message = 'Validation failed.',
    ) {
        parent::__construct($message);
    }
}

