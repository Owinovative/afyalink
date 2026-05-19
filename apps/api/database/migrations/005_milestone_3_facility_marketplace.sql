-- Afyalink Milestone 3: facility marketplace, access, candidate publication, requests, and recommendations.
-- Target database: PostgreSQL.

CREATE TABLE IF NOT EXISTS facilities (
    id BIGSERIAL PRIMARY KEY,
    legal_name VARCHAR(190) NOT NULL,
    display_name VARCHAR(190) NOT NULL,
    facility_type VARCHAR(120) NOT NULL,
    registration_number VARCHAR(160),
    county VARCHAR(120) NOT NULL,
    location VARCHAR(190),
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(60) NOT NULL,
    physical_address TEXT,
    contact_person VARCHAR(190) NOT NULL,
    operational_status VARCHAR(80) NOT NULL DEFAULT 'pending_onboarding',
    review_status VARCHAR(80) NOT NULL DEFAULT 'draft',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    review_note TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (email),
    UNIQUE (registration_number)
);

CREATE INDEX IF NOT EXISTS facilities_review_status_idx
    ON facilities(review_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS facilities_county_type_idx
    ON facilities(county, facility_type);

CREATE TABLE IF NOT EXISTS facility_memberships (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(80) NOT NULL DEFAULT 'facility_viewer',
    status VARCHAR(60) NOT NULL DEFAULT 'active',
    invited_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (facility_id, user_id)
);

CREATE INDEX IF NOT EXISTS facility_memberships_user_idx
    ON facility_memberships(user_id, status);

CREATE TABLE IF NOT EXISTS facility_documents (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    document_type VARCHAR(100) NOT NULL,
    original_name TEXT NOT NULL,
    storage_key TEXT,
    checksum CHAR(64),
    mime_type VARCHAR(120),
    size_bytes BIGINT,
    review_status VARCHAR(80) NOT NULL DEFAULT 'uploaded',
    review_note TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS facility_documents_facility_idx
    ON facility_documents(facility_id, review_status);

CREATE TABLE IF NOT EXISTS facility_access_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    plan_code VARCHAR(100) NOT NULL DEFAULT 'staging_manual_access',
    status VARCHAR(80) NOT NULL DEFAULT 'pending_payment',
    payment_reference VARCHAR(140) NOT NULL UNIQUE,
    idempotency_key VARCHAR(190) NOT NULL,
    amount_cents BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'KES',
    method VARCHAR(100) NOT NULL DEFAULT 'manual_reference',
    external_reference VARCHAR(190),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    admin_override BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (facility_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS facility_access_status_idx
    ON facility_access_subscriptions(facility_id, status, ends_at DESC);

CREATE TABLE IF NOT EXISTS candidate_publications (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES milestone1_applications(id) ON DELETE CASCADE,
    professional_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(80) NOT NULL DEFAULT 'draft',
    summary_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    private_admin_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    unpublished_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    unpublished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS candidate_publications_status_idx
    ON candidate_publications(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS candidate_publications_professional_idx
    ON candidate_publications(professional_user_id, status);

CREATE TABLE IF NOT EXISTS candidate_profile_views (
    id BIGSERIAL PRIMARY KEY,
    candidate_publication_id BIGINT NOT NULL REFERENCES candidate_publications(id) ON DELETE CASCADE,
    professional_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    viewer_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL DEFAULT 'profile_viewed',
    watermark JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidate_profile_views_candidate_idx
    ON candidate_profile_views(candidate_publication_id, created_at DESC);
CREATE INDEX IF NOT EXISTS candidate_profile_views_facility_idx
    ON candidate_profile_views(facility_id, created_at DESC);
CREATE INDEX IF NOT EXISTS candidate_profile_views_professional_idx
    ON candidate_profile_views(professional_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS facility_requests (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    requester_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    request_type VARCHAR(100) NOT NULL,
    title VARCHAR(190) NOT NULL,
    role_needed VARCHAR(160),
    county VARCHAR(120),
    urgency VARCHAR(80),
    experience_level VARCHAR(120),
    preferred_timing TEXT,
    contact_preference VARCHAR(120),
    notes TEXT,
    candidate_publication_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(80) NOT NULL DEFAULT 'submitted',
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    admin_note TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS facility_requests_status_idx
    ON facility_requests(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS facility_requests_facility_idx
    ON facility_requests(facility_id, created_at DESC);

CREATE TABLE IF NOT EXISTS facility_appointments (
    id BIGSERIAL PRIMARY KEY,
    facility_request_id BIGINT NOT NULL REFERENCES facility_requests(id) ON DELETE CASCADE,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    scheduled_start_at TIMESTAMPTZ,
    scheduled_end_at TIMESTAMPTZ,
    mode VARCHAR(80) NOT NULL DEFAULT 'remote',
    location TEXT,
    status VARCHAR(80) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS facility_appointments_status_idx
    ON facility_appointments(status, scheduled_start_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_requests (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    requester_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    role_needed VARCHAR(160) NOT NULL,
    county VARCHAR(120),
    urgency VARCHAR(80),
    experience_level VARCHAR(120),
    notes TEXT,
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    candidate_publication_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(80) NOT NULL DEFAULT 'submitted',
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recommendation_requests_status_idx
    ON recommendation_requests(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_requests_facility_idx
    ON recommendation_requests(facility_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_packages (
    id BIGSERIAL PRIMARY KEY,
    recommendation_request_id BIGINT REFERENCES recommendation_requests(id) ON DELETE SET NULL,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    title VARCHAR(190) NOT NULL,
    rationale TEXT,
    status VARCHAR(80) NOT NULL DEFAULT 'draft',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    shared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recommendation_packages_status_idx
    ON recommendation_packages(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_packages_facility_idx
    ON recommendation_packages(facility_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_package_candidates (
    id BIGSERIAL PRIMARY KEY,
    recommendation_package_id BIGINT NOT NULL REFERENCES recommendation_packages(id) ON DELETE CASCADE,
    candidate_publication_id BIGINT NOT NULL REFERENCES candidate_publications(id) ON DELETE CASCADE,
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (recommendation_package_id, candidate_publication_id)
);

CREATE INDEX IF NOT EXISTS recommendation_package_candidates_package_idx
    ON recommendation_package_candidates(recommendation_package_id);
