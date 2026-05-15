<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Applications;

use Afyalink\Core\Domain\Enums\ApplicationStatus;
use DomainException;

final readonly class AdminReviewService
{
    public function __construct(
        private ApplicationStateMachine $stateMachine = new ApplicationStateMachine(),
    ) {}

    public function moveToReview(ApplicationRecord $application, int $actorId): ApplicationRecord
    {
        $this->stateMachine->assertTransition($application->status, ApplicationStatus::UnderReview);

        return $application->withStatus(
            status: ApplicationStatus::UnderReview,
            note: 'Application entered verification review.',
            actorId: $actorId,
        );
    }

    public function requestReplacement(
        ApplicationRecord $application,
        string $reason,
        int $actorId,
    ): ApplicationRecord {
        $this->assertReason($reason, 'Replacement reason is required.');
        $this->stateMachine->assertTransition($application->status, ApplicationStatus::NeedsReplacement);

        return $application->withStatus(ApplicationStatus::NeedsReplacement, $reason, $actorId);
    }

    public function verify(ApplicationRecord $application, string $note, int $actorId): ApplicationRecord
    {
        $this->stateMachine->assertTransition($application->status, ApplicationStatus::Verified);

        return $application->withStatus(ApplicationStatus::Verified, $note, $actorId);
    }

    public function approve(ApplicationRecord $application, string $note, int $actorId): ApplicationRecord
    {
        $this->stateMachine->assertTransition($application->status, ApplicationStatus::Approved);

        return $application->withStatus(ApplicationStatus::Approved, $note, $actorId);
    }

    public function reject(ApplicationRecord $application, string $reason, int $actorId): ApplicationRecord
    {
        $this->assertReason($reason, 'Rejection reason is required.');
        $this->stateMachine->assertTransition($application->status, ApplicationStatus::Rejected);

        return $application->withStatus(ApplicationStatus::Rejected, $reason, $actorId);
    }

    private function assertReason(string $reason, string $message): void
    {
        if (trim($reason) === '') {
            throw new DomainException($message);
        }
    }
}

