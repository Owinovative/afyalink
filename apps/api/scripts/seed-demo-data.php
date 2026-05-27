<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthService;
use Afyalink\Core\Application\Auth\PasswordHasher;
use Afyalink\Core\Domain\Enums\ApplicantTrack;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\CandidatePublicationStatus;
use Afyalink\Core\Domain\Enums\FacilityAccessStatus;
use Afyalink\Core\Domain\Enums\FacilityReviewStatus;
use Afyalink\Core\Domain\Enums\InterviewRecommendation;
use Afyalink\Core\Domain\Enums\PaymentStatus;
use Afyalink\Core\Domain\Enums\StudentStatus;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Domain\Enums\VerificationStatus;
use Afyalink\Core\Infrastructure\AppFactory;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Config\EnvLoader;
use Afyalink\Core\Infrastructure\Persistence\DataStore;

$root = dirname(__DIR__);
$config = AppConfig::fromEnv(EnvLoader::load(dirname($root, 2) . '/.env'), $root);
if (in_array(strtolower($config->environment), ['production', 'prod'], true)) {
    fwrite(STDERR, "Refusing to seed demo data in production.\n");
    exit(1);
}

$store = AppFactory::dataStore($config);
$auth = new AuthService($store, new AuditLogger($store));
$hasher = new PasswordHasher();
$now = gmdate(DATE_ATOM);
$password = 'Password123!';

$users = [
    'admin' => ensureDemoUser($auth, $store, $hasher, 'Afyalink Demo Admin', 'admin@afyalinks.test', '0711776001', $password, [UserRole::Admin]),
    'professional' => ensureDemoUser($auth, $store, $hasher, 'Grace Demo Nurse', 'professional@afyalinks.test', '0711776002', $password, [UserRole::Professional]),
    'student' => ensureDemoUser($auth, $store, $hasher, 'Amina Demo Student', 'student@afyalinks.test', '0711776003', $password, [UserRole::Professional]),
    'facility' => ensureDemoUser($auth, $store, $hasher, 'Hardy Demo Facility Owner', 'facility@afyalinks.test', '0711776004', $password, [UserRole::FacilityAdmin]),
    'recruiter' => ensureDemoUser($auth, $store, $hasher, 'Hardy Demo Recruiter', 'recruiter@afyalinks.test', '0711776005', $password, [UserRole::FacilityViewer]),
];

$regulatoryBody = upsert($store, 'regulatory_bodies', static fn (array $row): bool => ($row['code'] ?? '') === 'NCK', [
    'code' => 'NCK',
    'name' => 'Nursing Council of Kenya',
    'profession_coverage' => ['Registered Nurse', 'Nurse'],
    'country' => 'Kenya',
    'region' => null,
    'active' => true,
    'default_verification_method' => 'manual_registry_check',
    'verification_instructions' => 'Demo marker only. Verify against the live registry during real operations.',
    'contact_reference' => null,
    'created_at' => $now,
    'updated_at' => $now,
]);

$professionalProfile = upsert($store, 'profiles', static fn (array $row): bool => (int) ($row['user_id'] ?? 0) === (int) $users['professional']['id'], [
    'user_id' => (int) $users['professional']['id'],
    'applicant_track' => ApplicantTrack::LicensedProfessional->value,
    'student_status' => null,
    'name' => (string) $users['professional']['name'],
    'email' => (string) $users['professional']['email'],
    'phone' => (string) $users['professional']['phone'],
    'profession' => 'Registered Nurse',
    'target_profession' => 'Registered Nurse',
    'regulatory_body' => 'Nursing Council of Kenya',
    'expected_regulatory_body' => 'Nursing Council of Kenya',
    'license_number' => 'NCK-DEMO-001',
    'county' => 'Nairobi',
    'years_experience' => 6,
    'institution_name' => null,
    'programme_or_course' => null,
    'graduation_or_completion_date' => null,
    'prelicensure_note' => null,
    'conversion_review_status' => 'not_applicable',
    'license_uploaded_at' => null,
    'converted_to_licensed_at' => null,
    'availability' => 'available_now',
    'work_preferences' => [
        'shift' => 'day',
        'facility_types' => ['Hospital', 'Clinic'],
        'employment_types' => ['full_time', 'locum'],
    ],
    'created_at' => $now,
    'updated_at' => $now,
]);

