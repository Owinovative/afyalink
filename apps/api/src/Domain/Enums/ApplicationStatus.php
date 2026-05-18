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
    case AwaitingVerification = 'awaiting_verification';
    case VerificationInProgress = 'verification_in_progress';
    case VerificationPassed = 'verification_passed';
    case VerificationFailed = 'verification_failed';
    case InterviewScheduled = 'interview_scheduled';
    case InterviewCompleted = 'interview_completed';
    case Qualified = 'qualified';
    case NotQualified = 'not_qualified';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';
}
