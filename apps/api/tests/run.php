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
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\DocumentType;
use Afyalink\Core\Domain\Enums\InterviewRecommendation;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Enums\VerificationStatus;
use Afyalink\Core\Domain\Payments\PaymentStateMachine;
use Afyalink\Core\Domain\Payments\PaymentIntentFactory;
use Afyalink\Core\Domain\Permissions\Permission;
use Afyalink\Core\Domain\Permissions\RolePermissionMatrix;
use Afyalink\Core\Domain\Profiles\ProfessionalProfile;
use Afyalink\Core\Domain\Regulatory\RegulatoryBodyRegistry;
use Afyalink\Core\Domain\Security\FileUploadPolicy;
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
    'configuration defaults to postgresql and supports explicit json adapter' => function (): void {
        $config = AppConfig::fromEnv([], __DIR__);
        expectTrue($config->datastoreDriver === 'pgsql', 'default runtime datastore should be PostgreSQL');

        $json = AppConfig::fromEnv(['AFYALINK_DATASTORE' => 'json'], __DIR__);
        expectTrue($json->datastoreDriver === 'json', 'JSON datastore should be explicit');
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
