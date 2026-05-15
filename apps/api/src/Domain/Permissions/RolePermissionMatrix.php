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
        ],
        'interviewer' => [
            Permission::InterviewScoreSubmit,
        ],
        'facility_admin' => [
            Permission::FacilityCandidateView,
            Permission::FacilitySubscriptionManage,
        ],
        'facility_viewer' => [
            Permission::FacilityCandidateView,
        ],
        'support_agent' => [],
        'admin' => [
            Permission::CredentialReview,
            Permission::CredentialRawView,
            Permission::ApplicationReview,
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
            Permission::InterviewScoreSubmit,
            Permission::FacilityCandidateView,
            Permission::FacilitySubscriptionManage,
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