$studentProfile = upsert($store, 'profiles', static fn (array $row): bool => (int) ($row['user_id'] ?? 0) === (int) $users['student']['id'], [
    'user_id' => (int) $users['student']['id'],
    'applicant_track' => ApplicantTrack::StudentAwaitingLicense->value,
    'student_status' => StudentStatus::CompletedTrainingWaitingLicense->value,
    'name' => (string) $users['student']['name'],
    'email' => (string) $users['student']['email'],
    'phone' => (string) $users['student']['phone'],
    'profession' => 'Registered Nurse',
    'target_profession' => 'Registered Nurse',
    'regulatory_body' => '',
    'expected_regulatory_body' => 'Nursing Council of Kenya',
    'license_number' => '',
    'county' => 'Nairobi',
    'years_experience' => 0,
    'institution_name' => 'Afyalink Demo Training College',
    'programme_or_course' => 'Diploma in Nursing',
    'graduation_or_completion_date' => gmdate('Y-m-d', strtotime('-2 months')),
    'prelicensure_note' => 'Demo awaiting-license profile. Do not publish as licensed.',
    'conversion_review_status' => 'waiting_for_license',
    'license_uploaded_at' => null,
    'converted_to_licensed_at' => null,
    'availability' => 'after_license',
    'work_preferences' => [
        'availability_after_licensure' => 'within_30_days',
        'placement_type' => 'supervised_entry_role',
    ],
    'created_at' => $now,
    'updated_at' => $now,
]);

