<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Config;

final class EnvLoader
{
    /**
     * @return array<string, string>
     */
    public static function load(string $path): array
    {
        $env = [];
        $system = getenv();
        if (!is_array($system)) {
            $system = [];
        }
        if (!is_file($path)) {
            return array_merge($env, $system);
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return array_merge($env, $system);
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $trimmed, 2);
            $env[trim($key)] = trim($value, "\"' ");
        }

        return array_merge($env, $system);
    }
}
