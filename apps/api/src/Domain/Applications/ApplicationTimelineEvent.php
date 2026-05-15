<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Applications;

use Afyalink\Core\Domain\Enums\ApplicationStatus;
use DateTimeImmutable;

final readonly class ApplicationTimelineEvent
{
    public function __construct(
        public ?ApplicationStatus $from,
        public ApplicationStatus $to,
        public ?string $note,
        public ?int $actorId,
        public DateTimeImmutable $occurredAt,
    ) {}
}

