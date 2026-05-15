<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Persistence;

use RuntimeException;

final class JsonDataStore
{
    /** @var list<string> */
    private const TABLES = [
        'users',
        'sessions',
        'profiles',
        'credentials',
        'consents',
        'payments',
        'applications',
        'audit_logs',
    ];

    public function __construct(
        private readonly string $path,
    ) {
        $directory = dirname($this->path);
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new RuntimeException('Could not create datastore directory.');
        }

        if (!is_file($this->path)) {
            $this->writeInitialFile();
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function all(string $table): array
    {
        $this->assertTable($table);
        $data = $this->read();

        return array_values($data['tables'][$table] ?? []);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(string $table, int $id): ?array
    {
        $this->assertTable($table);

        foreach ($this->all($table) as $row) {
            if ((int) ($row['id'] ?? 0) === $id) {
                return $row;
            }
        }

        return null;
    }

    /**
     * @param callable(array<string, mixed>): bool $predicate
     * @return array<string, mixed>|null
     */
    public function first(string $table, callable $predicate): ?array
    {
        foreach ($this->all($table) as $row) {
            if ($predicate($row)) {
                return $row;
            }
        }

        return null;
    }

    /**
     * @param callable(array<string, mixed>): bool $predicate
     * @return list<array<string, mixed>>
     */
    public function where(string $table, callable $predicate): array
    {
        return array_values(array_filter($this->all($table), $predicate));
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function insert(string $table, array $row): array
    {
        $this->assertTable($table);

        return $this->mutate(function (array $data) use ($table, $row): array {
            $id = (int) ($data['counters'][$table] ?? 0) + 1;
            $data['counters'][$table] = $id;
            $row['id'] = $id;
            $data['tables'][$table][] = $row;

            return [$data, $row];
        });
    }

    /**
     * @param array<string, mixed> $changes
     * @return array<string, mixed>
     */
    public function update(string $table, int $id, array $changes): array
    {
        $this->assertTable($table);

        return $this->mutate(function (array $data) use ($table, $id, $changes): array {
            foreach ($data['tables'][$table] as $index => $row) {
                if ((int) ($row['id'] ?? 0) !== $id) {
                    continue;
                }

                $updated = array_replace($row, $changes);
                $updated['id'] = $id;
                $data['tables'][$table][$index] = $updated;

                return [$data, $updated];
            }

            throw new RuntimeException("Could not update missing {$table} row {$id}.");
        });
    }

    /**
     * @template T
     * @param callable(self): T $callback
     * @return T
     */
    public function transaction(callable $callback): mixed
    {
        return $callback($this);
    }

    /**
     * @return array<string, mixed>
     */
    private function read(): array
    {
        $raw = file_get_contents($this->path);
        if ($raw === false) {
            throw new RuntimeException('Could not read datastore.');
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Datastore JSON is invalid.');
        }

        return $decoded;
    }

    /**
     * @param callable(array<string, mixed>): array{0: array<string, mixed>, 1: array<string, mixed>} $callback
     * @return array<string, mixed>
     */
    private function mutate(callable $callback): array
    {
        $handle = fopen($this->path, 'c+');
        if ($handle === false) {
            throw new RuntimeException('Could not open datastore.');
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                throw new RuntimeException('Could not lock datastore.');
            }

            rewind($handle);
            $raw = stream_get_contents($handle);
            $data = $raw === '' ? $this->initialData() : json_decode((string) $raw, true);
            if (!is_array($data)) {
                throw new RuntimeException('Datastore JSON is invalid.');
            }

            [$nextData, $result] = $callback($data);
            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, json_encode($nextData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            fflush($handle);
            flock($handle, LOCK_UN);

            return $result;
        } finally {
            fclose($handle);
        }
    }

    private function writeInitialFile(): void
    {
        file_put_contents($this->path, json_encode($this->initialData(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array<string, mixed>
     */
    private function initialData(): array
    {
        $tables = [];
        $counters = [];

        foreach (self::TABLES as $table) {
            $tables[$table] = [];
            $counters[$table] = 0;
        }

        return [
            'tables' => $tables,
            'counters' => $counters,
        ];
    }

    private function assertTable(string $table): void
    {
        if (!in_array($table, self::TABLES, true)) {
            throw new RuntimeException("Unknown datastore table {$table}.");
        }
    }
}
