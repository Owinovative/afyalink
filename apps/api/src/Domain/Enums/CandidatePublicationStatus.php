<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum CandidatePublicationStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Paused = 'paused';
    case Withdrawn = 'withdrawn';
}
