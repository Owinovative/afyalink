<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Registration;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Auth\PasswordHasher;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Application\Registration\Payments\ManualPaybillReferenceVerifier;
use Afyalink\Core\Application\Registration\Payments\MpesaRegistrationPaymentProvider;
use Afyalink\Core\Application\Registration\Payments\PaybillReferenceVerifier;
use Afyalink\Core\Application\Registration\Payments\RegistrationPaymentProvider;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\FacilityReviewStatus;
use Afyalink\Core\Domain\Enums\PaybillValidationStatus;
use Afyalink\Core\Domain\Enums\RegistrationPaymentStatus;
use Afyalink\Core\Domain\Enums\RegistrationPaymentType;
use Afyalink\Core\Domain\Enums\RegistrationStatus;
use Afyalink\Core\Domain\Enums\StudentStatus;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Registration\RegistrationStateMachine;
use Afyalink\Core\Domain\Security\SensitiveDataRedactor;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Exceptions\ValidationException;
use Afyalink\Core\Support\Validator;
use DomainException;

final readonly class RegistrationWorkflowService
{
    private const OTP_TTL_SECONDS = 900;
    private const OTP_RESEND_COOLDOWN_SECONDS = 60;
    private const OTP_MAX_SENDS_PER_HOUR = 5;
    private const OTP_MAX_ATTEMPTS_PER_CODE = 5;

    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private NotificationService $notifications,
        private RegistrationPricing $pricing = new RegistrationPricing([
            'professional' => ['label' => 'Healthcare Professional', 'amount_cents' => 200000, 'currency' => 'KES'],
            'student' => ['label' => 'Student Awaiting License', 'amount_cents' => 100000, 'currency' => 'KES'],
            'facility' => ['label' => 'Facility', 'amount_cents' => 500000, 'currency' => 'KES'],
        ]),
        private RegistrationPaymentProvider $paymentProvider = new MpesaRegistrationPaymentProvider(),
        private PaybillReferenceVerifier $paybillVerifier = new ManualPaybillReferenceVerifier(),
        private PasswordHasher $passwords = new PasswordHasher(),
        private RegistrationStateMachine $stateMachine = new RegistrationStateMachine(),
        private SensitiveDataRedactor $redactor = new SensitiveDataRedactor(),
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pricing(): array
    {
        return $this->pricing->all();
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function start(string $accountType, array $input, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $accountType = $this->normalizeAccountType($accountType);
        $this->validateStartInput($accountType, $input);
        $email = strtolower(trim((string) $input['email']));
        $phone = trim((string) $input['phone']);
        $now = gmdate(DATE_ATOM);

        $this->assertNoActiveUser($email, $phone);
        $existing = $this->store->first('registration_records', static function (array $row) use ($email, $phone): bool {
            return strtolower((string) ($row['email'] ?? '')) === $email || (string) ($row['phone'] ?? '') === $phone;
        });

        if ($existing !== null) {
            if (($existing['status'] ?? '') === RegistrationStatus::Active->value) {
                throw new ValidationException(['email' => ['Registration for this email is already active.']]);
            }

            if (($existing['account_type'] ?? '') !== $accountType) {
                throw new ValidationException(['account_type' => ['An in-progress registration already exists for this email or phone.']]);
            }

            $status = RegistrationStatus::from((string) $existing['status']);
            if (in_array($status, [RegistrationStatus::Draft, RegistrationStatus::PaymentPending, RegistrationStatus::InformationRequested], true)) {
                $updated = $this->store->update('registration_records', (int) $existing['id'], [
                    'name' => trim((string) $input['name']),
                    'email' => $email,
                    'phone' => $phone,
                    'details' => $this->detailsFor($accountType, $input),
                    'updated_at' => $now,
                ]);

                if ($status === RegistrationStatus::Draft) {
                    $updated = $this->transition($updated, RegistrationStatus::PaymentPending, null, 'registration.payment_pending', [], $ipAddress, $userAgent);
                } elseif ($status === RegistrationStatus::InformationRequested) {
                    $updated = $this->transition($updated, RegistrationStatus::ApprovalPending, null, 'registration.information_resubmitted', [], $ipAddress, $userAgent);
                }

                return $this->safeRegistration($updated);
            }

            return $this->safeRegistration($existing);
        }

        $price = $this->pricing->forAccountType($accountType);
        $registration = $this->store->insert('registration_records', [
            'registration_reference' => $this->newReference(),
            'account_type' => $accountType,
            'status' => RegistrationStatus::Draft->value,
            'name' => trim((string) $input['name']),
            'email' => $email,
            'phone' => $phone,
            'details' => $this->detailsFor($accountType, $input),
            'required_amount_cents' => (int) $price['amount_cents'],
            'currency' => (string) $price['currency'],
            'password_hash' => null,
            'password_created_at' => null,
            'email_verified_at' => null,
            'approval_status' => null,
            'approval_note' => null,
            'approved_by' => null,
            'approved_at' => null,
            'rejected_at' => null,
            'user_id' => null,
            'facility_id' => null,
            'abandoned_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->recordEvent($registration, null, 'registration.started', null, RegistrationStatus::Draft, [
            'account_type' => $accountType,
            'required_amount_cents' => $price['amount_cents'],
            'currency' => $price['currency'],
        ], $ipAddress, $userAgent);
        $this->notifications->registrationStarted($registration);

        $registration = $this->transition($registration, RegistrationStatus::PaymentPending, null, 'registration.payment_pending', [], $ipAddress, $userAgent);

        return $this->safeRegistration($registration);
    }

    /**
     * @return array<string, mixed>
     */
    public function detailByReference(string $reference): array
    {
        return $this->safeRegistration($this->requireRegistrationByReference($reference));
    }

    /**
     * @return array<string, mixed>
     */
    public function initiateStkPayment(string $reference, string $phoneNumber, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $registration = $this->requireRegistrationByReference($reference);
        $this->requireStatus($registration, RegistrationStatus::PaymentPending);
        $this->assertNoVerifiedRegistrationPayment((int) $registration['id']);
        $phoneNumber = trim($phoneNumber);
        if ($phoneNumber === '') {
            throw new ValidationException(['phone_number' => ['Phone number is required for STK Push.']]);
        }

        $provider = $this->paymentProvider->initiateStk(
            $registration,
            $phoneNumber,
            (int) $registration['required_amount_cents'],
            (string) $registration['currency'],
        );
        $now = gmdate(DATE_ATOM);
        $payment = $this->store->insert('registration_payments', [
            'registration_id' => (int) $registration['id'],
            'payment_type' => RegistrationPaymentType::MpesaStk->value,
            'amount_cents' => (int) $registration['required_amount_cents'],
            'currency' => (string) $registration['currency'],
            'payer_phone' => $phoneNumber,
            'reference' => $registration['registration_reference'],
            'status' => RegistrationPaymentStatus::Pending->value,
            'provider' => (string) ($provider['provider'] ?? $this->paymentProvider->providerCode()),
            'provider_status' => 'awaiting_callback',
            'transaction_id' => null,
            'checkout_request_id' => $provider['checkout_request_id'] ?? null,
            'merchant_request_id' => $provider['merchant_request_id'] ?? null,
            'validation_status' => null,
            'validation_note' => $provider['customer_message'] ?? null,
            'callback_payload_redacted' => [],
            'verified_by' => null,
            'verified_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->recordEvent($registration, null, 'registration.payment_submitted', RegistrationStatus::PaymentPending, RegistrationStatus::PaymentPending, [
            'payment_id' => $payment['id'],
            'payment_type' => RegistrationPaymentType::MpesaStk->value,
        ], $ipAddress, $userAgent);
        $this->notifications->registrationPaymentReceived($registration, $payment);

        return [
            'registration' => $this->safeRegistration($registration),
            'payment' => $this->safePayment($payment),
            'provider' => $provider,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function submitPaybillReference(
        string $reference,
        string $paymentReference,
        ?string $payerPhone,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $registration = $this->requireRegistrationByReference($reference);
        $this->requireStatus($registration, RegistrationStatus::PaymentPending);
        $this->assertNoVerifiedRegistrationPayment((int) $registration['id']);
        $paymentReference = strtoupper(trim($paymentReference));
        if ($paymentReference === '') {
            throw new ValidationException(['reference' => ['M-PESA payment reference is required.']]);
        }
        $this->assertReferenceNotReused($paymentReference);

        $validation = $this->paybillVerifier->verify(
            $paymentReference,
            (int) $registration['required_amount_cents'],
            (string) $registration['currency'],
            $payerPhone,
        );
        $status = $validation->status === PaybillValidationStatus::Validated
            ? RegistrationPaymentStatus::Verified
            : ($validation->status === PaybillValidationStatus::Rejected ? RegistrationPaymentStatus::Rejected : RegistrationPaymentStatus::Pending);
        $now = gmdate(DATE_ATOM);
        $payment = $this->store->insert('registration_payments', [
            'registration_id' => (int) $registration['id'],
            'payment_type' => RegistrationPaymentType::PaybillReference->value,
            'amount_cents' => (int) $registration['required_amount_cents'],
            'currency' => (string) $registration['currency'],
            'payer_phone' => $payerPhone !== null ? trim($payerPhone) : null,
            'reference' => $paymentReference,
            'status' => $status->value,
            'provider' => 'mpesa_paybill',
            'provider_status' => $validation->status->value,
            'transaction_id' => $validation->transactionId,
            'checkout_request_id' => null,
            'merchant_request_id' => null,
            'validation_status' => $validation->status->value,
            'validation_note' => $validation->message,
            'callback_payload_redacted' => [],
            'verified_by' => null,
            'verified_at' => $status === RegistrationPaymentStatus::Verified ? $now : null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->recordEvent($registration, null, 'registration.payment_submitted', RegistrationStatus::PaymentPending, RegistrationStatus::PaymentPending, [
            'payment_id' => $payment['id'],
            'payment_type' => RegistrationPaymentType::PaybillReference->value,
            'validation_status' => $validation->status->value,
        ], $ipAddress, $userAgent);
        $this->notifications->registrationPaymentReceived($registration, $payment);

        if ($status === RegistrationPaymentStatus::Verified) {
            $registration = $this->markPaymentVerified($registration, $payment, null, 'registration.payment_verified', $ipAddress, $userAgent);
            $payment = $this->store->find('registration_payments', (int) $payment['id']) ?? $payment;
        }

        return [
            'registration' => $this->safeRegistration($registration),
            'payment' => $this->safePayment($payment),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createPassword(string $reference, string $password, string $confirmation, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        if ($password !== $confirmation) {
            throw new ValidationException(['password_confirmation' => ['Password confirmation does not match.']]);
        }
        $this->assertPassword($password);
        $registration = $this->requireRegistrationByReference($reference);
        $this->requireStatus($registration, RegistrationStatus::PaymentVerified);
        $now = gmdate(DATE_ATOM);
        $registration = $this->store->update('registration_records', (int) $registration['id'], [
            'password_hash' => $this->passwords->hash($password),
            'password_created_at' => $now,
            'updated_at' => $now,
        ]);
        $registration = $this->transition($registration, RegistrationStatus::PasswordCreated, null, 'registration.password_created', [], $ipAddress, $userAgent);
        $registration = $this->sendOtp($registration, $ipAddress, $userAgent);

        return $this->safeRegistration($registration);
    }

    /**
     * @return array<string, mixed>
     */
    public function resendOtp(string $reference, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $registration = $this->requireRegistrationByReference($reference);
        if (($registration['status'] ?? '') !== RegistrationStatus::EmailVerificationPending->value) {
            throw new DomainException('OTP can only be resent after password creation.');
        }

        return $this->safeRegistration($this->sendOtp($registration, $ipAddress, $userAgent));
    }

    /**
     * @return array<string, mixed>
     */
    public function verifyOtp(string $reference, string $code, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $registration = $this->requireRegistrationByReference($reference);
        $this->requireStatus($registration, RegistrationStatus::EmailVerificationPending);
        $code = trim($code);
        if (!preg_match('/^\d{6}$/', $code)) {
            throw new ValidationException(['code' => ['Enter the 6 digit verification code.']]);
        }

        $otp = $this->activeOtpForCode((int) $registration['id'], $code);
        if ($otp === null) {
            $latest = $this->latestActiveOtp((int) $registration['id']);
            if ($latest !== null) {
                $this->store->update('registration_email_otps', (int) $latest['id'], [
                    'attempt_count' => (int) ($latest['attempt_count'] ?? 0) + 1,
                    'last_attempt_at' => gmdate(DATE_ATOM),
                ]);
            }
            $this->audit->record(null, 'registration.otp_invalid', 'Registration', (string) $registration['id'], [], $ipAddress, $userAgent);
            throw new ValidationException(['code' => ['Verification code is invalid.']]);
        }

        if ((int) ($otp['attempt_count'] ?? 0) >= self::OTP_MAX_ATTEMPTS_PER_CODE) {
            throw new ValidationException(['code' => ['Too many attempts. Request a new code.']]);
        }

        if (strtotime((string) $otp['expires_at']) <= time()) {
            throw new ValidationException(['code' => ['Verification code has expired.']]);
        }

        $verifiedAt = gmdate(DATE_ATOM);
        $this->store->update('registration_email_otps', (int) $otp['id'], [
            'used_at' => $verifiedAt,
            'attempt_count' => (int) ($otp['attempt_count'] ?? 0) + 1,
            'last_attempt_at' => $verifiedAt,
        ]);
        $registration = $this->store->update('registration_records', (int) $registration['id'], [
            'email_verified_at' => $verifiedAt,
            'updated_at' => $verifiedAt,
        ]);
        $registration = $this->transition($registration, RegistrationStatus::EmailVerified, null, 'registration.otp_verified', [], $ipAddress, $userAgent);
        $this->notifications->registrationOtpVerified($registration);

        if (($registration['account_type'] ?? '') === 'facility') {
            $registration = $this->transition($registration, RegistrationStatus::ApprovalPending, null, 'registration.facility_approval_pending', [], $ipAddress, $userAgent);
        } else {
            $registration = $this->activateRegistration($registration, null, 'registration.activated', null, $ipAddress, $userAgent);
        }

        return $this->safeRegistration($registration);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function handleMpesaCallback(array $payload, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $parsed = $this->paymentProvider->parseCallback($payload);
        $payment = $this->findCallbackPayment($parsed);
        if ($payment === null) {
            return ['matched_registration_payment' => false, 'status' => 'unmatched'];
        }

        $registration = $this->store->find('registration_records', (int) $payment['registration_id']);
        if ($registration === null) {
            return ['matched_registration_payment' => false, 'status' => 'orphaned_payment'];
        }

        $resultCode = (int) ($parsed['result_code'] ?? -1);
        $status = $resultCode === 0 ? RegistrationPaymentStatus::Verified : RegistrationPaymentStatus::Rejected;
        $changes = [
            'provider_status' => $resultCode === 0 ? 'validated' : 'rejected',
            'transaction_id' => $parsed['provider_reference'] ?? ($payment['transaction_id'] ?? null),
            'reference' => $parsed['provider_reference'] ?? ($payment['reference'] ?? null),
            'payer_phone' => $parsed['phone_number'] ?? ($payment['payer_phone'] ?? null),
            'status' => $status->value,
            'validation_status' => $resultCode === 0 ? PaybillValidationStatus::Validated->value : PaybillValidationStatus::Rejected->value,
            'validation_note' => $parsed['result_description'] ?? null,
            'callback_payload_redacted' => $this->redactor->redact($payload),
            'verified_at' => $status === RegistrationPaymentStatus::Verified ? gmdate(DATE_ATOM) : null,
            'updated_at' => gmdate(DATE_ATOM),
        ];
        $updatedPayment = $this->store->update('registration_payments', (int) $payment['id'], $changes);

        if ($status === RegistrationPaymentStatus::Verified && ($registration['status'] ?? '') === RegistrationStatus::PaymentPending->value) {
            $registration = $this->markPaymentVerified($registration, $updatedPayment, null, 'registration.payment_verified', $ipAddress, $userAgent);
        } else {
            $this->recordEvent($registration, null, 'registration.payment_rejected', RegistrationStatus::from((string) $registration['status']), RegistrationStatus::from((string) $registration['status']), [
                'payment_id' => $updatedPayment['id'],
                'result_description' => $parsed['result_description'] ?? null,
            ], $ipAddress, $userAgent);
        }

        return [
            'matched_registration_payment' => true,
            'status' => $status->value,
            'payment' => $this->safePayment($updatedPayment),
            'registration' => $this->safeRegistration($registration),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminQueue(?string $status = null, ?string $search = null): array
    {
        $rows = $this->store->all('registration_records');
        if ($status !== null && trim($status) !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        if ($search !== null && trim($search) !== '') {
            $needle = strtolower(trim($search));
            $rows = array_values(array_filter($rows, static function (array $row) use ($needle): bool {
                return str_contains(strtolower((string) ($row['registration_reference'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($row['name'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($row['email'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($row['phone'] ?? '')), $needle);
            }));
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['updated_at'] ?? ''), (string) ($a['updated_at'] ?? '')));

        $overview = [
            'total' => 0,
            'pending_payments' => 0,
            'pending_facility_reviews' => 0,
            'rejected_registrations' => 0,
            'verification_queue' => 0,
            'active' => 0,
        ];
        foreach ($this->store->all('registration_records') as $row) {
            $overview['total']++;
            $rowStatus = (string) ($row['status'] ?? '');
            if ($rowStatus === RegistrationStatus::PaymentPending->value) {
                $overview['pending_payments']++;
            }
            if ($rowStatus === RegistrationStatus::ApprovalPending->value) {
                $overview['pending_facility_reviews']++;
            }
            if ($rowStatus === RegistrationStatus::Rejected->value) {
                $overview['rejected_registrations']++;
            }
            if (in_array($rowStatus, [RegistrationStatus::PasswordCreated->value, RegistrationStatus::EmailVerificationPending->value], true)) {
                $overview['verification_queue']++;
            }
            if ($rowStatus === RegistrationStatus::Active->value) {
                $overview['active']++;
            }
        }

        return [
            'overview' => $overview,
            'registrations' => array_map(fn (array $row): array => $this->safeRegistration($row, true), $rows),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminUpdatePayment(
        AuthenticatedUser $admin,
        int $paymentId,
        RegistrationPaymentStatus $status,
        ?string $note,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $payment = $this->store->find('registration_payments', $paymentId);
        if ($payment === null) {
            throw new NotFoundException('Registration payment was not found.');
        }
        $registration = $this->store->find('registration_records', (int) $payment['registration_id']);
        if ($registration === null) {
            throw new NotFoundException('Registration was not found.');
        }
        if (($payment['status'] ?? '') === RegistrationPaymentStatus::Verified->value && $status === RegistrationPaymentStatus::Verified) {
            return ['registration' => $this->safeRegistration($registration, true), 'payment' => $this->safePayment($payment)];
        }
        if (($payment['status'] ?? '') !== RegistrationPaymentStatus::Pending->value && $status !== RegistrationPaymentStatus::Refunded) {
            throw new DomainException('Only pending registration payments can be verified or rejected.');
        }
        if (!in_array($status, [RegistrationPaymentStatus::Verified, RegistrationPaymentStatus::Rejected, RegistrationPaymentStatus::Refunded], true)) {
            throw new DomainException('Unsupported registration payment action.');
        }

        $updatedPayment = $this->store->update('registration_payments', $paymentId, [
            'status' => $status->value,
            'provider_status' => $status->value,
            'validation_status' => $status === RegistrationPaymentStatus::Verified ? PaybillValidationStatus::Validated->value : PaybillValidationStatus::Rejected->value,
            'validation_note' => $note,
            'verified_by' => $status === RegistrationPaymentStatus::Verified ? $admin->id : null,
            'verified_at' => $status === RegistrationPaymentStatus::Verified ? gmdate(DATE_ATOM) : null,
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        if ($status === RegistrationPaymentStatus::Verified && ($registration['status'] ?? '') === RegistrationStatus::PaymentPending->value) {
            $registration = $this->markPaymentVerified($registration, $updatedPayment, $admin->id, 'registration.payment_verified', $ipAddress, $userAgent);
        } elseif ($status === RegistrationPaymentStatus::Rejected) {
            $this->recordEvent($registration, $admin->id, 'registration.payment_rejected', RegistrationStatus::from((string) $registration['status']), RegistrationStatus::from((string) $registration['status']), [
                'payment_id' => $paymentId,
                'note' => $note,
            ], $ipAddress, $userAgent);
        }

        return [
            'registration' => $this->safeRegistration($registration, true),
            'payment' => $this->safePayment($updatedPayment),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminReviewFacility(
        AuthenticatedUser $admin,
        int $registrationId,
        string $action,
        ?string $note,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $registration = $this->store->find('registration_records', $registrationId);
        if ($registration === null || ($registration['account_type'] ?? '') !== 'facility') {
            throw new NotFoundException('Facility registration was not found.');
        }
        $status = RegistrationStatus::from((string) $registration['status']);
        if (!in_array($status, [RegistrationStatus::ApprovalPending, RegistrationStatus::InformationRequested], true)) {
            throw new DomainException('Facility registration is not waiting for admin review.');
        }

        return match ($action) {
            'approve' => [
                'registration' => $this->safeRegistration($this->activateRegistration($registration, $admin->id, 'registration.facility_approved', $note, $ipAddress, $userAgent), true),
            ],
            'reject' => [
                'registration' => $this->safeRegistration($this->rejectFacilityRegistration($registration, $admin, $note, $ipAddress, $userAgent), true),
            ],
            'request_information' => [
                'registration' => $this->safeRegistration($this->requestFacilityInformation($registration, $admin, $note, $ipAddress, $userAgent), true),
            ],
            default => throw new DomainException('Unsupported facility registration review action.'),
        };
    }

    public function cleanupAbandoned(int $olderThanDays = 30): array
    {
        $threshold = time() - (max(1, $olderThanDays) * 86400);
        $updated = [];
        foreach ($this->store->all('registration_records') as $registration) {
            $status = RegistrationStatus::from((string) $registration['status']);
            if (!in_array($status, [RegistrationStatus::Draft, RegistrationStatus::PaymentPending], true)) {
                continue;
            }
            if (strtotime((string) $registration['updated_at']) > $threshold) {
                continue;
            }
            $updated[] = $this->safeRegistration($this->transition(
                $registration,
                RegistrationStatus::Abandoned,
                null,
                'registration.abandoned',
                ['older_than_days' => $olderThanDays],
                null,
                null,
            ), true);
        }

        return ['abandoned_count' => count($updated), 'registrations' => $updated];
    }

    /**
     * @param array<string, mixed> $registration
     * @param array<string, mixed> $payment
     * @return array<string, mixed>
     */
    private function markPaymentVerified(array $registration, array $payment, ?int $actorId, string $action, ?string $ipAddress, ?string $userAgent): array
    {
        if (($registration['status'] ?? '') !== RegistrationStatus::PaymentPending->value) {
            return $registration;
        }

        $registration = $this->transition($registration, RegistrationStatus::PaymentVerified, $actorId, $action, [
            'payment_id' => $payment['id'],
            'payment_type' => $payment['payment_type'],
            'amount_cents' => $payment['amount_cents'],
        ], $ipAddress, $userAgent);
        $this->notifications->registrationPaymentVerified($registration, $payment);

        return $registration;
    }

    /**
     * @param array<string, mixed> $registration
     * @return array<string, mixed>
     */
    private function sendOtp(array $registration, ?string $ipAddress, ?string $userAgent): array
    {
        $now = time();
        $recentOtps = $this->store->where('registration_email_otps', static fn (array $row): bool => (int) $row['registration_id'] === (int) $registration['id']);
        foreach ($recentOtps as $otp) {
            $sentAt = strtotime((string) ($otp['sent_at'] ?? $otp['created_at'] ?? ''));
            if ($sentAt !== false && $sentAt > $now - self::OTP_RESEND_COOLDOWN_SECONDS) {
                throw new ValidationException(['code' => ['Wait before requesting another verification code.']]);
            }
        }
        $sendsLastHour = count(array_filter($recentOtps, static function (array $otp) use ($now): bool {
            $sentAt = strtotime((string) ($otp['sent_at'] ?? $otp['created_at'] ?? ''));

            return $sentAt !== false && $sentAt > $now - 3600;
        }));
        if ($sendsLastHour >= self::OTP_MAX_SENDS_PER_HOUR) {
            throw new ValidationException(['code' => ['Too many verification codes requested. Try again later.']]);
        }

        foreach ($this->store->where('registration_email_otps', static fn (array $row): bool => (int) $row['registration_id'] === (int) $registration['id'] && empty($row['used_at'])) as $otp) {
            $this->store->update('registration_email_otps', (int) $otp['id'], ['used_at' => gmdate(DATE_ATOM)]);
        }

        $code = (string) random_int(100000, 999999);
        $expiresAt = gmdate(DATE_ATOM, $now + self::OTP_TTL_SECONDS);
        $otp = $this->store->insert('registration_email_otps', [
            'registration_id' => (int) $registration['id'],
            'code_hash' => $this->otpHash((int) $registration['id'], $code),
            'expires_at' => $expiresAt,
            'used_at' => null,
            'sent_at' => gmdate(DATE_ATOM, $now),
            'resend_count' => $sendsLastHour,
            'attempt_count' => 0,
            'last_attempt_at' => null,
            'created_at' => gmdate(DATE_ATOM, $now),
        ]);

        if (($registration['status'] ?? '') === RegistrationStatus::PasswordCreated->value) {
            $registration = $this->transition($registration, RegistrationStatus::EmailVerificationPending, null, 'registration.otp_sent', [
                'otp_id' => $otp['id'],
                'expires_at' => $expiresAt,
            ], $ipAddress, $userAgent);
        } else {
            $this->recordEvent($registration, null, 'registration.otp_sent', RegistrationStatus::EmailVerificationPending, RegistrationStatus::EmailVerificationPending, [
                'otp_id' => $otp['id'],
                'expires_at' => $expiresAt,
            ], $ipAddress, $userAgent);
        }

        $this->notifications->registrationOtp($registration, $code, $expiresAt);

        return $registration;
    }

    /**
     * @param array<string, mixed> $registration
     * @return array<string, mixed>
     */
    private function activateRegistration(
        array $registration,
        ?int $actorId,
        string $action,
        ?string $note,
        ?string $ipAddress,
        ?string $userAgent,
    ): array {
        if (($registration['status'] ?? '') === RegistrationStatus::Active->value) {
            return $registration;
        }

        $this->assertActivationReady($registration);
        $now = gmdate(DATE_ATOM);
        $details = is_array($registration['details'] ?? null) ? $registration['details'] : [];
        $roles = ($registration['account_type'] ?? '') === 'facility'
            ? [UserRole::FacilityAdmin]
            : [UserRole::Professional];

        $userId = $registration['user_id'] !== null ? (int) $registration['user_id'] : null;
        if ($userId === null) {
            $this->assertNoActiveUser((string) $registration['email'], (string) $registration['phone']);
            $user = $this->store->insert('users', [
                'name' => (string) $registration['name'],
                'email' => (string) $registration['email'],
                'phone' => (string) $registration['phone'],
                'password_hash' => (string) $registration['password_hash'],
                'roles' => array_map(static fn (UserRole $role): string => $role->value, $roles),
                'status' => 'active',
                'is_active' => true,
                'email_verified_at' => $registration['email_verified_at'],
                'last_login_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $userId = (int) $user['id'];
        }

        $changes = [
            'user_id' => $userId,
            'approval_status' => ($registration['account_type'] ?? '') === 'facility' ? 'approved' : null,
            'approval_note' => $note,
            'approved_by' => ($registration['account_type'] ?? '') === 'facility' ? $actorId : null,
            'approved_at' => ($registration['account_type'] ?? '') === 'facility' ? $now : null,
            'updated_at' => $now,
        ];

        if (($registration['account_type'] ?? '') === 'student') {
            $this->createStudentProfile($userId, $registration, $details, $now);
        }

        if (($registration['account_type'] ?? '') === 'facility') {
            $facility = $this->createApprovedFacility($userId, $registration, $details, $actorId, $note, $now);
            $changes['facility_id'] = (int) $facility['id'];
        }

        $registration = $this->store->update('registration_records', (int) $registration['id'], $changes);
        $registration = $this->transition($registration, RegistrationStatus::Active, $actorId, $action, [
            'user_id' => $userId,
            'facility_id' => $registration['facility_id'] ?? null,
            'note' => $note,
        ], $ipAddress, $userAgent);

        if (($registration['account_type'] ?? '') === 'facility') {
            $this->notifications->registrationFacilityApproved($registration);
        }

        return $registration;
    }

    /**
     * @param array<string, mixed> $registration
     * @return array<string, mixed>
     */
    private function rejectFacilityRegistration(array $registration, AuthenticatedUser $admin, ?string $note, ?string $ipAddress, ?string $userAgent): array
    {
        if (trim((string) $note) === '') {
            throw new DomainException('A rejection note is required.');
        }
        $registration = $this->store->update('registration_records', (int) $registration['id'], [
            'approval_status' => 'rejected',
            'approval_note' => $note,
            'approved_by' => $admin->id,
            'rejected_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $registration = $this->transition($registration, RegistrationStatus::Rejected, $admin->id, 'registration.facility_rejected', ['note' => $note], $ipAddress, $userAgent);
        $this->notifications->registrationFacilityRejected($registration, $note);

        return $registration;
    }

    /**
     * @param array<string, mixed> $registration
     * @return array<string, mixed>
     */
    private function requestFacilityInformation(array $registration, AuthenticatedUser $admin, ?string $note, ?string $ipAddress, ?string $userAgent): array
    {
        if (trim((string) $note) === '') {
            throw new DomainException('A request information note is required.');
        }
        $registration = $this->store->update('registration_records', (int) $registration['id'], [
            'approval_status' => 'information_requested',
            'approval_note' => $note,
            'approved_by' => $admin->id,
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $registration = $this->transition($registration, RegistrationStatus::InformationRequested, $admin->id, 'registration.facility_information_requested', ['note' => $note], $ipAddress, $userAgent);
        $this->notifications->registrationFacilityInformationRequested($registration, $note);

        return $registration;
    }

    /**
     * @param array<string, mixed> $registration
     * @param array<string, mixed> $details
     */
    private function createStudentProfile(int $userId, array $registration, array $details, string $now): void
    {
        $existing = $this->store->first('profiles', static fn (array $row): bool => (int) ($row['user_id'] ?? 0) === $userId);
        if ($existing !== null) {
            return;
        }

        $studentStatus = StudentStatus::from((string) $details['student_status']);
        $this->store->insert('profiles', [
            'user_id' => $userId,
            'applicant_track' => ApplicantTrack::StudentAwaitingLicense->value,
            'student_status' => $studentStatus->value,
            'name' => (string) $registration['name'],
            'email' => (string) $registration['email'],
            'phone' => (string) $registration['phone'],
            'profession' => (string) $details['target_profession'],
            'target_profession' => (string) $details['target_profession'],
            'regulatory_body' => (string) ($details['expected_regulatory_body'] ?? ''),
            'expected_regulatory_body' => (string) ($details['expected_regulatory_body'] ?? ''),
            'license_number' => '',
            'county' => (string) $details['county'],
            'years_experience' => 0,
            'institution_name' => (string) $details['institution_name'],
            'programme_or_course' => (string) $details['programme_or_course'],
            'graduation_or_completion_date' => $details['graduation_or_completion_date'] ?? null,
            'prelicensure_note' => $details['notes'] ?? null,
            'conversion_review_status' => 'waiting_for_license',
            'license_uploaded_at' => null,
            'converted_to_licensed_at' => null,
            'availability' => $details['availability_after_licensure'] ?? null,
            'work_preferences' => [
                'availability_after_licensure' => $details['availability_after_licensure'] ?? null,
                'placement_type' => $details['placement_type'] ?? null,
            ],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * @param array<string, mixed> $registration
     * @param array<string, mixed> $details
     * @return array<string, mixed>
     */
    private function createApprovedFacility(int $userId, array $registration, array $details, ?int $adminId, ?string $note, string $now): array
    {
        $existing = $registration['facility_id'] !== null ? $this->store->find('facilities', (int) $registration['facility_id']) : null;
        if ($existing !== null) {
            return $existing;
        }

        $facility = $this->store->insert('facilities', [
            'legal_name' => (string) $details['legal_name'],
            'display_name' => (string) $details['display_name'],
            'facility_type' => (string) $details['facility_type'],
            'registration_number' => $details['registration_number'] ?? null,
            'county' => (string) $details['county'],
            'location' => $details['location'] ?? null,
            'email' => (string) $registration['email'],
            'phone' => (string) $registration['phone'],
            'physical_address' => $details['physical_address'] ?? null,
            'contact_person' => (string) $details['contact_person'],
            'operational_status' => 'active',
            'review_status' => FacilityReviewStatus::Approved->value,
            'created_by' => $userId,
            'reviewed_by' => $adminId,
            'review_note' => $note,
            'submitted_at' => $registration['email_verified_at'] ?? $now,
            'reviewed_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->store->insert('facility_memberships', [
            'facility_id' => (int) $facility['id'],
            'user_id' => $userId,
            'role' => UserRole::FacilityAdmin->value,
            'status' => 'active',
            'invited_by' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $facility;
    }

    /**
     * @param array<string, mixed> $registration
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    private function transition(
        array $registration,
        RegistrationStatus $to,
        ?int $actorId,
        string $action,
        array $metadata,
        ?string $ipAddress,
        ?string $userAgent,
    ): array {
        $from = RegistrationStatus::from((string) $registration['status']);
        if ($from === $to) {
            $this->recordEvent($registration, $actorId, $action, $from, $to, $metadata, $ipAddress, $userAgent);

            return $registration;
        }
        $this->stateMachine->assertTransition($from, $to);
        $updated = $this->store->update('registration_records', (int) $registration['id'], [
            'status' => $to->value,
            'updated_at' => gmdate(DATE_ATOM),
            'abandoned_at' => $to === RegistrationStatus::Abandoned ? gmdate(DATE_ATOM) : ($registration['abandoned_at'] ?? null),
        ]);
        $this->recordEvent($updated, $actorId, $action, $from, $to, $metadata, $ipAddress, $userAgent);

        return $updated;
    }

    /**
     * @param array<string, mixed> $registration
     * @param array<string, mixed> $metadata
     */
    private function recordEvent(
        array $registration,
        ?int $actorId,
        string $action,
        ?RegistrationStatus $from,
        RegistrationStatus $to,
        array $metadata,
        ?string $ipAddress,
        ?string $userAgent,
    ): void {
        $event = $this->store->insert('registration_decisions', [
            'registration_id' => (int) $registration['id'],
            'actor_id' => $actorId,
            'action' => $action,
            'from_status' => $from?->value,
            'to_status' => $to->value,
            'note' => $metadata['note'] ?? null,
            'metadata' => $metadata,
            'created_at' => gmdate(DATE_ATOM),
        ]);
        $this->audit->record($actorId, $action, 'Registration', (string) $registration['id'], [
            'registration_reference' => $registration['registration_reference'] ?? null,
            'from' => $from?->value,
            'to' => $to->value,
            'decision_id' => $event['id'] ?? null,
            ...$metadata,
        ], $ipAddress, $userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    private function requireRegistrationByReference(string $reference): array
    {
        $registration = $this->store->first('registration_records', static fn (array $row): bool => ($row['registration_reference'] ?? '') === strtoupper(trim($reference)));
        if ($registration === null) {
            throw new NotFoundException('Registration was not found.');
        }

        return $registration;
    }

    /**
     * @param array<string, mixed> $registration
     */
    private function requireStatus(array $registration, RegistrationStatus $status): void
    {
        if (($registration['status'] ?? '') !== $status->value) {
            throw new DomainException(sprintf('Registration must be %s before this step.', $status->value));
        }
    }

    /**
     * @param array<string, mixed> $registration
     */
    private function assertActivationReady(array $registration): void
    {
        if (empty($registration['password_hash'])) {
            throw new DomainException('Password must be created before account activation.');
        }
        if (empty($registration['email_verified_at'])) {
            throw new DomainException('Email must be verified before account activation.');
        }
        if (($registration['account_type'] ?? '') === 'facility' && ($registration['status'] ?? '') !== RegistrationStatus::ApprovalPending->value) {
            throw new DomainException('Facility registration requires admin approval before activation.');
        }
        if (($registration['account_type'] ?? '') !== 'facility' && ($registration['status'] ?? '') !== RegistrationStatus::EmailVerified->value) {
            throw new DomainException('Registration email must be verified before activation.');
        }
    }

    private function assertNoVerifiedRegistrationPayment(int $registrationId): void
    {
        $verified = $this->store->first('registration_payments', static fn (array $row): bool => (int) ($row['registration_id'] ?? 0) === $registrationId && ($row['status'] ?? '') === RegistrationPaymentStatus::Verified->value);
        if ($verified !== null) {
            throw new DomainException('Registration payment is already verified.');
        }
    }

    private function assertReferenceNotReused(string $reference): void
    {
        $existingRegistrationPayment = $this->store->first('registration_payments', static fn (array $row): bool => strtoupper((string) ($row['reference'] ?? '')) === $reference);
        $existingMilestonePayment = $this->store->first('payments', static fn (array $row): bool => strtoupper((string) ($row['provider_reference'] ?? $row['external_reference'] ?? '')) === $reference);
        if ($existingRegistrationPayment !== null || $existingMilestonePayment !== null) {
            throw new ValidationException(['reference' => ['This payment reference has already been used.']]);
        }
    }

    /**
     * @param array<string, mixed> $parsed
     * @return array<string, mixed>|null
     */
    private function findCallbackPayment(array $parsed): ?array
    {
        return $this->store->first('registration_payments', static function (array $row) use ($parsed): bool {
            foreach ([
                'checkout_request_id' => 'checkout_request_id',
                'merchant_request_id' => 'merchant_request_id',
                'reference' => 'provider_reference',
            ] as $rowField => $parsedField) {
                $expected = $parsed[$parsedField] ?? null;
                if ($expected !== null && $expected !== '' && ($row[$rowField] ?? null) === $expected) {
                    return true;
                }
            }

            $accountReference = $parsed['account_reference'] ?? null;

            return $accountReference !== null && $accountReference !== '' && ($row['reference'] ?? null) === $accountReference;
        });
    }

    private function activeOtpForCode(int $registrationId, string $code): ?array
    {
        $hash = $this->otpHash($registrationId, $code);

        return $this->store->first('registration_email_otps', static fn (array $row): bool => (int) $row['registration_id'] === $registrationId && ($row['code_hash'] ?? '') === $hash && empty($row['used_at']));
    }

    private function latestActiveOtp(int $registrationId): ?array
    {
        $rows = $this->store->where('registration_email_otps', static fn (array $row): bool => (int) $row['registration_id'] === $registrationId && empty($row['used_at']));
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));

        return $rows[0] ?? null;
    }

    private function otpHash(int $registrationId, string $code): string
    {
        return hash('sha256', $registrationId . '|' . $code);
    }

    private function assertNoActiveUser(string $email, string $phone): void
    {
        $existingEmail = $this->store->first('users', static fn (array $row): bool => strtolower((string) ($row['email'] ?? '')) === $email);
        if ($existingEmail !== null) {
            throw new ValidationException(['email' => ['An active account already exists for this email.']]);
        }
        $existingPhone = $this->store->first('users', static fn (array $row): bool => (string) ($row['phone'] ?? '') === $phone);
        if ($existingPhone !== null) {
            throw new ValidationException(['phone' => ['An active account already exists for this phone number.']]);
        }
    }

    /**
     * @param array<string, mixed> $input
     */
    private function validateStartInput(string $accountType, array $input): void
    {
        Validator::requireFields($input, ['name', 'email', 'phone']);
        Validator::email('email', $input['email']);

        if ($accountType === 'student') {
            Validator::requireFields($input, ['student_status', 'target_profession', 'institution_name', 'programme_or_course', 'county']);
            StudentStatus::from((string) $input['student_status']);
        }

        if ($accountType === 'facility') {
            Validator::requireFields($input, ['legal_name', 'display_name', 'facility_type', 'county', 'contact_person']);
        }
    }

    private function normalizeAccountType(string $accountType): string
    {
        $accountType = strtolower(trim($accountType));
        if (!in_array($accountType, ['professional', 'student', 'facility'], true)) {
            throw new ValidationException(['account_type' => ['Choose professional, student, or facility.']]);
        }

        return $accountType;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function detailsFor(string $accountType, array $input): array
    {
        $allowed = match ($accountType) {
            'student' => [
                'student_status',
                'target_profession',
                'institution_name',
                'programme_or_course',
                'graduation_or_completion_date',
                'expected_regulatory_body',
                'county',
                'placement_type',
                'availability_after_licensure',
                'notes',
            ],
            'facility' => [
                'legal_name',
                'display_name',
                'facility_type',
                'registration_number',
                'county',
                'location',
                'contact_person',
                'physical_address',
            ],
            default => ['applicant_track'],
        };

        $details = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $input)) {
                $value = is_string($input[$key]) ? trim($input[$key]) : $input[$key];
                $details[$key] = $value === '' ? null : $value;
            }
        }

        if ($accountType === 'professional') {
            $details['applicant_track'] = ApplicantTrack::LicensedProfessional->value;
        }

        return $details;
    }

    private function newReference(): string
    {
        do {
            $reference = 'AFYA-REG-' . strtoupper(bin2hex(random_bytes(5)));
        } while ($this->store->first('registration_records', static fn (array $row): bool => ($row['registration_reference'] ?? '') === $reference) !== null);

        return $reference;
    }

    private function assertPassword(string $password): void
    {
        if (strlen($password) < 10) {
            throw new ValidationException(['password' => ['Password must be at least 10 characters.']]);
        }

        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            throw new ValidationException(['password' => ['Password must contain letters and numbers.']]);
        }
    }

    /**
     * @param array<string, mixed> $registration
     * @return array<string, mixed>
     */
    private function safeRegistration(array $registration, bool $includeAdmin = false): array
    {
        $payment = $this->latestPayment((int) $registration['id']);
        $result = [
            'id' => (int) $registration['id'],
            'registration_reference' => (string) $registration['registration_reference'],
            'account_type' => (string) $registration['account_type'],
            'status' => (string) $registration['status'],
            'name' => (string) $registration['name'],
            'email' => (string) $registration['email'],
            'phone' => (string) $registration['phone'],
            'details' => is_array($registration['details'] ?? null) ? $registration['details'] : [],
            'required_amount_cents' => (int) $registration['required_amount_cents'],
            'currency' => (string) $registration['currency'],
            'password_created_at' => $registration['password_created_at'] ?? null,
            'email_verified_at' => $registration['email_verified_at'] ?? null,
            'approval_status' => $registration['approval_status'] ?? null,
            'approval_note' => $registration['approval_note'] ?? null,
            'user_id' => $registration['user_id'] ?? null,
            'facility_id' => $registration['facility_id'] ?? null,
            'created_at' => (string) $registration['created_at'],
            'updated_at' => (string) $registration['updated_at'],
            'latest_payment' => $payment === null ? null : $this->safePayment($payment),
            'next_step' => $this->nextStep((string) $registration['status'], (string) $registration['account_type']),
        ];

        if ($includeAdmin) {
            $result['decisions'] = array_map(
                fn (array $row): array => $this->safeDecision($row),
                $this->store->where('registration_decisions', static fn (array $row): bool => (int) $row['registration_id'] === (int) $registration['id']),
            );
        }

        return $result;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function latestPayment(int $registrationId): ?array
    {
        $payments = $this->store->where('registration_payments', static fn (array $row): bool => (int) $row['registration_id'] === $registrationId);
        usort($payments, static fn (array $a, array $b): int => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));

        return $payments[0] ?? null;
    }

    /**
     * @param array<string, mixed> $payment
     * @return array<string, mixed>
     */
    private function safePayment(array $payment): array
    {
        return [
            'id' => (int) $payment['id'],
            'registration_id' => (int) $payment['registration_id'],
            'payment_type' => (string) $payment['payment_type'],
            'amount_cents' => (int) $payment['amount_cents'],
            'currency' => (string) $payment['currency'],
            'payer_phone' => $this->maskPhone($payment['payer_phone'] ?? null),
            'reference' => $payment['reference'] ?? null,
            'status' => (string) $payment['status'],
            'provider' => $payment['provider'] ?? null,
            'provider_status' => $payment['provider_status'] ?? null,
            'transaction_id' => $payment['transaction_id'] ?? null,
            'checkout_request_id' => $payment['checkout_request_id'] ?? null,
            'merchant_request_id' => $payment['merchant_request_id'] ?? null,
            'validation_status' => $payment['validation_status'] ?? null,
            'validation_note' => $payment['validation_note'] ?? null,
            'verified_at' => $payment['verified_at'] ?? null,
            'created_at' => (string) $payment['created_at'],
            'updated_at' => (string) $payment['updated_at'],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeDecision(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'actor_id' => $row['actor_id'] ?? null,
            'action' => (string) $row['action'],
            'from_status' => $row['from_status'] ?? null,
            'to_status' => (string) $row['to_status'],
            'note' => $row['note'] ?? null,
            'metadata' => is_array($row['metadata'] ?? null) ? $row['metadata'] : [],
            'created_at' => (string) $row['created_at'],
        ];
    }

    private function nextStep(string $status, string $accountType): string
    {
        return match ($status) {
            RegistrationStatus::PaymentPending->value => 'payment',
            RegistrationStatus::PaymentVerified->value => 'password',
            RegistrationStatus::PasswordCreated->value,
            RegistrationStatus::EmailVerificationPending->value => 'email_otp',
            RegistrationStatus::EmailVerified->value => $accountType === 'facility' ? 'facility_review' : 'activation',
            RegistrationStatus::ApprovalPending->value => 'facility_review',
            RegistrationStatus::InformationRequested->value => 'provide_information',
            RegistrationStatus::Active->value => 'complete',
            RegistrationStatus::Rejected->value => 'rejected',
            RegistrationStatus::Abandoned->value => 'abandoned',
            default => 'details',
        };
    }

    private function maskPhone(mixed $phone): ?string
    {
        if ($phone === null || trim((string) $phone) === '') {
            return null;
        }
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
        if (strlen($digits) <= 4) {
            return '****';
        }

        return substr($digits, 0, 3) . '****' . substr($digits, -3);
    }
}
