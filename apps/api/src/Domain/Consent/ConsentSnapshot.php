<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Consent;

use DateTimeImmutable;

final readonly class ConsentSnapshot
{
    public function __construct(
        public string $type,
        public string $version,
        public string $textHash,
        public DateTimeImmutable $acceptedAt,
        public ?string $ipAddress,
        public ?string $userAgent,
    ) {}
}

