<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Credentials\CredentialService;
use Afyalink\Core\Http\Request;

final readonly class CredentialController
{
    public function __construct(
        private CredentialService $credentials,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function upload(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'credential' => $this->credentials->upload($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function index(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'credentials' => $this->credentials->listForUser($user->id),
        ];
    }
}
