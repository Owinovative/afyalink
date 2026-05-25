# Privacy Requests and Retention

Afyalink Milestone 4 adds a privacy request foundation without destructive automatic deletion.

## Request Types

Supported request types:

- `data_access`
- `correction`
- `deletion_retention`
- `consent_withdrawal`

Statuses:

- `submitted`
- `under_review`
- `completed`
- `rejected`
- `cancelled`

## Routes

- Public/protected request submission: `POST /api/privacy-requests`
- Admin listing: `GET /api/admin/privacy-requests`
- Admin update: `PATCH /api/admin/privacy-requests/{id}`
- Web admin queue: `/portal/admin/privacy`

## Data Minimization

Admin-facing privacy request lists mask subject emails. Audit logs record request type and status changes without copying full sensitive narrative into unrelated logs.

## Retention Assumptions

Credential files, audit logs, payment records, facility profile views, and notification delivery attempts are retained by default for business, security, compliance, and dispute-resolution purposes.

Deletion or consent-withdrawal requests should be reviewed by an authorized admin before any destructive action. The current implementation records and manages the request; actual erasure workflows remain deferred until retention policy and legal basis are finalized.
