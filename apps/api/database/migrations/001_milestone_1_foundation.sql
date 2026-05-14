-- Afyalink Milestone 1 foundation schema.
-- Target database: PostgreSQL.

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(40) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE professionals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    profession VARCHAR(120) NOT NULL,
    regulatory_body VARCHAR(160) NOT NULL,
    license_number VARCHAR(120) NOT NULL,
    county VARCHAR(120) NOT NULL,
    years_experience NUMERIC(5,2) DEFAULT 0,
    availability_status VARCHAR(80) DEFAULT 'available',
    work_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (regulatory_body, license_number)
);

CREATE TABLE consent_versions (
    id BIGSERIAL PRIMARY KEY,
    consent_type VARCHAR(80) NOT NULL,
    version VARCHAR(40) NOT NULL,
    body TEXT NOT NULL,
    body_hash CHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (consent_type, version)
);

CREATE TABLE consents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_version_id BIGINT NOT NULL REFERENCES consent_versions(id),
    ip_address INET,
    user_agent TEXT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, consent_version_id)
);

CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    professional_id BIGINT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    status VARCHAR(60) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX applications_status_created_at_idx ON applications(status, created_at DESC);
CREATE INDEX applications_professional_status_idx ON applications(professional_id, status);

CREATE TABLE professional_credentials (
    id BIGSERIAL PRIMARY KEY,
    professional_id BIGINT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    document_type VARCHAR(80) NOT NULL,
    current_version_id BIGINT,
    review_status VARCHAR(60) NOT NULL DEFAULT 'uploaded',
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    expires_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (professional_id, document_type)
);

CREATE TABLE document_versions (
    id BIGSERIAL PRIMARY KEY,
    credential_id BIGINT NOT NULL REFERENCES professional_credentials(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256_checksum CHAR(64) NOT NULL,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE professional_credentials
    ADD CONSTRAINT professional_credentials_current_version_fk
    FOREIGN KEY (current_version_id) REFERENCES document_versions(id);

CREATE INDEX document_versions_checksum_idx ON document_versions(sha256_checksum);
CREATE INDEX professional_credentials_review_idx ON professional_credentials(review_status, updated_at DESC);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'KES',
    method VARCHAR(60) NOT NULL,
    provider_reference VARCHAR(190),
    internal_status VARCHAR(60) NOT NULL DEFAULT 'initiated',
    provider_status VARCHAR(80),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_reference)
);

CREATE INDEX payments_user_status_idx ON payments(user_id, internal_status);
CREATE INDEX payments_application_status_idx ON payments(application_id, internal_status);

CREATE TABLE payment_events (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_events (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    actor_id BIGINT REFERENCES users(id),
    from_status VARCHAR(60),
    to_status VARCHAR(60) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX application_events_application_created_idx ON application_events(application_id, created_at DESC);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id),
    action VARCHAR(140) NOT NULL,
    entity_type VARCHAR(120) NOT NULL,
    entity_id VARCHAR(120),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs(actor_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs(action, created_at DESC);

