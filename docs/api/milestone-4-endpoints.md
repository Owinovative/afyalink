# Milestone 4 API Endpoints

Base path: `/api`

## Notification Operations

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/notifications` | Admin notification overview, failed queue, and recent notifications |
| `POST` | `/api/admin/notifications/process` | Process pending/due notification outbox records |

Requires `notification.manage`.

## Payments and M-PESA

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/payments/mpesa/callback` | Receive Daraja callback, persist redacted provider event, and update matched payment/subscription |
| `PATCH` | `/api/admin/payments/{id}/status` | Manual payment review remains available |
| `POST` | `/api/facility/access/payment-intents` | Create facility access subscription payment reference |
| `PATCH` | `/api/admin/facilities/{id}/subscription` | Activate, suspend, expire, cancel, or extend facility access |

Callback processing is idempotent by provider dedupe key and does not expose provider secrets.

## Operations and Reporting

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/operations/dashboard` | Admin command center counters and work queues |
| `GET` | `/api/admin/reports` | Aggregated application, verification, interview, facility, subscription, publication, recommendation, student, notification, and privacy summaries |

Requires `operations.read` or `reports.read`.

## Privacy Requests

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/privacy-requests` | Submit data access, correction, retention/deletion, or consent-withdrawal request |
| `GET` | `/api/admin/privacy-requests` | Admin privacy request queue |
| `PATCH` | `/api/admin/privacy-requests/{id}` | Admin privacy request status update |

Admin routes require `privacy_request.manage`.

## Student / Pre-Licensure

Milestone 4 uses the existing student track endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register/student` | Register waiting-license applicant |
| `GET` | `/api/admin/pre-licensure` | Admin pre-licensure queue |
| `PATCH` | `/api/admin/pre-licensure/{id}/convert` | Convert applicant after license evidence is ready |

Students remain blocked from licensed application submission and facility publication until conversion.
