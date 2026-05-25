<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Placements\PlacementService;
use Afyalink\Core\Http\Request;

final readonly class PlacementController
{
    public function __construct(
        private PlacementService $placements,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function savePreferences(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'preferences' => $this->placements->savePlacementPreferences($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function professionalPlacementDashboard(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->placements->professionalPlacementDashboard($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function professionalOpportunities(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'opportunities' => $this->placements->professionalOpportunities($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function professionalOpportunity(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->placements->professionalOpportunity($user, (int) $request->params['id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function facilityRequisitions(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'requisitions' => $this->placements->facilityRequisitions($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createFacilityRequisition(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'requisition' => $this->placements->createFacilityRequisition(
                $user,
                $request->body,
                filter_var($request->body['submit'] ?? false, FILTER_VALIDATE_BOOL),
                $request->ipAddress,
                $request->userAgent,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function facilityRequisition(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->placements->facilityRequisitionDetail($user, (int) $request->params['id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function facilityShortlists(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'shortlists' => $this->placements->facilityShortlists($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function facilityPlacements(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'placements' => $this->placements->facilityPlacements($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function requestFacilityInterview(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'facility_interview_request' => $this->placements->requestFacilityInterview($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function inviteFacilityMember(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'invitation' => $this->placements->inviteFacilityMember($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminRequisitions(Request $request): array
    {
        return [
            'requisitions' => $this->placements->adminRequisitions(isset($request->query['status']) ? (string) $request->query['status'] : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminRequisition(Request $request): array
    {
        return $this->placements->adminRequisitionDetail((int) $request->params['id']);
    }

    /**
     * @return array<string, mixed>
     */
    public function updateRequisition(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->placements->updateRequisition($admin, (int) $request->params['id'], $request->body, $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function runMatching(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'matching' => $this->placements->runMatching($admin, (int) $request->params['id'], $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function draftAiRationale(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->placements->draftAiRationale($admin, (int) $request->params['id'], $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function createShortlist(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'shortlist' => $this->placements->createShortlist($admin, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminPlacements(Request $request): array
    {
        return [
            'placements' => $this->placements->adminPlacements(isset($request->query['status']) ? (string) $request->query['status'] : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createPlacement(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return [
            'placement' => $this->placements->createPlacement($admin, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function updatePlacement(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->placements->updatePlacement($admin, (int) $request->params['id'], $request->body, 'admin', $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function adminThreads(): array
    {
        return [
            'threads' => $this->placements->adminThreads(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createThread(Request $request): array
    {
        /** @var AuthenticatedUser $admin */
        $admin = $request->user;

        return $this->placements->createCommunicationThread($admin, $request->body, $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function integrations(): array
    {
        return $this->placements->integrationReadiness();
    }

    /**
     * @return array<string, mixed>
     */
    public function security(): array
    {
        return $this->placements->securityReadiness();
    }
}
