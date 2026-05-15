<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Payments\PaymentService;
use Afyalink\Core\Http\Request;

final readonly class PaymentController
{
    public function __construct(
        private PaymentService $payments,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function create(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'payment' => $this->payments->createIntent($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }
}
