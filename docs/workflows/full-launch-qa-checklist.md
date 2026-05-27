# Full Launch QA Checklist

This workflow checklist complements `docs/operations/full-launch-qa-checklist.md` and focuses on role-safe launch verification.

## Access Control

- Logged-out `/portal/admin/dashboard` shows sign-in required.
- Logged-out `/portal/facility/dashboard` shows sign-in required.
- Logged-out `/portal/professional/dashboard` shows sign-in required.
- Facility user opening `/portal/admin/dashboard` sees access denied.
- Facility user opening `/portal/professional/dashboard` sees access denied.
- Professional user opening `/portal/facility/dashboard` sees access denied.
- Professional user opening `/portal/admin/dashboard` sees access denied.
- Admin user opening facility/professional workspaces sees access denied unless a formal impersonation feature exists.

## API Authorization

- No token on `/api/admin/applications` returns `401`.
- Facility token on `/api/admin/facility-requests` returns `403`.
- Facility token on `/api/professional/dashboard` returns `403`.
- Professional token on `/api/facility/dashboard` returns `403`.
- Professional token on `/api/admin/applications` returns `403`.
- Admin token on `/api/facility/dashboard` returns `403`.
- Admin token on `/api/professional/dashboard` returns `403`.
- Facility B cannot open Facility A requisition detail.

## Login Routing

- Admin login routes to `/portal/admin/dashboard`.
- Facility login routes to `/portal/facility/dashboard`.
- Professional login routes to `/portal/professional/dashboard`.
- Student awaiting-license registration routes to `/portal/professional/waiting-license`.
- Selecting the wrong portal on the login form does not override the backend role.

## Admin Creation

- First admin is created from the server with `php scripts/create-admin.php`.
- Duplicate non-admin email fails cleanly.
- Existing admin email is reported without printing a password.
- `/portal/admin/users` is visible only to admins.
- `POST /api/admin/users` requires an admin token.
- Admin user responses never include `password_hash`.

## Dashboard Quality

- Admin dashboard shows operational queues and quick links.
- Professional dashboard shows own profile, credentials, verification, interview, publication, and next requirements.
- Student dashboard shows waiting-license state and does not imply licensed publication.
- Facility dashboard shows own facility, access, requisitions, shortlists, placements, and next actions.
