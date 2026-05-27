# Workflow Auth Dashboard Correction Visual QA

Generated with:

```bash
cd apps/web
npm.cmd run build
npm.cmd run visual:workflow-auth
```

The production Next.js server was started locally on `http://127.0.0.1:3100` with public env values and mocked API responses for authorized dashboard states.

## Routes Checked

- `/auth/login`
- `/portal/admin/dashboard`
- `/portal/admin/users`
- `/portal/professional/dashboard`
- `/portal/professional/waiting-license`
- `/portal/facility/dashboard`
- `/portal/facility/requisitions`

## Widths Checked

- `375px` for mobile protected professional dashboard.
- `1440px` for desktop login, protected, wrong-role, and authorized dashboard states.

The automated browser smoke suite also checks public/protected routes at `375px`, `768px`, `1440px`, and `1920px` where covered by the launch test matrix.

## Evidence

- `login-1440.png`
- `admin-dashboard-sign-in-required-1440.png`
- `facility-dashboard-sign-in-required-1440.png`
- `professional-dashboard-sign-in-required-375.png`
- `facility-requisitions-sign-in-required-1440.png`
- `admin-dashboard-wrong-role-facility-1440.png`
- `admin-dashboard-authorized-1440.png`
- `admin-users-authorized-1440.png`
- `professional-dashboard-authorized-1440.png`
- `student-waiting-license-authorized-1440.png`
- `facility-dashboard-authorized-1440.png`
- `facility-requisitions-authorized-1440.png`
- `visual-qa-report.json`

## Results

- Logged-out portal pages show the protected sign-in state and do not render `.portal-shell`.
- Wrong-role admin access shows `Wrong workspace.` with a link to the facility dashboard.
- Authorized admin dashboard shows command-center metrics and quick links, including admin users.
- Authorized professional dashboard shows own readiness, credential, application, and visibility state.
- Authorized student waiting-license page keeps the student in pre-licensure state.
- Authorized facility dashboard and requisitions show only facility-safe workspace data.

## Fixes Confirmed

- Facility sessions no longer render admin or professional shells.
- Professional sessions no longer render facility or admin shells.
- Admin sessions no longer render facility/professional workspaces unless a future impersonation feature is explicitly added.
