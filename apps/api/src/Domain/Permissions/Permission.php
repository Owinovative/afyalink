<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Permissions;

enum Permission: string
{
    case ProfileOwnWrite = 'profile.own.write';
    case CredentialOwnUpload = 'credential.own.upload';
    case CredentialReview = 'credential.review';
    case CredentialRawView = 'credential.raw.view';
    case ApplicationOwnSubmit = 'application.own.submit';
    case ApplicationReview = 'application.review';
    case InterviewScoreSubmit = 'interview.score.submit';
    case FacilityCandidateView = 'facility.candidate.view';
    case FacilitySubscriptionManage = 'facility.subscription.manage';
    case PaymentManage = 'payment.manage';
    case AuditRead = 'audit.read';
    case UserManage = 'user.manage';
    case SystemManage = 'system.manage';
}

