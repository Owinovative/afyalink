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
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::Withdrawn,
        ],
        'under_review' => [
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::Verified,
            ApplicationStatus::Rejected,
            ApplicationStatus::Withdrawn,
        ],
        'needs_replacement' => [
            ApplicationStatus::Resubmitted,
            ApplicationStatus::Rejected,
            ApplicationStatus::Withdrawn,
        ],
        'resubmitted' => [
            ApplicationStatus::UnderReview,
            ApplicationStatus::NeedsReplacement,
            ApplicationStatus::Withdrawn,
        ],
        'verified' => [
            ApplicationStatus::Approved,
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

