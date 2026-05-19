# Afyalink Codex Instructions

Afyalink is a healthcare professional verification and placement platform. Treat it as security-sensitive healthcare infrastructure.

## Current Architecture

- Preserve the modular monolith direction.
- Keep business workflow state transitions in backend domain/application services.
- Keep controllers thin. Do not place credential, consent, payment, or application state logic directly in controllers.
- PHP 8.3+ is the current backend foundation. The code is framework-light but should remain Laravel-ready.
- PostgreSQL is the target relational database. Migrations must use constraints, indexes, and foreign keys.
- Credential files must stay private. Never add public credential URLs or permanent public links.

## Milestone Boundaries

Current implemented milestones cover professional credential intake, regulatory verification/interviews, and facility marketplace operations.

Milestone 1 is professional credential intake:

- professional auth;
- professional profile;
- private credential upload;
- versioned consent;
- payment reference/payment intent;
- application submission readiness;
- admin review;
- email verification/password reset lifecycle;
- notification outbox;
- audit logging.

Milestone 3 adds facility onboarding, facility access subscriptions, candidate publication, controlled candidate viewing, appointment requests, and recommendation packages. Keep facility candidate access approval-gated, subscription-gated, read-only, watermarked, and audited. Production M-PESA callbacks and document preview endpoints should be added only behind clean extension points.

## Security Rules

- Never commit `.env` files or secrets.
- Never log passwords, password hashes, tokens, cookies, M-PESA secrets, S3 secrets, or database URLs.
- Do not expose credential storage keys as downloadable public URLs.
- All admin-sensitive actions must require authorization and create an audit record.
- Keep consent wording versioned and hash-validated.
- Payment transitions must be idempotency-aware and state-machine controlled.
- Verification and reset tokens must be hashed at rest, expire, and never be logged.
- Notification outbox action URLs are sensitive and must not be exposed through public/debug endpoints.
- Candidate publication must remain separate from raw professional/application records.
- Candidate publication requires qualified or approved application state, current consent, passed verification, and a completed recommended interview.
- Facility users must never receive raw credential storage keys or direct public credential URLs.

## Verification Commands

Run these before handing work back:

```bash
cd apps/api
composer dump-autoload
php scripts/migrate.php # when DATABASE_URL is configured
composer check

cd ../web
npm.cmd run check
```

## Git Discipline

- Work on feature branches, never directly on `main`.
- Keep changes coherent and milestone-focused.
- Update docs when API routes, setup, or workflow behavior changes.
