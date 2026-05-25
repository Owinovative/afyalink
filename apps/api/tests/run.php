<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Domain\Applications\ApplicationStateMachine;
use Afyalink\Core\Domain\Applications\AdminReviewService;
use Afyalink\Core\Domain\Applications\ApplicationSubmissionService;
use Afyalink\Core\Domain\Applications\SubmissionReadinessChecker;
use Afyalink\Core\Domain\Audit\AuditEventFactory;
use Afyalink\Core\Domain\Consent\ConsentPolicy;
use Afyalink\Core\Domain\Consent\ConsentSnapshot;
use Afyalink\Core\Domain\Credentials\CredentialRecord;
use Afyalink\Core\Domain\Credentials\CredentialRequirementRegistry;
use Afyalink\Core\Domain\Documents\PrivateDocumentUrlFactory;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\CandidatePublicationStatus;
use Afyalink\Core\Domain\Enums\DocumentType;
use Afyalink\Core\Domain\Enums\FacilityAccessStatus;
use Afyalink\Core\Domain\Enums\FacilityRequestStatus;
use Afyalink\Core\Domain\Enums\FacilityReviewStatus;
use Afyalink\Core\Domain\Enums\InterviewRecommendation;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Enums\RecommendationPackageStatus;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Enums\VerificationStatus;
use Afyalink\Core\Domain\Payments\PaymentStateMachine;
use Afyalink\Core\Domain\Payments\PaymentIntentFactory;
use Afyalink\Core\Domain\Permissions\Permission;
use Afyalink\Core\Domain\Permissions\RolePermissionMatrix;
use Afyalink\Core\Domain\Profiles\ProfessionalProfile;
use Afyalink\Core\Domain\Regulatory\RegulatoryBodyRegistry;
use Afyalink\Core\Domain\Security\FileUploadPolicy;
use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\AI\LocalRecommendationAssistant;
use Afyalink\Core\Application\Consent\ConsentService;
use Afyalink\Core\Application\Facilities\CandidatePublicationService;
use Afyalink\Core\Application\Facilities\FacilityAccessService;
use Afyalink\Core\Application\Facilities\FacilityService;
use Afyalink\Core\Application\Integrations\FhirMappingService;
use Afyalink\Core\Application\Notifications\NotificationDeliveryService;
use Afyalink\Core\Application\Placements\PlacementService;
use Afyalink\Core\Application\Payments\MpesaPaymentService;
use Afyalink\Core\Application\Privacy\PrivacyRequestService;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Infrastructure\Notifications\EmailProvider;
use Afyalink\Core\Infrastructure\Notifications\LogEmailProvider;
use Afyalink\Core\Http\ApiKernel;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Http\JsonResponse;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;
use Afyalink\Core\Infrastructure\Persistence\PdoPostgresDataStore;
use Afyalink\Core\Infrastructure\Storage\LocalPrivateCredentialStorage;
use Afyalink\Core\Infrastructure\Storage\S3CompatibleCredentialStorage;

function expectTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function expectFalse(bool $condition, string $message): void
{
    expectTrue(!$condition, $message);
}

