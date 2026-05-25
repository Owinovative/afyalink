<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Persistence;

use PDO;
use PDOException;
use RuntimeException;

final class PdoPostgresDataStore implements DataStore
{
    /** @var array<string, string> */
    private const TABLE_MAP = [
        'users' => 'users',
        'sessions' => 'sessions',
        'profiles' => 'milestone1_profiles',
        'credentials' => 'milestone1_credentials',
        'consents' => 'milestone1_consents',
        'payments' => 'milestone1_payments',
        'applications' => 'milestone1_applications',
        'audit_logs' => 'audit_logs',
        'email_verification_tokens' => 'email_verification_tokens',
        'password_reset_tokens' => 'password_reset_tokens',
        'notification_outbox' => 'notification_outbox',
        'notification_delivery_attempts' => 'notification_delivery_attempts',
        'notification_templates' => 'notification_templates',
        'notification_preferences' => 'notification_preferences',
        'payment_provider_events' => 'payment_provider_events',
        'privacy_requests' => 'privacy_requests',
        'regulatory_bodies' => 'regulatory_bodies',
        'verification_cases' => 'verification_cases',
        'interviews' => 'interviews',
        'interview_score_items' => 'interview_score_items',
        'facilities' => 'facilities',
        'facility_memberships' => 'facility_memberships',
        'facility_documents' => 'facility_documents',
        'facility_access_subscriptions' => 'facility_access_subscriptions',
        'candidate_publications' => 'candidate_publications',
        'candidate_profile_views' => 'candidate_profile_views',
        'facility_requests' => 'facility_requests',
        'facility_appointments' => 'facility_appointments',
        'recommendation_requests' => 'recommendation_requests',
        'recommendation_packages' => 'recommendation_packages',
        'recommendation_package_candidates' => 'recommendation_package_candidates',
    ];

    /** @var array<string, list<string>> */
    private const JSON_COLUMNS = [
        'users' => ['roles'],
        'profiles' => ['work_preferences'],
        'applications' => ['timeline'],
        'audit_logs' => ['metadata'],
        'notification_outbox' => ['metadata'],
        'notification_delivery_attempts' => ['provider_response'],
        'notification_templates' => ['variables'],
        'notification_preferences' => ['preferences'],
        'payments' => ['callback_payload_redacted'],
        'payment_provider_events' => ['payload_redacted'],
        'regulatory_bodies' => ['profession_coverage'],
        'verification_cases' => ['timeline'],
        'interviews' => ['timeline'],
        'facility_documents' => ['metadata'],
        'candidate_publications' => ['summary_snapshot', 'private_admin_notes'],
        'candidate_profile_views' => ['watermark', 'metadata'],
        'facility_requests' => ['candidate_publication_ids', 'metadata'],
        'recommendation_requests' => ['criteria', 'candidate_publication_ids'],
    ];

    /** @var array<string, list<string>> */
    private const BOOL_COLUMNS = [
        'users' => ['is_active'],
        'regulatory_bodies' => ['active'],
        'notification_templates' => ['active'],
        'facility_access_subscriptions' => ['admin_override'],
    ];

    public function __construct(
        private readonly PDO $pdo,
    ) {
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function all(string $table): array
    {
        $physical = $this->physicalTable($table);
        $rows = $this->pdo->query("SELECT * FROM {$physical} ORDER BY id ASC")->fetchAll();

        return array_map(fn (array $row): array => $this->decodeRow($table, $row), $rows);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(string $table, int $id): ?array
    {
        $physical = $this->physicalTable($table);
        $statement = $this->pdo->prepare("SELECT * FROM {$physical} WHERE id = :id LIMIT 1");
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return is_array($row) ? $this->decodeRow($table, $row) : null;
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
        $physical = $this->physicalTable($table);
        unset($row['id']);
        $row = $this->encodeRow($table, $row);
        $columns = array_keys($row);
        $placeholders = array_map(static fn (string $column): string => ':' . $column, $columns);
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s) RETURNING *',
            $physical,
            implode(', ', $columns),
            implode(', ', $placeholders),
        );

        try {
            $statement = $this->pdo->prepare($sql);
            $statement->execute($row);
            $saved = $statement->fetch();
        } catch (PDOException $exception) {
            throw new RuntimeException('Database insert failed: ' . $exception->getMessage(), previous: $exception);
        }

        if (!is_array($saved)) {
            throw new RuntimeException('Database insert did not return a row.');
        }

        return $this->decodeRow($table, $saved);
    }

    /**
     * @param array<string, mixed> $changes
     * @return array<string, mixed>
     */
    public function update(string $table, int $id, array $changes): array
    {
        $physical = $this->physicalTable($table);
        unset($changes['id']);
        $changes = $this->encodeRow($table, $changes);
        $assignments = array_map(static fn (string $column): string => "{$column} = :{$column}", array_keys($changes));
        $sql = sprintf('UPDATE %s SET %s WHERE id = :id RETURNING *', $physical, implode(', ', $assignments));
        $changes['id'] = $id;

        try {
            $statement = $this->pdo->prepare($sql);
            $statement->execute($changes);
            $saved = $statement->fetch();
        } catch (PDOException $exception) {
            throw new RuntimeException('Database update failed: ' . $exception->getMessage(), previous: $exception);
        }

        if (!is_array($saved)) {
            throw new RuntimeException("Database update did not return {$table} row {$id}.");
        }

        return $this->decodeRow($table, $saved);
    }

    /**
     * @template T
     * @param callable(DataStore): T $callback
     * @return T
     */
    public function transaction(callable $callback): mixed
    {
        $this->pdo->beginTransaction();

        try {
            $result = $callback($this);
            $this->pdo->commit();

            return $result;
        } catch (\Throwable $exception) {
            $this->pdo->rollBack();
            throw $exception;
        }
    }

    private function physicalTable(string $table): string
    {
        return self::TABLE_MAP[$table] ?? throw new RuntimeException("Unknown datastore table {$table}.");
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function encodeRow(string $table, array $row): array
    {
        foreach (self::JSON_COLUMNS[$table] ?? [] as $column) {
            if (array_key_exists($column, $row) && is_array($row[$column])) {
                $row[$column] = json_encode($row[$column], JSON_UNESCAPED_SLASHES);
            }
        }

        foreach ($row as $key => $value) {
            if (is_bool($value)) {
                $row[$key] = $value ? 'true' : 'false';
            }
        }

        return $row;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function decodeRow(string $table, array $row): array
    {
        foreach (self::JSON_COLUMNS[$table] ?? [] as $column) {
            if (array_key_exists($column, $row) && is_string($row[$column])) {
                $decoded = json_decode($row[$column], true);
                $row[$column] = is_array($decoded) ? $decoded : [];
            }
        }

        foreach (self::BOOL_COLUMNS[$table] ?? [] as $column) {
            if (array_key_exists($column, $row)) {
                $row[$column] = filter_var($row[$column], FILTER_VALIDATE_BOOL);
            }
        }

        return $row;
    }
}
