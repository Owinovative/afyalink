# Custom Domain and Branded Email

This guide prepares Afyalink for:

- `https://www.afyalink.com` for the Next.js frontend
- `https://api.afyalink.com` for the PHP API
- `info@afyalink.com` for public contact
- `support@afyalink.com` for support
- `no-reply@afyalink.com` for system email
- `admin@afyalink.com` for internal admin use

Do not add secrets to git. Copy provider-generated targets and credentials into Cloudflare, Render, Zoho Mail, or Google Workspace only.

## DNS Records

Add these records after each Render service shows its custom-domain DNS target.

| Host | Type | Target |
| --- | --- | --- |
| `www.afyalink.com` | `CNAME` | `<RENDER_FRONTEND_DNS_TARGET>` |
| `api.afyalink.com` | `CNAME` | `<RENDER_API_DNS_TARGET>` |

For `afyalink.com`, prefer a Cloudflare redirect rule:

```text
if hostname equals afyalink.com
then forward to https://www.afyalink.com/$1
status 301
```

Render can also support root-domain routing for web services, but Cloudflare's root-to-`www` redirect keeps the canonical frontend URL explicit and avoids mixing root traffic with API routing.

## Render Setup

1. Open the Render frontend service.
2. Go to Settings -> Custom Domains.
3. Add `www.afyalink.com`.
4. Copy the Render DNS target.
5. Add the `www` CNAME in Cloudflare DNS.
6. Wait for Render verification and TLS issuance.
7. Repeat the same flow for the API service using `api.afyalink.com`.

After verification, keep the `onrender.com` URLs available until launch smoke tests pass.

## App Environment

Backend Render environment after the domains are live:

```env
APP_URL=https://www.afyalink.com
API_URL=https://api.afyalink.com
CORS_ALLOWED_ORIGINS=https://www.afyalink.com
```

Frontend Render environment:

```env
NEXT_PUBLIC_AFYA_API_BASE=https://api.afyalink.com
```

Notification sender and public inboxes:

```env
MAIL_DRIVER=log
MAIL_FROM_ADDRESS=no-reply@afyalink.com
MAIL_FROM_NAME=Afyalink
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_ENCRYPTION=tls
SUPPORT_EMAIL=support@afyalink.com
PUBLIC_CONTACT_EMAIL=info@afyalink.com
ADMIN_EMAIL=admin@afyalink.com
```

Keep `MAIL_DRIVER=log` until a live SMTP/provider adapter is configured and tested.

## Zoho Mail DNS

Zoho generates domain-specific values during setup. Copy the exact values from Zoho Admin Console.

| Purpose | Type | Host | Value |
| --- | --- | --- | --- |
| Domain verification | `TXT` or `CNAME` | `<ZOHO_VERIFICATION_HOST>` | `<ZOHO_VERIFICATION_VALUE>` |
| Mail routing | `MX` | `@` | `<ZOHO_MX_1>` with priority `<ZOHO_PRIORITY_1>` |
| Mail routing | `MX` | `@` | `<ZOHO_MX_2>` with priority `<ZOHO_PRIORITY_2>` |
| SPF | `TXT` | `@` | `v=spf1 include:<ZOHO_SPF_INCLUDE> ~all` |
| DKIM | `TXT` | `<ZOHO_DKIM_SELECTOR>._domainkey` | `<ZOHO_DKIM_TXT_VALUE>` |
| DMARC | `TXT` | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:admin@afyalink.com; fo=1` |

Do not invent the DKIM value. Zoho generates it per domain and selector.

## Google Workspace DNS

Google Workspace also provides setup checks in Admin Console. Use the Google-provided MX and DKIM values for the Afyalink domain.

| Purpose | Type | Host | Value |
| --- | --- | --- | --- |
| Domain verification | `TXT` or `CNAME` | `<GOOGLE_VERIFICATION_HOST>` | `<GOOGLE_VERIFICATION_VALUE>` |
| Mail routing | `MX` | `@` | `<GOOGLE_WORKSPACE_MX_HOST_1>` with priority `<GOOGLE_PRIORITY_1>` |
| Mail routing | `MX` | `@` | `<GOOGLE_WORKSPACE_MX_HOST_2>` with priority `<GOOGLE_PRIORITY_2>` |
| SPF | `TXT` | `@` | `v=spf1 include:_spf.google.com ~all` |
| DKIM | `TXT` | `<GOOGLE_DKIM_SELECTOR>._domainkey` | `<GOOGLE_DKIM_TXT_VALUE>` |
| DMARC | `TXT` | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:admin@afyalink.com; fo=1` |

Only one SPF TXT record should exist at the root. If the domain uses more than one sender, merge include mechanisms into a single SPF value.

## Sender Addresses

Create these accounts or aliases with the chosen email provider:

```text
info@afyalink.com
support@afyalink.com
no-reply@afyalink.com
admin@afyalink.com
```

Use `no-reply@afyalink.com` only for system-sent messages. Replies and public website contact should route to `info@afyalink.com` or `support@afyalink.com`.

## Custom Domain Launch Checklist

1. Buy domain.
2. Add domain to Cloudflare.
3. Add frontend custom domain in Render.
4. Add backend custom domain in Render.
5. Add DNS CNAME records.
6. Add Zoho/Google email DNS records.
7. Verify SPF/DKIM/DMARC.
8. Update Render frontend env.
9. Update Render backend env.
10. Redeploy frontend.
11. Redeploy backend.
12. Test website.
13. Test API health.
14. Test email verification.
15. Test password reset.
16. Test notification worker.

## Verification

Run these checks after DNS and env changes:

```bash
curl -I https://www.afyalink.com
curl https://api.afyalink.com/api/health
```

Then complete one email verification, one password reset, and one notification worker run from staging or production data.

## Official References

- Render custom domains: https://render.com/docs/custom-domains
- Cloudflare redirect rules: https://developers.cloudflare.com/rules/url-forwarding/
- Zoho Mail domain verification: https://www.zoho.com/mail/help/adminconsole/domain-verification.html
- Google Workspace MX setup: https://support.google.com/a/answer/174125
