-- Afyalink Milestone 2: regulatory verification and interview operations.
-- Target database: PostgreSQL.

CREATE TABLE IF NOT EXISTS regulatory_bodies (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(190) NOT NULL,
    profession_coverage JSONB NOT NULL DEFAULT '[]'::jsonb,
    country VARCHAR(120) NOT NULL DEFAULT 'Kenya',
    region VARCHAR(120),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    default_verification_method VARCHAR(120) NOT NULL DEFAULT 'manual_registry_check',
    verification_instructions TEXT,
    contact_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS regulatory_bodies_active_idx
    ON regulatory_bodies(active, code);

CREATE TABLE IF NOT EXISTS verification_cases (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES milestone1_applications(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    regulatory_body_id BIGINT REFERENCES regulatory_bodies(id) ON DELETE SET NULL,
    regulatory_body_code VARCHAR(80) NOT NULL,
    regulatory_body_name VARCHAR(190) NOT NULL,
    license_number VARCHAR(120) NOT NULL,
    verification_method VARCHAR(120) NOT NULL,
    reviewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(80) NOT NULL DEFAULT 'pending',
    evidence_reference TEXT,
    evidence_notes TEXT,
    final_decision_notes TEXT,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (application_id, regulatory_body_code)
);

CREATE INDEX IF NOT EXISTS verification_cases_status_idx
    ON verification_cases(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS verification_cases_reviewer_idx
    ON verification_cases(reviewer_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS verification_cases_user_idx
    ON verification_cases(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS interviews (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES milestone1_applications(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interviewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    scheduled_start_at TIMESTAMPTZ,
    scheduled_end_at TIMESTAMPTZ,
    mode VARCHAR(80) NOT NULL DEFAULT 'remote',
    location TEXT,
    status VARCHAR(80) NOT NULL DEFAULT 'pending_schedule',
    notes TEXT,
    recommendation VARCHAR(80),
    total_score NUMERIC(8,2),
    average_score NUMERIC(8,2),
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interviews_status_schedule_idx
    ON interviews(status, scheduled_start_at DESC);
CREATE INDEX IF NOT EXISTS interviews_interviewer_idx
    ON interviews(interviewer_id, status, scheduled_start_at DESC);
CREATE INDEX IF NOT EXISTS interviews_application_idx
    ON interviews(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS interviews_user_idx
    ON interviews(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS interview_score_items (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    category VARCHAR(120) NOT NULL,
    score NUMERIC(6,2) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 5,
    weight NUMERIC(6,2) NOT NULL DEFAULT 1,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (interview_id, category)
);

CREATE INDEX IF NOT EXISTS interview_score_items_interview_idx
    ON interview_score_items(interview_id);

