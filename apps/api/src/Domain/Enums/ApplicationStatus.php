<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum ApplicationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case NeedsReplacement = 'needs_replacement';
    case Resubmitted = 'resubmitted';
    case Verified = 'verified';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';
}

