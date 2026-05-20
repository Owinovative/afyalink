# Secure Candidate Viewing and Watermarking

Afyalink treats facility candidate viewing as controlled read-only access, not public profile hosting.

## Access Checks

Every facility candidate list/detail request requires:

- authenticated facility user;
- active facility membership;
- approved facility onboarding;
- active access subscription;
- published candidate publication.

The candidate detail endpoint returns `404` for unpublished or withdrawn publications and `409` for incomplete facility/access state.

## Watermarking

Candidate profile detail responses include dynamic watermark metadata:

- facility display name;
- viewer email;
- view timestamp;
- candidate code/publication reference.

The web UI renders this as a visible overlay on the read-only candidate detail panel and shows a redistribution warning.

## Auditing

Each candidate detail view writes:

- `candidate_profile_views` row;
- `candidate.profile_viewed` audit event;
- facility id;
- viewer user id;
- professional user id;
- candidate publication id;
- timestamp;
- IP address and user agent when available.

## Screenshot Reality

Screenshots cannot be made technically impossible in a browser. Afyalink's controls are:

- strict authorization;
- no direct raw document URLs;
- read-only UI;
- dynamic watermarking;
- policy warning;
- view auditability;
- future terms enforcement.

If credential document preview is added later, it must use short-lived viewer-bound signed URLs and a separate document view audit event.

