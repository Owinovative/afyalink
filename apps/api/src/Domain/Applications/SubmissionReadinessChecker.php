<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Applications;

use Afyalink\Core\Domain\Credentials\CredentialRequirementRegistry;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\DocumentType;
use Afyalink\Core\Domain\Enums\PaymentStatus;

final readonly class SubmissionReadinessChecker
{
    public function __construct(
        private CredentialRequirementRegistry $requirements,
    ) {}

    /**
     * @param array<string, mixed> $profile
     * @param array<string, CredentialReviewStatus|string> $credentialStatuses keyed by DocumentType value
     */
    public function evaluate(
        array $profile,
        array $credentialStatuses,
        bool $emailVerified,
        bool $acceptedCurrentConsent,
        PaymentStatus $paymentStatus,
    ): SubmissionReadiness {
        $missing = [];
        $warnings = [];

        foreach (['name', 'email', 'phone', 'profession', 'regulatory_body', 'license_number', 'county'] as $field) {
            if (!isset($profile[$field]) || trim((string) $profile[$field]) === '') {
                $missing[] = "profile.$field";
            }
        }

        foreach ($this->requirements->minimumRequiredDocuments((string) ($profile['profession'] ?? '')) as $documentType) {
            $status = $credentialStatuses[$documentType->value] ?? null;
            $statusValue = $status instanceof CredentialReviewStatus ? $status->value : (string) $status;

            if ($statusValue === '') {
                $missing[] = "credential.{$documentType->value}";
                continue;
            }

            if (in_array($statusValue, [
                CredentialReviewStatus::Rejected->value,
                CredentialReviewStatus::NeedsReplacement->value,
                CredentialReviewStatus::Expired->value,
            ], true)) {
                $warnings[] = "credential.{$documentType->value}.requires_attention";
            }
        }

        if (!$emailVerified) {
            $missing[] = 'account.email_verified';
        }

        if (!$acceptedCurrentConsent) {
            $missing[] = 'consent.current_version';
        }

        if (!in_array($paymentStatus, [PaymentStatus::Confirmed, PaymentStatus::PendingVerification], true)) {
            $missing[] = 'payment.confirmed_or_pending_verification';
        }

        return new SubmissionReadiness(
            ready: $missing === [] && $warnings === [],
            missing: $missing,
            warnings: $warnings,
        );
    }
}
