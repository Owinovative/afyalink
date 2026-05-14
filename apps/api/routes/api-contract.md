# Milestone 1 API Contract

This is the first backend API contract. Controllers should enforce policy checks, validation, audit logging, and rate limits.

## Professional

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `PUT /professional/profile`
- `GET /professional/application`
- `POST /professional/credentials`
- `POST /professional/consents`
- `POST /professional/application/submit`

## Payments

- `POST /payments/intents`
- `GET /payments/:id`
- `POST /payments/:id/manual-reference`
- `POST /payments/mpesa/callback`

## Admin Review

- `GET /admin/applications`
- `GET /admin/applications/:id`
- `PATCH /admin/applications/:id/status`
- `PATCH /admin/credentials/:id/review`
- `POST /admin/applications/:id/verification-evidence`

## Audit

- `GET /admin/audit-logs`

## Mandatory Rules

- Professional endpoints must scope to the authenticated professional only.
- Admin endpoints require roles and policy checks.
- Document access must use signed private delivery.
- Every review, document view, payment event, and status change must create an audit log.

