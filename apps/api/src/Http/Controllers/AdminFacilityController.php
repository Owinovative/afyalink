<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Facilities\CandidatePublicationService;
use Afyalink\Core\Application\Facilities\FacilityAccessService;
use Afyalink\Core\Application\Facilities\FacilityEngagementService;
use Afyalink\Core\Application\Facilities\FacilityService;
use Afyalink\Core\Domain\Enums\CandidatePublicationStatus;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Support\Validator;

final readonly class AdminFacilityController
{
    public function __construct(
        private FacilityService $facilities,
        private FacilityAccessService $access,
        private CandidatePublicationService $publications,
        private FacilityEngagementService $engagements,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        return [
            'facilities' => $this->facilities->overview(),
            'access' => $this->access->overview(),
            'publications' => $this->publications->overview(),
            'engagements' => $this->engagements->overview(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function facilities(Request $request): array
    {
        return [
            'overview' => $this->facilities->overview(),
            'facilities' => $this->facilities->listForAdmin(
                status: isset($request->query['status']) ? (string) $request->query['status'] : null,
                search: isset($request->query['search']) ? (string) $request->query['search'] : null,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function facility(Request $request): array
    {
        $facilityId = (int) $request->params['id'];

        return [
            ...$this->facilities->adminDetail($facilityId),
            'access' => $this->access->accessSummary($facilityId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function reviewFacility(Request $request): array
    {
        Validator::requireFields($request->body, ['action']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->facilities->review(
            admin: $admin,
            facilityId: (int) $request->params['id'],
            action: (string) $request->body['action'],
            note: isset($request->body['note']) ? (string) $request->body['note'] : null,
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function updateSubscription(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->access->adminUpdate($admin, (int) $request->params['id'], $request->body, $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function publications(Request $request): array
    {
        return [
            'overview' => $this->publications->overview(),
            'publications' => $this->publications->listForAdmin(
                status: isset($request->query['status']) ? (string) $request->query['status'] : null,
                search: isset($request->query['search']) ? (string) $request->query['search'] : null,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function publishCandidate(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->publications->publish($admin, $request->body, $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function updatePublication(Request $request): array
    {
        Validator::requireFields($request->body, ['status']);
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->publications->updateStatus(
            admin: $admin,
            publicationId: (int) $request->params['id'],
            status: CandidatePublicationStatus::from((string) $request->body['status']),
            note: isset($request->body['note']) ? (string) $request->body['note'] : null,
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function facilityRequests(Request $request): array
    {
        return [
            'overview' => $this->engagements->overview(),
            'requests' => $this->engagements->listFacilityRequests(isset($request->query['status']) ? (string) $request->query['status'] : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function updateFacilityRequest(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'request' => $this->engagements->updateFacilityRequest($admin, (int) $request->params['id'], $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function scheduleAppointment(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->engagements->scheduleAppointment($admin, (int) $request->params['id'], $request->body, $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function recommendationRequests(Request $request): array
    {
        return [
            'overview' => $this->engagements->overview(),
            'recommendation_requests' => $this->engagements->listRecommendationRequests(isset($request->query['status']) ? (string) $request->query['status'] : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function updateRecommendationRequest(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'recommendation_request' => $this->engagements->updateRecommendationRequest($admin, (int) $request->params['id'], $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function recommendationPackages(Request $request): array
    {
        return [
            'recommendation_packages' => $this->engagements->listPackagesForAdmin(isset($request->query['status']) ? (string) $request->query['status'] : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createRecommendationPackage(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'recommendation_package' => $this->engagements->createPackage($admin, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function updateRecommendationPackage(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'recommendation_package' => $this->engagements->updatePackage($admin, (int) $request->params['id'], $request->body, $request->ipAddress, $request->userAgent),
        ];
    }
}
