# Render Staging Deployment

This guide deploys Afyalink staging to Render using:

- Render Docker web service for the PHP API.
- Render Node web service for the Next.js public site and routed portals.
- Render Cron Job for notification outbox processing.
- Neon PostgreSQL through `DATABASE_URL`.
- Cloudflare R2/S3-compatible private object storage for credential files.

For the complete Render-first architecture, see [Render Platform Architecture](render-platform.md). For custom domain and branded email launch steps, see [Custom Domain and Branded Email](custom-domain-and-email.md).

## Render Blueprint

The repository includes `render.yaml` with three deployable services:

- `afyalink-api-staging`
- `afyalink-web-staging`
- `afyalink-notifications-staging`

Create a Render Blueprint from the repository and point Render at `render.yaml`.

## Database

Create a Neon PostgreSQL database for staging and set the API and notification cron `DATABASE_URL`.

Use SSL in the URL, for example:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

The API service uses Render `preDeployCommand` to run:

```bash
php scripts/migrate.php
```

Review migration SQL before deployment. Do not run destructive schema changes without a backup.

## Object Storage

Use Cloudflare R2 or another S3-compatible private bucket:

```text
AFYALINK_CREDENTIAL_STORAGE=r2
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=afyalink-credentials
S3_ACCESS_KEY_ID=<Render secret>
S3_SECRET_ACCESS_KEY=<Render secret>
```

Temporary local storage (`AFYALINK_CREDENTIAL_STORAGE=local`) is acceptable only for throwaway smoke tests. It is not durable on Render.

## API Environment Variables

Set these for `afyalink-api-staging`:

```text
APP_ENV=staging
APP_URL=https://YOUR-WEB-STAGING.onrender.com
API_URL=https://YOUR-API-STAGING.onrender.com
CORS_ALLOWED_ORIGINS=https://YOUR-WEB-STAGING.onrender.com,http://localhost:3000
AFYALINK_DATASTORE=pgsql
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
AFYALINK_CREDENTIAL_STORAGE=r2
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=afyalink-credentials
S3_ACCESS_KEY_ID=<Render secret>
S3_SECRET_ACCESS_KEY=<Render secret>
AFYALINK_SESSION_TTL_SECONDS=43200
AFYALINK_EMAIL_VERIFICATION_TTL_SECONDS=86400
AFYALINK_PASSWORD_RESET_TTL_SECONDS=3600
AFYALINK_MAX_UPLOAD_BYTES=8388608
MAIL_DRIVER=log
MAIL_FROM_ADDRESS=no-reply@afyalink.com
MAIL_FROM_NAME=Afyalink
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_ENCRYPTION=tls
SUPPORT_EMAIL=support@afyalink.com
PUBLIC_CONTACT_EMAIL=info@afyalink.com
ADMIN_EMAIL=admin@afyalink.com
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=https://YOUR-API-STAGING.onrender.com/api/payments/mpesa/callback
AI_RECOMMENDATION_DRIVER=local
```

Keep `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, SMTP secrets, R2 keys, and any AI provider keys in Render secrets only.

## Web Environment Variables

Set this for `afyalink-web-staging`:

```text
NEXT_PUBLIC_AFYA_API_BASE=https://YOUR-API-STAGING.onrender.com
```

Render should build the web service with:

```bash
npm install && npm run build
```

and start it with:

```bash
npm run start -- -p $PORT
```

## Notification Worker

The notification cron service runs:

```bash
php scripts/process-notifications.php 50
```

Recommended schedule:

```text
*/15 * * * *
```

Use the same `DATABASE_URL`, storage, and mail variables as the API. Keep `MAIL_DRIVER=log` until a live provider adapter is configured. Do not run overlapping duplicate notification jobs unless delivery idempotency has been reviewed.

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

## Health Check

Render should call:

```text
GET /api/health
```

Expected response:

```json
{
  "ok": true,
  "data": {
    "status": "ok"
  }
}
```

## M-PESA Callback

The callback endpoint is:

```text
https://YOUR-API-STAGING.onrender.com/api/payments/mpesa/callback
```

Use sandbox credentials for staging. Do not configure production Daraja credentials until callback IP policy, provider validation, reconciliation, and operational ownership are reviewed.

## Admin Bootstrap

After migrations run, open a Render shell for the API service:

```bash
cd /var/www/afyalink/apps/api
php scripts/create-admin.php "Afyalink Admin" admin@example.com 0799999999 AdminPass123
```

Use a strong staging password and rotate it after first login.

## Staging Verification

After deployment:

1. Open the web staging URL and confirm `/`, `/professionals`, `/students`, `/facilities`, `/matching`, `/trust-security`, and `/auth/login` render.
2. Register a professional and verify email through the queued notification link.
3. Complete profile, credential upload, consent, payment reference, and application submission.
4. Sign in as admin and review the application.
5. Complete verification and interview qualification for one candidate.
6. Publish the candidate from the admin facility operations console.
7. Register a facility, submit it for review, approve it as admin, and activate facility access.
8. Confirm the facility can browse/open the published candidate and that `candidate_profile_views` and `audit_logs` receive view records.
9. Open `/portal/admin/notifications`, `/portal/admin/reports`, `/portal/admin/privacy`, `/portal/admin/matching`, and `/portal/admin/placements`.
10. Confirm the notification cron job records delivery attempts without duplicates.

## Troubleshooting

- `DATABASE_URL is required`: confirm the API and notification cron have the same database secret.
- CORS failures: ensure `CORS_ALLOWED_ORIGINS` includes the exact web origin.
- Credential upload succeeds but later files are missing: local storage was used on Render; switch to R2/S3-compatible storage.
- Web calls localhost: set `NEXT_PUBLIC_AFYA_API_BASE` and redeploy the web service.
- M-PESA callback not matching payments: verify callback URL, environment, account reference, and redacted provider event records.
