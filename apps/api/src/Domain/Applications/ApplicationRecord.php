<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Applications;

use Afyalink\Core\Domain\Enums\ApplicationStatus;
use DateTimeImmutable;

final readonly class ApplicationRecord
{
    /**
     * @param list<ApplicationTimelineEvent> $timeline
     */
    public function __construct(
        public string $applicationNumber,
        public ApplicationStatus $status,
        public DateTimeImmutable $createdAt,
        public ?DateTimeImmutable $submittedAt = null,
        public ?string $reviewNote = null,
        public array $timeline = [],
    ) {}

    public function withStatus(
        ApplicationStatus $status,
        ?string $note,
        ?int $actorId,
    ): self {
        $now = new DateTimeImmutable();
        $timeline = $this->timeline;
        $timeline[] = new ApplicationTimelineEvent(
            from: $this->status,
            to: $status,
            note: $note,
            actorId: $actorId,
            occurredAt: $now,
        );

        return new self(
            applicationNumber: $this->applicationNumber,
            status: $status,
            createdAt: $this->createdAt,
            submittedAt: $status === ApplicationStatus::Submitted ? $now : $this->submittedAt,
            reviewNote: $note ?? $this->reviewNote,
            timeline: $timeline,
        );
    }
}

