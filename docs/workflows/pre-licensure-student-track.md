# Pre-Licensure Student Track Workflow

## State Model

Profiles now include an `applicant_track`:

- `licensed_professional`
- `student_awaiting_license`

Student profiles also carry:

- `student_status`
- `institution_name`
- `programme_or_course`
- `graduation_or_completion_date`
- `expected_regulatory_body`
- `target_profession`
- `conversion_review_status`
- `license_uploaded_at`
- `converted_to_licensed_at`

## Credential Requirements

Licensed professionals keep the full professional bundle:

- CV
- National ID or passport
- Professional license
- Academic certificate

Waiting-license applicants use a preliminary bundle:

- CV
- National ID or passport
- Student ID or training proof
- Transcript or completion evidence

Professional license is not required for student registration. It becomes required for conversion.

## Backend Rules

- `POST /api/auth/register/student` creates a professional-role user with `applicant_track=student_awaiting_license`.
- Student dashboards return a `prelicensure` block with checklist and conversion readiness.
- `POST /api/professional/application/submit` rejects waiting-license applicants.
- Candidate publication rejects any non-licensed applicant track.
- Admin conversion requires license number, regulatory body, and a non-rejected `professional_license` credential.

## Admin Queue

Admins use `/portal/admin/pre-licensure` to review:

- student status;
- target profession;
- institution and programme;
- county and expected regulatory body;
- preliminary document completeness;
- license evidence readiness;
- conversion action.

Conversion is audited with `student_awaiting_license.converted`.

