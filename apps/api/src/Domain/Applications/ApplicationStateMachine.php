<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Applications;

use Afyalink\Core\Domain\Enums\ApplicationStatus;
use InvalidArgumentException;

final class ApplicationStateMachine
{
    /** @var array<string, list<ApplicationStatus>> */
    private const ALLOWED = [
        'draft' => [
            ApplicationStatus::Submitted,
            ApplicationStatus::Withdrawn,
        ],
        'submitted' => [
            ApplicationStatus::UnderReview,
            ApplicationStatus::AwaitingVerification,
            ApplicationStatus::VerificationInProgress,
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::Withdrawn,
        ],
        'under_review' => [
            ApplicationStatus::AwaitingVerification,
            ApplicationStatus::VerificationInProgress,
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::Verified,
            ApplicationStatus::Rejected,
            ApplicationStatus::Withdrawn,
        ],
        'needs_replacement' => [
            ApplicationStatus::Resubmitted,
            ApplicationStatus::VerificationInProgress,
            ApplicationStatus::Rejected,
            ApplicationStatus::Withdrawn,
        ],
        'resubmitted' => [
            ApplicationStatus::UnderReview,
            ApplicationStatus::VerificationInProgress,
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::Withdrawn,
        ],
        'verified' => [
            ApplicationStatus::VerificationPassed,
            ApplicationStatus::Approved,
            ApplicationStatus::Rejected,
        ],
        'awaiting_verification' => [
            ApplicationStatus::VerificationInProgress,
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::VerificationFailed,
            ApplicationStatus::Withdrawn,
        ],
        'verification_in_progress' => [
            ApplicationStatus::AwaitingVerification,
            ApplicationStatus::VerificationPassed,
            ApplicationStatus::VerificationFailed,
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::Withdrawn,
        ],
        'verification_passed' => [
            ApplicationStatus::InterviewScheduled,
            ApplicationStatus::Approved,
            ApplicationStatus::Rejected,
            ApplicationStatus::Withdrawn,
        ],
        'verification_failed' => [
            ApplicationStatus::Rejected,
            ApplicationStatus::Withdrawn,
        ],
        'interview_scheduled' => [
            ApplicationStatus::InterviewCompleted,
            ApplicationStatus::VerificationPassed,
            ApplicationStatus::Withdrawn,
        ],
        'interview_completed' => [
            ApplicationStatus::Qualified,
            ApplicationStatus::NotQualified,
            ApplicationStatus::Approved,
            ApplicationStatus::Rejected,
        ],
        'qualified' => [
            ApplicationStatus::Approved,
        ],
        'not_qualified' => [
            ApplicationStatus::Rejected,
        ],
        'approved' => [],
        'rejected' => [],
        'withdrawn' => [],
    ];

    public function canTransition(ApplicationStatus $from, ApplicationStatus $to): bool
    {
        return in_array($to, self::ALLOWED[$from->value] ?? [], true);
    }

    public function assertTransition(ApplicationStatus $from, ApplicationStatus $to): void
    {
        if (!$this->canTransition($from, $to)) {
            throw new InvalidArgumentException(sprintf(
                'Application status cannot move from %s to %s.',
                $from->value,
                $to->value,
            ));
        }
    }

    /**
     * @return list<ApplicationStatus>
     */
    public function nextStatuses(ApplicationStatus $from): array
    {
        return self::ALLOWED[$from->value] ?? [];
    }
}
