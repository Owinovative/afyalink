-- Afyalink Milestone 5: intelligent placement, matching, communications, facility team,
-- and interoperability readiness.
-- Target database: PostgreSQL.

CREATE TABLE IF NOT EXISTS facility_requisitions (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(190) NOT NULL,
    profession_required VARCHAR(140) NOT NULL,
    specialty_required VARCHAR(140),
    facility_department VARCHAR(140),
    employment_type VARCHAR(60) NOT NULL,
    number_of_positions INTEGER NOT NULL DEFAULT 1,
    county VARCHAR(120) NOT NULL,
    facility_site TEXT,
    required_start_date DATE,
    end_date DATE,
    shift_pattern VARCHAR(120),
    urgency VARCHAR(40) NOT NULL DEFAULT 'normal',
    minimum_experience_years NUMERIC(5,2),
    required_credentials JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    language_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
    salary_or_rate_range VARCHAR(160),
    notes TEXT,
    status VARCHAR(60) NOT NULL DEFAULT 'draft',
    assigned_admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS facility_requisitions_facility_idx
    ON facility_requisitions(facility_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS facility_requisitions_status_idx
    ON facility_requisitions(status, urgency, updated_at DESC);
CREATE INDEX IF NOT EXISTS facility_requisitions_profession_location_idx
    ON facility_requisitions(profession_required, county, status);
CREATE INDEX IF NOT EXISTS facility_requisitions_admin_idx
    ON facility_requisitions(assigned_admin_id, status);

CREATE TABLE IF NOT EXISTS professional_placement_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    open_to_work BOOLEAN NOT NULL DEFAULT FALSE,
    availability_status VARCHAR(80) NOT NULL DEFAULT 'not_available',
    available_from DATE,
    preferred_counties JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_facility_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    employment_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    shift_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
    desired_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    minimum_rate_or_salary VARCHAR(120),
    relocation_willingness VARCHAR(80),
    remote_or_telehealth_interest BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    student_future_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS professional_preferences_open_idx
    ON professional_placement_preferences(open_to_work, availability_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS candidate_matches (
    id BIGSERIAL PRIMARY KEY,
    requisition_id BIGINT NOT NULL REFERENCES facility_requisitions(id) ON DELETE CASCADE,
    candidate_publication_id BIGINT REFERENCES candidate_publications(id) ON DELETE SET NULL,
    professional_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES milestone1_applications(id) ON DELETE SET NULL,
    match_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    match_band VARCHAR(40) NOT NULL DEFAULT 'ineligible',
    status VARCHAR(60) NOT NULL DEFAULT 'generated',
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    eligibility_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (requisition_id, professional_user_id)
);

CREATE INDEX IF NOT EXISTS candidate_matches_requisition_idx
    ON candidate_matches(requisition_id, match_band, match_score DESC);
CREATE INDEX IF NOT EXISTS candidate_matches_candidate_idx
    ON candidate_matches(professional_user_id, status);

CREATE TABLE IF NOT EXISTS ai_assistance_logs (
    id BIGSERIAL PRIMARY KEY,
    context_type VARCHAR(80) NOT NULL,
    context_id BIGINT NOT NULL,
    requested_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    provider VARCHAR(80) NOT NULL DEFAULT 'local_null',
    model VARCHAR(120),
    prompt_redacted JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_redacted JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(60) NOT NULL DEFAULT 'draft_generated',
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_assistance_context_idx
    ON ai_assistance_logs(context_type, context_id, created_at DESC);

CREATE TABLE IF NOT EXISTS placement_shortlists (
    id BIGSERIAL PRIMARY KEY,
    requisition_id BIGINT NOT NULL REFERENCES facility_requisitions(id) ON DELETE CASCADE,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    title VARCHAR(190) NOT NULL,
    summary TEXT,
    status VARCHAR(60) NOT NULL DEFAULT 'draft',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    shared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS placement_shortlists_requisition_idx
    ON placement_shortlists(requisition_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS placement_shortlists_facility_idx
    ON placement_shortlists(facility_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS placement_shortlist_candidates (
    id BIGSERIAL PRIMARY KEY,
    shortlist_id BIGINT NOT NULL REFERENCES placement_shortlists(id) ON DELETE CASCADE,
    candidate_match_id BIGINT REFERENCES candidate_matches(id) ON DELETE SET NULL,
    candidate_publication_id BIGINT REFERENCES candidate_publications(id) ON DELETE SET NULL,
    professional_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank_order INTEGER NOT NULL DEFAULT 1,
    admin_rationale TEXT,
    ai_draft_rationale TEXT,
    facility_visible_summary TEXT,
    status VARCHAR(60) NOT NULL DEFAULT 'included',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shortlist_id, professional_user_id)
);

CREATE INDEX IF NOT EXISTS placement_shortlist_candidates_shortlist_idx
    ON placement_shortlist_candidates(shortlist_id, rank_order);

CREATE TABLE IF NOT EXISTS placements (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    requisition_id BIGINT REFERENCES facility_requisitions(id) ON DELETE SET NULL,
    professional_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_publication_id BIGINT REFERENCES candidate_publications(id) ON DELETE SET NULL,
    shortlist_candidate_id BIGINT REFERENCES placement_shortlist_candidates(id) ON DELETE SET NULL,
    status VARCHAR(80) NOT NULL DEFAULT 'proposed',
    start_date DATE,
    end_date DATE,
    employment_type VARCHAR(60),
    facility_note TEXT,
    admin_note TEXT,
    professional_note TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS placements_facility_idx
    ON placements(facility_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS placements_professional_idx
    ON placements(professional_user_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS placement_events (
    id BIGSERIAL PRIMARY KEY,
    placement_id BIGINT NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    from_status VARCHAR(80),
    to_status VARCHAR(80),
    note TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS placement_events_placement_idx
    ON placement_events(placement_id, created_at DESC);

CREATE TABLE IF NOT EXISTS communication_threads (
    id BIGSERIAL PRIMARY KEY,
    context_type VARCHAR(80) NOT NULL,
    context_id BIGINT NOT NULL,
    facility_id BIGINT REFERENCES facilities(id) ON DELETE CASCADE,
    professional_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'open',
    subject VARCHAR(190) NOT NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS communication_threads_context_idx
    ON communication_threads(context_type, context_id, status);
CREATE INDEX IF NOT EXISTS communication_threads_facility_idx
    ON communication_threads(facility_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS communication_threads_professional_idx
    ON communication_threads(professional_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS communication_messages (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
    sender_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    visibility VARCHAR(60) NOT NULL DEFAULT 'internal_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS communication_messages_thread_idx
    ON communication_messages(thread_id, created_at ASC);

CREATE TABLE IF NOT EXISTS facility_interview_requests (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    requisition_id BIGINT REFERENCES facility_requisitions(id) ON DELETE SET NULL,
    candidate_publication_id BIGINT REFERENCES candidate_publications(id) ON DELETE SET NULL,
    placement_id BIGINT REFERENCES placements(id) ON DELETE SET NULL,
    preferred_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    mode VARCHAR(80) NOT NULL DEFAULT 'remote',
    notes TEXT,
    status VARCHAR(60) NOT NULL DEFAULT 'requested',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS facility_interview_requests_facility_idx
    ON facility_interview_requests(facility_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS professional_availability_blocks (
    id BIGSERIAL PRIMARY KEY,
    professional_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    availability_type VARCHAR(60) NOT NULL DEFAULT 'interview_available',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS professional_availability_blocks_user_idx
    ON professional_availability_blocks(professional_user_id, starts_at);

CREATE TABLE IF NOT EXISTS facility_preferred_interview_windows (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    requisition_id BIGINT REFERENCES facility_requisitions(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    mode VARCHAR(80) NOT NULL DEFAULT 'remote',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS facility_preferred_windows_facility_idx
    ON facility_preferred_interview_windows(facility_id, starts_at);

CREATE TABLE IF NOT EXISTS facility_invitations (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    email VARCHAR(190) NOT NULL,
    role VARCHAR(80) NOT NULL DEFAULT 'viewer',
    invited_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    status VARCHAR(60) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS facility_invitations_facility_idx
    ON facility_invitations(facility_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS facility_invitations_email_idx
    ON facility_invitations(email, status);

CREATE TABLE IF NOT EXISTS integration_connections (
    id BIGSERIAL PRIMARY KEY,
    owner_type VARCHAR(80) NOT NULL,
    owner_id BIGINT,
    provider_type VARCHAR(100) NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'planned',
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    token_storage_reference TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS integration_connections_owner_idx
    ON integration_connections(owner_type, owner_id, provider_type);

INSERT INTO notification_templates (template_key, channel, subject, body, variables)
VALUES
    ('facility_requisition_submitted', 'email', 'Afyalink staffing requisition received', 'Your staffing requisition has been submitted to Afyalink operations.', '["requisition_title","profession_required"]'::jsonb),
    ('facility_requisition_under_review', 'email', 'Afyalink requisition under review', 'Afyalink has started reviewing your staffing requisition.', '["requisition_title","status"]'::jsonb),
    ('shortlist_shared', 'email', 'Afyalink shortlist shared', 'A reviewed Afyalink shortlist is available in your facility portal.', '["shortlist_title","requisition_title"]'::jsonb),
    ('facility_interview_requested', 'email', 'Afyalink interview request received', 'Your facility interview request has been received for admin coordination.', '["requisition_title","mode"]'::jsonb),
    ('professional_opportunity_available', 'email', 'Afyalink opportunity available', 'A facility opportunity has been made available in your professional portal.', '["placement_id","employment_type"]'::jsonb),
    ('professional_opportunity_status_changed', 'email', 'Afyalink opportunity status updated', 'An Afyalink placement opportunity status has changed.', '["placement_id","status"]'::jsonb),
    ('placement_offer_made', 'email', 'Afyalink placement offer update', 'A placement offer has been recorded for review.', '["placement_id","status"]'::jsonb),
    ('placement_decision_recorded', 'email', 'Afyalink placement decision recorded', 'A placement decision has been recorded.', '["placement_id","status"]'::jsonb),
    ('facility_team_invitation', 'email', 'You were invited to an Afyalink facility team', 'A facility administrator invited you to collaborate in Afyalink.', '["facility_id","role","expires_at"]'::jsonb),
    ('matching_run_completed', 'email', 'Afyalink matching run completed', 'A matching run has completed for a staffing requisition.', '["requisition_id","generated_count"]'::jsonb)
ON CONFLICT (template_key) DO UPDATE
SET subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = NOW();
