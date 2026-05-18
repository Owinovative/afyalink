# Security Foundation

Afyalink handles identity records, credentials, professional licenses, payment events, facility access, and future interview scoring. Security must be designed into the first milestone.

## Required Controls

- Strong authentication with MFA-ready admin accounts.
- Role-based access control.
- Policy checks for every sensitive resource.
- Private object storage for all documents.
- Signed, time-limited document access when absolutely required.
- Full audit trail for document views, review actions, payment events, login failures, and admin changes.
- Hashed, expiring, single-use email verification and password reset tokens.
- Safe password reset responses that do not reveal whether an email exists.
- Rate limiting on login, upload, payment, and public endpoints.
- Server-side file validation by type, size, and checksum.
- No public direct links to credential documents.
- No secrets in logs, frontend payloads, or committed files.

## Document Protection

Technical controls can reduce misuse but cannot make screenshots impossible. Afyalink should combine:

- private file delivery;
- visible watermarks;
- audit trails;
- no-download controls where practical;
- role restrictions;
- facility terms and legal restrictions.

## Privacy Position

Use minimum necessary access. Facilities should only see approved candidate information after authorization, and raw documents should remain tightly controlled.

## Implemented Foundation

- `FileUploadPolicy` rejects unsupported MIME types, oversized files, and public storage paths.
- `SensitiveDataRedactor` removes passwords, tokens, secrets, passkeys, cookies, authorization headers, and database URLs from audit metadata.
- `AuditEventFactory` creates sanitized audit events for sensitive workflows.
- `ConsentPolicy` binds accepted consent to an exact version and text hash.
- PostgreSQL schema keeps audit logs, document versions, payments, application events, and consent records separate for traceability.
- PostgreSQL-backed runtime repositories are now available for Milestone 1 auth, profile, credential, consent, payment, application, and audit records.
- The S3-compatible credential storage adapter keeps credential objects private and rejects unsafe storage keys before making object-storage requests.
- API responses avoid returning password hashes, credential storage keys, and payment idempotency keys.
- Email verification and password reset tokens are hashed in persistence. Plain tokens appear only in queued notification action URLs, matching real email delivery behavior.
- Password reset completion revokes active sessions and records an audit event.
- Application submission readiness requires verified professional email.
- Credential replacement requests queue a professional notification and replacement uploads supersede prior rejected/replacement documents.

## Notification Security

The Milestone 1 notification layer is an outbox, not a direct SMTP integration. It stores the minimum delivery metadata needed for later workers and keeps all credential files private. Production mail workers must treat `action_url` values as sensitive because verification and reset links contain bearer-style one-time tokens.
