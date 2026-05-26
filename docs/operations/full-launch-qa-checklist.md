# Full Launch QA Checklist

Use this checklist in staging before any production cutover. Record the tester, date, environment, commit SHA, and evidence links for each pass.

## Setup

- Run migrations against staging.
- Confirm `APP_URL=https://www.afyalinks.org`, `API_URL=https://api.afyalinks.org`, and `CORS_ALLOWED_ORIGINS=https://www.afyalinks.org`.
- Confirm frontend `NEXT_PUBLIC_SITE_URL=https://www.afyalinks.org` and `NEXT_PUBLIC_AFYA_API_BASE=https://api.afyalinks.org`.
- Keep `MAIL_DRIVER=log` until SMTP provider DNS and credentials are verified.
- Seed demo data only in local or staging with `php scripts/seed-demo-data.php`.
- After `npm run build`, run browser smoke tests with `cd apps/web && npm run test:e2e`.

## Professional

- Register a professional account.
- Verify email through the queued verification notification.
- Log in and confirm portal access.
- Complete profile.
- Upload credential documents.
- Accept credential verification consent.
- Create a payment reference or payment intent.
- Submit application.
- Track application status from the professional dashboard.

## Student

- Register as a student awaiting license.
- Complete the pre-licensure profile.
- Upload early documents.
- Confirm the student cannot be published as licensed talent.
- Upload license evidence later.
- Admin converts the profile only after license review.

## Admin

- Log in as admin.
- Review submitted applications.
- Review credential metadata and private document access controls.
- Review payments and manual references.
- Create a verification case.
- Complete verification.
- Schedule an interview.
- Score the interview.
- Qualify or reject the candidate.
- Publish eligible licensed candidates only.
- Confirm command center counts update for pending payments, failed notifications, facility approvals, requisitions, shortlists, placements, students, privacy requests, and audit events.

## Facility

- Register a facility owner.
- Complete facility onboarding.
- Admin approves the facility.
- Admin activates facility access or subscription.
- Facility creates a requisition.
- Facility views available candidate summaries only after approval and active access.
- Admin shares a reviewed shortlist.
- Facility views watermarked candidate profile.
- Facility requests interview or placement coordination.

## Matching And Placement

- Run matching for a submitted requisition.
- Review the match score and explanation.
- Confirm ineligible student awaiting-license profiles stay blocked.
- Create a shortlist.
- Share the shortlist.
- Track facility interest.
- Create a placement.
- Move the placement through proposed, contacted, interview, offer, onboarding, and placed states where applicable.

## Notifications

- Email verification queues and sends.
- Password reset queues and sends.
- Application submitted queues a professional notification.
- Facility approved queues a facility notification.
- Shortlist shared queues a facility notification.
- Placement update queues a professional notification.
- Failed notification records an attempt, retry time, and safe error.
- Re-running the worker does not duplicate sent notifications.

## Payments

- Manual reference can move through review and confirmation.
- M-PESA callback simulation or sandbox updates matching payment status.
- Duplicate M-PESA callbacks are idempotent.
- Failed callback does not mark payment as confirmed.
- Admin review remains available.
- Do not fake production payment success.

## Security

- Logged-out portal pages show only the protected state.
- Admin pages are blocked from non-admin users.
- Facility pages are blocked from non-facility users.
- Professional pages are blocked from other roles.
- Private document URLs are not public.
- Candidate profile views are watermarked and audited.
- Auth and portal pages include `noindex, nofollow`.

## SEO

- `https://www.afyalinks.org/sitemap.xml` returns public routes only.
- `https://www.afyalinks.org/robots.txt` disallows `/portal/`, `/auth/`, and `/api/`.
- Google Search Console can verify DNS TXT.
- Bing Webmaster Tools accepts the same sitemap.
- `site:afyalinks.org` is checked after crawling has time to run.

## Sign-Off

- Public website smoke test passed.
- Protected portal smoke test passed.
- Backend workflow test passed.
- Notification worker test passed.
- Payment callback test passed.
- Upload flow test passed.
- Render logs monitored after deploy.
