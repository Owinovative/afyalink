<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Credentials\CredentialService;
use Afyalink\Core\Application\Payments\PaymentService;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
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
}
