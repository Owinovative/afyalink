<?php

namespace App\Application\Insurance;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class GeneratePublicQuote
{
    private function calculatePremium(string $tier, string $coverType, int $dependents): int
    {
        $basePrice = 2000; // Basic
        
        if ($tier === 'standard') $basePrice = 4500;
        if ($tier === 'premium') $basePrice = 8500;

        if ($coverType === 'family') {
            $basePrice += $dependents * 1500;
        }
        
        // Return cents/kobos
        return $basePrice * 100;
    }

    public function execute(array $data): array
    {
        $dependents = (int) ($data['dependents'] ?? 0);
        $finalPremiumCents = $this->calculatePremium($data['tier'], $data['coverType'], $dependents);
        
        $uniqueHash = strtoupper(Str::random(6));
        $policyNumber = "AFL-INS-{$uniqueHash}";

        // Persist to Database
        DB::table('insurance_policies')->insert([
            'policy_number' => $policyNumber,
            'provider' => 'Afyalink Master Cover',
            'policy_type' => $data['coverType'],
            'tier' => $data['tier'],
            'premium_cents' => $finalPremiumCents,
            'is_active' => true,
            'public_owner_name' => $data['name'],
            'public_owner_email' => $data['email'],
            'public_owner_phone' => $data['phone'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'number' => $policyNumber,
            'premium' => $finalPremiumCents / 100,
            'type' => $data['coverType'],
            'tier' => $data['tier']
        ];
    }
}
