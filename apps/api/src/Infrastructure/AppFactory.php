<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure;

use Afyalink\Core\Http\ApiKernel;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;
use Afyalink\Core\Infrastructure\Persistence\PdoPostgresDataStore;
use Afyalink\Core\Infrastructure\Storage\CredentialStorage;
use Afyalink\Core\Infrastructure\Storage\LocalPrivateCredentialStorage;
use Afyalink\Core\Infrastructure\Storage\S3CompatibleCredentialStorage;
use PDO;
use RuntimeException;

final class AppFactory
{
    public static function kernel(AppConfig $config): ApiKernel
    {
        return new ApiKernel(
            self::dataStore($config),
            self::credentialStorage($config),
            sessionTtlSeconds: $config->sessionTtlSeconds,
            maxUploadBytes: $config->maxUploadBytes,
        );
    }

    public static function dataStore(AppConfig $config): DataStore
    {
        return match ($config->datastoreDriver) {
            'pgsql', 'postgres', 'postgresql' => new PdoPostgresDataStore(self::postgresPdo($config)),
            'json' => new JsonDataStore($config->jsonDatastorePath),
            default => throw new RuntimeException("Unsupported AFYALINK_DATASTORE {$config->datastoreDriver}."),
        };
    }

    public static function credentialStorage(AppConfig $config): CredentialStorage
    {
        if ($config->storageDriver === 'local') {
            return new LocalPrivateCredentialStorage($config->localCredentialRoot);
        }

        if (in_array($config->storageDriver, ['s3', 'r2', 'minio'], true)) {
            foreach ([
                'S3_ENDPOINT' => $config->s3Endpoint,
                'S3_BUCKET' => $config->s3Bucket,
                'S3_ACCESS_KEY_ID' => $config->s3AccessKey,
                'S3_SECRET_ACCESS_KEY' => $config->s3SecretKey,
            ] as $name => $value) {
                if ($value === null || $value === '') {
                    throw new RuntimeException("{$name} is required for S3-compatible credential storage.");
                }
            }

            return new S3CompatibleCredentialStorage(
                endpoint: (string) $config->s3Endpoint,
                region: (string) $config->s3Region,
                bucket: (string) $config->s3Bucket,
                accessKey: (string) $config->s3AccessKey,
                secretKey: (string) $config->s3SecretKey,
            );
        }

        throw new RuntimeException("Unsupported AFYALINK_CREDENTIAL_STORAGE {$config->storageDriver}.");
    }

    private static function postgresPdo(AppConfig $config): PDO
    {
        if ($config->databaseUrl === null || trim($config->databaseUrl) === '') {
            throw new RuntimeException('DATABASE_URL is required when AFYALINK_DATASTORE=pgsql.');
        }

        $parts = parse_url($config->databaseUrl);
        if (!is_array($parts) || empty($parts['host']) || empty($parts['path'])) {
            throw new RuntimeException('DATABASE_URL must be a PostgreSQL URL.');
        }

        $database = ltrim((string) $parts['path'], '/');
        $port = (int) ($parts['port'] ?? 5432);
        $query = [];
        if (isset($parts['query'])) {
            parse_str((string) $parts['query'], $query);
        }

        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s%s',
            (string) $parts['host'],
            $port,
            $database,
            isset($query['sslmode']) ? ';sslmode=' . $query['sslmode'] : '',
        );

        return new PDO(
            $dsn,
            isset($parts['user']) ? urldecode((string) $parts['user']) : null,
            isset($parts['pass']) ? urldecode((string) $parts['pass']) : null,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ],
        );
    }
}
