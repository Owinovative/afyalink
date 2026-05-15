# Local Setup

## Requirements

- PHP 8.3+
- Composer
- Node.js 20+
- PostgreSQL for production-style development
- Redis for future queue/cache work

## Backend

```bash
cd apps/api
composer install
composer dump-autoload
composer check
php -S localhost:8000 -t public
```

The current executable API uses a local JSON datastore for Milestone 1 development:

- `apps/api/storage/runtime/afyalink-dev.json`
- `apps/api/storage/private/credentials`

These paths are ignored and must not be committed.

## Frontend

```bash
cd apps/web
npm install
npm.cmd run check
```

Open `apps/web/index.html` directly or serve it with any static server. The page expects the API at:

```text
http://localhost:8000
```

To point the page elsewhere, set `window.AFYA_API_BASE` before loading `src/app.js`.

## Creating an Admin for Local Testing

```bash
cd apps/api
php scripts/create-admin.php "Afyalink Admin" admin@example.com 0799999999 AdminPass123
```

You can also set `AFYALINK_ADMIN_NAME`, `AFYALINK_ADMIN_EMAIL`, `AFYALINK_ADMIN_PHONE`, and `AFYALINK_ADMIN_PASSWORD`. Do not hardcode admin credentials into the repository.

## Verification

```bash
cd apps/api
composer check

cd ../web
npm.cmd run check
```
