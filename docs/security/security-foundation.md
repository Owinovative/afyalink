# Security Foundation

Afyalink handles identity records, credentials, professional licenses, payment events, facility access, and future interview scoring. Security must be designed into the first milestone.

## Required Controls

- Strong authentication with MFA-ready admin accounts.
- Role-based access control.
- Policy checks for every sensitive resource.
- Private object storage for all documents.
- Signed, time-limited document access when absolutely required.
- Full audit trail for document views, review actions, payment events, login failures, and admin changes.
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
