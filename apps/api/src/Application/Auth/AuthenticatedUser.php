<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Auth;

use Afyalink\Core\Domain\Enums\UserRole;

final readonly class AuthenticatedUser
{
    /**
     * @param list<UserRole> $roles
     */
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public string $phone,
        public array $roles,
        public ?string $emailVerifiedAt = null,
    ) {}

    public function hasRole(UserRole $role): bool
    {
        return in_array($role, $this->roles, true);
    }

    public function isAdminLike(): bool
    {
        return $this->hasRole(UserRole::Admin)
            || $this->hasRole(UserRole::SuperAdmin)
            || $this->hasRole(UserRole::VerificationOfficer);
    }

    public function isAdminWorkspaceUser(): bool
    {
        return $this->hasRole(UserRole::Admin)
            || $this->hasRole(UserRole::SuperAdmin);
    }

    public function isFacilityWorkspaceUser(): bool
    {
        return $this->hasRole(UserRole::FacilityAdmin)
            || $this->hasRole(UserRole::FacilityViewer);
    }

    public function isProfessionalWorkspaceUser(): bool
    {
        return $this->hasRole(UserRole::Professional);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'roles' => array_map(static fn (UserRole $role) => $role->value, $this->roles),
            'email_verified_at' => $this->emailVerifiedAt,
            'email_verified' => $this->emailVerifiedAt !== null && $this->emailVerifiedAt !== '',
        ];
    }
}

