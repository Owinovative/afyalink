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

- Email: implemented through a provider interface with safe `log`/`null` staging behavior and SMTP launch support.
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
PUBLIC_CONTACT_PHONE=+254711776391
PUBLIC_LOCATION=Hardy, Karen
SUPPORT_EMAIL=
PUBLIC_CONTACT_EMAIL=
ADMIN_EMAIL=
```

`MAIL_DRIVER=log` is safe for staging because it does not require live provider credentials. Use `MAIL_DRIVER=null` only when delivery should be swallowed. Use `MAIL_DRIVER=smtp` after Zoho Mail, Google Workspace, or another SMTP provider is verified.

## Render Cron Job

Recommended setup:

```text
Name: afyalink-notification-worker
Command: php scripts/process-notifications.php 50
Schedule: */10 * * * *
```

Every run is bounded by the command limit. The worker processes only `queued`, `pending`, or due `retry_scheduled` records and does not resend `sent` notifications.

## Local Testing

```bash
cd apps/api
MAIL_DRIVER=log php scripts/process-notifications.php 10
```

Then inspect:

- `notification_outbox.status`
- `notification_outbox.attempt_count`
- `notification_outbox.next_attempt_at`
- `notification_delivery_attempts`
- `/portal/admin/notifications`

Retry safely by fixing the provider/env issue and rerunning the command after `next_attempt_at`, or by using the admin process action for a bounded manual run.

## Admin Operations

Admins can inspect notification health at:

- API: `GET /api/admin/notifications`
- API: `POST /api/admin/notifications/process`
- Web: `/portal/admin/notifications`

The admin UI shows delivery counts, failed/retry rows, recent notifications, and a controlled process button.

## Sensitive Data

Notification logs and provider responses must not contain passwords, tokens, credential files, raw documents, or provider secrets. The current implementation masks email addresses in admin-facing delivery lists.
