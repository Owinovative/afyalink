# Afyalink Project Context

Afyalink is a separate project from Invinceible Core HMS.

Use this repository for Afyalink only. Do not mix HMS code, HMS database schema, HMS branding, or HMS deployment assumptions into this codebase.

## Product Summary

Afyalink verifies healthcare professionals and prepares trusted professional profiles for controlled facility access.

## Engineering Position

Build Milestone 1 first:

- professional onboarding;
- profile completion;
- credential upload;
- consent capture;
- payment reference / M-PESA-ready payment records;
- admin review;
- audit logs;
- private document storage.

## Safety Rules

- Sensitive documents must stay private.
- No direct public document URLs.
- Every document view, status change, payment event, login failure, and admin review action must be audited.
- Role and permission boundaries must exist from day one.
- Facility access comes later and must be controlled, watermarked, and audited.

