# Render Staging Deployment

This guide deploys Afyalink staging to Render using:

- Render Docker web service for the PHP API.
- Render Node web service for the Next.js public site and routed portals.
- Neon PostgreSQL through `DATABASE_URL`.
- Temporary local credential storage on the API container filesystem.

## Important Storage Limitation

`AFYALINK_CREDENTIAL_STORAGE=local` on Render is temporary staging-only storage. Files written under `/tmp/afyalink/credentials` can be lost when Render restarts, redeploys, or moves the service. Use S3/R2/MinIO-compatible private object storage before production credential intake.

## Render Blueprint

The repository includes `render.yaml` with two services:

- `afyalink-api-staging`
- `afyalink-web-staging`

Create a Render Blueprint from the repository and point Render at `render.yaml`.

## Neon PostgreSQL

Create a Neon database for staging and copy the pooled or direct PostgreSQL connection string. Set it as the API service `DATABASE_URL`.

Use SSL in the URL, for example:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

The API Docker start command runs `php scripts/migrate.php` before starting the web server, so the Neon database is migrated on each deploy. Migrations are idempotent through `schema_migrations`.

## API Environment Variables

Set these in Render for `afyalink-api-staging`:

```text
APP_ENV=staging
APP_URL=https://YOUR-WEB-STAGING.onrender.com
API_URL=https://YOUR-API-STAGING.onrender.com
CORS_ALLOWED_ORIGINS=https://YOUR-WEB-STAGING.onrender.com
AFYALINK_DATASTORE=pgsql
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
AFYALINK_CREDENTIAL_STORAGE=local
AFYALINK_LOCAL_CREDENTIAL_ROOT=/tmp/afyalink/credentials
AFYALINK_SESSION_TTL_SECONDS=43200
AFYALINK_EMAIL_VERIFICATION_TTL_SECONDS=86400
AFYALINK_PASSWORD_RESET_TTL_SECONDS=3600
AFYALINK_MAX_UPLOAD_BYTES=8388608
```

Do not set S3 credentials while using temporary local staging storage.

## Web Environment Variables

Set this in Render for `afyalink-web-staging`:

```text
NEXT_PUBLIC_AFYA_API_BASE=https://YOUR-API-STAGING.onrender.com
```

The Next.js browser client reads this public build/runtime value so routed pages call the deployed API rather than localhost. Render should build the web service with:

```bash
npm install && npm run build
```

and start it with:

```bash
npm run start -- -p $PORT
```

## Admin Bootstrap

After the API service is deployed and migrations have run, open a Render shell for the API service and run:

```bash
cd /var/www/afyalink/apps/api
php scripts/create-admin.php "Afyalink Admin" admin@example.com 0799999999 AdminPass123
```

Use a strong staging password and rotate it after first login.

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

## Staging Verification

After deployment:

1. Open the web staging URL and confirm `/`, `/professionals`, `/facilities`, `/trust-security`, and `/auth/login` render.
2. Register a professional.
3. Inspect `notification_outbox` in Neon to retrieve the verification URL while no mail worker exists.
4. Complete profile, credential upload, consent, payment reference, and application submission.
5. Sign in as admin and review the application.
6. Complete verification and interview qualification for one candidate.
7. Publish the candidate from the admin facility operations console.
8. Register a facility, submit it for review, approve it as admin, and activate facility access.
9. Confirm the facility can browse/open the published candidate at `/portal/facility/candidates/:publicationId` and that `candidate_profile_views` and `audit_logs` receive view records.

## Production Changes Required Later

Before production:

- Replace temporary local credential storage with private S3/R2 storage.
- Add a real mail delivery worker for `notification_outbox`.
- Add production M-PESA callbacks and reconciliation for facility access subscriptions.
- Use a dedicated migration/predeploy step instead of running migrations in the API start command if zero-downtime deploys are required.
- Add a Render persistent disk only if intentionally accepting single-instance storage constraints. Object storage is preferred for credentials.
