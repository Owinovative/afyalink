<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Notifications\NotificationDeliveryService;
use Afyalink\Core\Application\Operations\OperationsDashboardService;
use Afyalink\Core\Application\Operations\ReportingService;
use Afyalink\Core\Application\Payments\MpesaPaymentService;
use Afyalink\Core\Application\Privacy\PrivacyRequestService;
use Afyalink\Core\Http\Request;

final readonly class OperationsController
{
    public function __construct(
        private OperationsDashboardService $operations,
        private ReportingService $reports,
        private NotificationDeliveryService $notifications,
        private PrivacyRequestService $privacy,
        private MpesaPaymentService $mpesa,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function dashboard(): array
    {
        return [
            'operations' => $this->operations->commandCenter(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function reports(): array
    {
        return [
            'reports' => $this->reports->summaries(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function notifications(): array
    {
        return [
            'overview' => $this->notifications->overview(),
            'failed' => $this->notifications->failed(),
            'recent' => $this->notifications->recent(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function processNotifications(Request $request): array
    {
        $limit = isset($request->body['limit']) ? max(1, min(100, (int) $request->body['limit'])) : 25;

        return [
            'delivery' => $this->notifications->processPending($limit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function paymentCallback(Request $request): array
    {
        return [
            'mpesa' => $this->mpesa->handleCallback($request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function submitPrivacyRequest(Request $request): array
    {
        return [
            'privacy_request' => $this->privacy->submit($request->user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function privacyRequests(Request $request): array
    {
        return [
            'privacy_requests' => $this->privacy->list(isset($request->query['status']) ? (string) $request->query['status'] : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function updatePrivacyRequest(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'privacy_request' => $this->privacy->update($admin, (int) $request->params['id'], $request->body, $request->ipAddress, $request->userAgent),
        ];
    }
}
