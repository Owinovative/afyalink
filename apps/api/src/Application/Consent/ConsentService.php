<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Consent;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Domain\Consent\ConsentPolicy;
use Afyalink\Core\Domain\Consent\ConsentSnapshot;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;
use DateTimeImmutable;

final readonly class ConsentService
{
    public const CURRENT_VERSION = 'milestone-1-credential-processing-v1';
    public const CURRENT_TEXT = 'I consent to Afyalink processing my professional profile, credential documents, payment reference, and verification review data for secure healthcare professional verification and placement readiness.';

    public function __construct(
        private JsonDataStore $store,
        private AuditLogger $audit,
        private ConsentPolicy $policy = new ConsentPolicy(),
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function accept(AuthenticatedUser $user, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $row = $this->store->insert('consents', [
            'user_id' => $user->id,
            'type' => 'credential_verification',
            'version' => self::CURRENT_VERSION,
            'text_hash' => hash('sha256', self::CURRENT_TEXT),
            'accepted_at' => gmdate(DATE_ATOM),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'created_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($user->id, 'consent.accepted', 'Consent', (string) $row['id'], [
            'type' => $row['type'],
            'version' => $row['version'],
            'text_hash' => $row['text_hash'],
        ], $ipAddress, $userAgent);

        return $row;
    }

    public function hasCurrentConsent(int $userId): bool
    {
        $rows = $this->store->where('consents', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['accepted_at'], (string) $a['accepted_at']));
        $latest = $rows[0] ?? null;
        if ($latest === null) {
            return false;
        }

        $snapshot = new ConsentSnapshot(
            type: (string) $latest['type'],
            version: (string) $latest['version'],
            textHash: (string) $latest['text_hash'],
            acceptedAt: new DateTimeImmutable((string) $latest['accepted_at']),
            ipAddress: $latest['ip_address'] === null ? null : (string) $latest['ip_address'],
            userAgent: $latest['user_agent'] === null ? null : (string) $latest['user_agent'],
        );

        return $this->policy->isCurrent($snapshot, self::CURRENT_VERSION, self::CURRENT_TEXT);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function latestForUser(int $userId): ?array
    {
        $rows = $this->store->where('consents', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['accepted_at'], (string) $a['accepted_at']));

        return $rows[0] ?? null;
    }
}
