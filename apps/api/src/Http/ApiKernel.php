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
use Afyalink\Core\Application\Notifications\NotificationDeliveryService;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Application\Operations\OperationsDashboardService;
use Afyalink\Core\Application\Operations\ReportingService;
use Afyalink\Core\Application\Payments\MpesaPaymentService;
use Afyalink\Core\Application\Payments\PaymentService;
use Afyalink\Core\Application\AI\LocalRecommendationAssistant;
use Afyalink\Core\Application\Placements\PlacementService;
use Afyalink\Core\Application\Privacy\PrivacyRequestService;
use Afyalink\Core\Application\Professionals\ProfessionalProfileService;
use Afyalink\Core\Application\Professionals\StudentPrelicensureService;
use Afyalink\Core\Application\Verification\VerificationService;
use Afyalink\Core\Domain\Permissions\Permission;
use Afyalink\Core\Domain\Security\FileUploadPolicy;
use Afyalink\Core\Http\Controllers\AdminFacilityController;
use Afyalink\Core\Http\Controllers\AdminController;
use Afyalink\Core\Http\Controllers\ApplicationController;
use Afyalink\Core\Http\Controllers\AuthController;
use Afyalink\Core\Http\Controllers\ConsentController;
use Afyalink\Core\Http\Controllers\CredentialController;
use Afyalink\Core\Http\Controllers\FacilityController;
use Afyalink\Core\Http\Controllers\OperationsController;
use Afyalink\Core\Http\Controllers\PaymentController;
use Afyalink\Core\Http\Controllers\PlacementController;
use Afyalink\Core\Http\Controllers\RegistrationController;
use Afyalink\Core\Application\Registration\RegistrationWorkflowService;
use Afyalink\Core\Http\Controllers\ProfessionalController;
use Afyalink\Core\Application\Insurance\InsuranceService;
use Afyalink\Core\Application\Insurance\MicroInsuranceService;
use Afyalink\Core\Http\Controllers\InsuranceController;
use Afyalink\Core\Infrastructure\Notifications\EmailProvider;
use Afyalink\Core\Infrastructure\Notifications\LogEmailProvider;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Infrastructure\Storage\CredentialStorage;
use Afyalink\Core\Support\Exceptions\AuthorizationException;
use Afyalink\Core\Support\Exceptions\AuthenticationException;
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
        private readonly ?EmailProvider $emailProvider = null,
    ) {
        $audit = new AuditLogger($this->store);
        $notifications = new NotificationService($this->store);
        $delivery = new NotificationDeliveryService($this->store, $audit, $this->emailProvider ?? new LogEmailProvider());
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
        $mpesa = new MpesaPaymentService($this->store, $audit);
        $prelicensure = new StudentPrelicensureService($this->store, $audit);
        $workflow = new ApplicationWorkflowService($this->store, $profiles, $credentials, $consents, $payments, $audit, notifications: $notifications, prelicensure: $prelicensure);
        $verifications = new VerificationService($this->store, $workflow, $audit, $notifications);
        $interviews = new InterviewService($this->store, $workflow, $audit, $notifications);
        $facilities = new FacilityService($this->store, $audit, $notifications);
        $facilityAccess = new FacilityAccessService($this->store, $facilities, $audit, $notifications);
        $candidatePublications = new CandidatePublicationService($this->store, $facilities, $facilityAccess, $consents, $audit, $notifications);
        $facilityEngagements = new FacilityEngagementService($this->store, $facilities, $facilityAccess, $candidatePublications, $audit, $notifications);
        $placements = new PlacementService($this->store, $facilities, $facilityAccess, $candidatePublications, $audit, $notifications, new LocalRecommendationAssistant());

        // Initialize the new Registration Engine
        $registrationWorkflow = new RegistrationWorkflowService($this->store, new AuditLogger($this->store), new NotificationService($this->store));
        $registrationController = new RegistrationController($registrationWorkflow);
        $authController = new AuthController($this->auth, $accounts);
        $professionalController = new ProfessionalController($profiles, $workflow, $verifications, $interviews, $candidatePublications);
        $credentialController = new CredentialController($credentials);
        $consentController = new ConsentController($consents);
        $paymentController = new PaymentController($payments);
        $applicationController = new ApplicationController($workflow);
        $adminController = new AdminController($this->auth, $workflow, $credentials, $payments, $this->store, $verifications, $interviews, $prelicensure);
        $facilityController = new FacilityController($this->auth, $facilities, $facilityAccess, $candidatePublications, $facilityEngagements);
        $adminFacilityController = new AdminFacilityController($facilities, $facilityAccess, $candidatePublications, $facilityEngagements);
        $placementController = new PlacementController($placements);
        $operationsController = new OperationsController(
            new OperationsDashboardService($this->store),
            new ReportingService($this->store),
            $delivery,
            new PrivacyRequestService($this->store, $audit),
            $mpesa,
        );

        $insuranceService = new InsuranceService();
        $microInsuranceService = new MicroInsuranceService($notifications);
        $insuranceController = new InsuranceController($insuranceService, $microInsuranceService);

        $this->router = new Router();
        $this->routes($authController, $professionalController, $credentialController, $consentController, $paymentController, $applicationController, $adminController, $facilityController, $adminFacilityController, $placementController, $operationsController, $insuranceController);
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
        } catch (AuthenticationException $exception) {
            return new JsonResponse([
                'ok' => false,
                'message' => $exception->getMessage(),
            ], 401);
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
        PlacementController $placements,
        OperationsController $operations,
        InsuranceController $insurance,
    ): void {
        $this->router->add('GET', '/api/health', static fn (): array => ['status' => 'ok']);
        $this->router->add('POST', '/api/insurance/public/quote', [$insurance, 'generatePublicQuote']);
        $this->router->add('POST', '/api/insurance/micro/underwrite', [$insurance, 'generateMicroQuote']);
        
        $this->router->add('POST', '/api/auth/login', [$auth, 'login']);
        $this->router->add('POST', '/api/auth/email/verify', [$auth, 'verifyEmail']);
        $this->router->add('POST', '/api/auth/password/forgot', [$auth, 'forgotPassword']);
        $this->router->add('POST', '/api/auth/password/reset', [$auth, 'resetPassword']);
        $this->router->add('POST', '/api/facility/auth/register', [$facility, 'register']);
        $this->router->add('POST', '/api/payments/mpesa/callback', [$operations, 'paymentCallback']);
        $this->router->add('POST', '/api/privacy-requests', [$operations, 'submitPrivacyRequest']);
        $this->router->add('POST', '/api/auth/logout', $this->protected([$auth, 'logout']));
        $this->router->add('POST', '/api/auth/email/resend', $this->professional([$auth, 'resendEmailVerification']));
        $this->router->add('GET', '/api/me', $this->protected([$auth, 'me']));

        $this->router->add('GET', '/api/professional/dashboard', $this->professional([$professional, 'dashboard']));
        $this->router->add('PUT', '/api/professional/profile', $this->professional([$professional, 'saveProfile'], Permission::ProfileOwnWrite));
        $this->router->add('GET', '/api/professional/placement', $this->professional([$placements, 'professionalPlacementDashboard'], Permission::ProfessionalPlacementOwnManage));
        $this->router->add('PUT', '/api/professional/placement/preferences', $this->professional([$placements, 'savePreferences'], Permission::ProfessionalPlacementOwnManage));
        $this->router->add('GET', '/api/professional/opportunities', $this->professional([$placements, 'professionalOpportunities'], Permission::ProfessionalPlacementOwnManage));
        $this->router->add('GET', '/api/professional/opportunities/{id}', $this->professional([$placements, 'professionalOpportunity'], Permission::ProfessionalPlacementOwnManage));
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
        $this->router->add('GET', '/api/facility/requisitions', $this->facilityUser([$placements, 'facilityRequisitions'], Permission::FacilityRequisitionManage));
        $this->router->add('POST', '/api/facility/requisitions', $this->facilityUser([$placements, 'createFacilityRequisition'], Permission::FacilityRequisitionManage));
        $this->router->add('GET', '/api/facility/requisitions/{id}', $this->facilityUser([$placements, 'facilityRequisition'], Permission::FacilityRequisitionManage));
        $this->router->add('GET', '/api/facility/shortlists', $this->facilityUser([$placements, 'facilityShortlists'], Permission::FacilityCandidateView));
        $this->router->add('GET', '/api/facility/placements', $this->facilityUser([$placements, 'facilityPlacements'], Permission::FacilityRequestManage));
        $this->router->add('POST', '/api/facility/interview-requests', $this->facilityUser([$placements, 'requestFacilityInterview'], Permission::FacilityRequestManage));
        $this->router->add('POST', '/api/facility/team/invitations', $this->facilityUser([$placements, 'inviteFacilityMember'], Permission::FacilityTeamManage));
        $this->router->add('POST', '/api/facility/requests/appointments', $this->facilityUser([$facility, 'requestAppointment'], Permission::FacilityRequestManage));
        $this->router->add('POST', '/api/facility/recommendation-requests', $this->facilityUser([$facility, 'requestRecommendation'], Permission::FacilityRequestManage));
        $this->router->add('GET', '/api/facility/recommendation-packages', $this->facilityUser([$facility, 'recommendationPackages'], Permission::FacilityCandidateView));

        $this->router->add('GET', '/api/admin/users', $this->admin([$admin, 'users'], Permission::UserManage));
        $this->router->add('POST', '/api/admin/users', $this->admin([$admin, 'createAdminUser'], Permission::UserManage));
        $this->router->add('GET', '/api/admin/applications', $this->admin([$admin, 'applications'], Permission::ApplicationReview));
        $this->router->add('GET', '/api/admin/applications/{id}', $this->admin([$admin, 'application'], Permission::ApplicationReview));
        $this->router->add('PATCH', '/api/admin/applications/{id}/action', $this->admin([$admin, 'action'], Permission::ApplicationReview));
        $this->router->add('PATCH', '/api/admin/credentials/{id}/review', $this->admin([$admin, 'reviewCredential'], Permission::CredentialReview));
        $this->router->add('PATCH', '/api/admin/payments/{id}/status', $this->admin([$admin, 'updatePayment'], Permission::PaymentManage));
        $this->router->add('GET', '/api/admin/regulatory-bodies', $this->admin([$admin, 'regulatoryBodies'], Permission::VerificationManage));
        $this->router->add('GET', '/api/admin/verifications', $this->admin([$admin, 'verificationCases'], Permission::VerificationManage));
        $this->router->add('POST', '/api/admin/verifications', $this->admin([$admin, 'createVerificationCase'], Permission::VerificationManage));
        $this->router->add('GET', '/api/admin/verifications/{id}', $this->admin([$admin, 'verificationCase'], Permission::VerificationManage));
        $this->router->add('PATCH', '/api/admin/verifications/{id}/status', $this->admin([$admin, 'updateVerificationStatus'], Permission::VerificationManage));
        $this->router->add('GET', '/api/admin/interviews', $this->admin([$admin, 'interviews'], Permission::InterviewManage));
        $this->router->add('POST', '/api/admin/interviews', $this->admin([$admin, 'scheduleInterview'], Permission::InterviewManage));
        $this->router->add('GET', '/api/admin/interviews/{id}', $this->admin([$admin, 'interview'], Permission::InterviewManage));
        $this->router->add('PATCH', '/api/admin/interviews/{id}/complete', $this->admin([$admin, 'completeInterview'], Permission::InterviewScoreSubmit));
        $this->router->add('GET', '/api/admin/facility-operations/overview', $this->admin([$adminFacility, 'overview'], Permission::FacilityReview));
        $this->router->add('GET', '/api/admin/facilities', $this->admin([$adminFacility, 'facilities'], Permission::FacilityReview));
        $this->router->add('GET', '/api/admin/facilities/{id}', $this->admin([$adminFacility, 'facility'], Permission::FacilityReview));
        $this->router->add('PATCH', '/api/admin/facilities/{id}/review', $this->admin([$adminFacility, 'reviewFacility'], Permission::FacilityReview));
        $this->router->add('PATCH', '/api/admin/facilities/{id}/subscription', $this->admin([$adminFacility, 'updateSubscription'], Permission::FacilitySubscriptionManage));
        $this->router->add('GET', '/api/admin/candidate-publications', $this->admin([$adminFacility, 'publications'], Permission::CandidatePublicationManage));
        $this->router->add('POST', '/api/admin/candidate-publications', $this->admin([$adminFacility, 'publishCandidate'], Permission::CandidatePublicationManage));
        $this->router->add('PATCH', '/api/admin/candidate-publications/{id}', $this->admin([$adminFacility, 'updatePublication'], Permission::CandidatePublicationManage));
        $this->router->add('GET', '/api/admin/facility-requests', $this->admin([$adminFacility, 'facilityRequests'], Permission::FacilityRequestManage));
        $this->router->add('PATCH', '/api/admin/facility-requests/{id}', $this->admin([$adminFacility, 'updateFacilityRequest'], Permission::FacilityRequestManage));
        $this->router->add('POST', '/api/admin/facility-requests/{id}/appointments', $this->admin([$adminFacility, 'scheduleAppointment'], Permission::FacilityRequestManage));
        $this->router->add('GET', '/api/admin/recommendation-requests', $this->admin([$adminFacility, 'recommendationRequests'], Permission::RecommendationPackageManage));
        $this->router->add('PATCH', '/api/admin/recommendation-requests/{id}', $this->admin([$adminFacility, 'updateRecommendationRequest'], Permission::RecommendationPackageManage));
        $this->router->add('GET', '/api/admin/recommendation-packages', $this->admin([$adminFacility, 'recommendationPackages'], Permission::RecommendationPackageManage));
        $this->router->add('POST', '/api/admin/recommendation-packages', $this->admin([$adminFacility, 'createRecommendationPackage'], Permission::RecommendationPackageManage));
        $this->router->add('PATCH', '/api/admin/recommendation-packages/{id}', $this->admin([$adminFacility, 'updateRecommendationPackage'], Permission::RecommendationPackageManage));
        $this->router->add('GET', '/api/admin/requisitions', $this->admin([$placements, 'adminRequisitions'], Permission::MatchingManage));
        $this->router->add('GET', '/api/admin/requisitions/{id}', $this->admin([$placements, 'adminRequisition'], Permission::MatchingManage));
        $this->router->add('PATCH', '/api/admin/requisitions/{id}', $this->admin([$placements, 'updateRequisition'], Permission::MatchingManage));
        $this->router->add('POST', '/api/admin/requisitions/{id}/matching-runs', $this->admin([$placements, 'runMatching'], Permission::MatchingManage));
        $this->router->add('POST', '/api/admin/matches/{id}/ai-draft', $this->admin([$placements, 'draftAiRationale'], Permission::MatchingManage));
        $this->router->add('POST', '/api/admin/placement-shortlists', $this->admin([$placements, 'createShortlist'], Permission::MatchingManage));
        $this->router->add('GET', '/api/admin/placements', $this->admin([$placements, 'adminPlacements'], Permission::PlacementManage));
        $this->router->add('POST', '/api/admin/placements', $this->admin([$placements, 'createPlacement'], Permission::PlacementManage));
        $this->router->add('PATCH', '/api/admin/placements/{id}', $this->admin([$placements, 'updatePlacement'], Permission::PlacementManage));
        $this->router->add('GET', '/api/admin/communications', $this->admin([$placements, 'adminThreads'], Permission::CommunicationManage));
        $this->router->add('POST', '/api/admin/communications', $this->admin([$placements, 'createThread'], Permission::CommunicationManage));
        $this->router->add('GET', '/api/admin/integrations', $this->admin([$placements, 'integrations'], Permission::IntegrationManage));
        $this->router->add('GET', '/api/admin/security/asvs-readiness', $this->admin([$placements, 'security'], Permission::OperationsRead));
        $this->router->add('GET', '/api/admin/audit-logs', $this->admin([$admin, 'auditLogs'], Permission::AuditRead));
        $this->router->add('GET', '/api/admin/pre-licensure', $this->admin([$admin, 'prelicensureApplicants'], Permission::PrelicensureManage));
        $this->router->add('PATCH', '/api/admin/pre-licensure/{id}/convert', $this->admin([$admin, 'convertPrelicensureApplicant'], Permission::PrelicensureManage));
        $this->router->add('GET', '/api/admin/operations/dashboard', $this->admin([$operations, 'dashboard'], Permission::OperationsRead));
        $this->router->add('GET', '/api/admin/reports', $this->admin([$operations, 'reports'], Permission::ReportsRead));
        $this->router->add('GET', '/api/admin/notifications', $this->admin([$operations, 'notifications'], Permission::NotificationManage));
        $this->router->add('POST', '/api/admin/notifications/process', $this->admin([$operations, 'processNotifications'], Permission::NotificationManage));
        $this->router->add('GET', '/api/admin/privacy-requests', $this->admin([$operations, 'privacyRequests'], Permission::PrivacyRequestManage));
        $this->router->add('PATCH', '/api/admin/privacy-requests/{id}', $this->admin([$operations, 'updatePrivacyRequest'], Permission::PrivacyRequestManage));
    }

    /**
     * @param callable(Request): array<string, mixed> $handler
     * @return callable(Request): array<string, mixed>
     */
    private function protected(callable $handler, ?Permission $permission = null): callable
    {
        return function (Request $request) use ($handler, $permission): array {
            if ($request->user === null) {
                throw new AuthenticationException();
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
            if ($request->user === null || !$request->user->isProfessionalWorkspaceUser()) {
                throw new AuthorizationException('Professional account required.');
            }

            return $handler($request);
        }, $permission);
    }

    /**
     * @param callable(Request): array<string, mixed> $handler
     * @return callable(Request): array<string, mixed>
     */
    private function admin(callable $handler, ?Permission $permission = null): callable
    {
        return $this->protected(function (Request $request) use ($handler): array {
            if ($request->user === null || !$request->user->isAdminWorkspaceUser()) {
                throw new AuthorizationException('Admin account required.');
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
            if ($request->user === null || !$request->user->isFacilityWorkspaceUser()) {
                throw new AuthorizationException('Facility account required.');
            }

            return $handler($request);
        }, $permission);
    }
}
