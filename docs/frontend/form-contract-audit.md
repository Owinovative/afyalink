# Afyalink Frontend Form Contract Audit

This audit maps the frontend forms in this correction PR to the current PHP API contracts. The goal is to stop frontend create/profile flows from failing because required backend fields are missing or payload names do not match.

## Professional registration

- Backend endpoint: `POST /api/auth/register`
- Backend required fields: `name`, `email`, `phone`, `password`
- Backend validation notes: email must be valid and unique; phone must be unique; password must be at least 10 characters and include letters and numbers.
- Current frontend fields: `name`, `phone`, `email`, `password`
- Missing frontend fields: no backend-required registration field was missing.
- Validation mismatches: password length/strength was not surfaced through native frontend validation.
- Payload mismatch: no required payload mismatch. This endpoint does not create the licensed profile.
- Fix implemented: professional registration keeps the account contract and adds native password validation plus an explicit `applicant_track=licensed_professional` marker for frontend flow clarity. Licensed profile requirements are enforced in the profile form.

## Professional profile completion

- Backend endpoint: `PUT /api/professional/profile`
- Backend required fields for licensed professionals: `name`, `phone`, `profession`, `regulatory_body`, `license_number`, `county`
- Backend optional fields used by the service: `years_experience`, `availability`, `preferred_counties`, `placement_type`, `work_preferences`
- Current frontend fields: `name`, `phone`, `profession`, `regulatory_body`, `license_number`, `county`, `years_experience`, `availability`, `preferred_counties`, `placement_type`
- Missing frontend fields: `applicant_track=licensed_professional` was not explicitly posted for licensed profiles; `work_preferences` was not exposed.
- Validation mismatches: years of experience allowed empty/non-minimum values.
- Payload mismatch: backend defaulted the licensed track, but the frontend did not make the track explicit.
- Fix implemented: licensed profile form now posts `applicant_track=licensed_professional`, validates years of experience, and exposes `work_preferences`.

## Student registration

- Backend endpoint: `POST /api/auth/register/student`
- Backend required fields: `name`, `email`, `phone`, `password`, `student_status`, `target_profession`, `institution_name`, `programme_or_course`, `county`
- Backend optional fields: `expected_regulatory_body`, `graduation_or_completion_date`, `notes`, `availability_after_licensure`, `placement_type`
- Current frontend fields: `name`, `phone`, `student_status`, `target_profession`, `institution_name`, `programme_or_course`, `graduation_or_completion_date`, `expected_regulatory_body`, `county`, `availability_after_licensure`, `email`, `password`
- Missing frontend fields: `placement_type`, `notes`, and explicit `applicant_track=student_awaiting_license` marker were missing.
- Validation mismatches: password length/strength was not surfaced through native frontend validation.
- Payload mismatch: no required backend payload mismatch. The endpoint assigns `student_awaiting_license` server-side.
- Fix implemented: student registration adds `placement_type`, `notes`, native password validation, and a visible pre-licensure status note. It does not ask for a license number.

## Student pre-licensure profile

- Backend endpoint: `PUT /api/professional/profile`
- Backend required fields when `applicant_track=student_awaiting_license`: `name`, `phone`, `student_status`, `target_profession`, `institution_name`, `programme_or_course`, `county`
- Backend optional fields: `license_number`, `regulatory_body`, `expected_regulatory_body`, `graduation_or_completion_date`, `notes`, `availability_after_licensure`, `preferred_counties`, `placement_type`
- Current frontend fields: `name`, `phone`, `student_status`, `target_profession`, `institution_name`, `programme_or_course`, `graduation_or_completion_date`, `expected_regulatory_body`, `county`, `license_number`, `regulatory_body`, `availability_after_licensure`
- Missing frontend fields: `notes`, `preferred_counties`, `placement_type`
- Validation mismatches: none for required fields.
- Payload mismatch: `applicant_track=student_awaiting_license` was already posted for student profiles.
- Fix implemented: student profile form adds `notes`, `preferred_counties`, and `placement_type` while keeping license fields optional and clearly post-license.

## Facility registration

- Backend endpoint: `POST /api/facility/auth/register`
- Backend account required fields: `name`, `email`, `phone`, `password`
- Backend facility required fields immediately created after account registration: `legal_name`, `display_name`, `facility_type`, `county`, `email`, `phone`, `contact_person`
- Backend optional fields: `registration_number`, `location`, `physical_address`
- Current frontend fields: `name`, `phone`, `email`, `password`
- Missing frontend fields: `legal_name`, `display_name`, `facility_type`, `county`, `contact_person`, `registration_number`, `location`, `physical_address`
- Validation mismatches: password length/strength was not surfaced through native frontend validation.
- Payload mismatch: registration posted only owner fields, but the backend also creates the facility profile from the same payload.
- Fix implemented: facility registration now collects the owner account fields plus the required facility organization fields in the same payload.

## Facility onboarding/profile

- Backend endpoint: `PUT /api/facility/profile`
- Backend required fields: `legal_name`, `display_name`, `facility_type`, `county`, `email`, `phone`, `contact_person`
- Backend optional fields: `registration_number`, `location`, `physical_address`
- Current frontend fields: `legal_name`, `display_name`, `facility_type`, `registration_number`, `county`, `location`, `email`, `phone`, `contact_person`, `physical_address`
- Missing frontend fields: none.
- Validation mismatches: no required field mismatch found.
- Payload mismatch: none.
- Fix implemented: existing onboarding contract was kept and documented.

## Facility requisition creation

- Backend endpoint: `POST /api/facility/requisitions`
- Backend required fields: `title`, `profession_required`, `employment_type`, `county`
- Backend optional fields: `specialty_required`, `facility_department`, `number_of_positions`, `facility_site`, `required_start_date`, `end_date`, `shift_pattern`, `urgency`, `minimum_experience_years`, `required_credentials`, `preferred_skills`, `language_preferences`, `salary_or_rate_range`, `notes`
- Current frontend fields: `title`, `profession_required`, `specialty_required`, `facility_department`, `employment_type`, `number_of_positions`, `county`, `facility_site`, `required_start_date`, `minimum_experience_years`, `urgency`, `shift_pattern`, `preferred_skills`, `notes`
- Missing frontend fields: `end_date`, `required_credentials`, `language_preferences`, `salary_or_rate_range`
- Validation mismatches: no required field mismatch found.
- Payload mismatch: optional backend fields were unavailable in the frontend brief.
- Fix implemented: requisition creation now exposes the missing supported fields while preserving the required payload names.

## Placement preferences

- Backend endpoint: `PUT /api/professional/placement/preferences`
- Backend required fields: none
- Backend optional fields: `open_to_work`, `availability_status`, `available_from`, `preferred_counties`, `preferred_facility_types`, `employment_types`, `shift_preferences`, `desired_roles`, `minimum_rate_or_salary`, `relocation_willingness`, `remote_or_telehealth_interest`, `notes`, `available_after_license`, `internship_or_attachment_interest`
- Current frontend fields: `open_to_work`, `availability_status`, `available_from`, `preferred_counties`, `employment_types`, `shift_preferences`, `desired_roles`, `minimum_rate_or_salary`, `relocation_willingness`, `notes`
- Missing frontend fields: `preferred_facility_types`, `remote_or_telehealth_interest`, `available_after_license`, `internship_or_attachment_interest`
- Validation mismatches: none for required fields.
- Payload mismatch: optional backend fields were unavailable.
- Fix implemented: preference form now exposes the missing backend-supported optional fields.
