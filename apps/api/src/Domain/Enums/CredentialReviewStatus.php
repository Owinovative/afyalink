<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum CredentialReviewStatus: string
{
    case Uploaded = 'uploaded';
    case PendingReview = 'pending_review';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case NeedsReplacement = 'needs_replacement';
    case Expired = 'expired';
}

