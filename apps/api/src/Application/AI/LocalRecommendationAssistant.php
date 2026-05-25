<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\AI;

final readonly class LocalRecommendationAssistant implements RecommendationAssistant
{
    /**
     * @param array<string, mixed> $requisition
     * @param array<string, mixed> $match
     * @return array<string, mixed>
     */
    public function draftShortlistRationale(array $requisition, array $match): array
    {
        $breakdown = is_array($match['score_breakdown'] ?? null) ? $match['score_breakdown'] : [];
        $strengths = array_values(array_filter(array_map(
            static fn (string $dimension): ?string => (($breakdown[$dimension]['matched'] ?? false) === true)
                ? str_replace('_', ' ', $dimension)
                : null,
            array_keys($breakdown),
        )));

        $weaknesses = array_values(array_filter(array_map(
            static fn (string $dimension): ?string => (($breakdown[$dimension]['matched'] ?? false) === false)
                ? str_replace('_', ' ', $dimension)
                : null,
            array_keys($breakdown),
        )));

        $profession = (string) ($requisition['profession_required'] ?? 'the requested role');
        $band = (string) ($match['match_band'] ?? 'review_needed');

        return [
            'provider' => 'local_deterministic',
            'model' => 'rules-v1',
            'draft' => true,
            'rationale' => sprintf(
                'Draft admin rationale: this candidate is a %s match for %s based on %s. Admin must verify the recommendation before sharing.',
                $band,
                $profession,
                $strengths === [] ? 'available Afyalink readiness signals' : implode(', ', $strengths),
            ),
            'strengths' => $strengths,
            'review_points' => $weaknesses,
            'limitations' => [
                'This is deterministic assistance, not an automated decision.',
                'Protected characteristics are not used for matching.',
                'Admin review is required before any facility-facing shortlist is shared.',
            ],
        ];
    }
}
