<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Auth;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\StudentStatus;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\AuthorizationException;
use Afyalink\Core\Support\Exceptions\ValidationException;

final readonly class AuthService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private PasswordHasher $passwords = new PasswordHasher(),
        private TokenGenerator $tokens = new TokenGenerator(),
        private int $sessionTtlSeconds = 43200,
    ) {}

    /**
     * @return array{token: string, user: AuthenticatedUser}
     */
    public function registerProfessional(
        string $name,
        string $email,
        string $phone,
        string $password,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $this->assertPassword($password);
        $email = strtolower(trim($email));
        $phone = trim($phone);

        if ($this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $email) !== null) {
            throw new ValidationException(['email' => ['An account already exists for this email.']]);
        }
        if ($this->store->first('users', static fn (array $row): bool => (string) $row['phone'] === $phone) !== null) {
            throw new ValidationException(['phone' => ['An account already exists for this phone number.']]);
        }

        $user = $this->insertUser(trim($name), $email, $phone, $password, [UserRole::Professional], null);

        $this->audit->record((int) $user['id'], 'professional.registered', 'User', (string) $user['id'], [
            'email' => $email,
            'roles' => $user['roles'],
        ], $ipAddress, $userAgent);

        return $this->createSession($user, $ipAddress, $userAgent);
    }

    /**
     * @param array<string, mixed> $studentProfile
     * @return array{token: string, user: AuthenticatedUser, profile: array<string, mixed>}
     */
    public function registerStudentApplicant(
        string $name,
        string $email,
        string $phone,
        string $password,
        array $studentProfile,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $this->assertPassword($password);
        $email = strtolower(trim($email));
        $phone = trim($phone);

        if ($this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $email) !== null) {
            throw new ValidationException(['email' => ['An account already exists for this email.']]);
        }
        if ($this->store->first('users', static fn (array $row): bool => (string) $row['phone'] === $phone) !== null) {
            throw new ValidationException(['phone' => ['An account already exists for this phone number.']]);
        }

        $studentStatus = StudentStatus::tryFrom((string) ($studentProfile['student_status'] ?? ''));
        if ($studentStatus === null) {
            throw new ValidationException(['student_status' => ['Choose a valid student or graduate status.']]);
        }

        foreach (['target_profession', 'institution_name', 'programme_or_course', 'county'] as $field) {
            if (trim((string) ($studentProfile[$field] ?? '')) === '') {
                throw new ValidationException([$field => ['This field is required for waiting-license registration.']]);
            }
        }

        $user = $this->insertUser(trim($name), $email, $phone, $password, [UserRole::Professional], null);
        $profile = $this->store->insert('profiles', [
            'user_id' => (int) $user['id'],
            'applicant_track' => ApplicantTrack::StudentAwaitingLicense->value,
            'student_status' => $studentStatus->value,
            'name' => trim($name),
            'email' => $email,
            'phone' => $phone,
            'profession' => trim((string) $studentProfile['target_profession']),
            'target_profession' => trim((string) $studentProfile['target_profession']),
            'regulatory_body' => trim((string) ($studentProfile['expected_regulatory_body'] ?? '')),
            'expected_regulatory_body' => trim((string) ($studentProfile['expected_regulatory_body'] ?? '')),
            'license_number' => '',
            'county' => trim((string) $studentProfile['county']),
            'years_experience' => 0,
            'institution_name' => trim((string) $studentProfile['institution_name']),
            'programme_or_course' => trim((string) $studentProfile['programme_or_course']),
            'graduation_or_completion_date' => trim((string) ($studentProfile['graduation_or_completion_date'] ?? '')) ?: null,
            'prelicensure_note' => trim((string) ($studentProfile['notes'] ?? '')),
            'conversion_review_status' => 'waiting_for_license',
            'license_uploaded_at' => null,
            'converted_to_licensed_at' => null,
            'availability' => trim((string) ($studentProfile['availability_after_licensure'] ?? '')),
            'work_preferences' => [
                'availability_after_licensure' => trim((string) ($studentProfile['availability_after_licensure'] ?? '')),
                'placement_type' => trim((string) ($studentProfile['placement_type'] ?? '')),
            ],
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record((int) $user['id'], 'student_awaiting_license.registered', 'User', (string) $user['id'], [
            'email' => $email,
            'target_profession' => $profile['target_profession'],
            'student_status' => $profile['student_status'],
        ], $ipAddress, $userAgent);

        return [
            ...$this->createSession($user, $ipAddress, $userAgent),
            'profile' => $profile,
        ];
    }

    /**
     * @return array{token: string, user: AuthenticatedUser}
     */
    public function registerFacilityOwner(
        string $name,
        string $email,
        string $phone,
        string $password,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $this->assertPassword($password);
        $email = strtolower(trim($email));
        $phone = trim($phone);

        if ($this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $email) !== null) {
            throw new ValidationException(['email' => ['An account already exists for this email.']]);
        }
        if ($this->store->first('users', static fn (array $row): bool => (string) $row['phone'] === $phone) !== null) {
            throw new ValidationException(['phone' => ['An account already exists for this phone number.']]);
        }

        $user = $this->insertUser(trim($name), $email, $phone, $password, [UserRole::FacilityAdmin], gmdate(DATE_ATOM));

        $this->audit->record((int) $user['id'], 'facility_user.registered', 'User', (string) $user['id'], [
            'email' => $email,
            'roles' => $user['roles'],
        ], $ipAddress, $userAgent);

        return $this->createSession($user, $ipAddress, $userAgent);
    }

    /**
     * @param list<UserRole> $roles
     * @return array<string, mixed>
     */
    public function createUser(
        string $name,
        string $email,
        string $phone,
        string $password,
        array $roles,
    ): array {
        $this->assertPassword($password);
        $email = strtolower(trim($email));
        $existing = $this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $email);
        if ($existing !== null) {
            return $existing;
        }

        return $this->insertUser(trim($name), $email, trim($phone), $password, $roles, gmdate(DATE_ATOM));
    }

    /**
     * @return array<string, mixed>
     */
    public function createAdminUser(
        AuthenticatedUser $actor,
        string $name,
        string $email,
        string $phone,
        string $password,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $this->assertPassword($password);
        $email = strtolower(trim($email));
        $phone = trim($phone);

        if ($this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $email) !== null) {
            throw new ValidationException(['email' => ['An account already exists for this email.']]);
        }
        if ($this->store->first('users', static fn (array $row): bool => (string) $row['phone'] === $phone) !== null) {
            throw new ValidationException(['phone' => ['An account already exists for this phone number.']]);
        }

        $user = $this->insertUser(trim($name), $email, $phone, $password, [UserRole::Admin], gmdate(DATE_ATOM));
        $this->audit->record($actor->id, 'admin_user.created', 'User', (string) $user['id'], [
            'email' => $email,
            'roles' => $user['roles'],
        ], $ipAddress, $userAgent);

        return $user;
    }

    /**
     * @return array{token: string, user: AuthenticatedUser}
     */
    public function login(
        string $email,
        string $password,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $email = strtolower(trim($email));
        $user = $this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $email);

        if ($user === null || !$this->passwords->verify($password, (string) ($user['password_hash'] ?? ''))) {
            $this->audit->record(null, 'auth.login_failed', 'User', null, ['email' => $email], $ipAddress, $userAgent);
            throw new AuthorizationException('Invalid email or password.');
        }

        if (!($user['is_active'] ?? false)) {
            $this->audit->record((int) $user['id'], 'auth.inactive_login_blocked', 'User', (string) $user['id'], [], $ipAddress, $userAgent);
            throw new AuthorizationException('Account is inactive.');
        }

        $this->store->update('users', (int) $user['id'], [
            'last_login_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        return $this->createSession($user, $ipAddress, $userAgent);
    }

    public function logout(string $plainToken, ?string $ipAddress = null, ?string $userAgent = null): void
    {
        $hash = $this->tokens->hashToken($plainToken);
        $session = $this->store->first('sessions', static fn (array $row): bool => ($row['token_hash'] ?? '') === $hash && empty($row['revoked_at']));
        if ($session === null) {
            return;
        }

        $this->store->update('sessions', (int) $session['id'], ['revoked_at' => gmdate(DATE_ATOM)]);
        $this->audit->record((int) $session['user_id'], 'auth.logout', 'Session', (string) $session['id'], [], $ipAddress, $userAgent);
    }

    public function userFromToken(?string $plainToken): ?AuthenticatedUser
    {
        if ($plainToken === null || trim($plainToken) === '') {
            return null;
        }

        $hash = $this->tokens->hashToken($plainToken);
        $session = $this->store->first('sessions', static fn (array $row): bool => ($row['token_hash'] ?? '') === $hash && empty($row['revoked_at']));
        if ($session === null || strtotime((string) $session['expires_at']) <= time()) {
            return null;
        }

        $user = $this->store->find('users', (int) $session['user_id']);
        if ($user === null || !($user['is_active'] ?? false)) {
            return null;
        }

        return $this->hydrateUser($user);
    }

    /**
     * @param array<string, mixed> $user
     * @return array{token: string, user: AuthenticatedUser}
     */
    private function createSession(array $user, ?string $ipAddress, ?string $userAgent): array
    {
        $plainToken = $this->tokens->createPlainToken();
        $session = $this->store->insert('sessions', [
            'user_id' => (int) $user['id'],
            'token_hash' => $this->tokens->hashToken($plainToken),
            'created_at' => gmdate(DATE_ATOM),
            'expires_at' => gmdate(DATE_ATOM, time() + $this->sessionTtlSeconds),
            'revoked_at' => null,
        ]);

        $this->audit->record((int) $user['id'], 'auth.login_success', 'Session', (string) $session['id'], [
            'roles' => $user['roles'] ?? [],
        ], $ipAddress, $userAgent);

        return [
            'token' => $plainToken,
            'user' => $this->hydrateUser($user),
        ];
    }

    /**
     * @param array<string, mixed> $user
     */
    private function hydrateUser(array $user): AuthenticatedUser
    {
        $roles = [];
        foreach (($user['roles'] ?? []) as $role) {
            $roles[] = UserRole::from((string) $role);
        }

        return new AuthenticatedUser(
            id: (int) $user['id'],
            name: (string) $user['name'],
            email: (string) $user['email'],
            phone: (string) $user['phone'],
            roles: $roles,
            emailVerifiedAt: isset($user['email_verified_at']) && $user['email_verified_at'] !== null ? (string) $user['email_verified_at'] : null,
        );
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
     * @param list<UserRole> $roles
     * @return array<string, mixed>
     */
    private function insertUser(string $name, string $email, string $phone, string $password, array $roles, ?string $emailVerifiedAt): array
    {
        return $this->store->insert('users', [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'password_hash' => $this->passwords->hash($password),
            'roles' => array_map(static fn (UserRole $role): string => $role->value, $roles),
            'is_active' => true,
            'email_verified_at' => $emailVerifiedAt,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);
    }
}
