<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Auth\AuthService;
use Afyalink\Core\Application\Facilities\CandidatePublicationService;
use Afyalink\Core\Application\Facilities\FacilityAccessService;
use Afyalink\Core\Application\Facilities\FacilityEngagementService;
use Afyalink\Core\Application\Facilities\FacilityService;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Support\Validator;

final readonly class FacilityController
{
    public function __construct(
        private AuthService $auth,
        private FacilityService $facilities,
        private FacilityAccessService $access,
        private CandidatePublicationService $publications,
        private FacilityEngagementService $engagements,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function register(Request $request): array
    {
        Validator::requireFields($request->body, ['name', 'email', 'phone', 'password']);
        Validator::email('email', $request->body['email']);

        $session = $this->auth->registerFacilityOwner(
            name: (string) $request->body['name'],
            email: (string) $request->body['email'],
            phone: (string) $request->body['phone'],
            password: (string) $request->body['password'],
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
        $facility = $this->facilities->upsertForUser($session['user'], $request->body, $request->ipAddress, $request->userAgent);

        return [
            'token' => $session['token'],
            'user' => $session['user']->toArray(),
            ...$facility,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;
        $base = $this->facilities->detailForFacilityUser($user);
        $facilityId = isset($base['facility']['id']) ? (int) $base['facility']['id'] : null;

        return [
            'user' => $user->toArray(),
            ...$base,
            'access' => $facilityId === null ? ['active' => false, 'active_subscription' => null, 'subscriptions' => []] : $this->access->accessSummary($facilityId),
            ...$this->engagements->facilityDashboard($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function saveProfile(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->facilities->upsertForUser($user, $request->body, $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function submit(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->facilities->submitForReview($user, $request->ipAddress, $request->userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function createAccessPayment(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'subscription' => $this->access->createPaymentIntent($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function candidates(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'candidates' => $this->publications->browseForFacility($user, $request->query),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function candidate(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return $this->publications->detailForFacility(
            viewer: $user,
            publicationId: (int) $request->params['id'],
            ipAddress: $request->ipAddress,
            userAgent: $request->userAgent,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function requestAppointment(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'request' => $this->engagements->submitAppointmentRequest($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function requestRecommendation(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'recommendation_request' => $this->engagements->submitRecommendationRequest($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function recommendationPackages(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;
        $facility = $this->facilities->requireApprovedFacilityForUser($user->id);

        return [
            'recommendation_packages' => $this->engagements->packagesForFacility((int) $facility['id']),
        ];
    }
}
