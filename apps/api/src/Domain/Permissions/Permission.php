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
    case VerificationManage = 'verification.manage';
    case InterviewManage = 'interview.manage';
    case InterviewScoreSubmit = 'interview.score.submit';
    case FacilityOwnManage = 'facility.own.manage';
    case FacilityReview = 'facility.review';
    case FacilityCandidateView = 'facility.candidate.view';
    case FacilitySubscriptionOwnManage = 'facility.subscription.own.manage';
    case FacilitySubscriptionManage = 'facility.subscription.manage';
    case CandidatePublicationManage = 'candidate.publication.manage';
    case FacilityRequestManage = 'facility.request.manage';
    case RecommendationPackageManage = 'recommendation.package.manage';
    case PaymentManage = 'payment.manage';
    case AuditRead = 'audit.read';
    case UserManage = 'user.manage';
    case SystemManage = 'system.manage';
}
