# Render Platform Architecture

Milestone 6 makes Render the preferred runtime target for Afyalink while keeping Cloudflare R2/S3-compatible object storage external. Render should run the API, frontend, and notification processing. It should not become the long-term credential/document object store.

## Runtime Components

| Component | Render shape | Purpose |
| --- | --- | --- |
| API backend | Docker web service from `apps/api` | PHP API, auth, professional/facility/admin workflows, M-PESA callback receiver, health checks |
| Frontend | Node web service from `apps/web` | Next.js App Router public site and portals |
| Notification processor | Cron job from `apps/api` | Processes `notification_outbox` in bounded batches |
| Database migrations | API pre-deploy command | Runs `php scripts/migrate.php` before the API starts |
| Database | Neon PostgreSQL now; optional Render PostgreSQL later | Stores platform records |
| Object storage | Cloudflare R2 or S3-compatible external bucket | Stores private credential/document objects |

## API Web Service

Recommended Render settings:

```text
Runtime: Docker
Root directory: apps/api
Dockerfile path: ./Dockerfile
Health check path: /api/health
Pre-deploy command: php scripts/migrate.php
Start command: Docker CMD
```

The Docker image starts the PHP built-in router with:

```text
php -S 0.0.0.0:${PORT:-10000} -t public public/index.php
```

Render owns `PORT`; do not hardcode a production port.

Required API environment variables:

```text
APP_ENV=staging or production
APP_URL=https://your-web-domain
API_URL=https://your-api-domain
CORS_ALLOWED_ORIGINS=https://your-web-domain,http://localhost:3000
AFYALINK_DATASTORE=pgsql
DATABASE_URL=postgresql://...
AFYALINK_SESSION_TTL_SECONDS=43200
AFYALINK_EMAIL_VERIFICATION_TTL_SECONDS=86400
AFYALINK_PASSWORD_RESET_TTL_SECONDS=3600
AFYALINK_MAX_UPLOAD_BYTES=8388608
```

Credential storage should use R2/S3-compatible storage outside Render:

```text
AFYALINK_CREDENTIAL_STORAGE=r2
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=afyalink-credentials
S3_ACCESS_KEY_ID=<Render secret>
S3_SECRET_ACCESS_KEY=<Render secret>
```

Never expose object keys or bucket credentials to the frontend.

M-PESA/Daraja variables:

```text
MPESA_ENV=sandbox or production
MPESA_CONSUMER_KEY=<Render secret>
MPESA_CONSUMER_SECRET=<Render secret>
MPESA_PASSKEY=<Render secret>
MPESA_SHORTCODE=<Render secret>
MPESA_CALLBACK_URL=https://your-api-domain/api/payments/mpesa/callback
```

Mail variables:

```text
MAIL_DRIVER=log or smtp
MAIL_FROM_ADDRESS=no-reply@afyalinks.org
MAIL_FROM_NAME=Afyalink
SMTP_HOST=<Render secret>
SMTP_PORT=587
SMTP_USERNAME=<Render secret>
SMTP_PASSWORD=<Render secret>
SMTP_ENCRYPTION=tls
PUBLIC_CONTACT_PHONE=+254711776391
PUBLIC_LOCATION=Hardy, Karen
SUPPORT_EMAIL=
PUBLIC_CONTACT_EMAIL=
ADMIN_EMAIL=
```

For the Afyalink custom domain launch, use:

```text
APP_URL=https://www.afyalinks.org
API_URL=https://api.afyalinks.org
CORS_ALLOWED_ORIGINS=https://www.afyalinks.org
```

See [Custom Domain and Branded Email](custom-domain-and-email.md) for DNS and email-provider records.

## Frontend Web Service

Recommended Render settings:

```text
Runtime: Node
Root directory: apps/web
Build command: npm install && npm run build
Start command: npm run start -- -p $PORT
```

Required frontend variables:

```text
NEXT_PUBLIC_SITE_URL=https://your-web-domain
NEXT_PUBLIC_AFYA_API_BASE=https://your-api-domain
PUBLIC_CONTACT_PHONE=+254711776391
PUBLIC_LOCATION=Hardy, Karen
PUBLIC_CONTACT_EMAIL=
SUPPORT_EMAIL=
```

For the Afyalink custom domain launch, use:

```text
NEXT_PUBLIC_SITE_URL=https://www.afyalinks.org
NEXT_PUBLIC_AFYA_API_BASE=https://api.afyalinks.org
```

The frontend contains no secrets. Only public runtime configuration should use `NEXT_PUBLIC_`.

## Notification Processor

The processor is safe to run as a Render Cron Job:

```text
Runtime: Docker
Root directory: apps/api
Docker command: php scripts/process-notifications.php 50
Schedule: */10 * * * *
```

The processor records delivery attempts and works from the outbox. Keep batches bounded so a retry spike does not monopolize the instance. Do not run multiple schedules with the same outbox unless duplicate-send protection has been reviewed.
Recommended Render Cron Job name: `afyalink-notification-worker`.

## Database Strategy

Neon PostgreSQL is currently acceptable and can remain the production database while services run on Render. Render PostgreSQL can be introduced later, but it must be treated as a data migration, not a simple environment edit.

Safe migration rules:

- back up Neon before any cutover;
- restore into a staging Render PostgreSQL database first;
- run `php scripts/migrate.php`;
- compare critical row counts and workflow smoke tests;
- switch `DATABASE_URL` only after validation;
- keep the old database read-only during rollback window.

## Migration Strategy

Milestone migrations are idempotent through the migration table, but they still change production schema. Prefer Render `preDeployCommand` over running migrations inside the long-lived web start command. For first deploys:

1. Create database and secrets.
2. Run the API service with pre-deploy migrations enabled.
3. Confirm `/api/health`.
4. Start the frontend.
5. Start the notification cron job after mail/provider configuration is reviewed.

For later deploys, review migration SQL before merge and let Render run the pre-deploy command once per API deployment.

## Object Storage

Cloudflare R2 remains external because credential objects must be private, durable, and independently governed. Render local disk is not suitable for long-term credential records. Temporary local storage may be used only for short-lived staging smoke tests.

## Future Jobs

The following should be added as separate Render cron jobs only when the matching services exist:

- subscription expiry and access reconciliation;
- failed notification retry review;
- privacy request deadline reminders;
- report snapshot generation;
- payment reconciliation against provider statements.

Each job must be idempotent, bounded, and audited.

## Custom Domain Launch Checklist

1. Buy domain.
2. Add domain to Cloudflare.
3. Add frontend custom domain in Render.
4. Add backend custom domain in Render.
5. Add DNS CNAME records.
6. Add Zoho/Google email DNS records.
7. Verify SPF/DKIM/DMARC.
8. Update Render frontend env.
9. Update Render backend env.
10. Redeploy frontend.
11. Redeploy backend.
12. Test website.
13. Test API health.
14. Test email verification.
15. Test password reset.
16. Test notification worker.
