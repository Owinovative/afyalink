<?php

declare(strict_types=1);

namespace Afyalink\Core\Http;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AccountLifecycleService;
use Afyalink\Core\Application\Auth\AuthService;
use Afyalink\Core\Application\Auth\AuthorizationService;
use Afyalink\Core\Application\Consent\ConsentService;
use Afyalink\Core\Application\Credentials\CredentialService;
use Afyalink\Core\Application\Facilities\CandidatePublicationService;
use Afyalink\Core\Application\Facilities\FacilityAccessService;
use Afyalink\Core\Application\Facilities\FacilityEngagementService;
use Afyalink\Core\Application\Facilities\FacilityService;
use Afyalink\Core\Application\Interviews\InterviewService;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Application\Payments\PaymentService;
use Afyalink\Core\Application\Professionals\ProfessionalProfileService;
use Afyalink\Core\Application\Verification\VerificationService;
use Afyalink\Core\Domain\Permissions\Permission;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Security\FileUploadPolicy;
use Afyalink\Core\Http\Controllers\AdminFacilityController;
use Afyalink\Core\Http\Controllers\AdminController;
use Afyalink\Core\Http\Controllers\ApplicationController;
use Afyalink\Core\Http\Controllers\AuthController;
use Afyalink\Core\Http\Controllers\ConsentController;
use Afyalink\Core\Http\Controllers\CredentialController;
use Afyalink\Core\Http\Controllers\FacilityController;
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
        private readonly string $appUrl = 'http://localhost:3000',
        private readonly int $sessionTtlSeconds = 43200,
        private readonly int $maxUploadBytes = 8388608,
        private readonly int $emailVerificationTtlSeconds = 86400,
        private readonly int $passwordResetTtlSeconds = 3600,
    ) {
        $audit = new AuditLogger($this->store);
        $notifications = new NotificationService($this->store);
        $this->auth = new AuthService($this->store, $audit, sessionTtlSeconds: $this->sessionTtlSeconds);
        $accounts = new AccountLifecycleService(
            $this->store,
            $audit,
            $notifications,
            $this->appUrl,
            verificationTtlSeconds: $this->emailVerificationTtlSeconds,
            resetTtlSeconds: $this->passwordResetTtlSeconds,
        );
        $this->authorization = new AuthorizationService();

        $profiles = new ProfessionalProfileService($this->store, $audit);
        $credentials = new CredentialService($this->store, $storage, $audit, new FileUploadPolicy($this->maxUploadBytes), $notifications);
        $consents = new ConsentService($this->store, $audit);
        $payments = new PaymentService($this->store, $audit);
        $workflow = new ApplicationWorkflowService($this->store, $profiles, $credentials, $consents, $payments, $audit, notifications: $notifications);
        $verifications = new VerificationService($this->store, $workflow, $audit, $notifications);
        $interviews = new InterviewService($this->store, $workflow, $audit, $notifications);
        $facilities = new FacilityService($this->store, $audit, $notifications);
        $facilityAccess = new FacilityAccessService($this->store, $facilities, $audit, $notifications);
        $candidatePublications = new CandidatePublicationService($this->store, $facilities, $facilityAccess, $consents, $audit, $notifications);
        $facilityEngagements = new FacilityEngagementService($this->store, $facilities, $facilityAccess, $candidatePublications, $audit, $notifications);

        $authController = new AuthController($this->auth, $accounts);
        $professionalController = new ProfessionalController($profiles, $workflow, $verifications, $interviews, $candidatePublications);
        $credentialController = new CredentialController($credentials);
        $consentController = new ConsentController($consents);
        $paymentController = new PaymentController($payments);
        $applicationController = new ApplicationController($workflow);
        $adminController = new AdminController($workflow, $credentials, $payments, $this->store, $verifications, $interviews);
        $facilityController = new FacilityController($this->auth, $facilities, $facilityAccess, $candidatePublications, $facilityEngagements);
        $adminFacilityController = new AdminFacilityController($facilities, $facilityAccess, $candidatePublications, $facilityEngagements);

        $this->router = new Router();
        $this->routes($authController, $professionalController, $credentialController, $consentController, $paymentController, $applicationController, $adminController, $facilityController, $adminFacilityController);
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
        FacilityController $facility,
        AdminFacilityController $adminFacility,
    ): void {
        $this->router->add('GET', '/api/health', static fn (): array => ['status' => 'ok']);
        $this->router->add('POST', '/api/auth/register', [$auth, 'register']);
        $this->router->add('POST', '/api/auth/login', [$auth, 'login']);
        $this->router->add('POST', '/api/auth/email/verify', [$auth, 'verifyEmail']);
        $this->router->add('POST', '/api/auth/password/forgot', [$auth, 'forgotPassword']);
        $this->router->add('POST', '/api/auth/password/reset', [$auth, 'resetPassword']);
        $this->router->add('POST', '/api/facility/auth/register', [$facility, 'register']);
        $this->router->add('POST', '/api/auth/logout', $this->protected([$auth, 'logout']));
        $this->router->add('POST', '/api/auth/email/resend', $this->professional([$auth, 'resendEmailVerification']));
        $this->router->add('GET', '/api/me', $this->protected([$auth, 'me']));

        $this->router->add('GET', '/api/professional/dashboard', $this->professional([$professional, 'dashboard']));
        $this->router->add('PUT', '/api/professional/profile', $this->professional([$professional, 'saveProfile'], Permission::ProfileOwnWrite));
        $this->router->add('GET', '/api/professional/credentials', $this->professional([$credentials, 'index']));
        $this->router->add('POST', '/api/professional/credentials', $this->professional([$credentials, 'upload'], Permission::CredentialOwnUpload));
        $this->router->add('POST', '/api/professional/consents', $this->professional([$consents, 'accept']));
        $this->router->add('POST', '/api/professional/payments', $this->professional([$payments, 'create']));
        $this->router->add('POST', '/api/professional/application/submit', $this->professional([$applications, 'submit'], Permission::ApplicationOwnSubmit));

        $this->router->add('GET', '/api/facility/dashboard', $this->facilityUser([$facility, 'dashboard']));
        $this->router->add('PUT', '/api/facility/profile', $this->facilityUser([$facility, 'saveProfile'], Permission::FacilityOwnManage));
        $this->router->add('POST', '/api/facility/submit', $this->facilityUser([$facility, 'submit'], Permission::FacilityOwnManage));
        $this->router->add('POST', '/api/facility/access/payment-intents', $this->facilityUser([$facility, 'createAccessPayment'], Permission::FacilitySubscriptionOwnManage));
        $this->router->add('GET', '/api/facility/candidates', $this->facilityUser([$facility, 'candidates'], Permission::FacilityCandidateView));
        $this->router->add('GET', '/api/facility/candidates/{id}', $this->facilityUser([$facility, 'candidate'], Permission::FacilityCandidateView));
        $this->router->add('POST', '/api/facility/requests/appointments', $this->facilityUser([$facility, 'requestAppointment'], Permission::FacilityRequestManage));
        $this->router->add('POST', '/api/facility/recommendation-requests', $this->facilityUser([$facility, 'requestRecommendation'], Permission::FacilityRequestManage));
        $this->router->add('GET', '/api/facility/recommendation-packages', $this->facilityUser([$facility, 'recommendationPackages'], Permission::FacilityCandidateView));

        $this->router->add('GET', '/api/admin/applications', $this->protected([$admin, 'applications'], Permission::ApplicationReview));
        $this->router->add('GET', '/api/admin/applications/{id}', $this->protected([$admin, 'application'], Permission::ApplicationReview));
        $this->router->add('PATCH', '/api/admin/applications/{id}/action', $this->protected([$admin, 'action'], Permission::ApplicationReview));
        $this->router->add('PATCH', '/api/admin/credentials/{id}/review', $this->protected([$admin, 'reviewCredential'], Permission::CredentialReview));
        $this->router->add('PATCH', '/api/admin/payments/{id}/status', $this->protected([$admin, 'updatePayment'], Permission::PaymentManage));
        $this->router->add('GET', '/api/admin/regulatory-bodies', $this->protected([$admin, 'regulatoryBodies'], Permission::VerificationManage));
        $this->router->add('GET', '/api/admin/verifications', $this->protected([$admin, 'verificationCases'], Permission::VerificationManage));
        $this->router->add('POST', '/api/admin/verifications', $this->protected([$admin, 'createVerificationCase'], Permission::VerificationManage));
        $this->router->add('GET', '/api/admin/verifications/{id}', $this->protected([$admin, 'verificationCase'], Permission::VerificationManage));
        $this->router->add('PATCH', '/api/admin/verifications/{id}/status', $this->protected([$admin, 'updateVerificationStatus'], Permission::VerificationManage));
        $this->router->add('GET', '/api/admin/interviews', $this->protected([$admin, 'interviews'], Permission::InterviewManage));
        $this->router->add('POST', '/api/admin/interviews', $this->protected([$admin, 'scheduleInterview'], Permission::InterviewManage));
        $this->router->add('GET', '/api/admin/interviews/{id}', $this->protected([$admin, 'interview'], Permission::InterviewManage));
        $this->router->add('PATCH', '/api/admin/interviews/{id}/complete', $this->protected([$admin, 'completeInterview'], Permission::InterviewScoreSubmit));
        $this->router->add('GET', '/api/admin/facility-operations/overview', $this->protected([$adminFacility, 'overview'], Permission::FacilityReview));
        $this->router->add('GET', '/api/admin/facilities', $this->protected([$adminFacility, 'facilities'], Permission::FacilityReview));
        $this->router->add('GET', '/api/admin/facilities/{id}', $this->protected([$adminFacility, 'facility'], Permission::FacilityReview));
        $this->router->add('PATCH', '/api/admin/facilities/{id}/review', $this->protected([$adminFacility, 'reviewFacility'], Permission::FacilityReview));
        $this->router->add('PATCH', '/api/admin/facilities/{id}/subscription', $this->protected([$adminFacility, 'updateSubscription'], Permission::FacilitySubscriptionManage));
        $this->router->add('GET', '/api/admin/candidate-publications', $this->protected([$adminFacility, 'publications'], Permission::CandidatePublicationManage));
        $this->router->add('POST', '/api/admin/candidate-publications', $this->protected([$adminFacility, 'publishCandidate'], Permission::CandidatePublicationManage));
        $this->router->add('PATCH', '/api/admin/candidate-publications/{id}', $this->protected([$adminFacility, 'updatePublication'], Permission::CandidatePublicationManage));
        $this->router->add('GET', '/api/admin/facility-requests', $this->protected([$adminFacility, 'facilityRequests'], Permission::FacilityRequestManage));
        $this->router->add('PATCH', '/api/admin/facility-requests/{id}', $this->protected([$adminFacility, 'updateFacilityRequest'], Permission::FacilityRequestManage));
        $this->router->add('POST', '/api/admin/facility-requests/{id}/appointments', $this->protected([$adminFacility, 'scheduleAppointment'], Permission::FacilityRequestManage));
        $this->router->add('GET', '/api/admin/recommendation-requests', $this->protected([$adminFacility, 'recommendationRequests'], Permission::RecommendationPackageManage));
        $this->router->add('PATCH', '/api/admin/recommendation-requests/{id}', $this->protected([$adminFacility, 'updateRecommendationRequest'], Permission::RecommendationPackageManage));
        $this->router->add('GET', '/api/admin/recommendation-packages', $this->protected([$adminFacility, 'recommendationPackages'], Permission::RecommendationPackageManage));
        $this->router->add('POST', '/api/admin/recommendation-packages', $this->protected([$adminFacility, 'createRecommendationPackage'], Permission::RecommendationPackageManage));
        $this->router->add('PATCH', '/api/admin/recommendation-packages/{id}', $this->protected([$adminFacility, 'updateRecommendationPackage'], Permission::RecommendationPackageManage));
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

    /**
     * @param callable(Request): array<string, mixed> $handler
     * @return callable(Request): array<string, mixed>
     */
    private function facilityUser(callable $handler, ?Permission $permission = null): callable
    {
        return $this->protected(function (Request $request) use ($handler): array {
            if ($request->user === null || (!$request->user->hasRole(UserRole::FacilityAdmin) && !$request->user->hasRole(UserRole::FacilityViewer))) {
                throw new AuthorizationException('Facility account required.');
            }

            return $handler($request);
        }, $permission);
    }
}
