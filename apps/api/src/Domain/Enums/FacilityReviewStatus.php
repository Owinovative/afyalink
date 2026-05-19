<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum FacilityReviewStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case ClarificationRequested = 'clarification_requested';
}
