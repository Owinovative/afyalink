# Web Route Map

## Public Site

- `/`
- `/how-it-works`
- `/matching`
- `/professionals`
- `/students`
- `/facilities`
- `/trust-security`
- `/verification`
- `/pricing-access`
- `/about`
- `/contact`
- `/faq`

Public routes are indexable, photo-led, and copy-reduced. Each route uses a short hero line, local healthcare imagery, compact CTAs, and the shared mobile navigation.

## Auth

- `/auth/login`
- `/auth/register/professional`
- `/auth/register/student`
- `/auth/register/facility`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`

Auth routes use the premium form shell with mode-specific image panels. They remain public entry points but do not expose portal data.

## Professional Portal

- `/portal/professional`
- `/portal/professional/dashboard`
- `/portal/professional/profile`
- `/portal/professional/credentials`
- `/portal/professional/consent-payment`
- `/portal/professional/application`
- `/portal/professional/verification`
- `/portal/professional/interview`
- `/portal/professional/publication`
- `/portal/professional/waiting-license`
- `/portal/professional/placement-preferences`
- `/portal/professional/availability`
- `/portal/professional/opportunities`
- `/portal/professional/opportunities/[id]`

Logged-out professional routes render only the protected sign-in state. Logged-in pages use compact status cards, guided readiness panels, and short helper text.

## Facility Portal

- `/portal/facility`
- `/portal/facility/dashboard`
- `/portal/facility/onboarding`
- `/portal/facility/access`
- `/portal/facility/candidates`
- `/portal/facility/candidates/[publicationId]`
- `/portal/facility/appointments`
- `/portal/facility/recommendations`
- `/portal/facility/packages`
- `/portal/facility/requisitions`
- `/portal/facility/requisitions/new`
- `/portal/facility/requisitions/[id]`
- `/portal/facility/shortlists`
- `/portal/facility/placements`
- `/portal/facility/placements/[id]`
- `/portal/facility/team`

Logged-out facility routes render only the protected sign-in state. Requisitions, dashboard, candidates, shortlists, placements, and team pages share the refined premium workspace styling.

## Admin Portal

- `/portal/admin`
- `/portal/admin/dashboard`
- `/portal/admin/applications`
- `/portal/admin/applications/[id]`
- `/portal/admin/credentials`
- `/portal/admin/payments`
- `/portal/admin/verifications`
- `/portal/admin/verifications/[id]`
- `/portal/admin/interviews`
- `/portal/admin/interviews/[id]`
- `/portal/admin/facilities`
- `/portal/admin/facilities/[id]`
- `/portal/admin/publications`
- `/portal/admin/subscriptions`
- `/portal/admin/appointments`
- `/portal/admin/recommendations`
- `/portal/admin/requisitions`
- `/portal/admin/requisitions/[id]`
- `/portal/admin/matching`
- `/portal/admin/shortlists`
- `/portal/admin/placements`
- `/portal/admin/placements/[id]`
- `/portal/admin/communications`
- `/portal/admin/reports`
- `/portal/admin/notifications`
- `/portal/admin/privacy`
- `/portal/admin/integrations`
- `/portal/admin/security`
- `/portal/admin/audit`
- `/portal/admin/pre-licensure`

Logged-out admin routes render only the protected sign-in state. Logged-in admin pages remain operational and dense, with command-center metrics, queue cards, and concise status badges.
