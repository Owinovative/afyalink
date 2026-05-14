# Milestone 1 Implementation Plan

Milestone 1 delivers the professional credential intake foundation.

## Functional Scope

### Professional Onboarding

- Register with name, email, phone, and password.
- Verify email before final application submission.
- Complete profession, regulatory body, license number, county, experience, availability, and work preferences.
- View current application status.

### Credential Upload

- Upload CV, ID/passport, professional license, academic certificates, and optional experience letters.
- Store uploads privately.
- Classify each upload by document type.
- Calculate checksum for each file.
- Allow admin review: accepted, rejected, or needs replacement.

### Consent and Submission

- Capture explicit consent before submission.
- Version consent wording.
- Record IP/device/timestamp.
- Submit application in a database transaction.

### Admin Review

- Review professional profile and documents.
- Record verification notes and evidence.
- Request document replacement.
- Approve, reject, or hold applications.
- Audit every review action.

### Payments

- Record payment intent/reference.
- Prepare M-PESA-ready payment domain.
- Track payment status and callback/reconciliation events.

## Definition of Done

- Professionals can register, complete profile, upload documents, accept consent, and submit.
- Admins can review applications and documents.
- Audit logs exist for all sensitive actions.
- Documents are private and not exposed through public links.
- Payment records are structured for M-PESA integration.
- Core tables, policies, and validation are in place.

## Engineering Foundation Added

The repository now includes framework-light domain code for:

- application status transitions;
- payment status transitions;
- submission readiness;
- credential requirements;
- consent version validation;
- file upload safety;
- audit metadata redaction;
- PostgreSQL Milestone 1 tables and indexes.

These rules should be treated as the canonical product rules when the Laravel controllers, jobs, policies, and UI are added.
