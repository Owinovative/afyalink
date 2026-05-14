# Afyalink

![Afyalink logo](assets/brand/afyalink-logo.png)

Afyalink is a secure healthcare professional verification and placement platform.

The platform is designed to help healthcare professionals submit credential records, give consent for verification, pay required review/interview fees, and track application status. It also prepares the foundation for Afyalink administrators to review credentials, record verification evidence, manage audit logs, and later expose approved professional profiles to authorized healthcare facilities.

## Product Direction

Afyalink is not just a recruitment site. It is a trust infrastructure layer for healthcare staffing:

- verify healthcare professional identity and credentials;
- protect sensitive documents using private storage and controlled access;
- record consent, payment, review, and workflow decisions;
- support admin review, interview scoring, and recommendation workflows;
- prepare for future facility subscriptions and controlled candidate viewing.

## Milestone 1 Scope

Milestone 1 focuses on the foundation:

- professional registration and authentication;
- professional profile completion;
- credential document upload;
- consent capture and consent versioning;
- payment reference or M-PESA-ready payment domain;
- application submission workflow;
- admin review workflow;
- audit logs for all sensitive actions;
- private document storage design;
- secure, scalable architecture ready for later facility access.

Out of scope for Milestone 1:

- full facility marketplace;
- automated regulatory integrations unless a verified API exists;
- AI matching engine;
- unrestricted facility access to professional documents.

## Recommended Stack

The source documents recommend a secure modular monolith:

- Backend/domain core: Laravel 13 / PHP 8.3+
- Frontend: React with Next.js App Router, or Laravel Inertia + React
- Database: PostgreSQL
- Cache/queue: Redis
- Storage: private S3-compatible object storage such as AWS S3 or Cloudflare R2
- Payments: M-PESA Daraja
- Authentication: Laravel Sanctum/Fortify, MFA-ready
- Admin: Filament, custom Laravel admin, or React dashboard
- CI/CD: Docker and GitHub Actions

## Repository Structure

```text
afyalink/
  apps/
    api/                 # Backend application will live here
    web/                 # Frontend application will live here if separate Next.js is chosen
  assets/
    brand/               # Logo and brand assets
  docs/
    architecture/        # Engineering architecture decisions
    milestones/          # Milestone implementation plans
    security/            # Security and privacy design
    source/              # Original planning DOCX files
```

## First Engineering Decision

Start with a secure modular monolith. Do not start by building every future module. The first working release must make identity, credentials, documents, consent, payments, workflow state, and audit logs correct from day one.

## Local Setup Status

This repository now includes the first executable Milestone 1 domain foundation. The code is intentionally framework-light so the trust-critical rules can be tested before controllers, UI screens, and storage providers are wired in.

## Current Engineering Foundation

- Application workflow state machine.
- Payment workflow state machine.
- Credential document requirement registry.
- Submission readiness checker.
- Consent version validation.
- Private credential file upload policy.
- Audit event factory with secret redaction.
- PostgreSQL Milestone 1 schema.
- Milestone 1 API contract.
- GitHub Actions CI foundation.

## Local Checks

```bash
cd apps/api
composer dump-autoload
composer check
```

The current tests verify:

- unsafe application status jumps are blocked;
- duplicate payment confirmation transitions are blocked;
- profile, credential, consent, and payment readiness rules work;
- public credential storage paths are rejected;
- audit metadata redacts secrets;
- consent is tied to exact active wording and version.

## Documents

- [Milestone 1 Plan](docs/milestones/milestone-1.md)
- [Technical Direction](docs/architecture/technical-direction.md)
- [Security Foundation](docs/security/security-foundation.md)
- [Docs Index](docs/README.md)
