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
- professional application submission service;
- admin review service;
- role and permission matrix;
- signed private document link generation;
- payment intent idempotency;
- priority regulatory body registry;
- API kernel, route protection, and HTTP controllers;
- file-backed development persistence;
- local private credential storage adapter;
- professional dashboard and application submission endpoints;
- admin application, credential, payment, and audit endpoints;
- interactive web intake and admin review console wired to the API contracts.

These rules should be treated as the canonical product rules when the Laravel controllers, jobs, policies, and PostgreSQL/S3 repositories are added.

## Current Executable Flow

1. Professional registers or logs in.
2. Professional saves profile details.
3. Professional uploads required credentials privately.
4. Professional accepts the current consent wording/version.
5. Professional creates a payment reference or payment intent.
6. Admin verifies payment state.
7. Professional submits the application once backend readiness checks pass.
8. Admin reviews the application, credentials, payment state, and audit trail.

Credential review is deliberately separated from submission readiness. A professional may submit an intake package once required documents are uploaded and not rejected/replacement/expired. Admin acceptance happens during the verification review phase.
