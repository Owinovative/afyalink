<?php

declare(strict_types=1);

namespace Afyalink\Core\Support;

use Afyalink\Core\Support\Exceptions\ValidationException;

final class Validator
{
    /**
     * @param array<string, mixed> $input
     * @param list<string> $fields
     */
    public static function requireFields(array $input, array $fields): void
    {
        $errors = [];
        foreach ($fields as $field) {
            if (!array_key_exists($field, $input) || trim((string) $input[$field]) === '') {
                $errors[$field][] = 'This field is required.';
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }
    }

    public static function email(string $field, mixed $value): void
    {
        if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException([$field => ['Enter a valid email address.']]);
        }
    }

    public static function minLength(string $field, mixed $value, int $min): void
    {
        if (!is_string($value) || strlen($value) < $min) {
            throw new ValidationException([$field => ["Must be at least {$min} characters."]]);
        }
    }

    public static function positiveNumber(string $field, mixed $value): void
    {
        if (!is_numeric($value) || (float) $value < 0) {
            throw new ValidationException([$field => ['Must be a positive number.']]);
        }
    }
}

