<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Insurance;

use Afyalink\Core\Application\Notifications\NotificationService;

final class MicroInsuranceService
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    /**
     * @param array<string, mixed> $kycData
     * @return array<string, mixed>
     */
    public function underwrite(array $kycData, string $paymentFrequency, string $phone): array
    {
        // 1. Calculate risk score and base monthly premium
        $monthlyPremiumCents = $this->calculateMonthlyBase($kycData);

        // 2. CRITICAL: Clamp strictly between 30,000 cents (300 KES) and 60,000 cents (600 KES)
        $monthlyPremiumCents = max(30000, min(60000, $monthlyPremiumCents));

        // 3. Apply frequency multiplier
        $multiplier = match ($paymentFrequency) {
            'quarterly' => 3,
            'half_yearly' => 6,
            'annually' => 12,
            default => 1, // monthly
        };

        $finalPremiumCents = $monthlyPremiumCents * $multiplier;

        // Note: We would insert this into the database here using the repository/datastore

        // 4. Notifications
        $premiumDisplay = number_format($finalPremiumCents / 100, 2);
        $message = sprintf(
            "Your %s micro-insurance policy is active. Premium: %s KES. Payments are due on or before the 10th of the month.",
            ucfirst(str_replace('_', '-', $paymentFrequency)),
            $premiumDisplay
        );

        $this->notifications->dispatchSms($phone, $message);

        return [
            'premium_cents' => $finalPremiumCents,
            'monthly_base_cents' => $monthlyPremiumCents,
            'frequency' => $paymentFrequency,
            'message' => 'Quote generated successfully.',
        ];
    }

    /**
     * @param array<string, mixed> $kycData
     */
    private function calculateMonthlyBase(array $kycData): int
    {
        // Base starting point
        $base = 45000; // 450 KES

        // Example risk logic based on Q1 and Q2
        $txVolume = $kycData['mobile_money_transactions'] ?? '';
        if ($txVolume === '0-4,999') {
            $base += 5000; // Higher risk
        } elseif ($txVolume === '50,000+') {
            $base -= 5000; // Lower risk
        }

        $livestock = $kycData['livestock'] ?? [];
        if (is_array($livestock) && count($livestock) > 0) {
            // Slight premium increase per livestock type
            $base += (count($livestock) * 1000); 
        }

        return $base;
    }
}
