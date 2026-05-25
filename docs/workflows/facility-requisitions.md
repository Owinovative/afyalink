# Facility Requisitions

Facility requisitions turn marketplace browsing into a structured staffing workflow.

## Purpose

A facility with approved, active access can create a requisition describing a real staffing need:

- profession and optional specialty;
- employment type;
- number of positions;
- county/site;
- required start date and optional end date;
- shift pattern and urgency;
- minimum experience;
- required credentials, preferred skills, and notes.

## Lifecycle

Statuses:

- `draft`
- `submitted`
- `under_review`
- `matching`
- `shortlist_ready`
- `interviews_requested`
- `filled`
- `cancelled`
- `closed`

Facilities can draft or submit. Afyalink admins review, assign ownership, start matching, share shortlists, and close the requisition.

## Security Rules

- Facility access must be approved and active before creating requisitions.
- Facilities can only see their own requisitions.
- Admin transitions are backend-enforced and audited.
- Requisitions never expose private credential documents.

## API Summary

- `GET /api/facility/requisitions`
- `POST /api/facility/requisitions`
- `GET /api/facility/requisitions/{id}`
- `GET /api/admin/requisitions`
- `GET /api/admin/requisitions/{id}`
- `PATCH /api/admin/requisitions/{id}`