foreach ([
    ['user' => 'professional', 'type' => 'professional_license', 'name' => 'demo-professional-license.pdf', 'status' => 'approved'],
    ['user' => 'professional', 'type' => 'national_id', 'name' => 'demo-national-id.pdf', 'status' => 'approved'],
    ['user' => 'professional', 'type' => 'training_certificate', 'name' => 'demo-training-certificate.pdf', 'status' => 'approved'],
    ['user' => 'student', 'type' => 'student_transcript', 'name' => 'demo-student-transcript.pdf', 'status' => 'uploaded'],
    ['user' => 'student', 'type' => 'completion_letter', 'name' => 'demo-completion-letter.pdf', 'status' => 'uploaded'],
] as $credential) {
    $userId = (int) $users[$credential['user']]['id'];
    upsert($store, 'credentials', static fn (array $row): bool => (
        (int) ($row['user_id'] ?? 0) === $userId
        && ($row['document_type'] ?? '') === $credential['type']
        && empty($row['superseded_at'])
    ), [
        'user_id' => $userId,
        'document_type' => $credential['type'],
        'storage_key' => 'demo/not-real/' . $credential['name'],
        'checksum' => hash('sha256', 'afyalink-demo-' . $credential['name']),
        'mime_type' => 'application/pdf',
        'size_bytes' => 1024,
        'original_name' => $credential['name'],
        'review_status' => $credential['status'],
        'review_note' => 'Demo metadata only. No real sensitive file is attached.',
        'reviewed_by' => $credential['status'] === 'approved' ? (int) $users['admin']['id'] : null,
        'reviewed_at' => $credential['status'] === 'approved' ? $now : null,
        'superseded_at' => null,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

foreach (['professional', 'student'] as $key) {
    upsert($store, 'consents', static fn (array $row): bool => (
        (int) ($row['user_id'] ?? 0) === (int) $users[$key]['id']
        && ($row['type'] ?? '') === 'credential_verification'
        && ($row['version'] ?? '') === 'demo-v1'
    ), [
        'user_id' => (int) $users[$key]['id'],
        'type' => 'credential_verification',
        'version' => 'demo-v1',
        'text_hash' => hash('sha256', 'demo consent credential verification'),
        'accepted_at' => $now,
        'ip_address' => null,
        'user_agent' => 'afyalink-demo-seed',
        'created_at' => $now,
    ]);
}

$professionalApplication = upsert($store, 'applications', static fn (array $row): bool => ($row['application_number'] ?? '') === 'AFYA-DEMO-PRO-001', [
    'user_id' => (int) $users['professional']['id'],
    'application_number' => 'AFYA-DEMO-PRO-001',
    'status' => ApplicationStatus::Qualified->value,
    'submitted_at' => gmdate(DATE_ATOM, strtotime('-7 days')),
    'review_note' => 'Demo application qualified for facility publication.',
    'timeline' => [
        ['from' => null, 'to' => 'submitted', 'note' => 'Demo application submitted.', 'occurred_at' => gmdate(DATE_ATOM, strtotime('-7 days'))],
        ['from' => 'submitted', 'to' => 'qualified', 'note' => 'Demo verification and interview completed.', 'occurred_at' => $now],
    ],
    'created_at' => gmdate(DATE_ATOM, strtotime('-7 days')),
    'updated_at' => $now,
]);

$studentApplication = upsert($store, 'applications', static fn (array $row): bool => ($row['application_number'] ?? '') === 'AFYA-DEMO-STU-001', [
    'user_id' => (int) $users['student']['id'],
    'application_number' => 'AFYA-DEMO-STU-001',
    'status' => ApplicationStatus::Submitted->value,
    'submitted_at' => gmdate(DATE_ATOM, strtotime('-3 days')),
    'review_note' => 'Demo pre-licensure record. Await license before conversion.',
    'timeline' => [
        ['from' => null, 'to' => 'submitted', 'note' => 'Demo student awaiting-license record received.', 'occurred_at' => gmdate(DATE_ATOM, strtotime('-3 days'))],
    ],
    'created_at' => gmdate(DATE_ATOM, strtotime('-3 days')),
    'updated_at' => $now,
]);

$payment = upsert($store, 'payments', static fn (array $row): bool => ($row['intent_reference'] ?? '') === 'AFYA-DEMO-PRO-PAY-001', [
    'user_id' => (int) $users['professional']['id'],
    'intent_reference' => 'AFYA-DEMO-PRO-PAY-001',
    'amount_cents' => 150000,
    'currency' => 'KES',
    'method' => 'manual_reference',
    'status' => PaymentStatus::Confirmed->value,
    'idempotency_key' => 'demo-professional-application-fee',
    'external_reference' => 'DEMO-MANUAL-001',
    'review_note' => 'Demo manual payment confirmation for staging QA.',
    'reviewed_by' => (int) $users['admin']['id'],
    'reviewed_at' => $now,
    'payer_user_id' => (int) $users['professional']['id'],
    'payer_type' => 'professional',
    'entity_type' => 'professional_application_fee',
    'entity_id' => (int) $professionalApplication['id'],
    'provider' => 'manual',
    'provider_reference' => 'DEMO-MPESA-RECEIPT-001',
    'checkout_request_id' => 'ws_CO_DEMO_PRO_001',
    'merchant_request_id' => 'demo-merchant-pro-001',
    'phone_number' => '254711776392',
    'callback_payload_redacted' => ['demo' => true],
    'failure_reason' => null,
    'paid_at' => $now,
    'expires_at' => null,
    'created_at' => gmdate(DATE_ATOM, strtotime('-7 days')),
    'updated_at' => $now,
]);

$verification = upsert($store, 'verification_cases', static fn (array $row): bool => (
    (int) ($row['application_id'] ?? 0) === (int) $professionalApplication['id']
    && ($row['regulatory_body_code'] ?? '') === 'NCK'
), [
    'application_id' => (int) $professionalApplication['id'],
    'user_id' => (int) $users['professional']['id'],
    'regulatory_body_id' => (int) $regulatoryBody['id'],
    'regulatory_body_code' => 'NCK',
    'regulatory_body_name' => 'Nursing Council of Kenya',
    'license_number' => (string) $professionalProfile['license_number'],
    'verification_method' => 'manual_registry_check',
    'reviewer_id' => (int) $users['admin']['id'],
    'status' => VerificationStatus::Verified->value,
    'evidence_reference' => 'DEMO-NCK-CHECK',
    'evidence_notes' => 'Demo evidence marker only. No live registry lookup was performed.',
    'final_decision_notes' => 'Demo profile is launch-QA eligible.',
    'timeline' => [
        ['from' => null, 'to' => 'pending', 'note' => 'Demo verification opened.', 'actor_id' => (int) $users['admin']['id'], 'occurred_at' => gmdate(DATE_ATOM, strtotime('-6 days'))],
        ['from' => 'pending', 'to' => 'verified', 'note' => 'Demo verification marked verified.', 'actor_id' => (int) $users['admin']['id'], 'occurred_at' => $now],
    ],
    'decided_at' => $now,
    'created_at' => gmdate(DATE_ATOM, strtotime('-6 days')),
    'updated_at' => $now,
]);

$interview = upsert($store, 'interviews', static fn (array $row): bool => (int) ($row['application_id'] ?? 0) === (int) $professionalApplication['id'], [
    'application_id' => (int) $professionalApplication['id'],
    'user_id' => (int) $users['professional']['id'],
    'interviewer_id' => (int) $users['admin']['id'],
    'scheduled_start_at' => gmdate(DATE_ATOM, strtotime('-5 days 10:00')),
    'scheduled_end_at' => gmdate(DATE_ATOM, strtotime('-5 days 10:45')),
    'mode' => 'remote',
    'location' => null,
    'status' => 'completed',
    'notes' => 'Demo interview completed for launch QA.',
    'recommendation' => InterviewRecommendation::Recommend->value,
    'total_score' => 22,
    'average_score' => 4.4,
    'timeline' => [
        ['from' => null, 'to' => 'scheduled', 'note' => 'Demo interview scheduled.', 'actor_id' => (int) $users['admin']['id'], 'occurred_at' => gmdate(DATE_ATOM, strtotime('-6 days'))],
        ['from' => 'scheduled', 'to' => 'completed', 'note' => 'Demo interview completed.', 'actor_id' => (int) $users['admin']['id'], 'occurred_at' => gmdate(DATE_ATOM, strtotime('-5 days'))],
    ],
    'completed_at' => gmdate(DATE_ATOM, strtotime('-5 days')),
    'created_at' => gmdate(DATE_ATOM, strtotime('-6 days')),
    'updated_at' => $now,
]);

foreach (['professional_knowledge' => 5, 'communication' => 4, 'ethical_judgment' => 4, 'practical_readiness' => 5, 'role_fit' => 4] as $category => $score) {
    upsert($store, 'interview_score_items', static fn (array $row): bool => (
        (int) ($row['interview_id'] ?? 0) === (int) $interview['id']
        && ($row['category'] ?? '') === $category
    ), [
        'interview_id' => (int) $interview['id'],
        'category' => $category,
        'score' => $score,
        'max_score' => 5,
        'weight' => 1,
        'comment' => 'Demo score item.',
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

$publication = upsert($store, 'candidate_publications', static fn (array $row): bool => (int) ($row['application_id'] ?? 0) === (int) $professionalApplication['id'], [
    'application_id' => (int) $professionalApplication['id'],
    'professional_user_id' => (int) $users['professional']['id'],
    'status' => CandidatePublicationStatus::Published->value,
    'summary_snapshot' => [
        'candidate_code' => 'AFYA-DEMO-GRACE',
        'name' => 'Grace Demo Nurse',
        'profession' => 'Registered Nurse',
        'county' => 'Nairobi',
        'years_experience' => 6,
        'availability' => 'available_now',
        'verification_status' => 'verified',
        'qualification_status' => 'qualified',
        'recommendation' => 'recommend',
    ],
    'private_admin_notes' => ['demo_record' => true],
    'published_by' => (int) $users['admin']['id'],
    'published_at' => $now,
    'unpublished_by' => null,
    'unpublished_at' => null,
    'created_at' => gmdate(DATE_ATOM, strtotime('-4 days')),
    'updated_at' => $now,
]);

$facility = upsert($store, 'facilities', static fn (array $row): bool => ($row['registration_number'] ?? '') === 'AFYA-DEMO-FAC-001', [
    'legal_name' => 'Hardy Care Demo Clinic Limited',
    'display_name' => 'Hardy Care Demo Clinic',
    'facility_type' => 'Clinic',
    'registration_number' => 'AFYA-DEMO-FAC-001',
    'county' => 'Nairobi',
    'location' => 'Hardy, Karen',
    'email' => (string) $users['facility']['email'],
    'phone' => (string) $users['facility']['phone'],
    'physical_address' => 'Hardy, Karen',
    'contact_person' => (string) $users['facility']['name'],
    'operational_status' => 'active',
    'review_status' => FacilityReviewStatus::Approved->value,
    'created_by' => (int) $users['facility']['id'],
    'reviewed_by' => (int) $users['admin']['id'],
    'review_note' => 'Demo facility approved for launch QA.',
    'submitted_at' => gmdate(DATE_ATOM, strtotime('-6 days')),
    'reviewed_at' => gmdate(DATE_ATOM, strtotime('-5 days')),
    'created_at' => gmdate(DATE_ATOM, strtotime('-6 days')),
    'updated_at' => $now,
]);

foreach ([['facility', UserRole::FacilityAdmin], ['recruiter', UserRole::FacilityViewer]] as [$key, $role]) {
    upsert($store, 'facility_memberships', static fn (array $row): bool => (
        (int) ($row['facility_id'] ?? 0) === (int) $facility['id']
        && (int) ($row['user_id'] ?? 0) === (int) $users[$key]['id']
    ), [
        'facility_id' => (int) $facility['id'],
        'user_id' => (int) $users[$key]['id'],
        'role' => $role->value,
        'status' => 'active',
        'invited_by' => $key === 'recruiter' ? (int) $users['facility']['id'] : null,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

upsert($store, 'facility_access_subscriptions', static fn (array $row): bool => ($row['payment_reference'] ?? '') === 'AFYA-DEMO-FAC-ACCESS-001', [
    'facility_id' => (int) $facility['id'],
    'plan_code' => 'facility_marketplace',
    'status' => FacilityAccessStatus::Active->value,
    'payment_reference' => 'AFYA-DEMO-FAC-ACCESS-001',
    'idempotency_key' => 'demo-facility-access',
    'amount_cents' => 500000,
    'currency' => 'KES',
    'method' => 'manual_reference',
    'provider' => 'manual',
    'provider_reference' => 'DEMO-FAC-RECEIPT-001',
    'checkout_request_id' => 'ws_CO_DEMO_FAC_001',
    'merchant_request_id' => 'demo-merchant-fac-001',
    'phone_number' => '254711776394',
    'paid_at' => $now,
    'external_reference' => null,
    'starts_at' => gmdate(DATE_ATOM, strtotime('-5 days')),
    'ends_at' => gmdate(DATE_ATOM, strtotime('+85 days')),
    'admin_override' => false,
    'note' => 'Demo active facility access.',
    'created_by' => (int) $users['facility']['id'],
    'reviewed_by' => (int) $users['admin']['id'],
    'reviewed_at' => $now,
    'created_at' => gmdate(DATE_ATOM, strtotime('-5 days')),
    'updated_at' => $now,
]);

$requisition = upsert($store, 'facility_requisitions', static fn (array $row): bool => (
    (int) ($row['facility_id'] ?? 0) === (int) $facility['id']
    && ($row['title'] ?? '') === 'Demo RN ward cover'
), [
    'facility_id' => (int) $facility['id'],
    'created_by_user_id' => (int) $users['facility']['id'],
    'title' => 'Demo RN ward cover',
    'profession_required' => 'Registered Nurse',
    'specialty_required' => 'General Nursing',
    'facility_department' => 'Medical Ward',
    'employment_type' => 'full_time',
    'number_of_positions' => 2,
    'county' => 'Nairobi',
    'facility_site' => 'Hardy, Karen',
    'required_start_date' => gmdate('Y-m-d', strtotime('+14 days')),
    'end_date' => null,
    'shift_pattern' => 'Day shift',
    'urgency' => 'high',
    'minimum_experience_years' => 3,
    'required_credentials' => ['professional_license', 'national_id'],
    'preferred_skills' => ['ward_rounds', 'patient_monitoring', 'documentation'],
    'language_preferences' => ['English', 'Swahili'],
    'salary_or_rate_range' => 'Staging demo only',
    'notes' => 'Demo requisition for launch QA.',
    'status' => 'shortlist_ready',
    'assigned_admin_id' => (int) $users['admin']['id'],
    'submitted_at' => gmdate(DATE_ATOM, strtotime('-2 days')),
    'closed_at' => null,
    'created_at' => gmdate(DATE_ATOM, strtotime('-2 days')),
    'updated_at' => $now,
]);

foreach (['professional' => true, 'student' => false] as $key => $openToWork) {
    upsert($store, 'professional_placement_preferences', static fn (array $row): bool => (int) ($row['user_id'] ?? 0) === (int) $users[$key]['id'], [
        'user_id' => (int) $users[$key]['id'],
        'open_to_work' => $openToWork,
        'availability_status' => $openToWork ? 'available_now' : 'student_waiting_license',
        'available_from' => $openToWork ? gmdate('Y-m-d', strtotime('+7 days')) : null,
        'preferred_counties' => ['Nairobi'],
        'preferred_facility_types' => ['Clinic', 'Hospital'],
        'employment_types' => ['full_time', 'locum'],
        'shift_preferences' => ['day'],
        'desired_roles' => ['Registered Nurse'],
        'minimum_rate_or_salary' => null,
        'relocation_willingness' => 'within_county',
        'remote_or_telehealth_interest' => false,
        'notes' => $openToWork ? 'Demo open-to-work preference.' : 'Demo future preference only.',
        'student_future_preferences' => $openToWork ? [] : ['target_profession' => 'Registered Nurse'],
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

$match = upsert($store, 'candidate_matches', static fn (array $row): bool => (
    (int) ($row['requisition_id'] ?? 0) === (int) $requisition['id']
    && (int) ($row['professional_user_id'] ?? 0) === (int) $users['professional']['id']
), [
    'requisition_id' => (int) $requisition['id'],
    'candidate_publication_id' => (int) $publication['id'],
    'professional_user_id' => (int) $users['professional']['id'],
    'application_id' => (int) $professionalApplication['id'],
    'match_score' => 88.5,
    'match_band' => 'strong',
    'status' => 'reviewed',
    'score_breakdown' => ['profession_match' => 25, 'county_fit' => 20, 'experience' => 20, 'availability' => 15, 'credentials' => 8.5],
    'eligibility_reasons' => ['licensed professional track', 'published by admin', 'facility access active'],
    'risk_flags' => [],
    'generated_by' => (int) $users['admin']['id'],
    'reviewed_by' => (int) $users['admin']['id'],
    'reviewed_at' => $now,
    'created_at' => $now,
    'updated_at' => $now,
]);

$shortlist = upsert($store, 'placement_shortlists', static fn (array $row): bool => (
    (int) ($row['requisition_id'] ?? 0) === (int) $requisition['id']
    && ($row['title'] ?? '') === 'Demo reviewed shortlist'
), [
    'requisition_id' => (int) $requisition['id'],
    'facility_id' => (int) $facility['id'],
    'title' => 'Demo reviewed shortlist',
    'summary' => 'One verified candidate reviewed for fit.',
    'status' => 'shared',
    'created_by' => (int) $users['admin']['id'],
    'reviewed_by' => (int) $users['admin']['id'],
    'shared_at' => $now,
    'created_at' => $now,
    'updated_at' => $now,
]);

$shortlistCandidate = upsert($store, 'placement_shortlist_candidates', static fn (array $row): bool => (
    (int) ($row['shortlist_id'] ?? 0) === (int) $shortlist['id']
    && (int) ($row['professional_user_id'] ?? 0) === (int) $users['professional']['id']
), [
    'shortlist_id' => (int) $shortlist['id'],
    'candidate_match_id' => (int) $match['id'],
    'candidate_publication_id' => (int) $publication['id'],
    'professional_user_id' => (int) $users['professional']['id'],
    'rank_order' => 1,
    'admin_rationale' => 'Verified license, relevant ward experience, and Nairobi availability.',
    'ai_draft_rationale' => 'Draft rationale retained for review only.',
    'facility_visible_summary' => 'Verified RN with ward experience and current availability.',
    'status' => 'included',
    'created_at' => $now,
    'updated_at' => $now,
]);

$placement = upsert($store, 'placements', static fn (array $row): bool => (
    (int) ($row['facility_id'] ?? 0) === (int) $facility['id']
    && (int) ($row['requisition_id'] ?? 0) === (int) $requisition['id']
    && (int) ($row['professional_user_id'] ?? 0) === (int) $users['professional']['id']
), [
    'facility_id' => (int) $facility['id'],
    'requisition_id' => (int) $requisition['id'],
    'professional_user_id' => (int) $users['professional']['id'],
    'candidate_publication_id' => (int) $publication['id'],
    'shortlist_candidate_id' => (int) $shortlistCandidate['id'],
    'status' => 'professional_contacted',
    'start_date' => gmdate('Y-m-d', strtotime('+21 days')),
    'end_date' => null,
    'employment_type' => 'full_time',
    'facility_note' => 'Demo facility interest recorded.',
    'admin_note' => 'Demo placement in progress for launch QA.',
    'professional_note' => null,
    'created_by' => (int) $users['admin']['id'],
    'assigned_admin_id' => (int) $users['admin']['id'],
    'created_at' => $now,
    'updated_at' => $now,
]);

upsert($store, 'placement_events', static fn (array $row): bool => (
    (int) ($row['placement_id'] ?? 0) === (int) $placement['id']
    && ($row['event_type'] ?? '') === 'demo.seeded'
), [
    'placement_id' => (int) $placement['id'],
    'actor_user_id' => (int) $users['admin']['id'],
    'event_type' => 'demo.seeded',
    'from_status' => null,
    'to_status' => 'professional_contacted',
    'note' => 'Demo placement timeline created.',
    'metadata' => ['seed' => 'production-launch-readiness'],
    'created_at' => $now,
]);

upsert($store, 'payment_provider_events', static fn (array $row): bool => ($row['dedupe_key'] ?? '') === hash('sha256', 'demo-mpesa-event'), [
    'provider' => 'mpesa',
    'payment_id' => (int) $payment['id'],
    'facility_subscription_id' => null,
    'checkout_request_id' => 'ws_CO_DEMO_PRO_001',
    'merchant_request_id' => 'demo-merchant-pro-001',
    'provider_reference' => 'DEMO-MPESA-RECEIPT-001',
    'account_reference' => 'AFYA-DEMO-PRO-PAY-001',
    'result_code' => 0,
    'result_description' => 'Demo callback event. Not a production payment.',
    'status' => 'processed',
    'dedupe_key' => hash('sha256', 'demo-mpesa-event'),
    'payload_redacted' => ['demo' => true, 'phone' => '254****392'],
    'received_at' => $now,
    'processed_at' => $now,
]);

upsert($store, 'privacy_requests', static fn (array $row): bool => ($row['subject_email'] ?? '') === 'privacy-demo@afyalinks.test', [
    'requester_user_id' => (int) $users['professional']['id'],
    'request_type' => 'access',
    'status' => 'under_review',
    'subject_name' => 'Grace Demo Nurse',
    'subject_email' => 'privacy-demo@afyalinks.test',
    'description' => 'Demo privacy request for launch cockpit QA.',
    'admin_note' => 'Demo request under review.',
    'reviewed_by' => (int) $users['admin']['id'],
    'reviewed_at' => $now,
    'created_at' => $now,
    'updated_at' => $now,
]);

foreach ([
    ['recipient' => 'professional', 'type' => 'email_verification', 'subject' => 'Verify your Afyalink email address', 'status' => 'sent', 'attempt_count' => 1],
    ['recipient' => 'facility', 'type' => 'shortlist_shared', 'subject' => 'Afyalink shortlist shared', 'status' => 'queued', 'attempt_count' => 0],
    ['recipient' => 'admin', 'type' => 'matching_run_completed', 'subject' => 'Afyalink matching run completed', 'status' => 'retry_scheduled', 'attempt_count' => 1],
] as $notice) {
    upsert($store, 'notification_outbox', static fn (array $row): bool => (
        ($row['type'] ?? '') === $notice['type']
        && ($row['recipient_email'] ?? '') === $users[$notice['recipient']]['email']
    ), [
        'recipient_user_id' => (int) $users[$notice['recipient']]['id'],
        'recipient_email' => (string) $users[$notice['recipient']]['email'],
        'channel' => 'email',
        'type' => $notice['type'],
        'subject' => $notice['subject'],
        'body' => 'Demo notification generated by the launch readiness seed.',
        'action_url' => null,
        'status' => $notice['status'],
        'metadata' => ['demo' => true],
        'attempt_count' => $notice['attempt_count'],
        'next_attempt_at' => $notice['status'] === 'retry_scheduled' ? gmdate(DATE_ATOM, strtotime('+5 minutes')) : null,
        'last_error' => $notice['status'] === 'retry_scheduled' ? 'Demo retry state.' : null,
        'created_at' => $now,
        'sent_at' => $notice['status'] === 'sent' ? $now : null,
        'updated_at' => $now,
    ]);
}

upsert($store, 'audit_logs', static fn (array $row): bool => ($row['action'] ?? '') === 'demo.seeded', [
    'actor_id' => (int) $users['admin']['id'],
    'action' => 'demo.seeded',
    'entity_type' => 'DemoDataset',
    'entity_id' => 'production-launch-readiness',
    'metadata' => ['users' => array_keys($users), 'safe_for' => ['local', 'staging']],
    'ip_address' => null,
    'user_agent' => 'afyalink-demo-seed',
    'created_at' => $now,
]);

fwrite(STDOUT, "Afyalink demo seed complete.\n");
fwrite(STDOUT, "Environment: {$config->environment}\n");
fwrite(STDOUT, "Demo users use Password123! and @afyalinks.test emails.\n");
foreach ($users as $key => $user) {
    fwrite(STDOUT, "- {$key}: {$user['email']}\n");
}

/**
 * @param list<UserRole> $roles
 * @return array<string, mixed>
 */
function ensureDemoUser(AuthService $auth, DataStore $store, PasswordHasher $hasher, string $name, string $email, string $phone, string $password, array $roles): array
{
    $user = $auth->createUser($name, $email, $phone, $password, $roles);

    return $store->update('users', (int) $user['id'], [
        'name' => $name,
        'phone' => $phone,
        'password_hash' => $hasher->hash($password),
        'roles' => array_map(static fn (UserRole $role): string => $role->value, $roles),
        'is_active' => true,
        'email_verified_at' => gmdate(DATE_ATOM),
        'updated_at' => gmdate(DATE_ATOM),
    ]);
}

/**
 * @param callable(array<string, mixed>): bool $predicate
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function upsert(DataStore $store, string $table, callable $predicate, array $row): array
{
    $existing = $store->first($table, $predicate);
    if ($existing === null) {
        return $store->insert($table, $row);
    }

    $changes = $row;
    unset($changes['created_at']);

    return $store->update($table, (int) $existing['id'], $changes);
}
