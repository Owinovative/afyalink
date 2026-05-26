# Notification Delivery Workflow

Afyalink now treats notifications as durable operational work, not controller-side side effects.

## Model

Notification intents are written to `notification_outbox`. Delivery processing records each attempt in `notification_delivery_attempts`.

Supported delivery states:

- `pending` / legacy `queued`
- `processing`
- `sent`
- `failed`
- `retry_scheduled`
- `cancelled`

Current production-shaped channels:

- Email: implemented through a provider interface with safe `log`/`null` staging behavior.
- SMS-ready: represented by channel/status design, not live provider delivery yet.
- WhatsApp-ready: represented by channel/status design, not live provider delivery yet.

## Local Processing

```bash
cd apps/api
php scripts/process-notifications.php 25
```

The command:

- picks pending or due retry notifications
- marks each record `processing`
- sends through the configured provider
- records a delivery attempt
- marks success as `sent`
- schedules retry with backoff or marks final `failed`

The worker is idempotent enough for cron-style execution. A repeated run does not resend `sent` notifications.

## Environment

```env
MAIL_DRIVER=log
MAIL_FROM_ADDRESS=no-reply@afyalinks.org
MAIL_FROM_NAME=Afyalink
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_ENCRYPTION=tls
SUPPORT_EMAIL=support@afyalinks.org
PUBLIC_CONTACT_EMAIL=info@afyalinks.org
ADMIN_EMAIL=admin@afyalinks.org
```

`MAIL_DRIVER=log` is safe for staging because it does not require live provider credentials. Production should add a real provider adapter such as Postmark, SendGrid, Mailgun, or SMTP-backed delivery before turning on real email.

## Admin Operations

Admins can inspect notification health at:

- API: `GET /api/admin/notifications`
- API: `POST /api/admin/notifications/process`
- Web: `/portal/admin/notifications`

The admin UI shows delivery counts, failed/retry rows, recent notifications, and a controlled process button.

## Sensitive Data

Notification logs and provider responses must not contain passwords, tokens, credential files, raw documents, or provider secrets. The current implementation masks email addresses in admin-facing delivery lists.
