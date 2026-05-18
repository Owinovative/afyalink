<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Auth;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\ValidationException;
use DomainException;

final readonly class AccountLifecycleService
{
    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
        private NotificationService $notifications,
        private string $appUrl,
        private PasswordHasher $passwords = new PasswordHasher(),
        private TokenGenerator $tokens = new TokenGenerator(),
        private int $verificationTtlSeconds = 86400,
        private int $resetTtlSeconds = 3600,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function sendEmailVerificationForUserId(int $userId, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $user = $this->store->find('users', $userId);
        if ($user === null) {
            throw new DomainException('User was not found.');
        }

        if (!empty($user['email_verified_at'])) {
            return ['email_verified' => true, 'notification_queued' => false];
        }

        foreach ($this->store->where('email_verification_tokens', static fn (array $row): bool => (int) $row['user_id'] === $userId && empty($row['used_at'])) as $token) {
            $this->store->update('email_verification_tokens', (int) $token['id'], ['used_at' => gmdate(DATE_ATOM)]);
        }

        $plainToken = $this->tokens->createPlainToken();
        $expiresAt = gmdate(DATE_ATOM, time() + $this->verificationTtlSeconds);
        $row = $this->store->insert('email_verification_tokens', [
            'user_id' => $userId,
            'token_hash' => $this->tokens->hashToken($plainToken),
            'expires_at' => $expiresAt,
            'used_at' => null,
            'created_at' => gmdate(DATE_ATOM),
        ]);

        $this->notifications->emailVerification($user, $this->buildUrl('/verify-email', $plainToken), $expiresAt);
        $this->audit->record($userId, 'auth.email_verification_requested', 'User', (string) $userId, [
            'token_id' => $row['id'],
            'expires_at' => $expiresAt,
        ], $ipAddress, $userAgent);

        return ['email_verified' => false, 'notification_queued' => true, 'expires_at' => $expiresAt];
    }

    /**
     * @return array<string, mixed>
     */
    public function verifyEmail(string $plainToken, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $hash = $this->tokens->hashToken(trim($plainToken));
        $token = $this->store->first('email_verification_tokens', static fn (array $row): bool => ($row['token_hash'] ?? '') === $hash);
        if ($token === null) {
            throw new ValidationException(['token' => ['Verification token is invalid.']]);
        }

        $user = $this->store->find('users', (int) $token['user_id']);
        if ($user === null) {
            throw new ValidationException(['token' => ['Verification token is invalid.']]);
        }

        if (!empty($token['used_at'])) {
            return ['email_verified' => !empty($user['email_verified_at']), 'already_used' => true];
        }

        if (strtotime((string) $token['expires_at']) <= time()) {
            $this->audit->record((int) $user['id'], 'auth.email_verification_expired', 'User', (string) $user['id'], [], $ipAddress, $userAgent);
            throw new ValidationException(['token' => ['Verification token has expired.']]);
        }

        $verifiedAt = $user['email_verified_at'] ?? gmdate(DATE_ATOM);
        $updated = $this->store->update('users', (int) $user['id'], [
            'email_verified_at' => $verifiedAt,
            'updated_at' => gmdate(DATE_ATOM),
        ]);
        $this->store->update('email_verification_tokens', (int) $token['id'], ['used_at' => gmdate(DATE_ATOM)]);
        $this->audit->record((int) $user['id'], 'auth.email_verified', 'User', (string) $user['id'], [], $ipAddress, $userAgent);

        return ['email_verified' => true, 'user' => $this->safeUser($updated)];
    }

    /**
     * Safe anti-enumeration response. Existing users receive notification outbox rows.
     *
     * @return array<string, mixed>
     */
    public function requestPasswordReset(string $email, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $normalizedEmail = strtolower(trim($email));
        $user = $this->store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $normalizedEmail);

        if ($user !== null && ($user['is_active'] ?? false)) {
            foreach ($this->store->where('password_reset_tokens', static fn (array $row): bool => (int) $row['user_id'] === (int) $user['id'] && empty($row['used_at'])) as $token) {
                $this->store->update('password_reset_tokens', (int) $token['id'], ['used_at' => gmdate(DATE_ATOM)]);
            }

            $plainToken = $this->tokens->createPlainToken();
            $expiresAt = gmdate(DATE_ATOM, time() + $this->resetTtlSeconds);
            $row = $this->store->insert('password_reset_tokens', [
                'user_id' => (int) $user['id'],
                'token_hash' => $this->tokens->hashToken($plainToken),
                'expires_at' => $expiresAt,
                'used_at' => null,
                'created_at' => gmdate(DATE_ATOM),
            ]);

            $this->notifications->passwordReset($user, $this->buildUrl('/reset-password', $plainToken), $expiresAt);
            $this->audit->record((int) $user['id'], 'auth.password_reset_requested', 'User', (string) $user['id'], [
                'token_id' => $row['id'],
                'expires_at' => $expiresAt,
            ], $ipAddress, $userAgent);
        } else {
            $this->audit->record(null, 'auth.password_reset_requested_unknown', 'User', null, [
                'email_hash' => hash('sha256', $normalizedEmail),
            ], $ipAddress, $userAgent);
        }

        return ['message' => 'If the account exists, a password reset message has been queued.'];
    }

    /**
     * @return array<string, mixed>
     */
    public function resetPassword(string $plainToken, string $password, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $this->assertPassword($password);
        $hash = $this->tokens->hashToken(trim($plainToken));
        $token = $this->store->first('password_reset_tokens', static fn (array $row): bool => ($row['token_hash'] ?? '') === $hash);

        if ($token === null || !empty($token['used_at'])) {
            throw new ValidationException(['token' => ['Password reset token is invalid.']]);
        }

        if (strtotime((string) $token['expires_at']) <= time()) {
            throw new ValidationException(['token' => ['Password reset token has expired.']]);
        }

        $user = $this->store->find('users', (int) $token['user_id']);
        if ($user === null || !($user['is_active'] ?? false)) {
            throw new ValidationException(['token' => ['Password reset token is invalid.']]);
        }

        $this->store->transaction(function () use ($user, $password, $token): void {
            $this->store->update('users', (int) $user['id'], [
                'password_hash' => $this->passwords->hash($password),
                'updated_at' => gmdate(DATE_ATOM),
            ]);
            $this->store->update('password_reset_tokens', (int) $token['id'], ['used_at' => gmdate(DATE_ATOM)]);
            foreach ($this->store->where('sessions', static fn (array $row): bool => (int) $row['user_id'] === (int) $user['id'] && empty($row['revoked_at'])) as $session) {
                $this->store->update('sessions', (int) $session['id'], ['revoked_at' => gmdate(DATE_ATOM)]);
            }
        });

        $this->audit->record((int) $user['id'], 'auth.password_reset_completed', 'User', (string) $user['id'], [], $ipAddress, $userAgent);

        return ['password_reset' => true];
    }

    private function buildUrl(string $path, string $token): string
    {
        return rtrim($this->appUrl, '/') . $path . '?token=' . rawurlencode($token);
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
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function safeUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => (string) $user['name'],
            'email' => (string) $user['email'],
            'phone' => (string) $user['phone'],
            'roles' => $user['roles'] ?? [],
            'email_verified_at' => $user['email_verified_at'] ?? null,
            'email_verified' => !empty($user['email_verified_at']),
        ];
    }
}
