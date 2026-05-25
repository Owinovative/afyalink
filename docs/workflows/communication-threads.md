# Communication Threads

Communication threads provide controlled conversation records around requisitions, shortlists, placements, recommendation packages, and appointment requests.

## Visibility

Message visibility is explicit:

- `internal_admin`
- `facility_visible`
- `professional_visible`
- `shared`

Internal admin notes must never be returned to facility or professional views.

## Rules

- Admin notes stay internal.
- Facility/professional communication is mediated by context and permission.
- Sensitive credentials are not attached casually.
- Message creation and visibility are auditable.

## API Summary

- `GET /api/admin/communications`
- `POST /api/admin/communications`

Future facility/professional reply routes should preserve the same visibility controls.
