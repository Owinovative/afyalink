# Technical Direction

## Architecture

Afyalink should start as a modular monolith with strict domain boundaries. This keeps delivery fast while preserving a clear path to split services later if scale demands it.

## Core Domains

- Identity and access
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
- Service classes and policy classes should keep modules testable.

