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
        // 1. Calculate Premium
        $premiumCents = $this->calculatePremiumCents($tier, $coverType, $dependents);
        
        // 2. Generate Cryptographic Policy Number
        $uniqueHash = strtoupper(bin2hex(random_bytes(3)));
        $policyNumber = "AFL-INS-{$uniqueHash}";

        // 3. Persist to your database (Adjust this SQL to your bespoke DB wrapper)
        // Database::query("INSERT INTO insurance_policies ... ");

        // 4. Return to Controller
        return [
            'number' => $policyNumber,
            'premium' => $premiumCents / 100, // Return standard currency to frontend
            'type' => $coverType,
            'tier' => $tier
        ];
    }

    private function calculatePremiumCents(string $tier, string $coverType, int $dependents): int
    {
        $basePrice = 2000;
        
        if ($tier === 'standard') {
            $basePrice = 4500;
        } elseif ($tier === 'premium') {
            $basePrice = 8500;
        }

        if ($coverType === 'family') {
            $basePrice += ($dependents * 1500);
        }
        
        return $basePrice * 100;
    }
}
