# Production Launch Readiness Plan

## What Exists Now

- Render deployment is documented for the PHP API, Next.js frontend, migrations, and a notification cron job.
- `afyalinks.org` SEO foundations already exist through `sitemap.ts`, `robots.ts`, public metadata, and `noindex` metadata for auth and portal layouts.
- The backend has an outbox-based notification delivery service with retry scheduling, delivery attempts, and a `php scripts/process-notifications.php` worker.
- M-PESA callback processing exists for redacted provider events, idempotency, payment status transitions, and facility subscription activation.
- The public frontend uses protected portal gates that hide dashboard content when no role token exists.
- Admin operations already expose work queues for applications, payments, verification, notifications, facilities, requisitions, placements, students, privacy, and audit events.

## Missing For Launch

- The environment examples still imply public/support/admin email inboxes are always configured, instead of allowing blank inboxes before Zoho or Google Workspace is live.
- Public contact display needs to use the launch phone, location, and site while hiding email links when inboxes are not configured.
- SMTP is documented as a future configuration path, but the notification provider factory needs a real SMTP driver option for launch testing.
- Notification, Render, domain, email, and M-PESA docs need a single operational path for `www.afyalinks.org`, `api.afyalinks.org`, branded email, and cron checks.
- There is no idempotent local/staging demo seed command for role-based QA users and cross-role workflow data.
- Browser smoke tests do not yet cover public pages, protected portal gates, the homepage slider, or launch contact data.
- Launch QA is spread across milestone docs instead of one complete operations checklist.

## What This PR Will Implement

- Harden `.env.example`, `render.yaml`, and deployment docs for `www.afyalinks.org`, `api.afyalinks.org`, blank optional contact inboxes, Render custom domains, SSL, CORS, frontend API base, email DNS, notification cron, and M-PESA callback configuration.
- Add config-safe public contact helpers for the web app, including `Hardy, Karen`, `+254 711 776 391`, `www.afyalinks.org`, and optional email rendering.
- Add an SMTP email provider behind `MAIL_DRIVER=smtp` while keeping `MAIL_DRIVER=log` and `MAIL_DRIVER=null` safe for local/staging.
- Add an idempotent `php scripts/seed-demo-data.php` command with local/staging-only users, profiles, credentials metadata, applications, verification, interview, candidate publication, facility, requisition, match, shortlist, placement, and notification records.
- Add backend tests for launch-critical notification and seed idempotency behavior without changing production payment semantics.
- Add Playwright smoke tests for public routes, protected portal logged-out states, homepage slider controls, and public contact display.
- Add operations docs for full launch QA and Render launch execution.

## Risks

- Seed data touches many workflow tables. The command must remain idempotent and avoid deleting or overwriting real production records.
- SMTP support must not leak secrets or treat failed sends as success.
- Browser tests must avoid depending on live API availability for public route checks.
- Public contact email must not appear from fallback values when the email env is blank.

## Test Strategy

- Run existing web checks: `npm run check`, `npm run typecheck`, and `npm run build`.
- Run Playwright launch smoke tests after installing the browser runtime when available.
- Run existing backend checks: `composer dump-autoload` and `composer check`.
- Run `php scripts/seed-demo-data.php` twice against a temporary JSON datastore to verify idempotency.
- Run `git diff --check`.

## Deployment Strategy

- Merge to main only after CI/local checks pass.
- Configure Render API env first: app/API URLs, CORS, database, R2, mail driver, M-PESA callback, and optional contact inboxes.
- Configure Render frontend env: site URL and API base.
- Verify custom domains and SSL on Render before switching production traffic.
- Start the notification cron only after the mail driver and outbox behavior are verified.
- Seed demo data only in local or staging environments.

## Manual Items Remaining

- Buy and verify `afyalinks.org`.
- Add Cloudflare DNS records and root redirect.
- Configure Zoho Mail or Google Workspace generated MX/SPF/DKIM/DMARC values.
- Enter real SMTP and M-PESA credentials in Render secrets.
- Run live provider sandbox tests for email and Daraja before production credentials are enabled.
- Submit sitemap to Google Search Console and Bing Webmaster Tools after the domain is live.
