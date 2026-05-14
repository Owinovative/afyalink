<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Consent;

final class ConsentPolicy
{
    public function isCurrent(ConsentSnapshot $consent, string $currentVersion, string $currentText): bool
    {
        return $consent->version === $currentVersion
            && hash_equals($consent->textHash, hash('sha256', $currentText));
    }
}

