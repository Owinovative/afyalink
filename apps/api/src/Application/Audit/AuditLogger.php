<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Audit;

use Afyalink\Core\Domain\Audit\AuditEventFactory;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;

final readonly class AuditLogger
{
    public function __construct(
        private JsonDataStore $store,
        private AuditEventFactory $factory = new AuditEventFactory(),
    ) {}

    /**
     * @param array<string, mixed> $metadata
     */
    public function record(
        ?int $actorId,
        string $action,
        string $entityType,
        ?string $entityId,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): void {
        $event = $this->factory->create($actorId, $action, $entityType, $entityId, $metadata, $ipAddress, $userAgent);

        $this->store->insert('audit_logs', [
            ...$event->toArray(),
            'created_at' => gmdate(DATE_ATOM),
        ]);
    }
}
