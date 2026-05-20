# Next.js Platform Architecture

Afyalink's web app is a Next.js App Router platform with three route families:

- Public marketing routes for the public site, including `/students`.
- Auth routes for professional, student, facility, and account recovery flows.
- Role-scoped portal routes for professional, facility, and admin workspaces.

The frontend stays presentation-focused. Workflow authority remains in the API for application readiness, pre-licensure conversion, subscription entitlement, publication eligibility, candidate access, and audit logging.

## Shared Layout

Public pages use the shared marketing shell, refined brand navigation, local SVG image assets, and the visual primitives in `apps/web/src/components/marketing/VisualSystem.tsx`.

Portal pages use role-aware shells from `apps/web/src/components/layout/PortalLayout.tsx`. The shell keeps professional, facility, and admin navigation separate so each workspace can stay focused without mixing unrelated actions.

## API Integration

Browser-side API calls use `NEXT_PUBLIC_AFYA_API_BASE` and existing bearer tokens:

- `afyalink.professionalToken`
- `afyalink.facilityToken`
- `afyalink.adminToken`

The API returns safe, shaped payloads. The frontend does not infer sensitive eligibility rules beyond rendering backend state and disabling invalid actions.

## Student Track

The student awaiting-license route set introduces:

- `/students`
- `/auth/register/student`
- `/portal/professional/waiting-license`
- `/portal/admin/pre-licensure`

Students can build preliminary profiles and documents before licensure, but the API blocks application submission and facility publication until conversion to `licensed_professional`.
