# Placement Lifecycle

Placements track the path from reviewed match or shortlist to actual opportunity and placement outcome.

## Statuses

- `proposed`
- `facility_interested`
- `professional_contacted`
- `interview_requested`
- `interview_scheduled`
- `offer_pending`
- `offer_made`
- `offer_accepted`
- `offer_declined`
- `onboarding`
- `placed`
- `completed`
- `cancelled`

Each status change creates a placement event containing the previous status, new status, actor, notes, and timestamp.

## Role Views

Admin:

- create placements;
- update status;
- assign admins;
- view placement timelines.

Facility:

- see only placements for its own facility;
- request interviews through controlled facility interview requests.

Professional:

- see opportunities only after Afyalink/admin-approved placement contact exists.

## API Summary

- `GET /api/admin/placements`
- `POST /api/admin/placements`
- `PATCH /api/admin/placements/{id}`
- `GET /api/facility/placements`
- `GET /api/professional/opportunities`
- `GET /api/professional/opportunities/{id}`
