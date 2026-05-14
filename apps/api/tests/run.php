<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Domain\Applications\ApplicationStateMachine;
use Afyalink\Core\Domain\Applications\SubmissionReadinessChecker;
use Afyalink\Core\Domain\Audit\AuditEventFactory;
use Afyalink\Core\Domain\Consent\ConsentPolicy;
use Afyalink\Core\Domain\Consent\ConsentSnapshot;
use Afyalink\Core\Domain\Credentials\CredentialRequirementRegistry;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\DocumentType;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Payments\PaymentStateMachine;
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

