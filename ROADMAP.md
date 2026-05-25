# Afyalink Roadmap

## Milestone 1

- Professional onboarding
- Credential intake
- Consent capture
- Payment reference / M-PESA-ready domain
- Admin review
- Audit logs
- Private document storage

## Milestone 2

- Interview scheduling and scoring
- Verification evidence tracking
- Notification workflows
- Improved admin dashboards

## Milestone 3

- Facility onboarding and admin review
- Facility subscriptions and staging manual access activation
- Candidate publication layer
- Controlled candidate marketplace browsing
- Watermarked and audited candidate profile views
- Facility appointment/hiring requests
- Afyalink recommendation requests and shared recommendation packages
- Professional visibility awareness
- Premium public landing page and role-aware portal entry
- Product polish for disabled actions, empty states, watermarked views, and clearer next steps

## Web Platform Megasprint

- Next.js App Router frontend replatform
- Multi-page public marketing website
- Dedicated students / awaiting-license public page
- Routed authentication pages
- Routed professional, facility, and admin portals
- Premium image-led visual system with local healthcare/trust SVG assets, wide desktop composition, refined nav/footer, and polished portal shells
- Shared design system primitives for cards, forms, badges, notices, layout shells, image panels, proof strips, feature splits, and data rows
- Render web deployment migration from static publish to Node-backed Next service
- Production build, typecheck, and routed-platform contract checks

## Pre-Licensure Student Track

- Student/recent graduate registration before license issuance
- Applicant track field separating `licensed_professional` from `student_awaiting_license`
- Student profile fields for training institution, programme, status, target profession, expected regulatory body, county, and availability after licensure
- Preliminary credential bundle distinct from licensed professional requirements
- Professional license not required until conversion
- Student dashboard guidance and waiting-license checklist
- Admin pre-licensure queue with conversion control
- Students blocked from licensed application submission, interview/publication pipeline, and facility marketplace visibility until converted

## Milestone 4

- Notification delivery engine with delivery attempts, safe log/null email provider, retry/backoff, and worker command
- M-PESA-ready callback foundation with redacted provider event persistence and idempotent status handling
- Facility subscription billing lifecycle tied to approved facility access
- Admin operations command center with payment, notification, verification, interview, facility, marketplace, student, and privacy queues
- Reporting summaries for application funnel, verification, interview, facility onboarding, subscriptions, publication, recommendations, appointments, students, notifications, and privacy
- Privacy request foundation for access, correction, retention/deletion, and consent-withdrawal requests

## Milestone 5

- Facility staffing requisitions with draft/submitted/review/matching/shortlist lifecycle
- Professional availability and placement preferences
- Match eligibility service that blocks unqualified, unconsented, unpublished, or student-awaiting-license candidates from normal matching
- Deterministic, explainable candidate match scoring
- AI-assisted recommendation abstraction with local default adapter and draft-only human review
- Placement shortlists and facility-visible approved rationale
- Placement lifecycle, placement events, and controlled professional opportunities
- Communication thread foundation with explicit visibility rules
- Facility interview request and calendar-readiness foundation
- Facility team invitation token-hash foundation
- FHIR/SMART-readiness metadata mappings and integration connection foundation
- ASVS-readiness checklist and access-control regression coverage

## Later

- Regulatory integration automation where APIs exist
- CSV/PDF report export and scheduled operations reports
- Live AI provider integrations after governance and redaction controls are reviewed
- Live STK push initiation and production M-PESA credential rollout
- Viewer-bound signed document preview endpoints where business rules allow document previews
- Server-managed browser sessions or cookie-based frontend auth if backend auth architecture changes
