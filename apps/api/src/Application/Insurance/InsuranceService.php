<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Insurance;

// Assuming you have a DB facade or repository, adjust this import to match your system
use Afyalink\Core\Infrastructure\Persistence\Database; 

final class InsuranceService
{
    public function generateQuote(
        string $name,
        string $email,
        string $phone,
        string $dob,
        string $coverType,
        int $dependents,
        string $tier,
        string $ipAddress
    ): array {
        // Calculate premium (in cents) using a single, consistent unit
        $premiumCents = $this->calculatePremiumCents($tier, $coverType, $dependents);

        // Generate a short, collision-resistant policy number
        try {
            $uniqueHash = strtoupper(bin2hex(random_bytes(4)));
        } catch (\Exception $e) {
            // Fallback to a time-based id if random_bytes is unavailable
            $uniqueHash = strtoupper(substr(bin2hex((string) uniqid()), 0, 8));
        }

        $policyNumber = "AFL-INS-{$uniqueHash}";

        // TODO: Persist to your database using your repository or DB wrapper

        // Return the canonical integer amount plus a safe decimal representation
        return [
            'number' => $policyNumber,
            'premiumCents' => $premiumCents,
            // Keep a human-friendly decimal string for clients that expect display values
            'premium' => number_format($premiumCents / 100, 2, '.', ''),
            'type' => $coverType,
            'tier' => $tier,
        ];
    }

    private function calculatePremiumCents(string $tier, string $coverType, int $dependents): int
    {
        // Pricing table expressed in major currency units (e.g. KES)
        $tierPricing = [
            'basic' => 2000,
            'standard' => 4500,
            'premium' => 8500,
        ];

        $perDependent = 1500; // per dependent surcharge in major currency units
        $maxDependents = 10;

        // Normalize inputs
        $dependents = max(0, (int) $dependents);
        if ($dependents > $maxDependents) {
            $dependents = $maxDependents;
        }

        $baseMajor = $tierPricing[$tier] ?? $tierPricing['basic'];

        $totalMajor = $baseMajor;
        if (strtolower($coverType) === 'family') {
            $totalMajor += ($dependents * $perDependent);
        }

        // Convert to cents (or sub-units) as canonical server-side storage
        return (int) round($totalMajor * 100);
    }
}
