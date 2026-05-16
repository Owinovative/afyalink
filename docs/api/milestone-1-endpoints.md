# Milestone 1 API Endpoints

Base path: `/api`

The current implementation is framework-light and Laravel-ready. It uses bearer tokens created by the local auth service and now supports PostgreSQL-backed runtime persistence through `AFYALINK_DATASTORE=pgsql`.

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Process health check |
| `POST` | `/api/auth/register` | Register a professional and return a bearer token |
| `POST` | `/api/auth/login` | Login professional or admin |

## Authenticated Professional

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/logout` | Revoke current session token |
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
