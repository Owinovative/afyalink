# Render Launch Checklist

Use this checklist for staging rehearsal and production launch. Keep demo seeding out of production.

1. Merge latest `main`.
2. Confirm Render frontend service exists.
3. Confirm Render backend service exists.
4. Confirm notification cron job exists.
5. Confirm `DATABASE_URL`.
6. Confirm R2/S3 credential storage env vars.
7. Confirm `MAIL_DRIVER`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, and SMTP env vars.
8. Confirm M-PESA env vars.
9. Confirm `APP_URL`, `API_URL`, and `CORS_ALLOWED_ORIGINS`.
10. Confirm `NEXT_PUBLIC_AFYA_API_BASE`.
11. Run migrations with `php scripts/migrate.php`.
12. Seed demo data only in staging with `php scripts/seed-demo-data.php`.
13. Test `https://www.afyalinks.org`.
14. Test `https://api.afyalinks.org/api/health`.
15. Test email sending through the notification outbox.
16. Test password reset.
17. Test credential upload.
18. Test payment flow and M-PESA callback in sandbox.
19. Test facility access.
20. Test matching and placement.
21. Test protected portals while logged out and with each role.
22. Test sitemap and robots.
23. Monitor Render API, web, and cron logs.

## Required Production Env

API:

```env
APP_ENV=production
APP_URL=https://www.afyalinks.org
API_URL=https://api.afyalinks.org
CORS_ALLOWED_ORIGINS=https://www.afyalinks.org
AFYALINK_DATASTORE=pgsql
DATABASE_URL=<Render or Neon secret>
AFYALINK_CREDENTIAL_STORAGE=r2
MAIL_DRIVER=log
MAIL_FROM_ADDRESS=no-reply@afyalinks.org
MAIL_FROM_NAME=Afyalink
PUBLIC_CONTACT_PHONE=+254711776391
PUBLIC_LOCATION=Hardy, Karen
PUBLIC_CONTACT_EMAIL=
SUPPORT_EMAIL=
ADMIN_EMAIL=
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=https://api.afyalinks.org/api/payments/mpesa/callback
```

Frontend:

```env
NEXT_PUBLIC_SITE_URL=https://www.afyalinks.org
NEXT_PUBLIC_AFYA_API_BASE=https://api.afyalinks.org
PUBLIC_CONTACT_PHONE=+254711776391
PUBLIC_LOCATION=Hardy, Karen
PUBLIC_CONTACT_EMAIL=
SUPPORT_EMAIL=
```

Switch `MAIL_DRIVER=smtp` only after MX/SPF/DKIM/DMARC and SMTP credentials are verified. Switch `MPESA_ENV=production` only after Daraja production credentials, callback reachability, and reconciliation procedures are verified.
