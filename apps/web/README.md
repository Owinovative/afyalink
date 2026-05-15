# Afyalink Web Milestone 1 Console

Frontend product foundation for Afyalink.

This folder currently contains a static Milestone 1 intake and admin review console wired to the backend API contract. It can later become a Next.js App Router or Laravel Inertia React app without moving sensitive workflow logic into the browser.

The page includes forms for:

- professional registration and login;
- profile completion;
- private credential upload;
- consent acceptance;
- payment reference creation;
- application submission;
- admin login;
- application and audit review.

## Run Locally

Start the API:

```bash
cd ../api
php -S localhost:8000 -t public
```

Then open `index.html` directly or serve this folder with a static server.

## Run Checks

```bash
npm.cmd run check
```

## Future Implementation Path

1. Move the static console into Next.js or Laravel Inertia + React.
2. Add route-level guards and real layout components.
3. Add admin detail/review controls beyond the current API smoke UI.
4. Keep document access private, watermarked, and audited.
