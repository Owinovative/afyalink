<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Applications;

final readonly class SubmissionReadiness
{
    /**
     * @param list<string> $missing
     * @param list<string> $warnings
     */
    public function __construct(
        public bool $ready,
        public array $missing,
        public array $warnings = [],
    ) {}
}