$tests = [
    'application state machine blocks unsafe jumps' => function (): void {
        $machine = new ApplicationStateMachine();
        expectTrue($machine->canTransition(ApplicationStatus::Draft, ApplicationStatus::Submitted), 'draft should submit');
        expectFalse($machine->canTransition(ApplicationStatus::Draft, ApplicationStatus::Approved), 'draft cannot approve directly');
        expectFalse($machine->canTransition(ApplicationStatus::Approved, ApplicationStatus::UnderReview), 'approved is terminal');
    },
    'payment state machine prevents duplicate confirmation abuse' => function (): void {
        $machine = new PaymentStateMachine();
        expectTrue($machine->canTransition(PaymentStatus::AwaitingProvider, PaymentStatus::Confirmed), 'awaiting provider can confirm');
        expectFalse($machine->canTransition(PaymentStatus::Confirmed, PaymentStatus::Confirmed), 'confirmed cannot confirm again');
        expectTrue($machine->canTransition(PaymentStatus::Failed, PaymentStatus::Initiated), 'failed can be retried');
    },
    'submission readiness allows uploaded credentials for submission intake' => function (): void {
        $checker = new SubmissionReadinessChecker(new CredentialRequirementRegistry());
        $profile = [
            'name' => 'Grace Achieng',
            'email' => 'grace@example.com',
            'phone' => '0712345678',
            'profession' => 'Nurse',
            'regulatory_body' => 'Nursing Council of Kenya',
            'license_number' => 'NCK-123',
            'county' => 'Kisumu',
        ];
        $credentials = [
            DocumentType::CurriculumVitae->value => CredentialReviewStatus::Uploaded,
            DocumentType::NationalIdOrPassport->value => CredentialReviewStatus::PendingReview,
            DocumentType::ProfessionalLicense->value => CredentialReviewStatus::Accepted,
            DocumentType::AcademicCertificate->value => CredentialReviewStatus::Uploaded,
        ];
        $ready = $checker->evaluate($profile, $credentials, true, true, PaymentStatus::Confirmed);
        expectTrue($ready->ready, 'complete intake package should be ready before admin review');

        $notReady = $checker->evaluate($profile, [], false, true, PaymentStatus::Confirmed);
        expectFalse($notReady->ready, 'missing credentials should block submission');
        expectTrue(in_array('credential.cv', $notReady->missing, true), 'cv should be required');
        expectTrue(in_array('account.email_verified', $notReady->missing, true), 'email verification should be required');
    },
    'student waiting-license readiness stays out of licensed submission pipeline' => function (): void {
        $checker = new SubmissionReadinessChecker(new CredentialRequirementRegistry());
        $profile = [
            'applicant_track' => ApplicantTrack::StudentAwaitingLicense->value,
            'name' => 'Student Nurse',
            'email' => 'student@example.com',
            'phone' => '0700000100',
            'target_profession' => 'Registered Nurse',
            'student_status' => 'completed_training_waiting_license',
            'institution_name' => 'Afya Training College',
            'programme_or_course' => 'Diploma in Nursing',
            'county' => 'Nairobi',
        ];
        $credentials = [
            DocumentType::CurriculumVitae->value => CredentialReviewStatus::Uploaded,
            DocumentType::NationalIdOrPassport->value => CredentialReviewStatus::Uploaded,
            DocumentType::StudentIdOrTrainingProof->value => CredentialReviewStatus::Uploaded,
            DocumentType::TranscriptOrCompletionEvidence->value => CredentialReviewStatus::Uploaded,
        ];

        $ready = $checker->evaluate($profile, $credentials, true, true, PaymentStatus::Confirmed);
        expectFalse($ready->ready, 'waiting-license applicants must not become full application ready');
        expectTrue(in_array('track.licensed_professional_conversion_required', $ready->missing, true), 'conversion should be required');
        expectFalse(in_array('credential.professional_license', $ready->missing, true), 'student preliminary readiness should not require professional license');
    },
    'professional can submit complete milestone 1 package' => function (): void {
        $profile = new ProfessionalProfile(
            name: 'Grace Achieng',
            email: 'grace@example.com',
            phone: '0712345678',
            profession: 'Nurse',
            regulatoryBody: 'Nursing Council of Kenya',
            licenseNumber: 'NCK-123',
            county: 'Kisumu',
            yearsExperience: 4.5,
        );
        $credentials = [
            new CredentialRecord(DocumentType::CurriculumVitae, 'professionals/1/cv.pdf', str_repeat('a', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
            new CredentialRecord(DocumentType::NationalIdOrPassport, 'professionals/1/id.pdf', str_repeat('b', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
            new CredentialRecord(DocumentType::ProfessionalLicense, 'professionals/1/license.pdf', str_repeat('c', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
            new CredentialRecord(DocumentType::AcademicCertificate, 'professionals/1/cert.pdf', str_repeat('d', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
        ];

        $application = (new ApplicationSubmissionService())->submit(
            profile: $profile,
            credentials: $credentials,
            emailVerified: true,
            acceptedCurrentConsent: true,
            paymentStatus: PaymentStatus::Confirmed,
            actorId: 1,
        );

        expectTrue($application->status === ApplicationStatus::Submitted, 'application should submit');
        expectTrue(count($application->timeline) === 1, 'submission should add timeline event');
        expectTrue(str_starts_with($application->applicationNumber, 'AFYA-'), 'application number should be generated');
    },
    'admin review flow reaches approval only through safe transitions' => function (): void {
        $profile = new ProfessionalProfile('John Mwangi', 'john@example.com', '0700000000', 'Clinical Officer', 'Clinical Officers Council', 'COC-99', 'Nairobi', 7);
        $credentials = [
            new CredentialRecord(DocumentType::CurriculumVitae, 'p/2/cv.pdf', str_repeat('a', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
            new CredentialRecord(DocumentType::NationalIdOrPassport, 'p/2/id.pdf', str_repeat('b', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
            new CredentialRecord(DocumentType::ProfessionalLicense, 'p/2/license.pdf', str_repeat('c', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
            new CredentialRecord(DocumentType::AcademicCertificate, 'p/2/cert.pdf', str_repeat('d', 64), 'application/pdf', 2048, CredentialReviewStatus::Accepted),
        ];
        $application = (new ApplicationSubmissionService())->submit($profile, $credentials, true, true, PaymentStatus::Confirmed, 10);
        $review = new AdminReviewService();
        $reviewing = $review->moveToReview($application, 99);
        $verified = $review->verify($reviewing, 'License checked against source evidence.', 99);
        $approved = $review->approve($verified, 'Professional cleared for Afyalink verified pool.', 1);

        expectTrue($approved->status === ApplicationStatus::Approved, 'application should be approved');
        expectTrue(count($approved->timeline) === 4, 'approval path should be fully traceable');
    },
    'file upload policy rejects public storage paths' => function (): void {
        $policy = new FileUploadPolicy();
        $policy->assertAllowed('application/pdf', 1024, 'professionals/1/license.pdf');

        try {
            $policy->assertAllowed('application/pdf', 1024, 'public/professionals/1/license.pdf');
            throw new RuntimeException('public path was not rejected');
        } catch (InvalidArgumentException) {
            expectTrue(true, 'public path rejected');
        }
    },
    'audit factory redacts secrets' => function (): void {
        $event = (new AuditEventFactory())->create(
            actorId: 1,
            action: 'payment.callback.received',
            entityType: 'Payment',
            entityId: '42',
            metadata: [
                'mpesa_receipt' => 'ABC123',
                'consumer_secret' => 'should-not-leak',
                'nested' => ['password' => 'hidden'],
            ],
            ipAddress: '127.0.0.1',
            userAgent: 'test',
        );
        $payload = $event->toArray();
        expectTrue($payload['metadata']['consumer_secret'] === '[REDACTED]', 'consumer secret redacted');
        expectTrue($payload['metadata']['nested']['password'] === '[REDACTED]', 'nested password redacted');
    },
    'role matrix blocks facility raw document access' => function (): void {
        $matrix = new RolePermissionMatrix();
        expectTrue($matrix->allows(UserRole::VerificationOfficer, Permission::CredentialRawView), 'verification officer can review raw credential');
        expectFalse($matrix->allows(UserRole::FacilityViewer, Permission::CredentialRawView), 'facility viewer cannot see raw credential');
        expectTrue($matrix->allows(UserRole::SuperAdmin, Permission::SystemManage), 'super admin can manage system');
    },
    'private document URLs are signed and expiring' => function (): void {
        $factory = new PrivateDocumentUrlFactory(str_repeat('s', 40));
        $expires = (new DateTimeImmutable())->modify('+15 minutes');
        $url = $factory->signedViewUrl('professionals/1/license.pdf', 7, $expires);
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        expectTrue(isset($query['signature']), 'signed URL should include signature');
        expectTrue($factory->verify((string) $query['key'], 7, (int) $query['expires'], (string) $query['signature']), 'signed URL should verify');
        expectFalse($factory->verify((string) $query['key'], 8, (int) $query['expires'], (string) $query['signature']), 'different viewer should fail');
    },
    'payment intent factory is deterministic by idempotency key' => function (): void {
        $factory = new PaymentIntentFactory();
        $first = $factory->create(10, 150000, 'KES', 'mpesa', 'same-request-key');
        $second = $factory->create(10, 150000, 'KES', 'mpesa', 'same-request-key');
        $third = $factory->create(10, 150000, 'KES', 'mpesa', 'different-request-key');

        expectTrue($first->intentReference === $second->intentReference, 'same idempotency key should create same reference');
        expectFalse($first->intentReference === $third->intentReference, 'different idempotency key should create different reference');
    },
    'regulatory registry maps priority professions' => function (): void {
        $registry = new RegulatoryBodyRegistry();
        expectTrue($registry->findByProfession('Registered Nurse')?->code === 'NCK', 'nurse should map to NCK');
        expectTrue($registry->findByProfession('Clinical Officer')?->code === 'COC', 'clinical officer should map to COC');
        expectTrue($registry->findByProfession('Pharmacist')?->code === 'PPB', 'pharmacist should map to PPB');
    },
    'consent policy validates exact current wording' => function (): void {
        $text = 'I consent to credential verification and controlled processing.';
        $snapshot = new ConsentSnapshot(
            type: 'credential_verification',
            version: 'v1',
            textHash: hash('sha256', $text),
            acceptedAt: new DateTimeImmutable(),
            ipAddress: '127.0.0.1',
            userAgent: 'test',
        );
        expectTrue((new ConsentPolicy())->isCurrent($snapshot, 'v1', $text), 'current consent should validate');
        expectFalse((new ConsentPolicy())->isCurrent($snapshot, 'v2', $text), 'old version should fail');
    },
    'api milestone 1 professional to admin review flow is executable' => function (): void {
        $root = sys_get_temp_dir() . '/afyalink-test-' . bin2hex(random_bytes(4));
        mkdir($root . '/storage/private/credentials', 0770, true);
        $store = new JsonDataStore($root . '/storage/runtime/database.json');
        $kernel = new ApiKernel(
            $store,
            new LocalPrivateCredentialStorage($root . '/storage/private/credentials'),
        );

        $api = static function (string $method, string $path, array $body = [], ?string $token = null, array $query = []) use ($kernel): JsonResponse {
            $headers = $token === null ? [] : ['authorization' => "Bearer {$token}"];

            return $kernel->handle(new Request($method, $path, $headers, $body, $query, ipAddress: '127.0.0.1', userAgent: 'test-suite'));
        };

        $registered = $api('POST', '/api/auth/register', [
            'name' => 'Milestone Nurse',
            'email' => 'milestone.nurse@example.com',
            'phone' => '0711111111',
            'password' => 'StrongPass123',
        ]);
        expectTrue($registered->status === 200, 'professional registration should succeed');
        $token = (string) $registered->payload['data']['token'];
        expectTrue($registered->payload['data']['email_verification']['notification_queued'] === true, 'registration should queue verification notification');

        $verificationNotice = $store->where('notification_outbox', static fn (array $row): bool => ($row['type'] ?? '') === 'email_verification')[0] ?? null;
        expectTrue($verificationNotice !== null, 'verification notification should be stored');
        parse_str((string) parse_url((string) $verificationNotice['action_url'], PHP_URL_QUERY), $verificationQuery);

        $profile = $api('PUT', '/api/professional/profile', [
            'name' => 'Milestone Nurse',
            'phone' => '0711111111',
            'profession' => 'Registered Nurse',
            'regulatory_body' => 'Nursing Council of Kenya',
            'license_number' => 'NCK-M1-001',
            'county' => 'Kisumu',
            'years_experience' => 5,
            'availability' => 'available',
            'placement_type' => 'locum',
        ], $token);
        expectTrue($profile->status === 200, 'profile update should succeed');

        foreach ([
            DocumentType::CurriculumVitae,
            DocumentType::NationalIdOrPassport,
            DocumentType::ProfessionalLicense,
            DocumentType::AcademicCertificate,
        ] as $type) {
            $upload = $api('POST', '/api/professional/credentials', [
                'document_type' => $type->value,
                'original_name' => $type->value . '.pdf',
                'mime_type' => 'application/pdf',
                'content_base64' => base64_encode('%PDF-1.4 milestone-test'),
            ], $token);
            expectTrue($upload->status === 200, "credential {$type->value} should upload");
        }

        $consent = $api('POST', '/api/professional/consents', [], $token);
        expectTrue($consent->status === 200, 'consent should be accepted');

        $payment = $api('POST', '/api/professional/payments', [
            'method' => 'mpesa_manual_reference',
            'idempotency_key' => 'test-payment-1',
            'amount_cents' => 250000,
            'external_reference' => 'MPESA-TEST-001',
        ], $token);
        expectTrue($payment->status === 200, 'payment intent should be created');
        $paymentId = (int) $payment->payload['data']['payment']['id'];

        $blockedSubmit = $api('POST', '/api/professional/application/submit', [], $token);
        expectTrue($blockedSubmit->status === 409, 'submission should wait for confirmed payment');

        $kernel->auth()->createUser('Afyalink Admin', 'admin@example.com', '0799999999', 'AdminPass123', [UserRole::Admin]);
        $adminLogin = $api('POST', '/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'AdminPass123',
        ]);
        expectTrue($adminLogin->status === 200, 'admin login should succeed');
        $adminToken = (string) $adminLogin->payload['data']['token'];

        $professionalDenied = $api('GET', '/api/admin/applications', [], $token);
        expectTrue($professionalDenied->status === 403, 'professional must not access admin applications');
        $adminProfessionalDenied = $api('GET', '/api/professional/dashboard', [], $adminToken);
        expectTrue($adminProfessionalDenied->status === 403, 'admin token must not access professional dashboard routes');

        $pending = $api('PATCH', "/api/admin/payments/{$paymentId}/status", [
            'status' => PaymentStatus::PendingVerification->value,
            'note' => 'Reference received.',
        ], $adminToken);
        expectTrue($pending->status === 200, 'admin should move payment to pending verification');

        $confirmed = $api('PATCH', "/api/admin/payments/{$paymentId}/status", [
            'status' => PaymentStatus::Confirmed->value,
            'note' => 'Manual reference confirmed.',
        ], $adminToken);
        expectTrue($confirmed->status === 200, 'admin should confirm payment');

        $unverifiedSubmit = $api('POST', '/api/professional/application/submit', [], $token);
        expectTrue($unverifiedSubmit->status === 409, 'submission should wait for verified email');

        $verify = $api('POST', '/api/auth/email/verify', ['token' => (string) $verificationQuery['token']], token: '');
        expectTrue($verify->status === 200 && $verify->payload['data']['email_verified'] === true, 'email verification should succeed');

        $submitted = $api('POST', '/api/professional/application/submit', [], $token);
        expectTrue($submitted->status === 200, 'professional should submit once ready');
        $applicationId = (int) $submitted->payload['data']['application']['id'];

        $list = $api('GET', '/api/admin/applications', [], $adminToken);
        expectTrue($list->status === 200 && count($list->payload['data']['applications']) === 1, 'admin should see submitted application');
        expectTrue($list->payload['data']['overview']['awaiting_review'] === 1, 'admin overview should count awaiting review');

        $filtered = $api('GET', '/api/admin/applications', [], $adminToken, ['status' => ApplicationStatus::Submitted->value, 'search' => 'milestone.nurse']);
        expectTrue(count($filtered->payload['data']['applications']) === 1, 'admin queue search/status filters should find matching application');

        $detail = $api('GET', "/api/admin/applications/{$applicationId}", [], $adminToken);
        expectTrue($detail->status === 200, 'admin detail should load');
        expectFalse(array_key_exists('password_hash', $detail->payload['data']['professional']), 'admin detail must not expose password hashes');
        expectFalse(array_key_exists('storage_key', $detail->payload['data']['credentials'][0]), 'admin credential metadata must not expose private storage keys');
        expectFalse(array_key_exists('idempotency_key', $detail->payload['data']['payments'][0]), 'payment response must not expose idempotency keys');

        $reviewing = $api('PATCH', "/api/admin/applications/{$applicationId}/action", [
            'action' => 'start_review',
        ], $adminToken);
        expectTrue($reviewing->status === 200, 'admin should start review');

        $audit = $api('GET', '/api/admin/audit-logs', [], $adminToken);
        expectTrue($audit->status === 200 && count($audit->payload['data']['audit_logs']) >= 8, 'sensitive workflow actions should be audited');
    },
    'email verification and password reset lifecycle is safe' => function (): void {
        $root = sys_get_temp_dir() . '/afyalink-auth-test-' . bin2hex(random_bytes(4));
        mkdir($root . '/storage/private/credentials', 0770, true);
        $store = new JsonDataStore($root . '/storage/runtime/database.json');
        $kernel = new ApiKernel($store, new LocalPrivateCredentialStorage($root . '/storage/private/credentials'));

        $api = static function (string $method, string $path, array $body = [], ?string $token = null) use ($kernel): JsonResponse {
            $headers = $token === null ? [] : ['authorization' => "Bearer {$token}"];

            return $kernel->handle(new Request($method, $path, $headers, $body, [], ipAddress: '127.0.0.1', userAgent: 'test-suite'));
        };

        $registered = $api('POST', '/api/auth/register', [
            'name' => 'Lifecycle User',
            'email' => 'lifecycle@example.com',
            'phone' => '0722222222',
            'password' => 'StrongPass123',
        ]);
        expectTrue($registered->status === 200, 'lifecycle registration should succeed');

        $verificationNotice = $store->where('notification_outbox', static fn (array $row): bool => ($row['type'] ?? '') === 'email_verification')[0] ?? null;
        parse_str((string) parse_url((string) $verificationNotice['action_url'], PHP_URL_QUERY), $verificationQuery);
        $verified = $api('POST', '/api/auth/email/verify', ['token' => (string) $verificationQuery['token']]);
        expectTrue($verified->status === 200 && $verified->payload['data']['email_verified'] === true, 'valid verification token should verify email');

        $duplicate = $api('POST', '/api/auth/email/verify', ['token' => (string) $verificationQuery['token']]);
        expectTrue($duplicate->status === 200 && $duplicate->payload['data']['already_used'] === true, 'duplicate verification should be safe');

        $unknownReset = $api('POST', '/api/auth/password/forgot', ['email' => 'nobody@example.com']);
        expectTrue($unknownReset->status === 200, 'unknown reset request should not enumerate users');

        $resetRequest = $api('POST', '/api/auth/password/forgot', ['email' => 'lifecycle@example.com']);
        expectTrue($resetRequest->status === 200, 'known reset request should succeed safely');
        $resetNotice = array_values(array_filter(
            $store->all('notification_outbox'),
            static fn (array $row): bool => ($row['type'] ?? '') === 'password_reset',
        ))[0] ?? null;
        expectTrue($resetNotice !== null, 'password reset notification should be queued');
        parse_str((string) parse_url((string) $resetNotice['action_url'], PHP_URL_QUERY), $resetQuery);

        $reset = $api('POST', '/api/auth/password/reset', [
            'token' => (string) $resetQuery['token'],
            'password' => 'NewStrongPass123',
        ]);
        expectTrue($reset->status === 200, 'password reset should succeed');

        $oldLogin = $api('POST', '/api/auth/login', ['email' => 'lifecycle@example.com', 'password' => 'StrongPass123']);
        expectTrue($oldLogin->status === 403, 'old password should be rejected after reset');
        $newLogin = $api('POST', '/api/auth/login', ['email' => 'lifecycle@example.com', 'password' => 'NewStrongPass123']);
        expectTrue($newLogin->status === 200, 'new password should login');

        $expiredUser = $api('POST', '/api/auth/register', [
            'name' => 'Expired User',
            'email' => 'expired@example.com',
            'phone' => '0733333333',
            'password' => 'StrongPass123',
        ]);
        expectTrue($expiredUser->status === 200, 'expired token test user should register');
        $expiredNotice = array_values(array_filter(
            $store->all('notification_outbox'),
            static fn (array $row): bool => ($row['type'] ?? '') === 'email_verification' && ($row['recipient_email'] ?? '') === 'expired@example.com',
        ))[0] ?? null;
        parse_str((string) parse_url((string) $expiredNotice['action_url'], PHP_URL_QUERY), $expiredQuery);
        $expiredToken = $store->where('email_verification_tokens', static fn (array $row): bool => empty($row['used_at']))[0] ?? null;
        $store->update('email_verification_tokens', (int) $expiredToken['id'], ['expires_at' => gmdate(DATE_ATOM, time() - 60)]);
        $expiredVerify = $api('POST', '/api/auth/email/verify', ['token' => (string) $expiredQuery['token']]);
        expectTrue($expiredVerify->status === 422, 'expired verification token should be rejected');
    },
    'api student waiting-license flow blocks submission and supports admin conversion' => function (): void {
        $root = sys_get_temp_dir() . '/afyalink-student-test-' . bin2hex(random_bytes(4));
        mkdir($root . '/storage/private/credentials', 0770, true);
        $store = new JsonDataStore($root . '/storage/runtime/database.json');
        $kernel = new ApiKernel(
            $store,
            new LocalPrivateCredentialStorage($root . '/storage/private/credentials'),
        );

        $api = static function (string $method, string $path, array $body = [], ?string $token = null, array $query = []) use ($kernel): JsonResponse {
            $headers = $token === null ? [] : ['authorization' => "Bearer {$token}"];

            return $kernel->handle(new Request($method, $path, $headers, $body, $query, ipAddress: '127.0.0.1', userAgent: 'student-test'));
        };

        $registered = $api('POST', '/api/auth/register/student', [
            'name' => 'Waiting License Nurse',
            'email' => 'waiting.license@example.com',
            'phone' => '0712222222',
            'password' => 'StrongPass123',
            'student_status' => 'completed_training_waiting_license',
            'target_profession' => 'Registered Nurse',
            'institution_name' => 'Afya Training College',
            'programme_or_course' => 'Diploma in Nursing',
            'graduation_or_completion_date' => '2026-03-30',
            'expected_regulatory_body' => 'Nursing Council of Kenya',
            'county' => 'Nairobi',
        ]);
        expectTrue($registered->status === 200, 'student registration should succeed');
        $token = (string) $registered->payload['data']['token'];
        $profileId = (int) $registered->payload['data']['profile']['id'];

        $dashboard = $api('GET', '/api/professional/dashboard', [], $token);
        expectTrue($dashboard->payload['data']['prelicensure']['active'] === true, 'student dashboard should expose pre-licensure state');

        $blocked = $api('POST', '/api/professional/application/submit', [], $token);
        expectTrue($blocked->status === 409, 'student cannot submit licensed application before conversion');

        foreach ([DocumentType::CurriculumVitae, DocumentType::NationalIdOrPassport, DocumentType::StudentIdOrTrainingProof, DocumentType::TranscriptOrCompletionEvidence, DocumentType::ProfessionalLicense] as $type) {
            $upload = $api('POST', '/api/professional/credentials', [
                'document_type' => $type->value,
                'original_name' => $type->value . '.pdf',
                'mime_type' => 'application/pdf',
                'content_base64' => base64_encode('%PDF-1.4 student'),
            ], $token);
            expectTrue($upload->status === 200, "student credential {$type->value} should upload");
        }

        $updatedProfile = $api('PUT', '/api/professional/profile', [
            'applicant_track' => ApplicantTrack::StudentAwaitingLicense->value,
            'name' => 'Waiting License Nurse',
            'phone' => '0712222222',
            'student_status' => 'completed_training_waiting_license',
            'target_profession' => 'Registered Nurse',
            'institution_name' => 'Afya Training College',
            'programme_or_course' => 'Diploma in Nursing',
            'expected_regulatory_body' => 'Nursing Council of Kenya',
            'regulatory_body' => 'Nursing Council of Kenya',
            'license_number' => 'NCK-STUDENT-001',
            'county' => 'Nairobi',
        ], $token);
        expectTrue($updatedProfile->status === 200, 'student can add license details once issued');

        $kernel->auth()->createUser('Student Admin', 'student.admin@example.com', '0799999911', 'AdminPass123', [UserRole::Admin]);
        $adminLogin = $api('POST', '/api/auth/login', ['email' => 'student.admin@example.com', 'password' => 'AdminPass123']);
        $adminToken = (string) $adminLogin->payload['data']['token'];

        $queue = $api('GET', '/api/admin/pre-licensure', [], $adminToken);
        expectTrue($queue->status === 200 && count($queue->payload['data']['students']) === 1, 'admin pre-licensure queue should include student');
        expectTrue($queue->payload['data']['students'][0]['can_convert'] === true, 'student should be convertible after license evidence');

        $converted = $api('PATCH', "/api/admin/pre-licensure/{$profileId}/convert", ['note' => 'License reviewed.'], $adminToken);
        expectTrue($converted->status === 200, 'admin should convert waiting-license applicant');
        expectTrue($converted->payload['data']['student']['applicant_track'] === ApplicantTrack::LicensedProfessional->value, 'profile should become licensed professional track');

        $auditActions = array_map(static fn (array $row): string => (string) $row['action'], $store->all('audit_logs'));
        expectTrue(in_array('student_awaiting_license.registered', $auditActions, true), 'student registration should be audited');
        expectTrue(in_array('student_awaiting_license.converted', $auditActions, true), 'student conversion should be audited');
    },
    'credential replacement loop supersedes prior document and queues notification' => function (): void {
        $root = sys_get_temp_dir() . '/afyalink-replacement-test-' . bin2hex(random_bytes(4));
        mkdir($root . '/storage/private/credentials', 0770, true);
        $store = new JsonDataStore($root . '/storage/runtime/database.json');
        $kernel = new ApiKernel($store, new LocalPrivateCredentialStorage($root . '/storage/private/credentials'));

        $api = static function (string $method, string $path, array $body = [], ?string $token = null) use ($kernel): JsonResponse {
            $headers = $token === null ? [] : ['authorization' => "Bearer {$token}"];

            return $kernel->handle(new Request($method, $path, $headers, $body, [], ipAddress: '127.0.0.1', userAgent: 'test-suite'));
        };

        $registered = $api('POST', '/api/auth/register', [
            'name' => 'Replacement Nurse',
            'email' => 'replacement@example.com',
            'phone' => '0744444444',
            'password' => 'StrongPass123',
        ]);
        $token = (string) $registered->payload['data']['token'];
        $credential = $api('POST', '/api/professional/credentials', [
            'document_type' => DocumentType::ProfessionalLicense->value,
            'original_name' => 'license.pdf',
            'mime_type' => 'application/pdf',
            'content_base64' => base64_encode('%PDF-1.4 old-license'),
        ], $token);
        $credentialId = (int) $credential->payload['data']['credential']['id'];

        $kernel->auth()->createUser('Review Admin', 'review@example.com', '0799999998', 'AdminPass123', [UserRole::Admin]);
        $adminLogin = $api('POST', '/api/auth/login', ['email' => 'review@example.com', 'password' => 'AdminPass123']);
        $adminToken = (string) $adminLogin->payload['data']['token'];

        $review = $api('PATCH', "/api/admin/credentials/{$credentialId}/review", [
            'status' => CredentialReviewStatus::NeedsReplacement->value,
            'note' => 'License image is unclear.',
        ], $adminToken);
        expectTrue($review->status === 200, 'admin should request credential replacement');
        expectTrue(count(array_filter(
            $store->all('notification_outbox'),
            static fn (array $row): bool => ($row['type'] ?? '') === 'credential_replacement_requested',
        )) === 1, 'replacement request should queue notification');

        $replacement = $api('POST', '/api/professional/credentials', [
            'document_type' => DocumentType::ProfessionalLicense->value,
            'original_name' => 'license-clear.pdf',
            'mime_type' => 'application/pdf',
            'content_base64' => base64_encode('%PDF-1.4 replacement-license'),
        ], $token);
        expectTrue($replacement->status === 200, 'professional should upload replacement');
        $current = $api('GET', '/api/professional/credentials', [], $token);
        expectTrue(count($current->payload['data']['credentials']) === 1, 'superseded credential should not appear in current list');
        expectTrue($current->payload['data']['credentials'][0]['review_status'] === CredentialReviewStatus::Uploaded->value, 'replacement should reset review state');
        $old = $store->find('credentials', $credentialId);
        expectTrue(!empty($old['superseded_at']), 'prior credential should be superseded');
    },
    'milestone 2 verification and interview happy path qualifies candidate' => function (): void {
        $root = sys_get_temp_dir() . '/afyalink-m2-test-' . bin2hex(random_bytes(4));
        mkdir($root . '/storage/private/credentials', 0770, true);
        $store = new JsonDataStore($root . '/storage/runtime/database.json');
        $kernel = new ApiKernel($store, new LocalPrivateCredentialStorage($root . '/storage/private/credentials'));

        $api = static function (string $method, string $path, array $body = [], ?string $token = null, array $query = []) use ($kernel): JsonResponse {
            $headers = $token === null ? [] : ['authorization' => "Bearer {$token}"];

            return $kernel->handle(new Request($method, $path, $headers, $body, $query, ipAddress: '127.0.0.1', userAgent: 'test-suite'));
        };

        $registered = $api('POST', '/api/auth/register', [
            'name' => 'Milestone Two Nurse',
            'email' => 'milestone.two@example.com',
            'phone' => '0755555555',
            'password' => 'StrongPass123',
        ]);
        expectTrue($registered->status === 200, 'milestone 2 professional should register');
        $token = (string) $registered->payload['data']['token'];
        $notice = $store->where('notification_outbox', static fn (array $row): bool => ($row['type'] ?? '') === 'email_verification')[0] ?? null;
        parse_str((string) parse_url((string) $notice['action_url'], PHP_URL_QUERY), $verificationQuery);

        $api('PUT', '/api/professional/profile', [
            'name' => 'Milestone Two Nurse',
            'phone' => '0755555555',
            'profession' => 'Registered Nurse',
            'regulatory_body' => 'NCK',
            'license_number' => 'NCK-M2-001',
            'county' => 'Nairobi',
            'years_experience' => 8,
            'availability' => 'available',
            'placement_type' => 'full_time',
        ], $token);

        foreach ([
            DocumentType::CurriculumVitae,
            DocumentType::NationalIdOrPassport,
            DocumentType::ProfessionalLicense,
            DocumentType::AcademicCertificate,
        ] as $type) {
            $api('POST', '/api/professional/credentials', [
                'document_type' => $type->value,
                'original_name' => $type->value . '.pdf',
                'mime_type' => 'application/pdf',
                'content_base64' => base64_encode('%PDF-1.4 milestone-two'),
            ], $token);
        }

        $api('POST', '/api/professional/consents', [], $token);
        $payment = $api('POST', '/api/professional/payments', [
            'method' => 'mpesa_manual_reference',
            'idempotency_key' => 'm2-payment',
            'amount_cents' => 250000,
            'external_reference' => 'MPESA-M2-001',
        ], $token);

        $kernel->auth()->createUser('Milestone Two Admin', 'm2.admin@example.com', '0799999997', 'AdminPass123', [UserRole::Admin]);
        $adminLogin = $api('POST', '/api/auth/login', ['email' => 'm2.admin@example.com', 'password' => 'AdminPass123']);
        $adminToken = (string) $adminLogin->payload['data']['token'];
        $api('PATCH', '/api/admin/payments/' . (int) $payment->payload['data']['payment']['id'] . '/status', [
            'status' => PaymentStatus::PendingVerification->value,
            'note' => 'Manual reference received.',
        ], $adminToken);
        $api('PATCH', '/api/admin/payments/' . (int) $payment->payload['data']['payment']['id'] . '/status', [
            'status' => PaymentStatus::Confirmed->value,
            'note' => 'Manual reference confirmed.',
        ], $adminToken);
        $api('POST', '/api/auth/email/verify', ['token' => (string) $verificationQuery['token']]);

        $submitted = $api('POST', '/api/professional/application/submit', [], $token);
        expectTrue($submitted->status === 200, 'professional should submit before milestone 2 review');
        $applicationId = (int) $submitted->payload['data']['application']['id'];

        $scheduleTooEarly = $api('POST', '/api/admin/interviews', [
            'application_id' => $applicationId,
            'scheduled_start_at' => gmdate(DATE_ATOM, time() + 86400),
            'scheduled_end_at' => gmdate(DATE_ATOM, time() + 90000),
        ], $adminToken);
        expectTrue($scheduleTooEarly->status === 409, 'interview must wait for passed verification');

        $createdCase = $api('POST', '/api/admin/verifications', [
            'application_id' => $applicationId,
            'verification_method' => 'manual_registry_check',
        ], $adminToken);
        expectTrue($createdCase->status === 200, 'admin should create verification case');
        $caseId = (int) $createdCase->payload['data']['verification']['case']['id'];
        $applicationAfterCase = $store->find('applications', $applicationId);
        expectTrue($applicationAfterCase['status'] === ApplicationStatus::AwaitingVerification->value, 'application should move to awaiting verification');

        $assigned = $api('PATCH', "/api/admin/verifications/{$caseId}/status", [
            'status' => VerificationStatus::Assigned->value,
            'note' => 'Assigned to internal reviewer.',
            'evidence_reference' => 'NCK registry search started.',
        ], $adminToken);
        expectTrue($assigned->status === 200, 'verification should assign');

        $passed = $api('PATCH', "/api/admin/verifications/{$caseId}/status", [
            'status' => VerificationStatus::Verified->value,
            'note' => 'License active and matching applicant identity.',
            'evidence_reference' => 'NCK online register',
            'evidence_notes' => 'Internal reviewer confirmed regulator record.',
            'final_decision_notes' => 'Verified.',
        ], $adminToken);
        expectTrue($passed->status === 200, 'verification should pass');
        $applicationAfterVerification = $store->find('applications', $applicationId);
        expectTrue($applicationAfterVerification['status'] === ApplicationStatus::VerificationPassed->value, 'application should move to verification passed');

        $professionalDashboard = $api('GET', '/api/professional/dashboard', [], $token);
        expectTrue($professionalDashboard->status === 200, 'professional dashboard should load after verification: ' . json_encode($professionalDashboard->payload));
        expectTrue(count($professionalDashboard->payload['data']['verification_cases']) === 1, 'professional should see safe verification status');
        expectFalse(array_key_exists('evidence_notes', $professionalDashboard->payload['data']['verification_cases'][0]), 'professional verification status must hide internal evidence notes');

        $scheduled = $api('POST', '/api/admin/interviews', [
            'application_id' => $applicationId,
            'scheduled_start_at' => gmdate(DATE_ATOM, time() + 86400),
            'scheduled_end_at' => gmdate(DATE_ATOM, time() + 90000),
            'mode' => 'remote',
            'location' => 'Secure video call',
            'notes' => 'Panel interview scheduled.',
        ], $adminToken);
        expectTrue($scheduled->status === 200, 'interview should schedule after verification passes');
        $interviewId = (int) $scheduled->payload['data']['interview']['interview']['id'];

        $completed = $api('PATCH', "/api/admin/interviews/{$interviewId}/complete", [
            'recommendation' => InterviewRecommendation::Recommend->value,
            'notes' => 'Candidate meets Afyalink milestone 2 readiness.',
            'scores' => [
                ['category' => 'professional_knowledge', 'score' => 5, 'max_score' => 5, 'weight' => 1, 'comment' => 'Strong technical answers.'],
                ['category' => 'communication', 'score' => 4, 'max_score' => 5, 'weight' => 1, 'comment' => 'Clear communication.'],
                ['category' => 'ethical_judgment', 'score' => 5, 'max_score' => 5, 'weight' => 1, 'comment' => 'Safe ethical reasoning.'],
                ['category' => 'practical_readiness', 'score' => 4, 'max_score' => 5, 'weight' => 1, 'comment' => 'Ready for supervised placement.'],
                ['category' => 'role_fit', 'score' => 4, 'max_score' => 5, 'weight' => 1, 'comment' => 'Good role fit.'],
            ],
        ], $adminToken);
        expectTrue($completed->status === 200, 'interview should complete with scores');
        $finalApplication = $store->find('applications', $applicationId);
        expectTrue($finalApplication['status'] === ApplicationStatus::Qualified->value, 'recommended candidate should become qualified');

        $professionalDenied = $api('GET', '/api/admin/verifications', [], $token);
        expectTrue($professionalDenied->status === 403, 'professional cannot access verification admin queue');

        $notificationTypes = array_map(static fn (array $row): string => (string) $row['type'], $store->all('notification_outbox'));
        expectTrue(in_array('verification_status_changed', $notificationTypes, true), 'verification status should queue notification');
        expectTrue(in_array('interview_scheduled', $notificationTypes, true), 'interview scheduled should queue notification');
        expectTrue(in_array('interview_completed', $notificationTypes, true), 'interview completion should queue notification');

        $auditActions = array_map(static fn (array $row): string => (string) $row['action'], $store->all('audit_logs'));
        expectTrue(in_array('verification.created', $auditActions, true), 'verification creation should be audited');
        expectTrue(in_array('verification.status_changed', $auditActions, true), 'verification status change should be audited');
        expectTrue(in_array('interview.completed', $auditActions, true), 'interview completion should be audited');
    },
    'milestone 3 facility marketplace gates access and audits candidate views' => function (): void {
        $root = sys_get_temp_dir() . '/afyalink-m3-test-' . bin2hex(random_bytes(4));
        mkdir($root . '/storage/private/credentials', 0770, true);
        $store = new JsonDataStore($root . '/storage/runtime/database.json');
        $kernel = new ApiKernel($store, new LocalPrivateCredentialStorage($root . '/storage/private/credentials'));

        $api = static function (string $method, string $path, array $body = [], ?string $token = null, array $query = []) use ($kernel): JsonResponse {
            $headers = $token === null ? [] : ['authorization' => "Bearer {$token}"];

            return $kernel->handle(new Request($method, $path, $headers, $body, $query, ipAddress: '127.0.0.1', userAgent: 'test-suite'));
        };

        $registered = $api('POST', '/api/auth/register', [
            'name' => 'Facility Visible Nurse',
            'email' => 'facility.visible@example.com',
            'phone' => '0766666666',
            'password' => 'StrongPass123',
        ]);
        expectTrue($registered->status === 200, 'candidate professional should register');
        $professionalToken = (string) $registered->payload['data']['token'];
        $notice = $store->where('notification_outbox', static fn (array $row): bool => ($row['type'] ?? '') === 'email_verification')[0] ?? null;
        parse_str((string) parse_url((string) $notice['action_url'], PHP_URL_QUERY), $verificationQuery);

        $api('PUT', '/api/professional/profile', [
            'name' => 'Facility Visible Nurse',
            'phone' => '0766666666',
            'profession' => 'Registered Nurse',
            'regulatory_body' => 'NCK',
            'license_number' => 'NCK-M3-001',
            'county' => 'Nairobi',
            'years_experience' => 6,
            'availability' => 'available',
            'placement_type' => 'full_time',
        ], $professionalToken);
        foreach ([
            DocumentType::CurriculumVitae,
            DocumentType::NationalIdOrPassport,
            DocumentType::ProfessionalLicense,
            DocumentType::AcademicCertificate,
        ] as $type) {
            $upload = $api('POST', '/api/professional/credentials', [
                'document_type' => $type->value,
                'original_name' => $type->value . '.pdf',
                'mime_type' => 'application/pdf',
                'content_base64' => base64_encode('%PDF-1.4 milestone-three'),
            ], $professionalToken);
            expectTrue($upload->status === 200, "credential {$type->value} should upload for publication flow");
        }
        $api('POST', '/api/professional/consents', [], $professionalToken);
        $payment = $api('POST', '/api/professional/payments', [
            'method' => 'mpesa_manual_reference',
            'idempotency_key' => 'm3-payment',
            'amount_cents' => 250000,
            'external_reference' => 'MPESA-M3-001',
        ], $professionalToken);

        $kernel->auth()->createUser('Milestone Three Admin', 'm3.admin@example.com', '0799999996', 'AdminPass123', [UserRole::Admin]);
        $adminLogin = $api('POST', '/api/auth/login', ['email' => 'm3.admin@example.com', 'password' => 'AdminPass123']);
        expectTrue($adminLogin->status === 200, 'milestone 3 admin should login');
        $adminToken = (string) $adminLogin->payload['data']['token'];
        $paymentId = (int) $payment->payload['data']['payment']['id'];
        $api('PATCH', "/api/admin/payments/{$paymentId}/status", [
            'status' => PaymentStatus::PendingVerification->value,
            'note' => 'Manual reference received.',
        ], $adminToken);
        $api('PATCH', "/api/admin/payments/{$paymentId}/status", [
            'status' => PaymentStatus::Confirmed->value,
            'note' => 'Manual reference confirmed.',
        ], $adminToken);
        $api('POST', '/api/auth/email/verify', ['token' => (string) $verificationQuery['token']]);
        $submitted = $api('POST', '/api/professional/application/submit', [], $professionalToken);
        expectTrue($submitted->status === 200, 'candidate should submit before publication');
        $applicationId = (int) $submitted->payload['data']['application']['id'];

        $verification = $api('POST', '/api/admin/verifications', [
            'application_id' => $applicationId,
            'verification_method' => 'manual_registry_check',
        ], $adminToken);
        $caseId = (int) $verification->payload['data']['verification']['case']['id'];
        $api('PATCH', "/api/admin/verifications/{$caseId}/status", [
            'status' => VerificationStatus::Assigned->value,
            'note' => 'Assigned.',
        ], $adminToken);
        $api('PATCH', "/api/admin/verifications/{$caseId}/status", [
            'status' => VerificationStatus::Verified->value,
            'note' => 'License active.',
            'evidence_reference' => 'NCK register',
            'final_decision_notes' => 'Verified.',
        ], $adminToken);
        $scheduled = $api('POST', '/api/admin/interviews', [
            'application_id' => $applicationId,
            'scheduled_start_at' => gmdate(DATE_ATOM, time() + 86400),
            'scheduled_end_at' => gmdate(DATE_ATOM, time() + 90000),
            'mode' => 'remote',
        ], $adminToken);
        $interviewId = (int) $scheduled->payload['data']['interview']['interview']['id'];
        $completed = $api('PATCH', "/api/admin/interviews/{$interviewId}/complete", [
            'recommendation' => InterviewRecommendation::Recommend->value,
            'notes' => 'Ready for facility catalogue.',
            'scores' => [
                ['category' => 'professional_knowledge', 'score' => 5, 'max_score' => 5],
                ['category' => 'communication', 'score' => 5, 'max_score' => 5],
                ['category' => 'ethical_judgment', 'score' => 4, 'max_score' => 5],
                ['category' => 'practical_readiness', 'score' => 4, 'max_score' => 5],
                ['category' => 'role_fit', 'score' => 5, 'max_score' => 5],
            ],
        ], $adminToken);
        expectTrue($completed->status === 200, 'candidate interview should qualify');

        $publication = $api('POST', '/api/admin/candidate-publications', [
            'application_id' => $applicationId,
            'status' => CandidatePublicationStatus::Published->value,
            'headline' => 'Verified registered nurse',
            'summary' => 'Interview-qualified nurse available for placement.',
        ], $adminToken);
        expectTrue($publication->status === 200, 'admin should publish qualified candidate');
        $publicationId = (int) $publication->payload['data']['publication']['id'];

        $facilityRegistration = $api('POST', '/api/facility/auth/register', [
            'name' => 'Facility Owner',
            'email' => 'facility.owner@example.com',
            'phone' => '0777777777',
            'password' => 'StrongPass123',
            'legal_name' => 'Nairobi Care Hospital Ltd',
            'display_name' => 'Nairobi Care Hospital',
            'facility_type' => 'hospital',
            'registration_number' => 'FAC-M3-001',
            'county' => 'Nairobi',
            'location' => 'Westlands',
            'physical_address' => 'Westlands Road',
            'contact_person' => 'Facility Owner',
        ]);
        expectTrue($facilityRegistration->status === 200, 'facility owner should register with organization profile');
        $facilityToken = (string) $facilityRegistration->payload['data']['token'];
        $facilityId = (int) $facilityRegistration->payload['data']['facility']['id'];

        $unapprovedBrowse = $api('GET', '/api/facility/candidates', [], $facilityToken);
        expectTrue($unapprovedBrowse->status === 409, 'unapproved facility cannot browse candidates');

        $submittedFacility = $api('POST', '/api/facility/submit', [], $facilityToken);
        expectTrue($submittedFacility->status === 200 && $submittedFacility->payload['data']['facility']['review_status'] === FacilityReviewStatus::Submitted->value, 'facility should submit onboarding for review');
        $approvedFacility = $api('PATCH', "/api/admin/facilities/{$facilityId}/review", [
            'action' => 'approve',
            'note' => 'Facility registration checked.',
        ], $adminToken);
        expectTrue($approvedFacility->status === 200 && $approvedFacility->payload['data']['facility']['review_status'] === FacilityReviewStatus::Approved->value, 'admin should approve facility');

        $noAccessBrowse = $api('GET', '/api/facility/candidates', [], $facilityToken);
        expectTrue($noAccessBrowse->status === 409, 'approved facility without active access cannot browse');
        $subscription = $api('POST', '/api/facility/access/payment-intents', [
            'idempotency_key' => 'facility-access-1',
            'amount_cents' => 500000,
        ], $facilityToken);
        expectTrue($subscription->status === 200 && $subscription->payload['data']['subscription']['status'] === FacilityAccessStatus::PendingPayment->value, 'facility should create access payment intent');
        $active = $api('PATCH', "/api/admin/facilities/{$facilityId}/subscription", [
            'subscription_id' => $subscription->payload['data']['subscription']['id'],
            'status' => FacilityAccessStatus::Active->value,
            'note' => 'Manual staging access activated.',
            'admin_override' => true,
        ], $adminToken);
        expectTrue($active->status === 200 && $active->payload['data']['access']['active'] === true, 'admin should activate facility access');

        $browse = $api('GET', '/api/facility/candidates', [], $facilityToken, ['profession' => 'Nurse', 'county' => 'Nairobi']);
        expectTrue($browse->status === 200 && count($browse->payload['data']['candidates']) === 1, 'active approved facility can browse published candidates');
        $candidateDetail = $api('GET', "/api/facility/candidates/{$publicationId}", [], $facilityToken);
        expectTrue($candidateDetail->status === 200, 'facility can open candidate detail');
        expectFalse(array_key_exists('storage_key', $candidateDetail->payload['data']), 'candidate detail must not expose raw storage keys');
        expectTrue(($candidateDetail->payload['data']['watermark']['viewer_email'] ?? '') === 'facility.owner@example.com', 'candidate detail should include viewer-bound watermark');

        $appointment = $api('POST', '/api/facility/requests/appointments', [
            'title' => 'Discuss ICU nurse hiring',
            'role_needed' => 'ICU nurse',
            'candidate_publication_ids' => [$publicationId],
            'preferred_timing' => 'Tomorrow morning',
            'notes' => 'Need two nurses for night shifts.',
        ], $facilityToken);
        expectTrue($appointment->status === 200 && $appointment->payload['data']['request']['status'] === FacilityRequestStatus::Submitted->value, 'facility should submit appointment request');

        $recommendationRequest = $api('POST', '/api/facility/recommendation-requests', [
            'role_needed' => 'Registered Nurse',
            'county' => 'Nairobi',
            'urgency' => 'high',
            'experience_level' => '5+ years',
            'candidate_publication_ids' => [$publicationId],
            'notes' => 'Recommend professionals for ward coverage.',
        ], $facilityToken);
        expectTrue($recommendationRequest->status === 200, 'facility should submit recommendation request');
        $recommendationRequestId = (int) $recommendationRequest->payload['data']['recommendation_request']['id'];
        $package = $api('POST', '/api/admin/recommendation-packages', [
            'recommendation_request_id' => $recommendationRequestId,
            'title' => 'Recommended nurses for Nairobi Care',
            'rationale' => 'Candidate has passed Afyalink verification and interview scoring.',
            'status' => RecommendationPackageStatus::Shared->value,
            'candidate_publication_ids' => [$publicationId],
        ], $adminToken);
        expectTrue($package->status === 200 && $package->payload['data']['recommendation_package']['status'] === RecommendationPackageStatus::Shared->value, 'admin should share recommendation package');
        $facilityPackages = $api('GET', '/api/facility/recommendation-packages', [], $facilityToken);
        expectTrue(count($facilityPackages->payload['data']['recommendation_packages']) === 1, 'facility should see shared recommendation package');

        $professionalDashboard = $api('GET', '/api/professional/dashboard', [], $professionalToken);
        expectTrue($professionalDashboard->payload['data']['facility_visibility']['published'] === true, 'professional should see catalogue visibility');
        expectTrue($professionalDashboard->payload['data']['facility_visibility']['view_count'] === 1, 'professional should see high-level view count');

        $auditActions = array_map(static fn (array $row): string => (string) $row['action'], $store->all('audit_logs'));
        expectTrue(in_array('facility.review_status_changed', $auditActions, true), 'facility approval should be audited');
        expectTrue(in_array('facility_subscription.status_changed', $auditActions, true), 'facility subscription change should be audited');
        expectTrue(in_array('candidate.profile_viewed', $auditActions, true), 'candidate profile view should be audited');
        expectTrue(in_array('recommendation_package.created', $auditActions, true), 'recommendation package lifecycle should be audited');

        $notificationTypes = array_map(static fn (array $row): string => (string) $row['type'], $store->all('notification_outbox'));
        expectTrue(in_array('facility_onboarding_submitted', $notificationTypes, true), 'facility onboarding submission should queue notification');
        expectTrue(in_array('facility_subscription_status_changed', $notificationTypes, true), 'facility access update should queue notification');
        expectTrue(in_array('recommendation_package_shared', $notificationTypes, true), 'shared package should queue notification');
    },
    'configuration defaults to postgresql and supports explicit json adapter' => function (): void {
        $config = AppConfig::fromEnv([], __DIR__);
        expectTrue($config->datastoreDriver === 'pgsql', 'default runtime datastore should be PostgreSQL');

        $json = AppConfig::fromEnv(['AFYALINK_DATASTORE' => 'json'], __DIR__);
        expectTrue($json->datastoreDriver === 'json', 'JSON datastore should be explicit');
    },
    'milestone 4 notification delivery records attempts and sent state' => function (): void {
        $path = sys_get_temp_dir() . '/afyalink-m4-notifications-' . bin2hex(random_bytes(4)) . '.json';
        $store = new JsonDataStore($path);
        $audit = new AuditLogger($store);
        $store->insert('notification_outbox', [
            'recipient_user_id' => 1,
            'recipient_email' => 'nurse@example.com',
            'channel' => 'email',
            'type' => 'application_submitted',
            'subject' => 'Application submitted',
            'body' => 'Your application was submitted.',
            'action_url' => 'https://example.test/portal/professional/dashboard',
            'status' => 'queued',
            'metadata' => ['template' => 'application_submitted'],
            'created_at' => gmdate(DATE_ATOM),
            'sent_at' => null,
        ]);

        $delivery = new NotificationDeliveryService($store, $audit, new LogEmailProvider());
        $result = $delivery->processPending(10);
        $outbox = $store->all('notification_outbox')[0];

        expectTrue($result['processed_count'] === 1, 'one notification should be processed');
        expectTrue($outbox['status'] === 'sent', 'notification should be marked sent');
        expectTrue(count($store->all('notification_delivery_attempts')) === 1, 'delivery attempt should be recorded');
        expectTrue(in_array('notification.sent', array_map(static fn (array $row): string => (string) $row['action'], $store->all('audit_logs')), true), 'sent notification should be audited');
        @unlink($path);
    },
    'milestone 4 notification delivery records retry failures' => function (): void {
        $path = sys_get_temp_dir() . '/afyalink-m4-notification-failure-' . bin2hex(random_bytes(4)) . '.json';
        $store = new JsonDataStore($path);
        $audit = new AuditLogger($store);
        $store->insert('notification_outbox', [
            'recipient_user_id' => 1,
            'recipient_email' => 'retry@example.com',
            'channel' => 'email',
            'type' => 'password_reset',
            'subject' => 'Reset',
            'body' => 'Reset password.',
            'action_url' => 'https://example.test/reset',
            'status' => 'queued',
            'metadata' => [],
            'created_at' => gmdate(DATE_ATOM),
            'sent_at' => null,
        ]);
        $failingProvider = new class implements EmailProvider {
            public function name(): string
            {
                return 'failing-test';
            }

            public function send(string $to, string $subject, string $body, ?string $actionUrl = null, array $metadata = []): array
            {
                throw new RuntimeException('provider unavailable');
            }
        };
        $delivery = new NotificationDeliveryService($store, $audit, $failingProvider, maxAttempts: 2);
        $delivery->processPending(1);
        $outbox = $store->all('notification_outbox')[0];

        expectTrue($outbox['status'] === 'retry_scheduled', 'first failed notification attempt should be retry scheduled');
        expectTrue(count($store->all('notification_delivery_attempts')) === 1, 'failed attempt should be recorded');
        expectTrue(in_array('notification.delivery_failed', array_map(static fn (array $row): string => (string) $row['action'], $store->all('audit_logs')), true), 'failed notification attempt should be audited');
        @unlink($path);
    },
    'milestone 4 mpesa callback processing is idempotent and activates matched payment' => function (): void {
        $path = sys_get_temp_dir() . '/afyalink-m4-mpesa-' . bin2hex(random_bytes(4)) . '.json';
        $store = new JsonDataStore($path);
        $audit = new AuditLogger($store);
        $user = $store->insert('users', [
            'name' => 'Payment User',
            'email' => 'pay@example.com',
            'phone' => '0700000000',
            'password_hash' => 'hash',
            'roles' => [UserRole::Professional->value],
            'is_active' => true,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $payment = $store->insert('payments', [
            'user_id' => (int) $user['id'],
            'payer_user_id' => (int) $user['id'],
            'payer_type' => 'professional',
            'entity_type' => 'professional_application_fee',
            'entity_id' => null,
            'intent_reference' => 'AFYA-PAY-MPESA-1',
            'amount_cents' => 250000,
            'currency' => 'KES',
            'method' => 'mpesa_stk',
            'status' => PaymentStatus::AwaitingProvider->value,
            'idempotency_key' => 'mpesa-test',
            'provider' => 'mpesa',
            'provider_reference' => null,
            'checkout_request_id' => 'ws_CO_123',
            'merchant_request_id' => 'merchant_123',
            'phone_number' => '254700000000',
            'callback_payload_redacted' => [],
            'failure_reason' => null,
            'paid_at' => null,
            'expires_at' => null,
            'external_reference' => '',
            'review_note' => null,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $callback = [
            'Body' => [
                'stkCallback' => [
                    'MerchantRequestID' => 'merchant_123',
                    'CheckoutRequestID' => 'ws_CO_123',
                    'ResultCode' => 0,
                    'ResultDesc' => 'The service request is processed successfully.',
                    'CallbackMetadata' => [
                        'Item' => [
                            ['Name' => 'Amount', 'Value' => 2500],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'RCP123456'],
                            ['Name' => 'PhoneNumber', 'Value' => 254700000000],
                        ],
                    ],
                ],
            ],
        ];
        $mpesa = new MpesaPaymentService($store, $audit);
        $first = $mpesa->handleCallback($callback);
        $second = $mpesa->handleCallback($callback);
        $updatedPayment = $store->find('payments', (int) $payment['id']);

        expectTrue($first['status'] === 'processed', 'first callback should process');
        expectTrue($second['status'] === 'duplicate', 'duplicate callback should be idempotent');
        expectTrue(($updatedPayment['status'] ?? '') === PaymentStatus::Confirmed->value, 'matched payment should be confirmed');
        expectTrue(count($store->all('payment_provider_events')) === 1, 'only one provider event should be persisted for duplicate callback');
        $storedEvent = $store->all('payment_provider_events')[0];
        $storedPayload = json_encode($storedEvent['payload_redacted'] ?? [], JSON_UNESCAPED_SLASHES);
        expectFalse(str_contains((string) $storedPayload, '254700000000'), 'callback event payload should mask phone numbers');
        @unlink($path);
    },
    'milestone 4 privacy request lifecycle is audited and masks subject email' => function (): void {
        $path = sys_get_temp_dir() . '/afyalink-m4-privacy-' . bin2hex(random_bytes(4)) . '.json';
        $store = new JsonDataStore($path);
        $audit = new AuditLogger($store);
        $admin = new AuthenticatedUser(99, 'Admin', 'admin@example.com', '0799999999', [UserRole::Admin]);
        $service = new PrivacyRequestService($store, $audit);
        $request = $service->submit(null, [
            'request_type' => 'data_access',
            'subject_name' => 'Jane Applicant',
            'subject_email' => 'jane@example.com',
            'description' => 'Please provide a copy of my Afyalink records.',
        ]);
        $updated = $service->update($admin, (int) $request['id'], ['status' => 'under_review', 'admin_note' => 'Assigned to operations.']);

        expectTrue($request['subject_email'] === 'j***@example.com', 'privacy response should mask subject email');
        expectTrue($updated['status'] === 'under_review', 'privacy request should update through service');
        expectTrue(in_array('privacy_request.status_changed', array_map(static fn (array $row): string => (string) $row['action'], $store->all('audit_logs')), true), 'privacy request update should be audited');
        @unlink($path);
    },
    'milestone 5 matching blocks students and scores eligible professionals transparently' => function (): void {
        $path = sys_get_temp_dir() . '/afyalink-m5-matching-' . bin2hex(random_bytes(4)) . '.json';
        $store = new JsonDataStore($path);
        $audit = new AuditLogger($store);
        $facilities = new FacilityService($store, $audit);
        $access = new FacilityAccessService($store, $facilities, $audit);
        $publications = new CandidatePublicationService($store, $facilities, $access, new ConsentService($store, $audit), $audit);
        $placements = new PlacementService($store, $facilities, $access, $publications, $audit, null, new LocalRecommendationAssistant());
        $now = gmdate(DATE_ATOM);
        $admin = new AuthenticatedUser(90, 'Admin', 'admin@example.com', '0799999999', [UserRole::Admin]);

        $facilityOwner = $store->insert('users', [
            'name' => 'Facility Owner',
            'email' => 'facility@example.com',
            'phone' => '0700000001',
            'password_hash' => 'hash',
            'roles' => [UserRole::FacilityAdmin->value],
            'is_active' => true,
            'email_verified_at' => $now,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $facility = $store->insert('facilities', [
            'legal_name' => 'Nairobi Care Hospital',
            'display_name' => 'Nairobi Care',
            'facility_type' => 'Hospital',
            'registration_number' => 'FAC-M5',
            'county' => 'Nairobi',
            'location' => 'Westlands',
            'email' => 'facility@example.com',
            'phone' => '0700000001',
            'physical_address' => 'Nairobi',
            'contact_person' => 'Facility Owner',
            'operational_status' => 'active',
            'review_status' => FacilityReviewStatus::Approved->value,
            'created_by' => (int) $facilityOwner['id'],
            'reviewed_by' => 90,
            'review_note' => null,
            'submitted_at' => $now,
            'reviewed_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $store->insert('facility_memberships', [
            'facility_id' => (int) $facility['id'],
            'user_id' => (int) $facilityOwner['id'],
            'role' => UserRole::FacilityAdmin->value,
            'status' => 'active',
            'invited_by' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $store->insert('facility_access_subscriptions', [
            'facility_id' => (int) $facility['id'],
            'plan_code' => 'facility_marketplace',
            'status' => FacilityAccessStatus::Active->value,
            'payment_reference' => 'AFYA-FAC-M5',
            'idempotency_key' => 'm5-access',
            'amount_cents' => 500000,
            'currency' => 'KES',
            'method' => 'manual_reference',
            'provider' => 'manual',
            'provider_reference' => null,
            'checkout_request_id' => null,
            'merchant_request_id' => null,
            'phone_number' => null,
            'paid_at' => $now,
            'external_reference' => null,
            'starts_at' => $now,
            'ends_at' => (new DateTimeImmutable('+30 days'))->format(DATE_ATOM),
            'admin_override' => false,
            'note' => null,
            'created_by' => (int) $facilityOwner['id'],
            'reviewed_by' => 90,
            'reviewed_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $pro = $store->insert('users', [
            'name' => 'Grace Nurse',
            'email' => 'grace.m5@example.com',
            'phone' => '0700000002',
            'password_hash' => 'hash',
            'roles' => [UserRole::Professional->value],
            'is_active' => true,
            'email_verified_at' => $now,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $student = $store->insert('users', [
            'name' => 'Student Nurse',
            'email' => 'student.m5@example.com',
            'phone' => '0700000003',
            'password_hash' => 'hash',
            'roles' => [UserRole::Professional->value],
            'is_active' => true,
            'email_verified_at' => $now,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $application = $store->insert('applications', [
            'user_id' => (int) $pro['id'],
            'application_number' => 'AFYA-M5-001',
            'status' => ApplicationStatus::Qualified->value,
            'submitted_at' => $now,
            'review_note' => null,
            'timeline' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $studentApplication = $store->insert('applications', [
            'user_id' => (int) $student['id'],
            'application_number' => 'AFYA-M5-STUDENT',
            'status' => ApplicationStatus::Qualified->value,
            'submitted_at' => $now,
            'review_note' => null,
            'timeline' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $store->insert('profiles', [
            'user_id' => (int) $pro['id'],
            'applicant_track' => ApplicantTrack::LicensedProfessional->value,
            'student_status' => null,
            'name' => 'Grace Nurse',
            'email' => 'grace.m5@example.com',
            'phone' => '0700000002',
            'profession' => 'Registered Nurse',
            'target_profession' => 'Registered Nurse',
            'regulatory_body' => 'Nursing Council of Kenya',
            'expected_regulatory_body' => 'Nursing Council of Kenya',
            'license_number' => 'NCK-M5',
            'county' => 'Nairobi',
            'years_experience' => 6,
            'institution_name' => null,
            'programme_or_course' => null,
            'graduation_or_completion_date' => null,
            'prelicensure_note' => null,
            'conversion_review_status' => 'not_applicable',
            'license_uploaded_at' => null,
            'availability' => 'available_now',
            'work_preferences' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $store->insert('profiles', [
            'user_id' => (int) $student['id'],
            'applicant_track' => ApplicantTrack::StudentAwaitingLicense->value,
            'student_status' => 'completed_training_waiting_license',
            'name' => 'Student Nurse',
            'email' => 'student.m5@example.com',
            'phone' => '0700000003',
            'profession' => 'Registered Nurse',
            'target_profession' => 'Registered Nurse',
            'regulatory_body' => '',
            'expected_regulatory_body' => 'Nursing Council of Kenya',
            'license_number' => '',
            'county' => 'Nairobi',
            'years_experience' => 0,
            'institution_name' => 'Afya Training College',
            'programme_or_course' => 'Diploma Nursing',
            'graduation_or_completion_date' => null,
            'prelicensure_note' => null,
            'conversion_review_status' => 'waiting_for_license',
            'license_uploaded_at' => null,
            'availability' => '',
            'work_preferences' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        foreach ([$pro, $student] as $candidateUser) {
            $store->insert('consents', [
                'user_id' => (int) $candidateUser['id'],
                'type' => 'credential_verification',
                'version' => 'v1',
                'text_hash' => str_repeat('a', 64),
                'accepted_at' => $now,
                'ip_address' => null,
                'user_agent' => null,
                'created_at' => $now,
            ]);
            $store->insert('professional_placement_preferences', [
                'user_id' => (int) $candidateUser['id'],
                'open_to_work' => true,
                'availability_status' => 'available_now',
                'available_from' => null,
                'preferred_counties' => ['Nairobi'],
                'preferred_facility_types' => ['Hospital'],
                'employment_types' => ['full_time', 'locum'],
                'shift_preferences' => ['day'],
                'desired_roles' => ['Registered Nurse'],
                'minimum_rate_or_salary' => null,
                'relocation_willingness' => 'within_county',
                'remote_or_telehealth_interest' => false,
                'notes' => null,
                'student_future_preferences' => [],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
        $store->insert('verification_cases', [
            'professional_user_id' => (int) $pro['id'],
            'application_id' => (int) $application['id'],
            'regulatory_body_code' => 'NCK',
            'license_number' => 'NCK-M5',
            'method' => 'manual_registry',
            'assigned_reviewer_id' => 90,
            'status' => VerificationStatus::Verified->value,
            'evidence_reference' => 'Manual registry check',
            'reviewer_notes' => 'Verified.',
            'timeline' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $store->insert('interviews', [
            'professional_user_id' => (int) $pro['id'],
            'application_id' => (int) $application['id'],
            'scheduled_start_at' => $now,
            'scheduled_end_at' => $now,
            'mode' => 'remote',
            'location' => null,
            'interviewer_id' => 90,
            'status' => 'completed',
            'notes' => 'Good fit.',
            'total_score' => 85,
            'recommendation' => InterviewRecommendation::Recommend->value,
            'timeline' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $publication = $store->insert('candidate_publications', [
            'application_id' => (int) $application['id'],
            'professional_user_id' => (int) $pro['id'],
            'status' => CandidatePublicationStatus::Published->value,
            'summary_snapshot' => [
                'candidate_code' => 'AFYA-M5-GRACE',
                'name' => 'Grace Nurse',
                'profession' => 'Registered Nurse',
                'county' => 'Nairobi',
                'years_experience' => 6,
                'availability' => 'available_now',
                'verification_status' => 'verified',
                'qualification_status' => 'qualified',
                'recommendation' => 'recommend',
            ],
            'private_admin_notes' => [],
            'published_by' => 90,
            'published_at' => $now,
            'unpublished_by' => null,
            'unpublished_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $store->insert('candidate_publications', [
            'application_id' => (int) $studentApplication['id'],
            'professional_user_id' => (int) $student['id'],
            'status' => CandidatePublicationStatus::Published->value,
            'summary_snapshot' => ['candidate_code' => 'AFYA-M5-STUDENT', 'name' => 'Student Nurse', 'profession' => 'Registered Nurse', 'county' => 'Nairobi'],
            'private_admin_notes' => [],
            'published_by' => 90,
            'published_at' => $now,
            'unpublished_by' => null,
            'unpublished_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $requisition = $placements->createFacilityRequisition(new AuthenticatedUser((int) $facilityOwner['id'], 'Facility Owner', 'facility@example.com', '0700000001', [UserRole::FacilityAdmin]), [
            'title' => 'Ward nurse cover',
            'profession_required' => 'Registered Nurse',
            'employment_type' => 'full_time',
            'county' => 'Nairobi',
            'minimum_experience_years' => 3,
            'urgency' => 'high',
            'submit' => true,
        ], true);
        $matches = $placements->runMatching($admin, (int) $requisition['id']);
        $eligible = array_values(array_filter($matches['matches'], static fn (array $row): bool => (int) $row['professional_user_id'] === (int) $pro['id']))[0] ?? null;
        $blocked = array_values(array_filter($matches['matches'], static fn (array $row): bool => (int) $row['professional_user_id'] === (int) $student['id']))[0] ?? null;

        expectTrue($eligible !== null && $eligible['match_band'] !== 'ineligible', 'qualified published professional should match');
        expectTrue((float) $eligible['match_score'] >= 70, 'qualified professional should score strongly');
        expectTrue(isset($eligible['score_breakdown']['profession_match']), 'score explanation should include profession match');
        expectTrue($blocked !== null && $blocked['match_band'] === 'ineligible', 'student awaiting license must not enter normal matching');
        expectTrue(in_array('applicant is licensed professional track', $blocked['eligibility_reasons'], true), 'student block reason should be explicit');

        $draft = $placements->draftAiRationale($admin, (int) $eligible['id']);
        expectTrue(($draft['draft']['draft'] ?? false) === true, 'AI assistance must be draft-only');
        expectTrue(count($store->all('ai_assistance_logs')) === 1, 'AI draft should be logged');

        $shortlist = $placements->createShortlist($admin, [
            'requisition_id' => (int) $requisition['id'],
            'title' => 'Ward nurse shortlist',
            'status' => 'shared',
            'candidate_match_ids' => [(int) $eligible['id']],
            'admin_rationale' => 'Verified and strong match.',
        ]);
        expectTrue($shortlist['status'] === 'shared', 'admin should share shortlist');
        expectTrue(count($shortlist['candidates']) === 1, 'shortlist should include selected candidate');

        $placement = $placements->createPlacement($admin, [
            'facility_id' => (int) $facility['id'],
            'requisition_id' => (int) $requisition['id'],
            'professional_user_id' => (int) $pro['id'],
            'candidate_publication_id' => (int) $publication['id'],
            'employment_type' => 'full_time',
        ]);
        expectTrue($placement['placement']['status'] === 'proposed', 'placement starts proposed');
        expectTrue(count($store->all('placement_events')) >= 1, 'placement timeline should be recorded');
        expectTrue(in_array('matching.run_completed', array_map(static fn (array $row): string => (string) $row['action'], $store->all('audit_logs')), true), 'matching run should be audited');
        @unlink($path);
    },
    'milestone 5 facility team and FHIR metadata foundations avoid unsafe secrets' => function (): void {
        $path = sys_get_temp_dir() . '/afyalink-m5-team-' . bin2hex(random_bytes(4)) . '.json';
        $store = new JsonDataStore($path);
        $audit = new AuditLogger($store);
        $facilities = new FacilityService($store, $audit);
        $access = new FacilityAccessService($store, $facilities, $audit);
        $publications = new CandidatePublicationService($store, $facilities, $access, new ConsentService($store, $audit), $audit);
        $placements = new PlacementService($store, $facilities, $access, $publications, $audit, null, new LocalRecommendationAssistant());
        $now = gmdate(DATE_ATOM);
        $owner = $store->insert('users', [
            'name' => 'Facility Owner',
            'email' => 'team-owner@example.com',
            'phone' => '0700000100',
            'password_hash' => 'hash',
            'roles' => [UserRole::FacilityAdmin->value],
            'is_active' => true,
            'email_verified_at' => $now,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $facility = $store->insert('facilities', [
            'legal_name' => 'Team Hospital',
            'display_name' => 'Team Hospital',
            'facility_type' => 'Hospital',
            'registration_number' => 'TEAM-M5',
            'county' => 'Kisumu',
            'location' => 'Kisumu',
            'email' => 'team@example.com',
            'phone' => '0700000100',
            'physical_address' => 'Kisumu',
            'contact_person' => 'Owner',
            'operational_status' => 'active',
            'review_status' => FacilityReviewStatus::Approved->value,
            'created_by' => (int) $owner['id'],
            'reviewed_by' => 1,
            'review_note' => null,
            'submitted_at' => $now,
            'reviewed_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $store->insert('facility_memberships', [
            'facility_id' => (int) $facility['id'],
            'user_id' => (int) $owner['id'],
            'role' => UserRole::FacilityAdmin->value,
            'status' => 'active',
            'invited_by' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $invitation = $placements->inviteFacilityMember(new AuthenticatedUser((int) $owner['id'], 'Facility Owner', 'team-owner@example.com', '0700000100', [UserRole::FacilityAdmin]), [
            'email' => 'recruiter@example.com',
            'role' => 'recruiter',
        ]);
        $storedInvitation = $store->all('facility_invitations')[0];
        expectTrue($invitation['email'] === 'recruiter@example.com', 'invitation response should include invited email');
        expectTrue(strlen((string) $storedInvitation['token_hash']) === 64, 'invitation token should be hashed');
        expectFalse(array_key_exists('token', $invitation), 'raw invitation token must not be returned');

        $mapping = new FhirMappingService();
        $documentReference = $mapping->documentReferenceFromCredentialMetadata([
            'document_type' => 'professional_license',
            'original_name' => 'license.pdf',
            'mime_type' => 'application/pdf',
            'checksum' => str_repeat('b', 64),
            'storage_key' => 'professionals/1/license.pdf',
        ]);
        $encoded = json_encode($documentReference, JSON_UNESCAPED_SLASHES);
        expectTrue(str_contains((string) $encoded, 'credential metadata only'), 'FHIR document reference should state metadata-only scope');
        expectFalse(str_contains((string) $encoded, 'storage_key'), 'FHIR mapping must not expose private storage keys');
        @unlink($path);
    },
    's3-compatible storage rejects unsafe keys before network access' => function (): void {
        $storage = new S3CompatibleCredentialStorage(
            endpoint: 'http://127.0.0.1:9000',
            region: 'us-east-1',
            bucket: 'afyalink-test',
            accessKey: 'test',
            secretKey: 'test',
        );

        try {
            $storage->put('../public/license.pdf', 'secret');
            throw new RuntimeException('unsafe S3 key was not rejected');
        } catch (RuntimeException $exception) {
            expectTrue(str_contains($exception->getMessage(), 'Unsafe storage key'), 'unsafe S3 key should fail locally');
        }
    },
    'pdo datastore persists rows with json decoding' => function (): void {
        if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            echo "SKIP: pdo sqlite driver unavailable\n";
            return;
        }

        $pdo = new PDO('sqlite::memory:');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, password_hash TEXT, roles TEXT, is_active TEXT, created_at TEXT, updated_at TEXT)');

        $store = new PdoPostgresDataStore($pdo);
        $saved = $store->insert('users', [
            'name' => 'DB User',
            'email' => 'db@example.com',
            'phone' => '0700000000',
            'password_hash' => 'hash',
            'roles' => [UserRole::Professional->value],
            'is_active' => true,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        expectTrue($saved['id'] === 1, 'pdo datastore should return inserted id');
        expectTrue($saved['roles'] === [UserRole::Professional->value], 'pdo datastore should decode json role arrays');
        expectTrue($saved['is_active'] === true, 'pdo datastore should decode booleans');
    },
];

$passed = 0;
foreach ($tests as $name => $test) {
    $test();
    $passed++;
    echo "PASS: {$name}\n";
}

echo "\n{$passed} tests passed.\n";
