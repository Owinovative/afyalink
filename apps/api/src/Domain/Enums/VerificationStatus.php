<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum VerificationStatus: string
{
    case Pending = 'pending';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case AwaitingExternalResponse = 'awaiting_external_response';
    case Verified = 'verified';
    case Failed = 'failed';
    case NeedsClarification = 'needs_clarification';
}

