# Ten-Hour Polish Visual QA

Generated from the built Next.js app with:

```bash
cd apps/web
npm run build
npm run visual:polish
```

## Screenshot Evidence

| Route | Width | Screenshot |
| --- | ---: | --- |
| `/` | 1440 | [home-desktop-1440.png](./home-desktop-1440.png) |
| `/` | 375 | [home-mobile-375.png](./home-mobile-375.png) |
| `/matching` | 1440 | [matching-page-1440.png](./matching-page-1440.png) |
| `/professionals` | 1440 | [professionals-page-1440.png](./professionals-page-1440.png) |
| `/students` | 1440 | [students-page-1440.png](./students-page-1440.png) |
| `/facilities` | 1440 | [facilities-page-1440.png](./facilities-page-1440.png) |
| `/contact` | 1440 | [contact-page-1440.png](./contact-page-1440.png) |
| `/auth/login` | 1440 | [login-page-1440.png](./login-page-1440.png) |
| `/portal/facility/requisitions` logged out | 1440 | [facility-requisitions-logged-out-1440.png](./facility-requisitions-logged-out-1440.png) |
| `/portal/facility/dashboard` logged out | 1440 | [facility-dashboard-logged-out-1440.png](./facility-dashboard-logged-out-1440.png) |
| `/portal/professional/dashboard` logged out | 1440 | [professional-dashboard-logged-out-1440.png](./professional-dashboard-logged-out-1440.png) |
| `/portal/admin/dashboard` logged out | 1440 | [admin-dashboard-logged-out-1440.png](./admin-dashboard-logged-out-1440.png) |

Raw run data: [visual-qa-report.json](./visual-qa-report.json)

## Widths Checked

The visual QA script checked horizontal overflow at:

- 375 px
- 768 px
- 1440 px
- 1920 px

Routes checked for overflow:

- `/`
- `/professionals`
- `/students`
- `/facilities`
- `/matching`
- `/trust-security`
- `/verification`
- `/contact`
- `/auth/login`
- `/auth/register/student`
- `/portal/professional/dashboard`
- `/portal/facility/dashboard`
- `/portal/facility/requisitions`
- `/portal/admin/dashboard`

Result: no horizontal overflow failures were reported.

## Issues Found And Fixed

- Auth side-panel table inherited white text on a white surface; the table row text color now resolves to the main ink token.
- Public editorial split CTA links stretched across the grid column; route split CTAs now keep intrinsic button width.
- Mobile navigation previously disappeared below desktop width; the header now exposes an accessible menu.

## Protected Portal Verification

Logged-out portal screenshots show only the protected sign-in state. Facility requisitions, facility dashboard, professional dashboard, and admin dashboard did not render internal workspace content while logged out.
