<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Audit;

use Afyalink\Core\Domain\Security\SensitiveDataRedactor;

final readonly class AuditEventFactory
{
    public function __construct(
        private SensitiveDataRedactor $redactor = new SensitiveDataRedactor(),
    ) {}

    /**
     * @param array<string, mixed> $metadata
     */
    public function create(
        ?int $actorId,
        string $action,
        string $entityType,
        ?string $entityId,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): AuditEvent {
        return new AuditEvent(
            actorId: $actorId,
            action: $action,
            entityType: $entityType,
            entityId: $entityId,
            metadata: $this->redactor->redact($metadata),
            ipAddress: $ipAddress,
            userAgent: $userAgent,
        );
    }
}

