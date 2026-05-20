# Facility Platform Architecture

Afyalink's facility platform extends the professional verification workflow without exposing raw professional records directly to employers.

## Core Boundaries

- Professionals remain the source of profile, credential, consent, payment, verification, and interview data.
- Facilities are separate organizations with their own memberships and review state.
- Candidate catalogue access is mediated by `candidate_publications`.
- Facility candidate browsing requires approved facility onboarding and active access.
- Controllers route requests only; facility business rules live in `Application\Facilities`.

## Facility Lifecycle

1. Facility owner registers through `/api/facility/auth/register`.
2. Facility profile is persisted in `facilities`.
3. Owner membership is persisted in `facility_memberships` with the `facility_admin` role.
4. Facility submits onboarding for Afyalink review.
5. Admin starts review, approves, rejects, or requests clarification.
6. Approved facilities can create access payment references.
7. Admin activates, suspends, expires, or cancels access.

## Access Entitlement

Facility marketplace access is never implied by account creation. The backend checks:

- authenticated user has a facility role;
- user has an active facility membership;
- facility `review_status` is `approved`;
- at least one facility access subscription is `active` and within its start/end window.

The staging implementation uses manual payment references and admin activation. Production M-PESA callbacks should reconcile into the same subscription records rather than bypassing the entitlement service.

## Admin Operations

The admin facility operations console is backed by service methods for:

- facility review queue and detail;
- subscription/access status management;
- candidate publication management;
- facility requests and appointment scheduling;
- recommendation requests and packages;
- overview counters for pending approvals, active access, candidate views, and open requests.

## Persistence

Milestone 3 adds PostgreSQL tables for facilities, memberships, facility documents, access subscriptions, publications, candidate profile views, facility requests, appointments, recommendation requests, packages, and package candidates. The JSON adapter mirrors these tables for local tests.

