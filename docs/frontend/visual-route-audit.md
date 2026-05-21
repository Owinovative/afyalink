# Visual Route Audit

This audit records the correction plan for the HMS-inspired refinement sprint. The target is compact, classic healthcare product design: photo-supported, not photo-dominated; wide on desktop, not loose; concise in copy, not repetitive.

## Public Routes

| Route | Current weakness | Correction planned |
| --- | --- | --- |
| `/` | Hero and downstream photo panels compete for attention; section gaps are too tall. | Use a tighter HMS-style hero, compact metric strip, shorter sections, and moderated image panels. |
| `/how-it-works` | Generic template makes the operating model feel like repeated cards. | Use a process-led page with short stage copy, one controlled photo hero, and compact steps. |
| `/professionals` | Copy is accurate but too long and formal in places. | Shorten to profile, credentials, verification, interview, publication. Add student cross-link. |
| `/students` | Strong product idea, but headline and panels can sprawl. | Make the waiting-license promise direct, with now/later lists and a clear registration CTA. |
| `/facilities` | Photo and marketplace copy can overpower executive scanning. | Use moderate facility photo, compact access explanation, candidate/recommendation blocks. |
| `/trust-security` | Too much explanatory copy for a security page. | Use brief architecture bullets for private storage, entitlement checks, watermarking, and audit. |
| `/verification` | Verification journey reads like system documentation. | Convert to concise process steps: intake, regulatory case, interview, qualification, publish. |
| `/pricing-access` | Access model is honest but wordy. | Keep no-fake-price stance; present compact plan/status cards and contact CTA. |
| `/about` | Mission copy is credible but too dense. | Make it short, mission-led, and visually restrained. |
| `/contact` | Form is functional but generic. | Use compact split layout with clear inquiry purposes and security note. |
| `/faq` | FAQ is useful but crowded. | Group into concise professional, student, facility, security, verification, and access answers. |

## Auth Routes

| Route | Current weakness | Correction planned |
| --- | --- | --- |
| `/auth/login` | Single centered card feels generic. | Add compact split-style auth shell with short side guidance and tighter card copy. |
| `/auth/register/professional` | Support copy overexplains backend authority. | Use direct professional onboarding language. |
| `/auth/register/student` | Needs clearer safety boundary. | State plainly that students are not facility-publishable until license conversion. |
| `/auth/register/facility` | Facility onboarding copy should feel commercial and concise. | Emphasize approval, access, and marketplace gating. |
| `/auth/verify-email` | Token workflow feels technical. | Use short verification guidance. |
| `/auth/forgot-password` | Recovery copy can be shorter. | Make action and expectation clear. |
| `/auth/reset-password` | Reset form feels utilitarian. | Keep compact but clearer. |

## Portal Routes

| Area | Current weakness | Correction planned |
| --- | --- | --- |
| Professional portal | Metrics and next-step panels are useful but loose. | Compact metric strip, shorter page headers, tighter card and table spacing. |
| Waiting-license page | Correct logic, but explanatory copy is long. | Strong track badge, now/later framing, concise conversion guidance. |
| Facility portal | Candidate/request pages feel card-heavy. | Tighter forms, compact cards, clear access state, smaller gaps. |
| Admin portal | Workbenches need operational density. | Compact metrics, tighter queues, reduced header height, stronger table rows. |

## Bandwidth Risks

- Avoid loading multiple large editorial photos per generic public page.
- Use `next/image` with lower `sizes` hints and lazy loading for non-home images.
- Keep source photos below 250 KB where possible; current files are already under that threshold.
- Use CSS surfaces instead of background photos except for the small clinical grid SVG.
