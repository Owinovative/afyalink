<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Registration\RegistrationWorkflowService;
use Afyalink\Core\Http\Request;

final readonly class RegistrationController
{
    public function __construct(
        private RegistrationWorkflowService $workflow,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pricing(Request $request): array
    {
        return ['pricing' => $this->workflow->pricing()];
    }

    /**
     * @return array<string, mixed>
     */
    public function start(Request $request): array
    {
        $type = (string) ($request->body['account_type'] ?? '');
        $result = $this->workflow->start($type, $request->body, $request->ipAddress, $request->userAgent);

        return ['registration' => $result];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Request $request, array $params): array
    {
        return ['registration' => $this->workflow->detailByReference((string) $params['reference'])];
    }

    /**
     * @return array<string, mixed>
     */
    public function initiateStk(Request $request, array $params): array
    {
        return $this->workflow->initiateStkPayment(
            (string) $params['reference'],
            (string) ($request->body['phone_number'] ?? ''),
            $request->ipAddress,
            $request->userAgent
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function submitPaybill(Request $request, array $params): array
    {
        return $this->workflow->submitPaybillReference(
            (string) $params['reference'],
            (string) ($request->body['reference'] ?? ''),
            $request->body['payer_phone'] ?? null,
            $request->ipAddress,
            $request->userAgent
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function createPassword(Request $request, array $params): array
    {
        return ['registration' => $this->workflow->createPassword(
            (string) $params['reference'],
            (string) ($request->body['password'] ?? ''),
            (string) ($request->body['password_confirmation'] ?? ''),
            $request->ipAddress,
            $request->userAgent
        )];
    }

    /**
     * @return array<string, mixed>
     */
    public function resendOtp(Request $request, array $params): array
    {
        return ['registration' => $this->workflow->resendOtp(
            (string) $params['reference'],
            $request->ipAddress,
            $request->userAgent
        )];
    }

    /**
     * @return array<string, mixed>
     */
    public function verifyOtp(Request $request, array $params): array
    {
        return ['registration' => $this->workflow->verifyOtp(
            (string) $params['reference'],
            (string) ($request->body['code'] ?? ''),
            $request->ipAddress,
            $request->userAgent
        )];
    }

    /**
     * @return array<string, mixed>
     */
    public function mpesaCallback(Request $request): array
    {
        return $this->workflow->handleMpesaCallback($request->body, $request->ipAddress, $request->userAgent);
    }
}
