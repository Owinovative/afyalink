# Milestone 1 API Endpoints

Base path: `/api`

The current implementation is framework-light and Laravel-ready. It uses bearer tokens created by the local auth service and now supports PostgreSQL-backed runtime persistence through `AFYALINK_DATASTORE=pgsql`.

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Process health check |
| `POST` | `/api/auth/register` | Register a professional and return a bearer token |
| `POST` | `/api/auth/login` | Login professional or admin |
| `POST` | `/api/auth/email/verify` | Verify an email verification token |
| `POST` | `/api/auth/password/forgot` | Queue a password reset notification with anti-enumeration response |
| `POST` | `/api/auth/password/reset` | Reset password with a valid reset token |

## Authenticated Professional

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/logout` | Revoke current session token |
| `POST` | `/api/auth/email/resend` | Queue a new verification notification for the authenticated professional |
| `GET` | `/api/me` | Current authenticated user |
| `GET` | `/api/professional/dashboard` | Profile, credential, consent, payment, application, and readiness state |
| `PUT` | `/api/professional/profile` | Save professional profile |
| `GET` | `/api/professional/credentials` | List professional credential metadata |
| `POST` | `/api/professional/credentials` | Upload a private credential document as base64 JSON |
| `POST` | `/api/professional/consents` | Accept the active consent wording/version |
| `POST` | `/api/professional/payments` | Create an idempotency-aware payment intent/reference |
| `POST` | `/api/professional/application/submit` | Submit application when readiness conditions pass |

## Admin

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/applications` | List applications with optional `status` and `search` query filters |
| `GET` | `/api/admin/applications/{id}` | Application detail with profile, credentials, payment, consent |
| `PATCH` | `/api/admin/applications/{id}/action` | Run review action: `start_review`, `request_replacement`, `verify`, `approve`, `reject` |
| `PATCH` | `/api/admin/credentials/{id}/review` | Set credential status: `accepted`, `rejected`, `needs_replacement`, etc. |
| `PATCH` | `/api/admin/payments/{id}/status` | Move payment through allowed state transitions |
| `GET` | `/api/admin/audit-logs` | Latest audit records |

`GET /api/admin/applications` also returns an `overview` object with total, awaiting review, replacement, ready, approved, and rejected counters.

## Email Verification Contract

Registration queues an email verification notification. In the current dev adapter, notification rows are written to `notification_outbox`; a later mail worker can deliver them through SMTP or an email provider without changing the controller flow.

```json
{
  "token": "verification-token-from-email"
}
```

Final application submission is blocked until the professional account has `email_verified_at`.

## Password Reset Contract

Forgot password uses a safe response for both known and unknown emails:

```json
{
  "email": "professional@example.com"
}
```

Reset uses the token from the queued notification:

```json
{
  "token": "reset-token-from-email",
  "password": "NewStrongPass123"
}
```

Reset tokens are hashed at rest, expire, and are single-use. Successful password reset revokes existing sessions.

## Credential Upload Contract

Credential upload uses JSON in this milestone implementation:

```json
{
  "document_type": "professional_license",
  "original_name": "license.pdf",
  "mime_type": "application/pdf",
  "content_base64": "JVBERi0xLjQ..."
}
```

Allowed document types include `cv`, `national_id_or_passport`, `professional_license`, `academic_certificate`, and optional experience/payment/regulatory evidence types.

The API stores the file through a private credential storage adapter, records checksum and metadata, and never returns a public direct file URL. Supported storage drivers are local private storage and S3-compatible object storage for MinIO/S3/R2 style providers.

## Payment Contract

Payment intent creation is integration-ready:

```json
{
  "method": "mpesa_manual_reference",
  "amount_cents": 250000,
  "currency": "KES",
  "idempotency_key": "unique-client-key",
  "external_reference": "optional-reference"
}
```

The same `user_id + idempotency_key` returns the existing payment row.
