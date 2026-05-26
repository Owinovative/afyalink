# Seeded Demo Data

Use this only for local or staging QA. The script refuses `APP_ENV=production`.

## Run

```bash
cd apps/api
php scripts/seed-demo-data.php
```

For a JSON local datastore:

```bash
cd apps/api
APP_ENV=staging AFYALINK_DATASTORE=json AFYALINK_JSON_DATASTORE=storage/runtime/demo.json php scripts/seed-demo-data.php
```

## Demo Users

All demo users use:

```text
Password123!
```

Accounts:

```text
admin@afyalinks.test
professional@afyalinks.test
student@afyalinks.test
facility@afyalinks.test
recruiter@afyalinks.test
```

These are local/staging-only accounts. Do not use them in production.

## Seeded Workflow

The seed creates or updates:

- admin, professional, student, facility owner, and recruiter users
- licensed professional profile
- student awaiting-license profile
- facility profile and memberships
- credential metadata only, with no real sensitive files
- consent records
- application records
- manual payment and redacted M-PESA event sample
- verification case
- completed interview and score items
- published candidate for the licensed professional only
- active facility access
- facility requisition
- candidate match
- shared shortlist
- placement in progress
- notification outbox records
- privacy request sample

The script is idempotent. Running it again updates the same demo records instead of duplicating them.
