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
- a student / graduate awaiting-license track that captures pre-licensure applicants early without treating them as licensed or facility-publishable candidates;
- audit and notification outbox coverage for sensitive workflows;
- Milestone 4 operations infrastructure for notification delivery attempts, M-PESA-ready callback events, facility subscription billing lifecycle, admin command center reporting, and privacy request queues.
- Milestone 5 placement operations infrastructure for facility requisitions, explainable deterministic matching, reviewed shortlists, placement lifecycle tracking, controlled communication threads, facility collaboration, FHIR/SMART readiness, and ASVS-readiness governance.

## Safety Rules

- Sensitive documents must stay private.
- No direct public document URLs.
- Every document view, status change, payment event, login failure, and admin review action must be audited.
- Role and permission boundaries must exist from day one.
- Facility candidate access must remain approval-gated, subscription-gated, read-only, watermarked, and audited.
- Candidate publication must stay separate from raw professional/application records.
- Student-awaiting-license applicants must stay out of full licensed submission, verification/interview, and facility publication until converted after license evidence is available.
- The frontend must render and guide workflows only. Backend services remain authoritative for application, verification, interview, subscription, and publication state.
- Notification, payment callback, subscription activation, privacy request, and reporting logic must remain backend-owned. Frontend pages are operational consoles, not business-rule engines.
- Payment provider payloads must be redacted before persistence or display. M-PESA credentials must never be committed or exposed to frontend routes.
- Matching, shortlist sharing, AI-assisted rationale, communication visibility, and placement status changes must remain backend-owned and audited.
- AI assistance must never auto-reject candidates, override eligibility rules, or use protected characteristics for scoring.
