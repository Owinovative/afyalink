# Local Setup

## Requirements

- PHP 8.3+
- Composer
- Node.js 20+
- PostgreSQL for production-style development
- Redis for future queue/cache work

## Backend

```bash
cd apps/api
composer install
composer dump-autoload
composer check
php -S localhost:8000 -t public
```

The default runtime datastore is PostgreSQL. Start local infrastructure:

```bash
docker compose up -d postgres minio
```

Create a local `.env` from `.env.example`, then set:

```text
AFYALINK_DATASTORE=pgsql
DATABASE_URL=postgresql://afyalink:afyalink_dev_password@localhost:5432/afyalink
AFYALINK_CREDENTIAL_STORAGE=local
AFYALINK_EMAIL_VERIFICATION_TTL_SECONDS=86400
AFYALINK_PASSWORD_RESET_TTL_SECONDS=3600
```

Run migrations:

```bash
cd apps/api
php scripts/migrate.php
```

The JSON datastore remains available only as an explicit test/dev adapter:

```text
AFYALINK_DATASTORE=json
AFYALINK_JSON_DATASTORE=apps/api/storage/runtime/afyalink-dev.json
```

Do not use JSON persistence for production-like local development.

Local private credential storage uses:

- `apps/api/storage/private/credentials`

These paths are ignored and must not be committed.

## Notification Outbox

Milestone 1 queues notification intents in the `notification_outbox` table. The current development adapter records email verification, password reset, application submission, and credential replacement messages for later delivery. It does not require SMTP credentials for local testing.

For local manual testing, inspect the latest `notification_outbox.action_url` in the database or JSON dev store to retrieve the verification/reset token that a real mail worker would send. Do not log or expose those tokens in production.

## Optional MinIO Credential Storage

The application also includes an S3-compatible private storage adapter suitable for MinIO, AWS S3, or Cloudflare R2 style storage.

For MinIO local development:

```text
AFYALINK_CREDENTIAL_STORAGE=minio
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=afyalink-credentials
S3_ACCESS_KEY_ID=afyalink
S3_SECRET_ACCESS_KEY=afyalink_dev_password
```

Create the bucket in the MinIO console at `http://localhost:9001`. Keep the bucket private.

## Frontend

```bash
cd apps/web
npm install
npm.cmd run check
```

Open `apps/web/index.html` directly or serve it with any static server. The page expects the API at:

```text
http://localhost:8000
```

To point the page elsewhere, set `window.AFYA_API_BASE` before loading `src/app.js`.

## Creating an Admin for Local Testing

```bash
cd apps/api
php scripts/create-admin.php "Afyalink Admin" admin@example.com 0799999999 AdminPass123
```

You can also set `AFYALINK_ADMIN_NAME`, `AFYALINK_ADMIN_EMAIL`, `AFYALINK_ADMIN_PHONE`, and `AFYALINK_ADMIN_PASSWORD`. Do not hardcode admin credentials into the repository.

## Troubleshooting

- If the API says `DATABASE_URL is required`, either configure PostgreSQL or explicitly set `AFYALINK_DATASTORE=json` for test-only local work.
- If migrations fail because tables already exist, use a fresh local database or drop/recreate the local `afyalink` database.
- On Windows, use `npm.cmd run check` for the web check command.
- Credential uploads must be PDF, JPEG, or PNG and under `AFYALINK_MAX_UPLOAD_BYTES`.
- Final application submission now requires verified email. If a user cannot submit, check the dashboard readiness list and the queued verification notification.

## Verification

```bash
cd apps/api
composer check

cd ../web
npm.cmd run check
```
