# Student Awaiting License Experience

Afyalink now supports students and recent healthcare graduates who are waiting for professional license registration.

## Product Intent

The track lets Afyalink build an early relationship with future healthcare professionals without misrepresenting their current licensing status.

Students can:

- register before receiving a professional license;
- complete a pre-licensure profile;
- provide institution, programme, student/graduate status, target profession, expected regulatory body, and county;
- upload preliminary documents;
- later add license details and professional license evidence.

Students cannot:

- submit the full licensed professional application;
- enter regulatory verification/interview/publication workflows;
- appear in the facility candidate marketplace;
- be described as verified or licensed professionals.

## Routes

- Public page: `/students`
- Registration: `/auth/register/student`
- Portal checklist: `/portal/professional/waiting-license`
- Admin queue: `/portal/admin/pre-licensure`

## Conversion

When a license is issued, the applicant updates license number and regulatory body fields and uploads `professional_license` evidence. Admins then review the pre-licensure queue and convert the profile to `licensed_professional` when the license evidence is present and not rejected.

After conversion, the normal professional application readiness rules apply.

