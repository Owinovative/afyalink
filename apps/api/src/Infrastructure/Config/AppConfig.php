<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Config;

final readonly class AppConfig
{
    public function __construct(
        public string $environment,
        public string $appUrl,
        public string $apiUrl,
        public string $datastoreDriver,
        public ?string $databaseUrl,
        public string $jsonDatastorePath,
        public string $storageDriver,
        public string $localCredentialRoot,
        public ?string $s3Endpoint,
        public ?string $s3Region,
        public ?string $s3Bucket,
        public ?string $s3AccessKey,
        public ?string $s3SecretKey,
        public int $sessionTtlSeconds,
        public int $maxUploadBytes,
        public int $emailVerificationTtlSeconds,
        public int $passwordResetTtlSeconds,
        public string $mailDriver,
        public string $mailFromAddress,
        public string $mailFromName,
    ) {}

    /**
     * @param array<string, string> $env
     */
    public static function fromEnv(array $env, string $apiRoot): self
    {
        return new self(
            environment: $env['APP_ENV'] ?? 'local',
            appUrl: $env['APP_URL'] ?? 'http://localhost:3000',
            apiUrl: $env['API_URL'] ?? 'http://localhost:8000',
            datastoreDriver: strtolower($env['AFYALINK_DATASTORE'] ?? 'pgsql'),
            databaseUrl: $env['DATABASE_URL'] ?? null,
            jsonDatastorePath: $env['AFYALINK_JSON_DATASTORE'] ?? $apiRoot . '/storage/runtime/afyalink-dev.json',
            storageDriver: strtolower($env['AFYALINK_CREDENTIAL_STORAGE'] ?? 'local'),
            localCredentialRoot: $env['AFYALINK_LOCAL_CREDENTIAL_ROOT'] ?? $apiRoot . '/storage/private/credentials',
            s3Endpoint: $env['S3_ENDPOINT'] ?? null,
            s3Region: $env['S3_REGION'] ?? 'us-east-1',
            s3Bucket: $env['S3_BUCKET'] ?? null,
            s3AccessKey: $env['S3_ACCESS_KEY_ID'] ?? null,
            s3SecretKey: $env['S3_SECRET_ACCESS_KEY'] ?? null,
            sessionTtlSeconds: (int) ($env['AFYALINK_SESSION_TTL_SECONDS'] ?? 43200),
            maxUploadBytes: (int) ($env['AFYALINK_MAX_UPLOAD_BYTES'] ?? 8388608),
            emailVerificationTtlSeconds: (int) ($env['AFYALINK_EMAIL_VERIFICATION_TTL_SECONDS'] ?? 86400),
            passwordResetTtlSeconds: (int) ($env['AFYALINK_PASSWORD_RESET_TTL_SECONDS'] ?? 3600),
            mailDriver: strtolower($env['MAIL_DRIVER'] ?? 'log'),
            mailFromAddress: $env['MAIL_FROM_ADDRESS'] ?? 'no-reply@afyalink.local',
            mailFromName: $env['MAIL_FROM_NAME'] ?? 'Afyalink',
        );
    }
}
