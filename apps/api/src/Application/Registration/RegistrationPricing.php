<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Registration;

use RuntimeException;

final readonly class RegistrationPricing
{
    /**
     * @param array<string, array{label: string, amount_cents: int, currency: string}> $prices
     */
    public function __construct(
        private array $prices,
    ) {}

    public static function fromDefaultConfig(): self
    {
        $path = dirname(__DIR__, 3) . '/config/pricing.php';
        $config = require $path;
        if (!is_array($config) || !isset($config['registration']) || !is_array($config['registration'])) {
            throw new RuntimeException('Registration pricing configuration is invalid.');
        }

        return new self($config['registration']);
    }

    /**
     * @return array{label: string, amount_cents: int, currency: string}
     */
    public function forAccountType(string $accountType): array
    {
        $normalized = strtolower(trim($accountType));
        if (!isset($this->prices[$normalized])) {
            throw new RuntimeException("Unsupported registration account type {$accountType}.");
        }

        return $this->prices[$normalized];
    }

    /**
     * @return array<string, array{label: string, amount_cents: int, currency: string}>
     */
    public function all(): array
    {
        return $this->prices;
    }
}
