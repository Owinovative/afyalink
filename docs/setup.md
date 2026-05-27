# Local Setup

## Requirements

- PHP 8.3+
- Composer
- Node.js 20.9+ for Next.js 16, or a current LTS/newer Node runtime
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
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_AFYA_API_BASE=http://localhost:8000
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

Milestone 3 and Milestone 4 tables are included in the normal migration path. Facility onboarding, candidate publication, access gating, requests, recommendations, notification delivery attempts, provider payment events, privacy requests, and reporting counters all use the same migration command.

Local private credential storage uses:

- `apps/api/storage/private/credentials`

These paths are ignored and must not be committed.

## Notification Delivery

Afyalink queues notification intents in `notification_outbox` and records delivery attempts in `notification_delivery_attempts`. The default local/staging driver is safe log delivery.

```text
MAIL_DRIVER=log
MAIL_FROM_ADDRESS=no-reply@afyalinks.org
MAIL_FROM_NAME=Afyalink
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_ENCRYPTION=tls
PUBLIC_CONTACT_PHONE=+254711776391
PUBLIC_LOCATION=Hardy, Karen
SUPPORT_EMAIL=
PUBLIC_CONTACT_EMAIL=
ADMIN_EMAIL=
```

Milestone 5 recommendation assistance defaults to the local deterministic adapter:

```text
AI_RECOMMENDATION_DRIVER=local
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
```

Do not configure a live AI provider until prompt redaction, approval, monitoring, and billing controls are reviewed. The local adapter is enough for development and tests.

Process pending notifications manually:

```bash
cd apps/api
php scripts/process-notifications.php 25
```

For local manual testing, inspect the latest `notification_outbox.action_url` in the database or JSON dev store to retrieve the verification/reset token that a real mail worker would send. Do not log or expose those tokens in production.

## M-PESA Callback Foundation

Set provider credentials only in deployment secrets:

```text
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://api.afyalinks.org/api/payments/mpesa/callback
```

The callback endpoint stores redacted provider events and updates matched payment/subscription state. It does not fake STK success or hardcode credentials.

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
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

The Next.js app expects the API at:

```text
http://localhost:8000
```

To point the browser client elsewhere, set:

```text
NEXT_PUBLIC_SITE_URL=https://your-web-staging.onrender.com
NEXT_PUBLIC_AFYA_API_BASE=https://your-api-staging.onrender.com
```

The local route map includes public marketing pages, routed auth pages, and professional, facility, and admin portals.

## Render Staging

Use `render.yaml` from the repository root to create the staging API, web, and notification cron services on Render. The web service is a Node-backed Next.js service and requires `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_AFYA_API_BASE`. The staging API uses Neon PostgreSQL via `DATABASE_URL` and should use private R2/S3-compatible credential storage:

```text
AFYALINK_DATASTORE=pgsql
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
AFYALINK_CREDENTIAL_STORAGE=r2
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=afyalink-credentials
S3_ACCESS_KEY_ID=<Render secret>
S3_SECRET_ACCESS_KEY=<Render secret>
CORS_ALLOWED_ORIGINS=https://your-web-staging.onrender.com
NEXT_PUBLIC_SITE_URL=https://your-web-staging.onrender.com
NEXT_PUBLIC_AFYA_API_BASE=https://your-api-staging.onrender.com
```

Temporary local credential storage on Render is not durable and is only acceptable for throwaway staging smoke tests. See [Render Platform Architecture](deployment/render-platform.md) and [Render Staging Deployment](deployment/render-staging.md).

Cloudflare R2/S3-compatible private storage is already supported through `AFYALINK_CREDENTIAL_STORAGE=r2` plus `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. Keep buckets private; facility candidate views must not expose raw object keys.

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
npm.cmd run typecheck
npm.cmd run build
```
