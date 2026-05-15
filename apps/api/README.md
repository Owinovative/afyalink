# Afyalink API

Backend domain foundation for Afyalink Milestone 1.

This folder currently contains framework-light PHP domain code for the trust-critical workflows that must remain correct after the Laravel/API layer is scaffolded.

## Included Now

- Domain enums for application, credential, payment, document, and role states.
- Application status transition rules.
- Payment status transition rules.
- Professional profile and credential records.
- Full submission service.
- Admin review service.
- Permission matrix.
- Signed private document link factory.
- Payment intent factory.
- Priority regulatory body registry.
- Professional submission readiness checks.
- Credential requirement registry.
- File upload security policy.
- Consent version validation.
- Audit event creation with secret redaction.
- PostgreSQL foundation schema.
- Milestone 1 API contract.
- Executable test runner.

## Run Checks

```bash
composer dump-autoload
composer check
```

Current checks include full submission, admin review, permission boundary, document signing, idempotent payment, consent, audit redaction, and upload policy tests.

## Recommended Implementation Path

1. Scaffold Laravel 13 / PHP 8.3+.
2. Configure PostgreSQL, Redis, private storage, and queue workers.
3. Build Milestone 1 modules:
   - auth and roles;
   - professional profiles;
   - credential documents;
   - consent;
   - payments;
   - application workflow;
   - audit logs;
   - admin review.
4. Move or wrap the current domain classes inside Laravel services/policies without weakening the rules.
