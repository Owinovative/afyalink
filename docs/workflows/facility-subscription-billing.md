# Facility Subscription Billing

Facility marketplace access is not public. A facility must be approved and have an active access subscription before it can browse published candidates.

## Lifecycle

1. Facility registers and submits onboarding.
2. Admin approves or rejects facility onboarding.
3. Facility creates an access payment intent.
4. Payment is confirmed manually in staging or through a provider callback in production-ready deployments.
5. Admin or callback activates the subscription.
6. The access window controls marketplace browsing.

Subscription statuses:

- `pending_payment`
- `active`
- `suspended`
- `expired`
- `cancelled`

## Admin Controls

Admins can manage access from:

- Web: `/portal/admin/facilities/{id}`
- API: `PATCH /api/admin/facilities/{id}/subscription`

Allowed actions include activation, suspension, expiration, cancellation, extension, and manual override notes.

## Operational Signals

The operations command center reports:

- active subscriptions
- expiring subscriptions
- pending payment subscriptions
- suspended/cancelled access

These counters appear in:

- API: `GET /api/admin/operations/dashboard`
- Web: `/portal/admin/dashboard`

## Deferred

Automatic recurring billing, invoice PDFs, subscription plan catalogues, and provider-initiated STK push are intentionally deferred until a production payment provider adapter is configured.
