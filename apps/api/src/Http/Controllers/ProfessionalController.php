<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Facilities\CandidatePublicationService;
use Afyalink\Core\Application\Interviews\InterviewService;
use Afyalink\Core\Application\Professionals\ProfessionalProfileService;
use Afyalink\Core\Application\Verification\VerificationService;
use Afyalink\Core\Http\Request;

final readonly class ProfessionalController
{
    public function __construct(
        private ProfessionalProfileService $profiles,
        private ApplicationWorkflowService $workflow,
        private ?VerificationService $verifications = null,
        private ?InterviewService $interviews = null,
        private ?CandidatePublicationService $publications = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function saveProfile(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        return [
            'profile' => $this->profiles->upsert($user, $request->body, $request->ipAddress, $request->userAgent),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(Request $request): array
    {
        /** @var AuthenticatedUser $user */
        $user = $request->user;

        $dashboard = $this->workflow->dashboard($user);
        $dashboard['verification_cases'] = $this->verifications?->professionalCases($user->id) ?? [];
        $dashboard['interviews'] = $this->interviews?->professionalInterviews($user->id) ?? [];
        $dashboard['facility_visibility'] = $this->publications?->professionalVisibility($user->id) ?? [
            'published' => false,
            'status' => null,
            'candidate_code' => null,
            'view_count' => 0,
        ];

        return $dashboard;
    }
}
