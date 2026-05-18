# Technical Direction

## Architecture

Afyalink should start as a modular monolith with strict domain boundaries. This keeps delivery fast while preserving a clear path to split services later if scale demands it.

## Core Domains

- Identity and access
- Account lifecycle and notification outbox
- Professional profiles
- Credential documents
- Consent and legal acceptance
- Payments
- Application workflow
- Admin review
- Audit logging
- Notifications
- Facility access later

## Recommended Stack

- Laravel 13 / PHP 8.3+ for backend and domain core
- PostgreSQL for relational integrity and audit-friendly data
- Redis for queue, rate limiting, cache, and background jobs
- Private S3-compatible object storage for credentials
- M-PESA Daraja for payments
- React/Next.js or Laravel Inertia + React for UI
- Docker and GitHub Actions for repeatable deployment

## Engineering Rules

- Backend owns all sensitive state transitions.
- Database constraints must enforce core integrity.
- Files must never be stored in a public web directory.
- Background jobs should handle notifications, payment callbacks, virus scanning, and future reminders.
- Notification delivery should be driven from an outbox table so email verification, reset, and review messages are durable and retryable.
- Service classes and policy classes should keep modules testable.

## Current Productionization Direction

- Runtime persistence is selected by configuration through `AFYALINK_DATASTORE`.
- `pgsql` is the production-oriented default and uses a PDO-backed repository adapter against PostgreSQL tables with foreign keys and indexes.
- `json` is preserved only for tests and explicit local fixture work.
- Credential storage is selected by `AFYALINK_CREDENTIAL_STORAGE`.
- `local` stores files outside public web paths for development.
- `s3`, `minio`, and `r2` use the S3-compatible private object storage adapter.
- The domain/application service contracts remain stable so a later Laravel repository layer can replace the framework-light adapters without rewriting workflow rules.
- Account lifecycle flows now use hashed verification/reset token records and notification outbox rows. This keeps direct mail providers outside controllers and prepares the system for Redis-backed queue workers later.
