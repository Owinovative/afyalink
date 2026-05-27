# Role Access Matrix

## Public Visitor

Allowed:

- `/`
- `/professionals`
- `/students`
- `/facilities`
- `/matching`
- `/trust-security`
- `/verification`
- `/pricing-access`
- `/about`
- `/contact`
- `/faq`
- `/auth/login`
- `/auth/register/professional`
- `/auth/register/student`
- `/auth/register/facility`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify-email`

Blocked:

- `/portal/*`
- authenticated API routes

## Professional

Allowed:

- `/portal/professional/*`
- own profile
- own credentials
- own application
- own verification, interview, and publication status
- own placement preferences and opportunities

Blocked:

- `/portal/admin/*`
- `/portal/facility/*`
- admin APIs
- facility APIs
- other users' records

## Student Awaiting License

Allowed:

- student-safe professional portal pages
- own pre-licensure profile
- own preliminary documents
- waiting-license dashboard
- license upload and conversion workflow

Blocked:

- licensed publication before conversion
- facility marketplace publication as a licensed candidate
- admin pages
- facility pages

## Facility Owner Or Member

Allowed:

- `/portal/facility/*`
- own facility profile
- own facility requisitions
- own facility shortlists
- own facility placements
- own team workflow
- approved candidate marketplace views only when facility approval and access are active

Blocked:

- `/portal/admin/*`
- `/portal/professional/*`
- admin APIs
- professional-only APIs
- candidate data without facility approval and active access
- other facilities' records

## Admin

Allowed:

- `/portal/admin/*`
- admin API endpoints
- operational queues
- review actions
- reports
- audit views
- facility, professional, and student management
- admin user management

Blocked:

- normal user-only portal actions unless a formal impersonation feature exists
- facility/professional workspaces as if the admin were that user

No impersonation is part of this milestone.

## API Response Rules

- Logged-out protected API calls return `401`.
- Wrong-role API calls return `403`.
- Private data is not included in auth error responses.
- Frontend route guards must not render internal portal content until the stored session role group matches the requested workspace.
