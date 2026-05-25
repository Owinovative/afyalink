# M-PESA Payment Operations

Afyalink Milestone 4 adds a production-shaped M-PESA foundation while preserving manual payment review for staging.

## Payment Contexts

Payments can now carry operational context:

- professional application or interview fee
- facility access subscription
- recommendation package or service fee
- future admin adjustment

The `milestone1_payments` table now supports provider references, checkout request IDs, merchant request IDs, redacted callback metadata, failure reasons, and paid timestamps.

## M-PESA Callback Endpoint

```http
POST /api/payments/mpesa/callback
```

The callback handler:

- extracts `CheckoutRequestID`, `MerchantRequestID`, result code, receipt number, amount, and phone from Daraja callback metadata
- stores a redacted provider event in `payment_provider_events`
- uses a deterministic dedupe key to avoid duplicate callback processing
- updates matched payment records to `confirmed` or `failed`
- activates a matched facility subscription when the callback account reference matches the subscription payment reference
- audits callback processing without storing secrets

## Environment

```env
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
```

No production success is faked. Live STK push initiation still requires a provider adapter and credential configuration.

## Manual Review

Manual payment confirmation remains available:

- API: `PATCH /api/admin/payments/{id}/status`
- Web: `/portal/admin/payments`

Every admin status change is audited.

## Facility Subscription Linkage

Facility access becomes operationally active when:

1. facility review status is approved
2. subscription status is active
3. the access window is current

Admins can activate, suspend, expire, cancel, or extend access from facility detail pages. M-PESA callbacks can also activate a matched subscription when the provider sends the subscription reference as the account reference.
