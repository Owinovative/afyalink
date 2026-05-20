-- Afyalink pre-licensure student / graduate awaiting-license track.
-- Target database: PostgreSQL.

ALTER TABLE milestone1_profiles
    ADD COLUMN IF NOT EXISTS applicant_track VARCHAR(60) NOT NULL DEFAULT 'licensed_professional',
    ADD COLUMN IF NOT EXISTS student_status VARCHAR(80),
    ADD COLUMN IF NOT EXISTS institution_name VARCHAR(190),
    ADD COLUMN IF NOT EXISTS programme_or_course VARCHAR(190),
    ADD COLUMN IF NOT EXISTS graduation_or_completion_date DATE,
    ADD COLUMN IF NOT EXISTS expected_regulatory_body VARCHAR(160),
    ADD COLUMN IF NOT EXISTS target_profession VARCHAR(120),
    ADD COLUMN IF NOT EXISTS prelicensure_note TEXT,
    ADD COLUMN IF NOT EXISTS conversion_review_status VARCHAR(80) NOT NULL DEFAULT 'not_applicable',
    ADD COLUMN IF NOT EXISTS license_uploaded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS converted_to_licensed_at TIMESTAMPTZ;

ALTER TABLE milestone1_profiles
    ALTER COLUMN regulatory_body DROP NOT NULL,
    ALTER COLUMN license_number DROP NOT NULL;

ALTER TABLE milestone1_profiles
    DROP CONSTRAINT IF EXISTS milestone1_profiles_regulatory_body_license_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS milestone1_profiles_licensed_unique_idx
    ON milestone1_profiles(regulatory_body, license_number)
    WHERE applicant_track = 'licensed_professional'
      AND regulatory_body IS NOT NULL
      AND license_number IS NOT NULL
      AND license_number <> '';

CREATE INDEX IF NOT EXISTS milestone1_profiles_applicant_track_idx
    ON milestone1_profiles(applicant_track, conversion_review_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS milestone1_profiles_student_search_idx
    ON milestone1_profiles(target_profession, county, expected_regulatory_body);

