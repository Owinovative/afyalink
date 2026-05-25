# ASVS Readiness Checklist

Afyalink uses OWASP ASVS as a security direction. This document is a readiness foundation, not a compliance claim.

## Authentication and Session Management

- Email verification and password reset tokens are hashed.
- Sessions are server-side/token-tracked in persistence.
- Admin, facility, and professional routes use role permissions.
- Failed and sensitive auth events are auditable where implemented.

## Access Control

- Backend services own workflow transitions.
- Facility marketplace and requisition access are facility scoped.
- Students awaiting license are blocked from licensed publication and normal matching.
- Private credential storage keys are not exposed to frontend or facility views.

## Validation and File Handling

- Credential upload policy validates size, type, checksum, and private paths.
- Provider callbacks and payment payloads are redacted before persistence.
- Requisition, matching, placement, and communication mutations validate status and actor permissions.

## Logging and Audit

- Sensitive workflow actions create audit events.
- Payment callback payloads are redacted.
- AI prompt/output records are redacted and marked as assistance, not final decisioning.

## Secrets and Configuration

- `.env.example` documents required variables without real secrets.
- M-PESA, SMTP, S3/R2, and AI provider secrets must remain environment-managed.
- Frontend routes must not receive backend secrets.

## Privacy

- Privacy request lifecycle exists for access, correction, retention/deletion, and consent withdrawal.
- Destructive deletion is intentionally not automatic because credential, payment, and audit retention require policy review.

## Milestone 5 Additions

- Explainable deterministic matching.
- Human-reviewed shortlist sharing.
- Controlled communication visibility.
- Facility invitation token hashing.
- FHIR metadata mapping without clinical patient data or raw document exposure.
