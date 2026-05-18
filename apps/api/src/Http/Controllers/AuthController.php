<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AccountLifecycleService;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Auth\AuthService;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Support\Validator;

final readonly class AuthController
{
    public function __construct(
        private AuthService $auth,
        private AccountLifecycleService $accounts,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function register(Request $request): array
    {
        Validator::requireFields($request->body, ['name', 'email', 'phone', 'password']);
        Validator::email('email', $request->body['email']);

        $session = $this->auth->registerProfessional(
            name: (string) $request->body['name'],
            email: (string) $request->body['email'],
            phone: (string) $request->body['phone'],
            password: (string) $request->body['password'],
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
        $verification = $this->accounts->sendEmailVerificationForUserId(
            $session['user']->id,
            $request->ipAddress,
            $request->userAgent,
        );

        return [
            'token' => $session['token'],
            'user' => $session['user']->toArray(),
            'email_verification' => $verification,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function login(Request $request): array
    {
        Validator::requireFields($request->body, ['email', 'password']);

        $session = $this->auth->login(
            email: (string) $request->body['email'],
            password: (string) $request->body['password'],
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );

        return [
            'token' => $session['token'],
            'user' => $session['user']->toArray(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function logout(Request $request): array
    {
        $this->auth->logout((string) $request->bearerToken(), $request->ipAddress, $request->userAgent);

        return ['ok' => true];
    }

    /**
     * @return array<string, mixed>
     */
    public function verifyEmail(Request $request): array
    {
        Validator::requireFields($request->body, ['token']);

        return $this->accounts->verifyEmail(
            plainToken: (string) $request->body['token'],
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function resendEmailVerification(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->accounts->sendEmailVerificationForUserId(
            $user->id,
            $request->ipAddress,
            $request->userAgent,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function forgotPassword(Request $request): array
    {
        Validator::requireFields($request->body, ['email']);
        Validator::email('email', $request->body['email']);

        return $this->accounts->requestPasswordReset(
            email: (string) $request->body['email'],
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function resetPassword(Request $request): array
    {
        Validator::requireFields($request->body, ['token', 'password']);

        return $this->accounts->resetPassword(
            plainToken: (string) $request->body['token'],
            password: (string) $request->body['password'],
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function me(Request $request): array
    {
        return ['user' => $request->user?->toArray()];
    }
}
