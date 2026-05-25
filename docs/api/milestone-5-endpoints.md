# Milestone 5 API Endpoints

## Professional Placement

- `GET /api/professional/placement`
- `PUT /api/professional/placement/preferences`
- `GET /api/professional/opportunities`
- `GET /api/professional/opportunities/{id}`

## Facility Requisitions and Placement

- `GET /api/facility/requisitions`
- `POST /api/facility/requisitions`
- `GET /api/facility/requisitions/{id}`
- `GET /api/facility/shortlists`
- `GET /api/facility/placements`
- `POST /api/facility/interview-requests`
- `POST /api/facility/team/invitations`

## Admin Placement Operations

- `GET /api/admin/requisitions`
- `GET /api/admin/requisitions/{id}`
- `PATCH /api/admin/requisitions/{id}`
- `POST /api/admin/requisitions/{id}/matching-runs`
- `POST /api/admin/matches/{id}/ai-draft`
- `POST /api/admin/placement-shortlists`
- `GET /api/admin/placements`
- `POST /api/admin/placements`
- `PATCH /api/admin/placements/{id}`
- `GET /api/admin/communications`
- `POST /api/admin/communications`
- `GET /api/admin/integrations`
- `GET /api/admin/security/asvs-readiness`

All routes require authentication and backend permissions. Facility routes are facility scoped. Professional opportunity routes return only approved placement records for the authenticated professional.
