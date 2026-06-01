-- Afyalink registration, payment verification, email OTP, and activation engine.
-- Target database: PostgreSQL.

CREATE TABLE IF NOT EXISTS registration_records (
    id BIGSERIAL PRIMARY KEY,
    registration_reference VARCHAR(80) NOT NULL UNIQUE,
    account_type VARCHAR(40) NOT NULL,
    status VARCHAR(80) NOT NULL DEFAULT 'draft',
    name VARCHAR(180) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(60) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    required_amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'KES',
    password_hash TEXT,
    password_created_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    approval_status VARCHAR(80),
    approval_note TEXT,
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    facility_id BIGINT REFERENCES facilities(id) ON DELETE SET NULL,
    abandoned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (email),
    UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS registration_records_status_idx
    ON registration_records(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS registration_records_account_status_idx
    ON registration_records(account_type, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS registration_records_search_idx
    ON registration_records(registration_reference, email, phone);

CREATE TABLE IF NOT EXISTS registration_payments (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL REFERENCES registration_records(id) ON DELETE CASCADE,
    payment_type VARCHAR(80) NOT NULL,
    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'KES',
    payer_phone VARCHAR(80),
    reference VARCHAR(190),
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    provider VARCHAR(80),
    provider_status VARCHAR(120),
    transaction_id VARCHAR(190),
    checkout_request_id VARCHAR(190),
    merchant_request_id VARCHAR(190),
    validation_status VARCHAR(80),
    validation_note TEXT,
    callback_payload_redacted JSONB NOT NULL DEFAULT '{}'::jsonb,
    verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registration_payments_registration_status_idx
    ON registration_payments(registration_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS registration_payments_provider_refs_idx
    ON registration_payments(provider, checkout_request_id, merchant_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS registration_payments_reference_unique_idx
    ON registration_payments(reference)
    WHERE reference IS NOT NULL AND reference <> '';
CREATE UNIQUE INDEX IF NOT EXISTS registration_payments_transaction_unique_idx
    ON registration_payments(transaction_id)
    WHERE transaction_id IS NOT NULL AND transaction_id <> '';

CREATE TABLE IF NOT EXISTS registration_email_otps (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL REFERENCES registration_records(id) ON DELETE CASCADE,
    code_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resend_count INTEGER NOT NULL DEFAULT 0,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registration_email_otps_registration_idx
    ON registration_email_otps(registration_id, used_at, expires_at DESC);
CREATE INDEX IF NOT EXISTS registration_email_otps_code_idx
    ON registration_email_otps(code_hash);

CREATE TABLE IF NOT EXISTS registration_decisions (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL REFERENCES registration_records(id) ON DELETE CASCADE,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(140) NOT NULL,
    from_status VARCHAR(80),
    to_status VARCHAR(80) NOT NULL,
    note TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registration_decisions_registration_idx
    ON registration_decisions(registration_id, created_at DESC);
CREATE INDEX IF NOT EXISTS registration_decisions_action_idx
    ON registration_decisions(action, created_at DESC);

INSERT INTO notification_templates (template_key, channel, subject, body, variables)
VALUES
    ('registration_started', 'email', 'Afyalink registration started', 'Afyalink registration has started. Verify. Connect. Place.', '["account_type","amount_cents","currency"]'::jsonb),
    ('registration_payment_received', 'email', 'Afyalink payment received for review', 'Afyalink received your registration payment details and will verify before the next step.', '["registration_reference","payment_type","amount_cents","currency"]'::jsonb),
    ('registration_payment_verified', 'email', 'Afyalink registration payment verified', 'Your Afyalink registration payment is verified. Create your password to continue.', '["registration_reference"]'::jsonb),
    ('registration_otp', 'email', 'Afyalink email verification code', 'Use the Afyalink one-time code to verify your email. Verify. Connect. Place.', '["code","expires_at"]'::jsonb),
    ('registration_otp_verified', 'email', 'Afyalink email verified', 'Your Afyalink email is verified. Your registration will continue to the next required step.', '["registration_reference"]'::jsonb),
    ('registration_facility_approved', 'email', 'Afyalink facility approved', 'Afyalink approved your facility registration. Your facility workspace is now active.', '["registration_reference","facility_id"]'::jsonb),
    ('registration_facility_rejected', 'email', 'Afyalink facility registration rejected', 'Afyalink rejected your facility registration after review. Check the decision note.', '["registration_reference","note"]'::jsonb),
    ('registration_facility_information_requested', 'email', 'Afyalink facility information requested', 'Afyalink needs more information before facility approval can continue.', '["registration_reference","note"]'::jsonb)
ON CONFLICT (template_key) DO UPDATE
SET subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = NOW();
