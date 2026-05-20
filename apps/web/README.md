# Afyalink Next.js Web Platform

Route-based frontend product platform for Afyalink.

This folder contains a Next.js App Router application with a multi-page public website, routed authentication pages, and separate professional, facility, and admin portals wired to the backend API contract. Sensitive workflow logic remains in backend services.

The public website includes:

- premium Afyalink positioning and trust messaging across distinct pages;
- professional, facility, and admin entry paths;
- workflow explanation;
- security and controlled-access messaging.

The routed portals include forms for:

- professional registration and login;
- profile completion;
- private credential upload;
- consent acceptance;
- payment reference creation;
- application submission;
- admin login;
- application and audit review.
- regulatory verification and interview operations;
- facility registration/onboarding, access status, candidate browsing, candidate detail viewing, appointment requests, recommendation requests, and shared packages;
- admin facility review, access management, candidate publication, facility request, and recommendation package operations.

## Run Locally

Start the API:

```bash
cd ../api
php -S localhost:8000 -t public
```

Then run the Next.js frontend:

```bash
npm install
npm.cmd run dev
```

The browser API client defaults to `http://localhost:8000`. Set `NEXT_PUBLIC_AFYA_API_BASE` when pointing the frontend at staging or another API.

## Run Checks

```bash
npm.cmd run check
npm.cmd run typecheck
npm.cmd run build
```

## Route Map

Public pages: `/`, `/how-it-works`, `/professionals`, `/facilities`, `/trust-security`, `/verification`, `/pricing-access`, `/about`, `/contact`, `/faq`.

Auth pages: `/auth/login`, `/auth/register/professional`, `/auth/register/facility`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`.

Portals:

- `/portal/professional/*`
- `/portal/facility/*`
- `/portal/admin/*`

Facility candidate detail remains read-only, watermarked, and audit-backed through the API. The frontend does not expose raw credential storage keys or public document URLs.
