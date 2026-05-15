<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Persistence;

interface DataStore
{
    /**
     * @return list<array<string, mixed>>
     */
    public function all(string $table): array;

    /**
     * @return array<string, mixed>|null
     */
    public function find(string $table, int $id): ?array;

    /**
     * @param callable(array<string, mixed>): bool $predicate
     * @return array<string, mixed>|null
     */
    public function first(string $table, callable $predicate): ?array;

    /**
     * @param callable(array<string, mixed>): bool $predicate
     * @return list<array<string, mixed>>
     */
    public function where(string $table, callable $predicate): array;

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function insert(string $table, array $row): array;

    /**
     * @param array<string, mixed> $changes
     * @return array<string, mixed>
     */
    public function update(string $table, int $id, array $changes): array;

    /**
     * @template T
     * @param callable(self): T $callback
     * @return T
     */
    public function transaction(callable $callback): mixed;
}
