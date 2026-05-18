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
}
