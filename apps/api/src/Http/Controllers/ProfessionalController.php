<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Professionals\ProfessionalProfileService;
use Afyalink\Core\Http\Request;

final readonly class ProfessionalController
{
    public function __construct(
        private ProfessionalProfileService $profiles,
        private ApplicationWorkflowService $workflow,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function saveProfile(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'profile' => $this->profiles->upsert($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->workflow->dashboard($user);
    }
}
