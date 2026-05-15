<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Regulatory;

final readonly class RegulatoryBody
{
    /**
     * @param list<string> $supportedProfessions
     */
    public function __construct(
        public string $code,
        public string $name,
        public array $supportedProfessions,
        public ?string $publicLookupUrl = null,
    ) {}
}

