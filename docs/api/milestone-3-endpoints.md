# Milestone 3 API Endpoints

Base path: `/api`

## Facility

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/facility/auth/register` | Register facility owner and create facility profile |
| `GET` | `/api/facility/dashboard` | Facility onboarding, access, request, and package status |
| `PUT` | `/api/facility/profile` | Save facility organization details |
| `POST` | `/api/facility/submit` | Submit facility for admin review |
| `POST` | `/api/facility/access/payment-intents` | Create staging manual access payment reference |
| `GET` | `/api/facility/candidates` | Browse published candidates; requires approved facility and active access |
| `GET` | `/api/facility/candidates/{id}` | View watermarked read-only candidate detail and create audit record |
| `POST` | `/api/facility/requests/appointments` | Submit appointment or hiring consultation request |
| `POST` | `/api/facility/recommendation-requests` | Request Afyalink candidate recommendations |
| `GET` | `/api/facility/recommendation-packages` | List shared recommendation packages |

## Admin Facility Operations

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/facility-operations/overview` | Facility, access, publication, request, and recommendation counters |
| `GET` | `/api/admin/facilities` | Facility review queue |
| `GET` | `/api/admin/facilities/{id}` | Facility detail, memberships, documents, and access |
| `PATCH` | `/api/admin/facilities/{id}/review` | `start_review`, `approve`, `reject`, or `request_clarification` |
| `PATCH` | `/api/admin/facilities/{id}/subscription` | Activate, suspend, expire, or cancel access |
| `GET` | `/api/admin/candidate-publications` | Candidate publication manager |
| `POST` | `/api/admin/candidate-publications` | Publish a qualified candidate |
| `PATCH` | `/api/admin/candidate-publications/{id}` | Change publication status |
| `GET` | `/api/admin/facility-requests` | Facility requests queue |
| `PATCH` | `/api/admin/facility-requests/{id}` | Update request status/owner/note |
| `POST` | `/api/admin/facility-requests/{id}/appointments` | Schedule appointment |
| `GET` | `/api/admin/recommendation-requests` | Recommendation request queue |
| `PATCH` | `/api/admin/recommendation-requests/{id}` | Update recommendation request status/owner/note |
| `GET` | `/api/admin/recommendation-packages` | Recommendation package list |
| `POST` | `/api/admin/recommendation-packages` | Create package and attach published candidates |
| `PATCH` | `/api/admin/recommendation-packages/{id}` | Update package status/details |

## Authorization Rules

- Facility candidate browse/detail requires a facility role, approved facility, and active access.
- Candidate publication management requires admin publication permission.
- Facility review and subscription management require admin facility permissions.
- Candidate detail is read-only and audited.
- Raw credential files remain private and are not exposed to facility users.

