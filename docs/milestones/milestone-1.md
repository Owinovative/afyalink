# Milestone 1 Implementation Plan

Milestone 1 delivers the professional credential intake foundation.

## Functional Scope

### Professional Onboarding

- Register with name, email, phone, and password.
- Verify email before final application submission.
- Recover password through hashed, expiring reset tokens.
- Complete profession, regulatory body, license number, county, experience, availability, and work preferences.
- View current application status.

### Credential Upload

- Upload CV, ID/passport, professional license, academic certificates, and optional experience letters.
- Store uploads privately.
- Classify each upload by document type.
- Calculate checksum for each file.
- Allow admin review: accepted, rejected, or needs replacement.
- Let professionals replace documents that reviewers mark as needs replacement while preserving superseded history.

### Consent and Submission

- Capture explicit consent before submission.
- Version consent wording.
- Record IP/device/timestamp.
- Submit application in a database transaction.

### Admin Review

- Review professional profile and documents.
- Record verification notes and evidence.
- Request document replacement.
- View overview counters, queue filters, and application timeline/history.
- Approve, reject, or hold applications.
- Audit every review action.

### Payments

- Record payment intent/reference.
- Prepare M-PESA-ready payment domain.
- Track payment status and callback/reconciliation events.

## Definition of Done

- Professionals can register, complete profile, upload documents, accept consent, and submit.
- Professionals can verify email and recover passwords.
- Admins can review applications and documents.
- Professionals can see replacement requests and upload corrected documents.
- Notification outbox records exist for verification, reset, submission, and replacement events.
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
- professional application submission service;
- admin review service;
- role and permission matrix;
- signed private document link generation;
- payment intent idempotency;
- priority regulatory body registry;
- API kernel, route protection, and HTTP controllers;
- PostgreSQL-backed runtime repository adapter;
- JSON datastore retained for explicit test/dev fixture mode;
- local private and S3-compatible credential storage adapters;
- professional dashboard and application submission endpoints;
- admin application, credential, payment, and audit endpoints;
- email verification, password reset, and notification outbox endpoints/services;
- interactive step-based web intake and admin review console wired to the API contracts.

These rules should be treated as the canonical product rules when Laravel controllers, jobs, policies, and ORM repositories are added.

## Current Executable Flow

1. Professional registers or logs in.
2. Professional verifies email through a queued notification link.
3. Professional saves profile details.
4. Professional uploads required credentials privately.
5. Professional accepts the current consent wording/version.
6. Professional creates a payment reference or payment intent.
7. Admin verifies payment state.
8. Professional submits the application once backend readiness checks pass.
9. Admin reviews the application, credentials, payment state, and audit trail.
10. If a document needs replacement, the professional sees the reason, uploads a corrected file, and the prior credential is superseded.

Credential review is deliberately separated from submission readiness. A professional may submit an intake package once required documents are uploaded and not rejected/replacement/expired. Admin acceptance happens during the verification review phase.

## Runtime Infrastructure Status

- PostgreSQL is the default runtime datastore through `AFYALINK_DATASTORE=pgsql`.
- JSON persistence remains available only when explicitly selected for tests or fixture work.
- Credential storage can use local private storage or S3-compatible object storage for MinIO/S3/R2 style providers.
- API responses avoid returning raw password hashes, credential storage keys, or payment idempotency keys.
