<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Consent\ConsentService;
use Afyalink\Core\Http\Request;

final readonly class ConsentController
{
    public function __construct(
        private ConsentService $consents,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function accept(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'consent' => $this->consents->accept($user, $request->ipAddress, $request->userAgent),
        ];
    }
}
