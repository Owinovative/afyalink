<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Auth;

use Afyalink\Core\Domain\Permissions\Permission;
use Afyalink\Core\Domain\Permissions\RolePermissionMatrix;
use Afyalink\Core\Support\Exceptions\AuthorizationException;

final readonly class AuthorizationService
{
    public function __construct(
        private RolePermissionMatrix $matrix = new RolePermissionMatrix(),
    ) {}

    public function require(AuthenticatedUser $user, Permission $permission): void
    {
        foreach ($user->roles as $role) {
            if ($this->matrix->allows($role, $permission)) {
                return;
            }
        }

        throw new AuthorizationException();
    }
}
