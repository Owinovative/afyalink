# Milestone 3 Facility Marketplace Platform

Milestone 3 adds the healthcare facility side of Afyalink while preserving the professional verification workflow.

## Facility Lifecycle

1. Facility owner registers a facility account through `/api/facility/auth/register`.
2. Facility details are saved in `facilities` and linked to the owner through `facility_memberships`.
3. Facility submits onboarding for admin review.
4. Admin approves, rejects, or requests clarification.
5. Approved facilities can create a staging-friendly access payment reference.
6. Admin activates, suspends, expires, or cancels facility access.

Facility accounts are separate from professional accounts. Facilities cannot access candidates until both conditions are true:

- facility review status is `approved`;
- facility access subscription status is active and within its start/end window.

## Candidate Publication Model

Facilities do not browse raw professional records. Admins publish candidates through `candidate_publications`.

A candidate can be published only when:

- the application is `qualified` or `approved`;
- current professional consent is still valid;
- regulatory verification passed;
- interview is completed;
- interview recommendation is `recommend` or `recommend_with_conditions`.

Publication statuses are `draft`, `published`, `paused`, and `withdrawn`.

## Facility Marketplace

Approved facilities with active access can:

- browse published candidates;
- filter by search, profession, county, availability, verification status, qualification status, and minimum years of experience;
- open a read-only candidate profile.

Candidate detail responses expose only facility-safe fields, approved credential metadata, and a dynamic watermark. They never include raw credential storage keys or public document URLs.

## Secure Viewing

Afyalink cannot make screenshots technically impossible. The implemented controls are:

- approval and subscription access gates;
- no raw credential download URLs;
- read-only candidate payloads;
- dynamic watermark metadata containing facility, viewer email, timestamp, and candidate code;
- `candidate_profile_views` records for every candidate detail view;
- audit action `candidate.profile_viewed`.

Future document preview endpoints must use signed, temporary, viewer-bound URLs and write separate document-view audit records.

## Facility Requests And Recommendations

Facilities can submit:

- consultation or appointment requests in `facility_requests`;
- recommendation requests in `recommendation_requests`.

Admins can:

- acknowledge/update facility requests;
- schedule `facility_appointments`;
- create recommendation packages;
- attach published candidates;
- mark packages `draft`, `ready`, `shared`, or `archived`.

Facilities can only see shared recommendation packages.

## Notifications And Audit

Notification outbox events now include facility onboarding, facility review decisions, subscription changes, facility appointment lifecycle, recommendation packages, and candidate publication changes.

Sensitive actions are audited for facility review, subscription changes, publication changes, profile views, facility requests, appointments, and recommendation packages.

