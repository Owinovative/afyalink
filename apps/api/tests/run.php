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
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Payments\PaymentStateMachine;
use Afyalink\Core\Domain\Payments\PaymentIntentFactory;
use Afyalink\Core\Domain\Permissions\Permission;
use Afyalink\Core\Domain\Permissions\RolePermissionMatrix;
use Afyalink\Core\Domain\Profiles\ProfessionalProfile;
use Afyalink\Core\Domain\Regulatory\RegulatoryBodyRegistry;
use Afyalink\Core\Domain\Security\FileUploadPolicy;

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
    'submission readiness requires profile, accepted credentials, consent, and payment' => function (): void {
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
            DocumentType::CurriculumVitae->value => CredentialReviewStatus::Accepted,
            DocumentType::NationalIdOrPassport->value => CredentialReviewStatus::Accepted,
            DocumentType::ProfessionalLicense->value => CredentialReviewStatus::Accepted,
            DocumentType::AcademicCertificate->value => CredentialReviewStatus::Accepted,
        ];
        $ready = $checker->evaluate($profile, $credentials, true, PaymentStatus::Confirmed);
        expectTrue($ready->ready, 'complete profile should be ready');

        $notReady = $checker->evaluate($profile, [], true, PaymentStatus::Confirmed);
        expectFalse($notReady->ready, 'missing credentials should block submission');
        expectTrue(in_array('credential.cv', $notReady->missing, true), 'cv should be required');
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
        $application = (new ApplicationSubmissionService())->submit($profile, $credentials, true, PaymentStatus::Confirmed, 10);
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
];

$passed = 0;
foreach ($tests as $name => $test) {
    $test();
    $passed++;
    echo "PASS: {$name}\n";
}

echo "\n{$passed} tests passed.\n";
