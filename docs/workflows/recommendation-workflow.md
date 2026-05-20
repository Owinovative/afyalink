# Recommendation Workflow

Recommendation workflows let approved facilities ask Afyalink to curate professionals for a role instead of browsing alone.

## Facility Request

Facilities with approved onboarding and active access can submit recommendation requests containing:

- role needed;
- county/location preference;
- urgency;
- experience level;
- notes;
- optional candidate publication ids of interest.

Candidate ids are validated against published candidate publications.

## Admin Package Preparation

Admins can:

- review recommendation request queues;
- update status and internal admin note;
- create recommendation packages;
- attach published candidates;
- add package rationale;
- mark a package as `draft`, `ready`, `shared`, or `archived`.

Only `shared` packages are visible to facilities.

## Facility View

Facilities see shared packages in read-only form with:

- package title;
- rationale;
- shared timestamp;
- candidate cards;
- candidate-specific rationale when provided.

Facilities can follow up by submitting an appointment/request that references candidates of interest.

## Audit and Notification

Recommendation request submission, package creation/update, and package sharing are audited. Shared packages queue a notification outbox event for the facility owner.

