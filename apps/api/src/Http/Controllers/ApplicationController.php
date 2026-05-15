<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Http\Request;

final readonly class ApplicationController
{
    public function __construct(
        private ApplicationWorkflowService $workflow,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function submit(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'application' => $this->workflow->submit($user, $request->ipAddress, $request->userAgent),
        ];
    }
}
