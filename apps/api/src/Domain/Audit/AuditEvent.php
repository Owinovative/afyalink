<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Audit;

final readonly class AuditEvent
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public ?int $actorId,
        public string $action,
        public string $entityType,
        public ?string $entityId,
        public array $metadata,
        public ?string $ipAddress,
        public ?string $userAgent,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'actor_id' => $this->actorId,
            'action' => $this->action,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'metadata' => $this->metadata,
            'ip_address' => $this->ipAddress,
            'user_agent' => $this->userAgent,
        ];
    }
}

