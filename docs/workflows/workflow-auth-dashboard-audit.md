# Workflow Auth And Dashboard Audit

## Current roles

Afyalink currently stores backend roles on each user row:

- `professional`
- `facility_admin`
- `facility_viewer`
- `verification_officer`
- `interviewer`
- `support_agent`
- `admin`
- `super_admin`

The product-facing account groups are professionals/students, facilities, and admins. Students are represented as `professional` users with a `student_awaiting_license` applicant track on their profile.

## Current permissions

The backend has a `RolePermissionMatrix` and route wrappers for professional and facility routes. Professional routes require the `professional` role. Facility routes require `facility_admin` or `facility_viewer`.

Admin routes currently use generic permission checks through `protected(..., Permission::*)`. Some permissions are shared with non-admin roles, such as facility request and requisition permissions. That makes admin URLs too permissive.

## Current login behavior

The API returns a token and user role list. The frontend login form lets the user choose a portal, then stores the token under the selected portal bucket. The redirect follows that selected bucket, not the returned backend role group.

This means a valid facility session can be stored under the admin or professional localStorage key if the wrong portal is selected or a stale local session exists.

## Current dashboard redirects

The public login form redirects to:

- `/portal/admin/dashboard`
- `/portal/facility/dashboard`
- `/portal/professional/dashboard`

The redirect is based on the chosen portal, not the authenticated user's real backend role.

## Incorrectly accessible routes

Frontend:

- A wrong-role token can render the admin, facility, or professional shell because the shell only checks for a token in the role bucket.
- Navigation is role-specific once rendered, but the render decision is not role-safe.

Backend:

- `/api/admin/*` routes are permission-gated, not admin-role-gated.
- Facility users can satisfy some admin route permissions that overlap with facility workflows.
- Verification/interview internal roles can access admin URLs through specialized permissions.
- Logged-out protected requests currently return a generic authorization response instead of a clear authentication response.

## Backend endpoints needing stronger protection

The admin namespace must require `admin` or `super_admin` before any permission check:

- `/api/admin/applications`
- `/api/admin/credentials`
- `/api/admin/payments`
- `/api/admin/verifications`
- `/api/admin/interviews`
- `/api/admin/facilities`
- `/api/admin/candidate-publications`
- `/api/admin/facility-requests`
- `/api/admin/recommendation-*`
- `/api/admin/requisitions`
- `/api/admin/matching`
- `/api/admin/placements`
- `/api/admin/communications`
- `/api/admin/integrations`
- `/api/admin/security`
- `/api/admin/reports`
- `/api/admin/notifications`
- `/api/admin/privacy-requests`
- `/api/admin/audit-logs`
- `/api/admin/pre-licensure`
- `/api/admin/users`

Professional and facility API namespaces already have role wrappers and need regression tests to prove cross-role blocking.

## Frontend pages leaking dashboard content

The portal shells can leak the wrong workspace frame and navigation when a token exists in the wrong localStorage key. Data fetches may fail later with `403`, but the internal shell and nav should not render for the wrong role.

Affected layouts:

- `apps/web/src/app/portal/admin/layout.tsx`
- `apps/web/src/app/portal/facility/layout.tsx`
- `apps/web/src/app/portal/professional/layout.tsx`

Affected session code:

- `apps/web/src/lib/auth/session.ts`
- `apps/web/src/components/auth/AuthForms.tsx`
- `apps/web/src/components/layout/PortalLayout.tsx`

## Admin account creation today

There is an existing CLI script:

`php scripts/create-admin.php "Name" admin@example.com 0700000000 StrongPass123`

It creates or returns an admin user using `AuthService::createUser`. It does not expose the password, but it needs clearer validation and documentation. There is no admin-only portal page for creating additional admin accounts.

## What must change in this PR

- Add an admin-only backend route wrapper for all `/api/admin/*` routes.
- Return `401` for logged-out protected API calls and `403` for wrong-role calls.
- Add admin user list/create endpoints guarded by admin role.
- Improve `create-admin.php` validation and failure messages.
- Store frontend session metadata with the authenticated user role group.
- Derive login redirect from backend roles, not the selected portal.
- Block wrong-role portal layouts before rendering internal nav or dashboard content.
- Add polished sign-in required and access-denied states.
- Add `/portal/admin/users` for admin-only admin account creation.
- Improve admin, professional/student, and facility dashboards around role-specific next actions.
- Add backend and frontend tests for the role-access bug.
