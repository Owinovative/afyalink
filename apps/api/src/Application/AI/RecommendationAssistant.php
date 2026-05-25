<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\AI;

interface RecommendationAssistant
{
    /**
     * @param array<string, mixed> $requisition
     * @param array<string, mixed> $match
     * @return array<string, mixed>
     */
    public function draftShortlistRationale(array $requisition, array $match): array;
}
