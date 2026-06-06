# Milestone 1 API Contract

This is the first backend API contract. Controllers should enforce policy checks, validation, audit logging, and rate limits.

## Professional & Student

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

## Public & B2C Insurance (No Auth Required)

- `POST /insurance/public/quote` *(Generates dynamic underwriting quotes)*
- `POST /insurance/public/apply` *(Initiates application and payment intent)*
- `GET /insurance/public/policy/:policyNumber` *(Requires OTP or verification token for access)*

## Professional Insurance (Authenticated)

- `GET /professional/insurance/quote` *(Pre-filled using verified profile data)*
- `POST /professional/insurance/apply`
- `GET /professional/insurance/policies`

## Facility Insurance (Requires Approved Status)

- `GET /facility/insurance/overview` *(Metrics & billing summary)*
- `GET /facility/insurance/catalog` *(Partnered B2B Master Plans)*
- `GET /facility/insurance/enrolled-staff`
- `POST /facility/insurance/enroll` *(Adds professional to master cover)*
- `PATCH /facility/insurance/enrollments/:id/status` *(Activate/Deactivate locum cover)*

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

## Admin Insurance Operations

- `GET /admin/insurance/policies`
- `GET /admin/insurance/policies/:id`
- `PATCH /admin/insurance/policies/:id/status`
- `GET /admin/insurance/analytics`

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
- **Insurance:** All monetary calculations (Premiums, Coverage Limits) must be executed server-side and stored as integers (cents/sub-units) to prevent floating-point errors.
- **Insurance:** Unauthenticated public endpoints (`/insurance/public/*`) must have strict rate limiting to prevent automated scraping of pricing engines.
- **Insurance:** Facility insurance endpoints MUST cryptographically verify that the `facility.status === 'approved'` before returning pricing catalogs or enrolled staff data.
