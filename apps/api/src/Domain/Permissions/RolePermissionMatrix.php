<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Permissions;

use Afyalink\Core\Domain\Enums\UserRole;

final class RolePermissionMatrix
{
    /** @var array<string, list<Permission>> */
    private const MATRIX = [
        'professional' => [
            Permission::ProfileOwnWrite,
            Permission::CredentialOwnUpload,
            Permission::ApplicationOwnSubmit,
        ],
        'verification_officer' => [
            Permission::CredentialReview,
            Permission::CredentialRawView,
            Permission::ApplicationReview,
            Permission::VerificationManage,
        ],
        'interviewer' => [
            Permission::InterviewManage,
            Permission::InterviewScoreSubmit,
        ],
        'facility_admin' => [
            Permission::FacilityOwnManage,
            Permission::FacilityCandidateView,
            Permission::FacilitySubscriptionOwnManage,
            Permission::FacilityRequestManage,
        ],
        'facility_viewer' => [
            Permission::FacilityCandidateView,
            Permission::FacilityRequestManage,
        ],
        'support_agent' => [],
        'admin' => [
            Permission::CredentialReview,
            Permission::CredentialRawView,
            Permission::ApplicationReview,
            Permission::VerificationManage,
            Permission::InterviewManage,
            Permission::InterviewScoreSubmit,
            Permission::FacilityReview,
            Permission::FacilitySubscriptionManage,
            Permission::CandidatePublicationManage,
            Permission::FacilityRequestManage,
            Permission::RecommendationPackageManage,
            Permission::PrelicensureManage,
            Permission::PaymentManage,
            Permission::AuditRead,
        ],
        'super_admin' => [
            Permission::ProfileOwnWrite,
            Permission::CredentialOwnUpload,
            Permission::CredentialReview,
            Permission::CredentialRawView,
            Permission::ApplicationOwnSubmit,
            Permission::ApplicationReview,
            Permission::VerificationManage,
            Permission::InterviewManage,
            Permission::InterviewScoreSubmit,
            Permission::FacilityOwnManage,
            Permission::FacilityReview,
            Permission::FacilityCandidateView,
            Permission::FacilitySubscriptionOwnManage,
            Permission::FacilitySubscriptionManage,
            Permission::CandidatePublicationManage,
            Permission::FacilityRequestManage,
            Permission::RecommendationPackageManage,
            Permission::PrelicensureManage,
            Permission::PaymentManage,
            Permission::AuditRead,
            Permission::UserManage,
            Permission::SystemManage,
        ],
    ];

    public function allows(UserRole $role, Permission $permission): bool
    {
        return in_array($permission, self::MATRIX[$role->value] ?? [], true);
    }

    /**
     * @return list<Permission>
     */
    public function permissionsFor(UserRole $role): array
    {
        return self::MATRIX[$role->value] ?? [];
    }
}
