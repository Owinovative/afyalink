-- Production-oriented runtime repository tables for the executable Milestone 1 API.
-- Target database: PostgreSQL.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS roles JSONB NOT NULL DEFAULT '["professional"]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sessions_user_active_idx ON sessions(user_id, revoked_at, expires_at DESC);

CREATE TABLE IF NOT EXISTS milestone1_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    profession VARCHAR(120) NOT NULL,
    regulatory_body VARCHAR(160) NOT NULL,
    license_number VARCHAR(120) NOT NULL,
    county VARCHAR(120) NOT NULL,
    years_experience NUMERIC(5,2) NOT NULL DEFAULT 0,
    work_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    availability VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (regulatory_body, license_number)
);

CREATE INDEX IF NOT EXISTS milestone1_profiles_profession_idx ON milestone1_profiles(profession);
CREATE INDEX IF NOT EXISTS milestone1_profiles_county_idx ON milestone1_profiles(county);

CREATE TABLE IF NOT EXISTS milestone1_credentials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(80) NOT NULL,
    storage_key TEXT NOT NULL,
    checksum CHAR(64) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    original_name TEXT NOT NULL,
    review_status VARCHAR(60) NOT NULL DEFAULT 'uploaded',
    review_note TEXT,
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    superseded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS milestone1_credentials_user_type_idx ON milestone1_credentials(user_id, document_type, superseded_at);
CREATE INDEX IF NOT EXISTS milestone1_credentials_review_idx ON milestone1_credentials(review_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS milestone1_credentials_checksum_idx ON milestone1_credentials(checksum);

CREATE TABLE IF NOT EXISTS milestone1_consents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(80) NOT NULL,
    version VARCHAR(120) NOT NULL,
    text_hash CHAR(64) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, type, version)
);

CREATE INDEX IF NOT EXISTS milestone1_consents_user_accepted_idx ON milestone1_consents(user_id, accepted_at DESC);

CREATE TABLE IF NOT EXISTS milestone1_payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    intent_reference VARCHAR(120) NOT NULL UNIQUE,
    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'KES',
    method VARCHAR(80) NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'initiated',
    idempotency_key VARCHAR(190) NOT NULL,
    external_reference VARCHAR(190),
    review_note TEXT,
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS milestone1_payments_user_status_idx ON milestone1_payments(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS milestone1_payments_reference_idx ON milestone1_payments(intent_reference);

CREATE TABLE IF NOT EXISTS milestone1_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_number VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(60) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    review_note TEXT,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS milestone1_applications_user_status_idx ON milestone1_applications(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS milestone1_applications_status_created_idx ON milestone1_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS milestone1_applications_number_idx ON milestone1_applications(application_number);
