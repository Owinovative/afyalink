# Candidate Publication and Access Control

Facilities do not browse raw professional, application, verification, interview, or credential tables. Afyalink creates an explicit publication record only after the candidate is eligible.

## Publication Requirements

The backend only allows publication when all conditions are true:

- application status is `qualified` or `approved`;
- current professional consent is valid;
- a verification case has passed with `verified`;
- interview is completed;
- interview recommendation is `recommend` or `recommend_with_conditions`;
- an admin explicitly creates or updates the publication.

These rules are enforced in `CandidatePublicationService`; the frontend only reflects the state.

## Publication States

- `draft`: admin-managed but not visible to facilities.
- `published`: visible to approved facilities with active access.
- `paused`: temporarily removed from facility view.
- `withdrawn`: removed from facility view after a business or compliance decision.

## Facility-Safe Candidate Payload

Facility marketplace responses may include:

- candidate code;
- professional name and profession;
- county/location;
- years of experience;
- availability;
- verification and qualification badges;
- interview recommendation summary and allowed score summary;
- admin-written public headline/summary;
- approved credential metadata.

Facility responses must not include:

- credential `storage_key`;
- direct public document URLs;
- password hashes, reset tokens, sessions, or idempotency keys;
- internal verification evidence notes;
- private admin publication notes;
- raw payment or audit secrets.

## Professional Visibility

The professional dashboard exposes only privacy-safe publication awareness:

- whether published;
- current publication status;
- candidate code;
- aggregate profile view count.

Facility identities are not revealed to professionals in the current implementation.

