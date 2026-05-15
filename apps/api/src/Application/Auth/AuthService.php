<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Auth;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;
use Afyalink\Core\Support\Exceptions\AuthorizationException;
use Afyalink\Core\Support\Exceptions\ValidationException;

final readonly class AuthService
{
    public function __construct(
        private JsonDataStore $store,
        private AuditLogger $audit,
        private PasswordHasher $passwords = new PasswordHasher(),
        private TokenGenerator $tokens = new TokenGenerator(),
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

        if ($this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $email) !== null) {
            throw new ValidationException(['email' => ['An account already exists for this email.']]);
        }

        $user = $this->store->insert('users', [
            'name' => trim($name),
            'email' => $email,
            'phone' => trim($phone),
            'password_hash' => $this->passwords->hash($password),
            'roles' => [UserRole::Professional->value],
            'is_active' => true,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record((int) $user['id'], 'professional.registered', 'User', (string) $user['id'], [
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

        return $this->store->insert('users', [
            'name' => trim($name),
            'email' => $email,
            'phone' => trim($phone),
            'password_hash' => $this->passwords->hash($password),
            'roles' => array_map(static fn (UserRole $role): string => $role->value, $roles),
            'is_active' => true,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);
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
            'expires_at' => gmdate(DATE_ATOM, time() + 60 * 60 * 12),
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
}
