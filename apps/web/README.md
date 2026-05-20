# Afyalink Web Platform Console

Frontend product foundation for Afyalink.

This folder contains a static public landing page plus professional, facility, and admin workspaces wired to the backend API contract. It can later become a Next.js App Router or Laravel Inertia React app without moving sensitive workflow logic into the browser.

The public page includes:

- premium Afyalink positioning and trust messaging;
- professional, facility, and admin entry paths;
- workflow explanation;
- security and controlled-access messaging.

The application console includes forms for:

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

Then open `index.html` directly or serve this folder with a static server. For asset-accurate staging parity, run `npm.cmd run build:render` and serve `dist/`.

## Run Checks

```bash
npm.cmd run check
```

## Future Implementation Path

1. Move the static landing page and console into Next.js or Laravel Inertia + React.
2. Add route-level guards and real layout components.
3. Keep facility candidate views read-only, watermarked, and audited.
4. Keep document access private and avoid exposing raw credential storage keys.
