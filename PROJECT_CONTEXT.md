# Afyalink Project Context

Afyalink is a separate project from Invinceible Core HMS.

Use this repository for Afyalink only. Do not mix HMS code, HMS database schema, HMS branding, or HMS deployment assumptions into this codebase.

## Product Summary

Afyalink verifies healthcare professionals and prepares trusted professional profiles for controlled facility access.

## Engineering Position

The platform has progressed beyond intake into facility marketplace operations:

- professional onboarding, profile, credentials, consent, payment, admin review, verification, interview, and qualification;
- facility onboarding, admin approval, active access subscriptions, candidate publication, controlled candidate browsing, appointment requests, recommendation requests, and shared recommendation packages;
- a multi-page Next.js public website with routed professional, facility, and admin portals;
- audit and notification outbox coverage for sensitive workflows.

## Safety Rules

- Sensitive documents must stay private.
- No direct public document URLs.
- Every document view, status change, payment event, login failure, and admin review action must be audited.
- Role and permission boundaries must exist from day one.
- Facility candidate access must remain approval-gated, subscription-gated, read-only, watermarked, and audited.
- Candidate publication must stay separate from raw professional/application records.
- The frontend must render and guide workflows only. Backend services remain authoritative for application, verification, interview, subscription, and publication state.
