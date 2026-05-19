# Milestone 1 API Contract

This is the first backend API contract. Controllers should enforce policy checks, validation, audit logging, and rate limits.

## Professional

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/email/verify`
- `POST /auth/email/resend`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
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

## Facility Marketplace

- `POST /facility/auth/register`
- `GET /facility/dashboard`
- `PUT /facility/profile`
- `POST /facility/submit`
- `POST /facility/access/payment-intents`
- `GET /facility/candidates`
- `GET /facility/candidates/:id`
- `POST /facility/requests/appointments`
- `POST /facility/recommendation-requests`
- `GET /facility/recommendation-packages`

## Admin Facility Operations

- `GET /admin/facility-operations/overview`
- `GET /admin/facilities`
- `GET /admin/facilities/:id`
- `PATCH /admin/facilities/:id/review`
- `PATCH /admin/facilities/:id/subscription`
- `GET /admin/candidate-publications`
- `POST /admin/candidate-publications`
- `PATCH /admin/candidate-publications/:id`
- `GET /admin/facility-requests`
- `PATCH /admin/facility-requests/:id`
- `POST /admin/facility-requests/:id/appointments`
- `GET /admin/recommendation-requests`
- `PATCH /admin/recommendation-requests/:id`
- `GET /admin/recommendation-packages`
- `POST /admin/recommendation-packages`
- `PATCH /admin/recommendation-packages/:id`

## Mandatory Rules

- Professional endpoints must scope to the authenticated professional only.
- Admin endpoints require roles and policy checks.
- Document access must use signed private delivery.
- Every review, document view, payment event, and status change must create an audit log.
- Email verification and password reset tokens must be hashed, expiring, and single-use.
- Notification delivery must be outbox-driven rather than embedded directly in controllers.
- Facility candidate browsing requires approved facility status and active access.
- Candidate detail must stay read-only, watermarked, and audited.
- Facility endpoints must not expose raw credential storage keys or direct public document URLs.
