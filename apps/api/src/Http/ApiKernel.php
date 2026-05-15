<?php

declare(strict_types=1);

namespace Afyalink\Core\Http;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthService;
use Afyalink\Core\Application\Auth\AuthorizationService;
use Afyalink\Core\Application\Consent\ConsentService;
use Afyalink\Core\Application\Credentials\CredentialService;
use Afyalink\Core\Application\Payments\PaymentService;
use Afyalink\Core\Application\Professionals\ProfessionalProfileService;
use Afyalink\Core\Domain\Permissions\Permission;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Security\FileUploadPolicy;
use Afyalink\Core\Http\Controllers\AdminController;
use Afyalink\Core\Http\Controllers\ApplicationController;
use Afyalink\Core\Http\Controllers\AuthController;
use Afyalink\Core\Http\Controllers\ConsentController;
use Afyalink\Core\Http\Controllers\CredentialController;
use Afyalink\Core\Http\Controllers\PaymentController;
use Afyalink\Core\Http\Controllers\ProfessionalController;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Infrastructure\Storage\CredentialStorage;
use Afyalink\Core\Support\Exceptions\AuthorizationException;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Exceptions\ValidationException;
use DomainException;
use InvalidArgumentException;
use Throwable;

final class ApiKernel
{
    private Router $router;
    private AuthService $auth;
    private AuthorizationService $authorization;

    public function __construct(
        private readonly DataStore $store,
        CredentialStorage $storage,
        private readonly int $sessionTtlSeconds = 43200,
        private readonly int $maxUploadBytes = 8388608,
    ) {
        $audit = new AuditLogger($this->store);
        $this->auth = new AuthService($this->store, $audit, sessionTtlSeconds: $this->sessionTtlSeconds);
        $this->authorization = new AuthorizationService();

        $profiles = new ProfessionalProfileService($this->store, $audit);
        $credentials = new CredentialService($this->store, $storage, $audit, new FileUploadPolicy($this->maxUploadBytes));
        $consents = new ConsentService($this->store, $audit);
        $payments = new PaymentService($this->store, $audit);
        $workflow = new ApplicationWorkflowService($this->store, $profiles, $credentials, $consents, $payments, $audit);

        $authController = new AuthController($this->auth);
        $professionalController = new ProfessionalController($profiles, $workflow);
        $credentialController = new CredentialController($credentials);
        $consentController = new ConsentController($consents);
        $paymentController = new PaymentController($payments);
        $applicationController = new ApplicationController($workflow);
        $adminController = new AdminController($workflow, $credentials, $payments, $this->store);

        $this->router = new Router();
        $this->routes($authController, $professionalController, $credentialController, $consentController, $paymentController, $applicationController, $adminController);
    }

    public function auth(): AuthService
    {
        return $this->auth;
    }

    public function handle(Request $request): JsonResponse
    {
        $start = microtime(true);

        try {
            $request->user = $this->auth->userFromToken($request->bearerToken());
            $payload = $this->router->dispatch($request);

            return new JsonResponse([
                'ok' => true,
                'data' => $payload,
                'meta' => [
                    'duration_ms' => (int) round((microtime(true) - $start) * 1000),
                ],
            ]);
        } catch (ValidationException $exception) {
            return new JsonResponse([
                'ok' => false,
                'message' => $exception->getMessage(),
                'errors' => $exception->errors,
            ], 422);
        } catch (AuthorizationException $exception) {
            return new JsonResponse([
                'ok' => false,
                'message' => $exception->getMessage(),
            ], 403);
        } catch (NotFoundException $exception) {
            return new JsonResponse([
                'ok' => false,
                'message' => $exception->getMessage(),
            ], 404);
        } catch (DomainException|InvalidArgumentException $exception) {
            return new JsonResponse([
                'ok' => false,
                'message' => $exception->getMessage(),
            ], 409);
        } catch (Throwable) {
            return new JsonResponse([
                'ok' => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }

    private function routes(
        AuthController $auth,
        ProfessionalController $professional,
        CredentialController $credentials,
        ConsentController $consents,
        PaymentController $payments,
        ApplicationController $applications,
        AdminController $admin,
    ): void {
        $this->router->add('GET', '/api/health', static fn (): array => ['status' => 'ok']);
        $this->router->add('POST', '/api/auth/register', [$auth, 'register']);
        $this->router->add('POST', '/api/auth/login', [$auth, 'login']);
        $this->router->add('POST', '/api/auth/logout', $this->protected([$auth, 'logout']));
        $this->router->add('GET', '/api/me', $this->protected([$auth, 'me']));

        $this->router->add('GET', '/api/professional/dashboard', $this->professional([$professional, 'dashboard']));
        $this->router->add('PUT', '/api/professional/profile', $this->professional([$professional, 'saveProfile'], Permission::ProfileOwnWrite));
        $this->router->add('GET', '/api/professional/credentials', $this->professional([$credentials, 'index']));
        $this->router->add('POST', '/api/professional/credentials', $this->professional([$credentials, 'upload'], Permission::CredentialOwnUpload));
        $this->router->add('POST', '/api/professional/consents', $this->professional([$consents, 'accept']));
        $this->router->add('POST', '/api/professional/payments', $this->professional([$payments, 'create']));
        $this->router->add('POST', '/api/professional/application/submit', $this->professional([$applications, 'submit'], Permission::ApplicationOwnSubmit));

        $this->router->add('GET', '/api/admin/applications', $this->protected([$admin, 'applications'], Permission::ApplicationReview));
        $this->router->add('GET', '/api/admin/applications/{id}', $this->protected([$admin, 'application'], Permission::ApplicationReview));
        $this->router->add('PATCH', '/api/admin/applications/{id}/action', $this->protected([$admin, 'action'], Permission::ApplicationReview));
        $this->router->add('PATCH', '/api/admin/credentials/{id}/review', $this->protected([$admin, 'reviewCredential'], Permission::CredentialReview));
        $this->router->add('PATCH', '/api/admin/payments/{id}/status', $this->protected([$admin, 'updatePayment'], Permission::PaymentManage));
        $this->router->add('GET', '/api/admin/audit-logs', $this->protected([$admin, 'auditLogs'], Permission::AuditRead));
    }

    /**
     * @param callable(Request): array<string, mixed> $handler
     * @return callable(Request): array<string, mixed>
     */
    private function protected(callable $handler, ?Permission $permission = null): callable
    {
        return function (Request $request) use ($handler, $permission): array {
            if ($request->user === null) {
                throw new AuthorizationException('Authentication required.');
            }

            if ($permission !== null) {
                $this->authorization->require($request->user, $permission);
            }

            return $handler($request);
        };
    }

    /**
     * @param callable(Request): array<string, mixed> $handler
     * @return callable(Request): array<string, mixed>
     */
    private function professional(callable $handler, ?Permission $permission = null): callable
    {
        return $this->protected(function (Request $request) use ($handler): array {
            if ($request->user === null || !$request->user->hasRole(UserRole::Professional)) {
                throw new AuthorizationException('Professional account required.');
            }

            return $handler($request);
        }, $permission);
    }
}
