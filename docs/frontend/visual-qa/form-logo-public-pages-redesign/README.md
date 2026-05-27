# Form, Logo, and Public Page Redesign Visual QA

This folder records the visual QA for `feat/frontend-contract-forms-logo-and-public-page-redesign`.

## Routes Checked

- `/`
- `/professionals`
- `/students`
- `/facilities`
- `/matching`
- `/trust-security`
- `/auth/register/professional`
- `/auth/register/student`
- `/auth/register/facility`
- `/portal/facility/dashboard` logged out
- `/portal/admin/dashboard` logged out

## Widths Checked

- `375px`
- `768px`
- `1440px`
- `1920px`

## Checks Performed

- No horizontal overflow at target widths.
- Logo appears in public header, footer, auth pages, portal shell, and protected gate.
- Public target pages use stronger healthcare photography as background treatments with shorter copy.
- Registration forms expose backend-required contract fields.
- Logged-out portal routes show the protected sign-in state only.
- Contact/footer public data remains `Hardy, Karen`, `+254 711 776 391`, and `www.afyalinks.org`.
- Public placeholder emails remain hidden when email env vars are blank.

## Screenshot Artifacts

Run from `apps/web` after a production build:

```bash
npm run visual:form-logo
```

The script writes screenshots and `visual-qa-report.json` into this folder.

## Issues Fixed

- Facility registration now collects required facility profile fields before the API call.
- Student registration/profile stay on the waiting-license track without requiring a license number.
- Professional profile posts the licensed applicant track explicitly.
- Public pages were moved away from repeated card layouts into photo-backed path sections.
- Foreground public-page photo cards were removed after review; photos now sit behind content as section backgrounds.
- A real Afyalink logo asset is rendered instead of text-only branding.
