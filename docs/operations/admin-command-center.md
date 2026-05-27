# Admin Operations Command Center

Milestone 4 expands the admin portal into an operating dashboard for Afyalink review, payment, facility, marketplace, notification, privacy, and student-pipeline work.

## Routes

- Web: `/portal/admin/dashboard`
- Web: `/portal/admin/reports`
- Web: `/portal/admin/users`
- Web: `/portal/admin/notifications`
- Web: `/portal/admin/privacy`
- API: `GET /api/admin/operations/dashboard`
- API: `GET /api/admin/reports`
- API: `GET /api/admin/users`
- API: `POST /api/admin/users`
- API: `GET /api/admin/notifications`
- API: `GET /api/admin/privacy-requests`

## Dashboard Metrics

The command center aggregates:

- pending and incomplete applications
- credential review queues
- payment review queues
- verification backlog
- interview backlog
- qualified and published candidates
- facility approval state
- active and expiring subscriptions
- recommendation and appointment requests
- students awaiting license
- notification pending/failed counts
- privacy request queues
- recent audit events

## Work Queues

Operational queues are deliberately separated from the public marketplace and professional portal. Admins can see pending work without exposing private credential files or internal review notes to professionals or facilities.

## Admin User Management

First admin bootstrap remains server-side only:

```bash
cd apps/api
php scripts/create-admin.php "Afyalink Admin" admin@example.com 0799999999 StrongPass123
```

Existing admins can create another admin from `/portal/admin/users`. The backing API is admin-role gated and never exposes password hashes. There is no public admin registration route.

## Role Boundary

The admin command center requires an `admin` or `super_admin` backend role. Facility and professional users are rejected before any admin dashboard data is returned. A logged-out request receives `401`; a wrong-role request receives `403`.

## Reporting

The reporting service currently returns aggregated summaries for:

- application funnel
- verification outcomes
- interview outcomes
- facility onboarding
- subscription status
- candidate publication
- recommendation and appointment requests
- student pipeline
- notification delivery
- privacy requests

The service is export-ready but CSV/PDF export is deferred.
