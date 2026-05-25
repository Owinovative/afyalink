-- Afyalink Milestone 4: production operations, notification delivery, M-PESA callback events,
-- payment lifecycle fields, and privacy request foundation.
-- Target database: PostgreSQL.

ALTER TABLE notification_outbox
    ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS notification_outbox_delivery_idx
    ON notification_outbox(status, next_attempt_at, created_at);

CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
    id BIGSERIAL PRIMARY KEY,
    notification_outbox_id BIGINT NOT NULL REFERENCES notification_outbox(id) ON DELETE CASCADE,
    channel VARCHAR(40) NOT NULL,
    provider VARCHAR(80) NOT NULL,
    status VARCHAR(40) NOT NULL,
    attempt_number INTEGER NOT NULL,
    provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_retry_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notification_delivery_attempts_outbox_idx
    ON notification_delivery_attempts(notification_outbox_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS notification_delivery_attempts_status_idx
    ON notification_delivery_attempts(status, attempted_at DESC);

CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGSERIAL PRIMARY KEY,
    template_key VARCHAR(120) NOT NULL UNIQUE,
    channel VARCHAR(40) NOT NULL DEFAULT 'email',
    subject VARCHAR(190) NOT NULL,
    body TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(190),
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

ALTER TABLE milestone1_payments
    ADD COLUMN IF NOT EXISTS payer_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS payer_type VARCHAR(80) NOT NULL DEFAULT 'professional',
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100) NOT NULL DEFAULT 'professional_application_fee',
    ADD COLUMN IF NOT EXISTS entity_id BIGINT,
    ADD COLUMN IF NOT EXISTS provider VARCHAR(80),
    ADD COLUMN IF NOT EXISTS provider_reference VARCHAR(190),
    ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(190),
    ADD COLUMN IF NOT EXISTS merchant_request_id VARCHAR(190),
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(80),
    ADD COLUMN IF NOT EXISTS callback_payload_redacted JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS milestone1_payments_provider_refs_idx
    ON milestone1_payments(provider, checkout_request_id, merchant_request_id);
CREATE INDEX IF NOT EXISTS milestone1_payments_entity_idx
    ON milestone1_payments(entity_type, entity_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS milestone1_payments_mpesa_receipt_unique_idx
    ON milestone1_payments(provider_reference)
    WHERE provider_reference IS NOT NULL AND provider_reference <> '';

ALTER TABLE facility_access_subscriptions
    ADD COLUMN IF NOT EXISTS provider VARCHAR(80),
    ADD COLUMN IF NOT EXISTS provider_reference VARCHAR(190),
    ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(190),
    ADD COLUMN IF NOT EXISTS merchant_request_id VARCHAR(190),
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(80),
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS facility_access_provider_refs_idx
    ON facility_access_subscriptions(provider, checkout_request_id, merchant_request_id);

CREATE TABLE IF NOT EXISTS payment_provider_events (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(80) NOT NULL,
    payment_id BIGINT REFERENCES milestone1_payments(id) ON DELETE SET NULL,
    facility_subscription_id BIGINT REFERENCES facility_access_subscriptions(id) ON DELETE SET NULL,
    checkout_request_id VARCHAR(190),
    merchant_request_id VARCHAR(190),
    provider_reference VARCHAR(190),
    account_reference VARCHAR(190),
    result_code INTEGER,
    result_description TEXT,
    status VARCHAR(60) NOT NULL DEFAULT 'received',
    dedupe_key CHAR(64) NOT NULL UNIQUE,
    payload_redacted JSONB NOT NULL DEFAULT '{}'::jsonb,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS payment_provider_events_refs_idx
    ON payment_provider_events(provider, checkout_request_id, merchant_request_id, provider_reference);
CREATE INDEX IF NOT EXISTS payment_provider_events_status_idx
    ON payment_provider_events(status, received_at DESC);

CREATE TABLE IF NOT EXISTS privacy_requests (
    id BIGSERIAL PRIMARY KEY,
    requester_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    request_type VARCHAR(80) NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'submitted',
    subject_name VARCHAR(190) NOT NULL,
    subject_email VARCHAR(190) NOT NULL,
    description TEXT NOT NULL,
    admin_note TEXT,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS privacy_requests_status_idx
    ON privacy_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS privacy_requests_subject_idx
    ON privacy_requests(subject_email, created_at DESC);

INSERT INTO notification_templates (template_key, channel, subject, body, variables)
VALUES
    ('email_verification', 'email', 'Verify your Afyalink email address', 'Confirm your Afyalink account before submitting your application.', '["verification_url","expires_at"]'::jsonb),
    ('password_reset', 'email', 'Reset your Afyalink password', 'Use the secure reset link to set a new Afyalink password.', '["reset_url","expires_at"]'::jsonb),
    ('application_submitted', 'email', 'Afyalink application submitted', 'Your application has been submitted for review.', '["application_number"]'::jsonb),
    ('credential_replacement_requested', 'email', 'Credential replacement requested', 'An Afyalink reviewer requested a replacement document.', '["document_type","review_note"]'::jsonb),
    ('verification_status_changed', 'email', 'Afyalink verification update', 'Your regulatory verification status has changed.', '["status"]'::jsonb),
    ('interview_scheduled', 'email', 'Afyalink interview scheduled', 'Your Afyalink interview has been scheduled.', '["scheduled_start_at","mode"]'::jsonb),
    ('interview_completed', 'email', 'Afyalink interview outcome update', 'Your Afyalink interview has been completed and your dashboard has the current outcome.', '["recommendation"]'::jsonb),
    ('publication_status_changed', 'email', 'Afyalink publication status update', 'Your Afyalink candidate publication status has changed.', '["status"]'::jsonb),
    ('facility_registration_submitted', 'email', 'Afyalink facility onboarding received', 'Your facility onboarding record has been submitted for review.', '["facility_name"]'::jsonb),
    ('facility_clarification_requested', 'email', 'Afyalink facility clarification requested', 'Afyalink requested clarification for your facility onboarding.', '["review_note"]'::jsonb),
    ('facility_review_decision', 'email', 'Afyalink facility review update', 'Your facility review status has changed.', '["status"]'::jsonb),
    ('facility_access_changed', 'email', 'Afyalink facility access update', 'Your facility access status has changed.', '["status","ends_at"]'::jsonb),
    ('recommendation_request_received', 'email', 'Afyalink recommendation request received', 'Your recommendation request has been received.', '["role_needed"]'::jsonb),
    ('recommendation_package_shared', 'email', 'Afyalink recommendation package shared', 'A recommendation package is available in your facility portal.', '["package_title"]'::jsonb),
    ('appointment_scheduled', 'email', 'Afyalink appointment scheduled', 'A facility appointment has been scheduled.', '["scheduled_start_at","mode"]'::jsonb),
    ('student_registration_received', 'email', 'Afyalink student profile received', 'Your waiting-license Afyalink account has been created.', '["target_profession"]'::jsonb),
    ('student_profile_completed', 'email', 'Afyalink pre-licensure profile updated', 'Your preliminary profile has been updated.', '["target_profession"]'::jsonb),
    ('student_license_reminder', 'email', 'Afyalink license upload reminder', 'Upload your professional license when it is issued so Afyalink can review conversion.', '["target_profession"]'::jsonb)
ON CONFLICT (template_key) DO UPDATE
SET subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = NOW();
