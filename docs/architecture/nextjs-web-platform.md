# Next.js Web Platform Architecture

Afyalink's web frontend is now a Next.js App Router application under `apps/web`.

## Route Architecture

Public pages are separate routes rather than sections in one static page:

- `/`
- `/how-it-works`
- `/professionals`
- `/students`
- `/facilities`
- `/trust-security`
- `/verification`
- `/pricing-access`
- `/about`
- `/contact`
- `/faq`

Authentication routes are explicit:

- `/auth/login`
- `/auth/register/professional`
- `/auth/register/student`
- `/auth/register/facility`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`

Portal routes are split by role:

- `/portal/professional/*`
- `/portal/facility/*`
- `/portal/admin/*`

Each portal has its own shell navigation so professional onboarding, facility marketplace access, and admin operations are not compressed into one screen.

The professional portal includes `/portal/professional/waiting-license` for students and recent graduates in the pre-licensure track. The admin portal includes `/portal/admin/pre-licensure` so reviewers can monitor waiting-license applicants separately from licensed professional application queues.

## Visual System

The web frontend now uses a shared premium visual system documented in `docs/frontend/design-system.md`. Public pages use local SVG image compositions, full-width editorial bands, shared section primitives, and route-specific hero treatments instead of relying on one generic card grid.

## API Integration

The frontend uses the existing backend API contracts. The browser API client reads `NEXT_PUBLIC_AFYA_API_BASE` and attaches bearer tokens from the existing localStorage keys:

- `afyalink.professionalToken`
- `afyalink.facilityToken`
- `afyalink.adminToken`

This keeps the web migration compatible with the current backend while leaving backend authorization authoritative.

## Security Boundaries

The Next.js app does not move sensitive workflow rules into the frontend. Backend services remain responsible for:

- application readiness and state transitions;
- credential review rules;
- payment status transitions;
- verification status transitions;
- interview outcomes;
- facility approval and subscription gating;
- candidate publication eligibility;
- candidate marketplace authorization.
- student waiting-license conversion into the licensed professional track.

Facility candidate detail pages retain visible watermark UI and call the secure detail API, which records the view audit. The frontend does not expose raw private document URLs, storage keys, internal admin notes, tokens, payment idempotency secrets, or notification action URLs.

Student awaiting-license applicants are intentionally blocked from normal application submission, verification, interview, and facility publication until backend conversion moves their applicant track to `licensed_professional`.

## Deployment

The frontend is deployed as a Render Node web service:

```bash
npm install && npm run build
npm run start -- -p $PORT
```

Static export is intentionally not used because dynamic detail routes such as `/portal/facility/candidates/[publicationId]` and admin detail pages must resolve for arbitrary records.

## Checks

Run:

```bash
cd apps/web
npm.cmd run check
npm.cmd run typecheck
npm.cmd run build
```

`npm.cmd run check` verifies the required route map, API base configuration, bearer authorization usage, and secure candidate watermark UI.
