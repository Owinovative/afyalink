<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Credentials\CredentialService;
use Afyalink\Core\Application\Interviews\InterviewService;
use Afyalink\Core\Application\Payments\PaymentService;
use Afyalink\Core\Application\Professionals\StudentPrelicensureService;
use Afyalink\Core\Application\Verification\VerificationService;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\InterviewRecommendation;
use Afyalink\Core\Domain\Enums\VerificationStatus;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Validator;

final readonly class AdminController
{
    public function __construct(
        private ApplicationWorkflowService $workflow,
        private CredentialService $credentials,
        private PaymentService $payments,
        private DataStore $store,
        private ?VerificationService $verifications = null,
        private ?InterviewService $interviews = null,
        private ?StudentPrelicensureService $prelicensure = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function applications(Request $request): array
    {
        return [
            'overview' => $this->workflow->adminOverview(),
            'applications' => $this->workflow->listForAdmin(
                status: isset($request->query['status']) ? (string) $request->query['status'] : null,
                search: isset($request->query['search']) ? (string) $request->query['search'] : null,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function application(Request $request): array
    {
        return $this->workflow->adminDetail((int) $request->params['id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function action(Request $request): array
    {
        Validator::requireFields($request->body, ['action']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'application' => $this->workflow->adminAction(
                admin: $admin,
                applicationId: (int) $request->params['id'],
                action: (string) $request->body['action'],
                note: isset($request->body['note']) ? (string) $request->body['note'] : null,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function reviewCredential(Request $request): array
    {
        Validator::requireFields($request->body, ['status']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'credential' => $this->credentials->review(
                admin: $admin,
                credentialId: (int) $request->params['id'],
                status: CredentialReviewStatus::from((string) $request->body['status']),
                note: isset($request->body['note']) ? (string) $request->body['note'] : null,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function updatePayment(Request $request): array
    {
        Validator::requireFields($request->body, ['status']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'payment' => $this->payments->updateStatus(
                admin: $admin,
                paymentId: (int) $request->params['id'],
                status: PaymentStatus::from((string) $request->body['status']),
                note: isset($request->body['note']) ? (string) $request->body['note'] : null,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function auditLogs(): array
    {
        return [
            'audit_logs' => array_slice(array_reverse($this->store->all('audit_logs')), 0, 100),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function prelicensureApplicants(Request $request): array
    {
        return [
            'overview' => $this->prelicensureService()->overview(),
            'students' => $this->prelicensureService()->listForAdmin(
                search: isset($request->query['search']) ? (string) $request->query['search'] : null,
                status: isset($request->query['status']) ? (string) $request->query['status'] : null,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function convertPrelicensureApplicant(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'student' => $this->prelicensureService()->convertToLicensed(
                admin: $admin,
                profileId: (int) $request->params['id'],
                note: isset($request->body['note']) ? (string) $request->body['note'] : null,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function regulatoryBodies(): array
    {
        return [
            'regulatory_bodies' => $this->verifications()->regulatoryBodies(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function verificationCases(Request $request): array
    {
        return [
            'overview' => $this->verifications()->overview(),
            'verification_cases' => $this->verifications()->list(
                status: isset($request->query['status']) ? (string) $request->query['status'] : null,
                regulatoryBodyCode: isset($request->query['regulatory_body_code']) ? (string) $request->query['regulatory_body_code'] : null,
                profession: isset($request->query['profession']) ? (string) $request->query['profession'] : null,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createVerificationCase(Request $request): array
    {
        Validator::requireFields($request->body, ['application_id']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'verification' => $this->verifications()->createCase(
                admin: $admin,
                applicationId: (int) $request->body['application_id'],
                input: $request->body,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function verificationCase(Request $request): array
    {
        return $this->verifications()->detail((int) $request->params['id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function updateVerificationStatus(Request $request): array
    {
        Validator::requireFields($request->body, ['status']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'verification' => $this->verifications()->updateStatus(
                admin: $admin,
                caseId: (int) $request->params['id'],
                status: VerificationStatus::from((string) $request->body['status']),
                input: $request->body,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function interviews(Request $request): array
    {
        return [
            'overview' => $this->interviewService()->overview(),
            'interviews' => $this->interviewService()->list(
                status: isset($request->query['status']) ? (string) $request->query['status'] : null,
                interviewerId: isset($request->query['interviewer_id']) && $request->query['interviewer_id'] !== '' ? (int) $request->query['interviewer_id'] : null,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function scheduleInterview(Request $request): array
    {
        Validator::requireFields($request->body, ['application_id', 'scheduled_start_at', 'scheduled_end_at']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'interview' => $this->interviewService()->schedule(
                admin: $admin,
                applicationId: (int) $request->body['application_id'],
                input: $request->body,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function interview(Request $request): array
    {
        return $this->interviewService()->detail((int) $request->params['id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function completeInterview(Request $request): array
    {
        Validator::requireFields($request->body, ['recommendation']);
        InterviewRecommendation::from((string) $request->body['recommendation']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'interview' => $this->interviewService()->complete(
                admin: $admin,
                interviewId: (int) $request->params['id'],
                input: $request->body,
                ipAddress: $request->ipAddress,
                userAgent: $request->userAgent,
            ),
        ];
    }

    private function verifications(): VerificationService
    {
        if ($this->verifications === null) {
            throw new \LogicException('Verification service is not configured.');
        }

        return $this->verifications;
    }

    private function interviewService(): InterviewService
    {
        if ($this->interviews === null) {
            throw new \LogicException('Interview service is not configured.');
        }

        return $this->interviews;
    }

    private function prelicensureService(): StudentPrelicensureService
    {
        if ($this->prelicensure === null) {
            throw new \LogicException('Pre-licensure service is not configured.');
        }

        return $this->prelicensure;
    }
}
