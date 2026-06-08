<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Notifications;

use Afyalink\Core\Infrastructure\Persistence\DataStore;

final readonly class NotificationService
{
    public function __construct(
        private DataStore $store,
    ) {}

    /**
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    public function queueEmail(
        ?int $recipientUserId,
        string $recipientEmail,
        string $type,
        string $subject,
        string $body,
        ?string $actionUrl = null,
        array $metadata = [],
    ): array {
        return $this->store->insert('notification_outbox', [
            'recipient_user_id' => $recipientUserId,
            'recipient_email' => strtolower(trim($recipientEmail)),
            'channel' => 'email',
            'type' => $type,
            'subject' => trim($subject),
            'body' => trim($body),
            'action_url' => $actionUrl,
            'status' => 'queued',
            'metadata' => $metadata,
            'created_at' => gmdate(DATE_ATOM),
            'sent_at' => null,
        ]);
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function emailVerification(array $user, string $verificationUrl, string $expiresAt): array
    {
        return $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'email_verification',
            subject: 'Verify your Afyalink email address',
            body: 'Use the secure verification link to confirm your email before submitting your Afyalink application.',
            actionUrl: $verificationUrl,
            metadata: ['expires_at' => $expiresAt],
        );
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function passwordReset(array $user, string $resetUrl, string $expiresAt): array
    {
        return $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'password_reset',
            subject: 'Reset your Afyalink password',
            body: 'Use the secure reset link to set a new password. Ignore this message if you did not request it.',
            actionUrl: $resetUrl,
            metadata: ['expires_at' => $expiresAt],
        );
    }

    /**
     * @param array<string, mixed> $user
     * @param array<string, mixed> $application
     */
    public function applicationSubmitted(array $user, array $application): void
    {
        $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'application_submitted',
            subject: 'Afyalink application submitted',
            body: 'Your Afyalink credential intake application has been submitted for review.',
            actionUrl: null,
            metadata: [
                'application_number' => $application['application_number'] ?? null,
                'status' => $application['status'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $user
     * @param array<string, mixed> $credential
     */
    public function credentialReplacementRequested(array $user, array $credential, ?string $note): void
    {
        $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'credential_replacement_requested',
            subject: 'Afyalink document replacement requested',
            body: 'An Afyalink reviewer requested a replacement credential document. Check your dashboard for the document type and note.',
            actionUrl: null,
            metadata: [
                'credential_id' => $credential['id'] ?? null,
                'document_type' => $credential['document_type'] ?? null,
                'review_note' => $note,
            ],
        );
    }

    /**
     * @param array<string, mixed> $user
     * @param array<string, mixed> $verificationCase
     */
    public function verificationStatusChanged(array $user, array $verificationCase, string $status): void
    {
        $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'verification_status_changed',
            subject: 'Afyalink verification status updated',
            body: 'Your Afyalink regulatory verification status has been updated. Sign in to view the current application progress.',
            actionUrl: null,
            metadata: [
                'verification_case_id' => $verificationCase['id'] ?? null,
                'regulatory_body_code' => $verificationCase['regulatory_body_code'] ?? null,
                'status' => $status,
            ],
        );
    }

    /**
     * @param array<string, mixed> $user
     * @param array<string, mixed> $interview
     */
    public function interviewScheduled(array $user, array $interview): void
    {
        $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'interview_scheduled',
            subject: 'Afyalink interview scheduled',
            body: 'Your Afyalink interview has been scheduled. Sign in to view the date, time, mode, and location.',
            actionUrl: null,
            metadata: [
                'interview_id' => $interview['id'] ?? null,
                'scheduled_start_at' => $interview['scheduled_start_at'] ?? null,
                'mode' => $interview['mode'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $user
     * @param array<string, mixed> $interview
     */
    public function interviewCompleted(array $user, array $interview, string $recommendation): void
    {
        $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'interview_completed',
            subject: 'Afyalink interview review completed',
            body: 'Your Afyalink interview review has been completed. Sign in to view the current application progress.',
            actionUrl: null,
            metadata: [
                'interview_id' => $interview['id'] ?? null,
                'status' => $interview['status'] ?? null,
                'recommendation' => $recommendation,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     */
    public function facilityOnboardingSubmitted(array $facility): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_onboarding_submitted',
            subject: 'Afyalink facility onboarding submitted',
            body: 'Your facility onboarding details have been submitted for Afyalink review.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'review_status' => $facility['review_status'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     */
    public function facilityReviewDecision(array $facility, string $status, ?string $note): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_review_decision',
            subject: 'Afyalink facility review updated',
            body: 'Your facility onboarding review status has changed. Sign in to view the current status and next step.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'review_status' => $status,
                'note' => $note,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $subscription
     */
    public function facilitySubscriptionStatusChanged(array $facility, array $subscription): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_subscription_status_changed',
            subject: 'Afyalink facility access updated',
            body: 'Your Afyalink facility access status has been updated.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'subscription_id' => $subscription['id'] ?? null,
                'status' => $subscription['status'] ?? null,
                'ends_at' => $subscription['ends_at'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $application
     * @param array<string, mixed> $publication
     */
    public function candidatePublicationStatusChanged(array $application, array $publication): void
    {
        $user = $this->store->find('users', (int) ($application['user_id'] ?? 0));
        if ($user === null) {
            return;
        }

        $this->queueEmail(
            recipientUserId: (int) $user['id'],
            recipientEmail: (string) $user['email'],
            type: 'candidate_publication_status_changed',
            subject: 'Afyalink facility catalogue visibility updated',
            body: 'Your Afyalink facility catalogue visibility has been updated. Sign in to view the current status.',
            metadata: [
                'application_id' => $application['id'] ?? null,
                'publication_id' => $publication['id'] ?? null,
                'status' => $publication['status'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $request
     */
    public function facilityAppointmentCreated(array $facility, array $request): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_appointment_created',
            subject: 'Afyalink facility request received',
            body: 'Your Afyalink facility request has been received for review.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'request_id' => $request['id'] ?? null,
                'request_type' => $request['request_type'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $appointment
     */
    public function facilityAppointmentScheduled(array $facility, array $appointment): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_appointment_scheduled',
            subject: 'Afyalink facility appointment scheduled',
            body: 'Your Afyalink facility appointment has been scheduled.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'appointment_id' => $appointment['id'] ?? null,
                'scheduled_start_at' => $appointment['scheduled_start_at'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $package
     */
    public function recommendationPackageShared(array $facility, array $package): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'recommendation_package_shared',
            subject: 'Afyalink recommendation package shared',
            body: 'Afyalink has shared a recommendation package for your facility request.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'recommendation_package_id' => $package['id'] ?? null,
                'status' => $package['status'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $requisition
     */
    public function facilityRequisitionSubmitted(array $facility, array $requisition): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_requisition_submitted',
            subject: 'Afyalink staffing requisition received',
            body: 'Your staffing requisition has been submitted to Afyalink operations.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'requisition_id' => $requisition['id'] ?? null,
                'requisition_title' => $requisition['title'] ?? null,
                'profession_required' => $requisition['profession_required'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $requisition
     */
    public function facilityRequisitionUnderReview(array $facility, array $requisition): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_requisition_under_review',
            subject: 'Afyalink requisition under review',
            body: 'Afyalink has started reviewing your staffing requisition.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'requisition_id' => $requisition['id'] ?? null,
                'status' => $requisition['status'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $shortlist
     * @param array<string, mixed> $requisition
     */
    public function shortlistShared(array $facility, array $shortlist, array $requisition): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'shortlist_shared',
            subject: 'Afyalink shortlist shared',
            body: 'A reviewed Afyalink shortlist is available in your facility portal.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'shortlist_id' => $shortlist['id'] ?? null,
                'shortlist_title' => $shortlist['title'] ?? null,
                'requisition_id' => $requisition['id'] ?? null,
                'requisition_title' => $requisition['title'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $request
     */
    public function facilityInterviewRequested(array $facility, array $request): void
    {
        $this->queueEmail(
            recipientUserId: isset($facility['created_by']) && $facility['created_by'] !== null ? (int) $facility['created_by'] : null,
            recipientEmail: (string) $facility['email'],
            type: 'facility_interview_requested',
            subject: 'Afyalink interview request received',
            body: 'Your facility interview request has been received for admin coordination.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'facility_interview_request_id' => $request['id'] ?? null,
                'requisition_id' => $request['requisition_id'] ?? null,
                'mode' => $request['mode'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $facility
     * @param array<string, mixed> $invitation
     */
    public function facilityTeamInvitation(string $email, array $facility, array $invitation): void
    {
        $this->queueEmail(
            recipientUserId: null,
            recipientEmail: $email,
            type: 'facility_team_invitation',
            subject: 'You were invited to an Afyalink facility team',
            body: 'A facility administrator invited you to collaborate in Afyalink. Sign in or create an account with this email to continue.',
            metadata: [
                'facility_id' => $facility['id'] ?? null,
                'role' => $invitation['role'] ?? null,
                'expires_at' => $invitation['expires_at'] ?? null,
            ],
        );
    }

    /**
     * @param array<string, mixed> $requisition
     */
    public function matchingRunCompleted(string $adminEmail, int $adminUserId, array $requisition, int $generatedCount): void
    {
        $this->queueEmail(
            recipientUserId: $adminUserId,
            recipientEmail: $adminEmail,
            type: 'matching_run_completed',
            subject: 'Afyalink matching run completed',
            body: 'A requisition matching run has completed and is ready for admin review.',
            metadata: [
                'requisition_id' => $requisition['id'] ?? null,
                'requisition_title' => $requisition['title'] ?? null,
                'generated_count' => $generatedCount,
            ],
        );
    }

    /**
     * @param string $phone
     * @param string $message
     */
    public function dispatchSms(string $phone, string $message): void
    {
        // Dummy SMS dispatch logic for Micro-Insurance
        // In a real system, this would integrate with Africa's Talking or Twilio
        $this->store->insert('notification_outbox', [
            'recipient_user_id' => null,
            'recipient_email' => $phone, // Storing phone in email column for dummy schema compatibility
            'channel' => 'sms',
            'type' => 'micro_insurance_underwritten',
            'subject' => 'Micro-Insurance Details',
            'body' => trim($message),
            'action_url' => null,
            'status' => 'queued',
            'metadata' => ['phone' => $phone],
            'created_at' => gmdate(DATE_ATOM),
            'sent_at' => null,
        ]);
    }
}
