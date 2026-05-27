import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = process.env.VISUAL_QA_BASE_URL ?? "http://127.0.0.1:3100";
const outDir = resolve(process.cwd(), "../../docs/frontend/visual-qa/workflow-auth-dashboard-correction");

const userByRole = {
  admin: { id: 1, name: "Afyalink Admin", email: "admin@afyalinks.test", phone: "0700000001", roles: ["admin"] },
  facility: { id: 2, name: "Facility Owner", email: "facility@afyalinks.test", phone: "0700000002", roles: ["facility_admin"] },
  professional: { id: 3, name: "Grace Nurse", email: "professional@afyalinks.test", phone: "0700000003", roles: ["professional"] },
};

const tokenKeyByRole = {
  admin: "afyalink.adminToken",
  facility: "afyalink.facilityToken",
  professional: "afyalink.professionalToken",
};

const screenshots = [];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  await capturePublic("/auth/login", "login-1440.png", { width: 1440, height: 1000 });
  await capturePublic("/portal/admin/dashboard", "admin-dashboard-sign-in-required-1440.png", { width: 1440, height: 1000 });
  await capturePublic("/portal/facility/dashboard", "facility-dashboard-sign-in-required-1440.png", { width: 1440, height: 1000 });
  await capturePublic("/portal/professional/dashboard", "professional-dashboard-sign-in-required-375.png", { width: 375, height: 900 });
  await capturePublic("/portal/facility/requisitions", "facility-requisitions-sign-in-required-1440.png", { width: 1440, height: 1000 });
  await captureWrongRole();
  await captureAdminDashboard();
  await captureAdminUsers();
  await captureProfessionalDashboard();
  await captureFacilityDashboard();
  await captureFacilityRequisitions();

  await writeFile(resolve(outDir, "visual-qa-report.json"), JSON.stringify({
    generated_at: new Date().toISOString(),
    base_url: baseURL,
    screenshots,
  }, null, 2));
} finally {
  await browser.close();
}

async function capturePublic(path, filename, viewport) {
  const page = await newPage(viewport);
  await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: resolve(outDir, filename), fullPage: true });
  screenshots.push({ path, filename, viewport });
  await page.close();
}

async function captureWrongRole() {
  const page = await newPage({ width: 1440, height: 1000 });
  await mockMe(page, "facility");
  await page.addInitScript(() => {
    window.localStorage.setItem("afyalink.adminToken", "facility-token-in-admin-slot");
  });
  await page.goto(`${baseURL}/portal/admin/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Wrong workspace." }).waitFor();
  await page.screenshot({ path: resolve(outDir, "admin-dashboard-wrong-role-facility-1440.png"), fullPage: true });
  screenshots.push({ path: "/portal/admin/dashboard", filename: "admin-dashboard-wrong-role-facility-1440.png", viewport: { width: 1440, height: 1000 } });
  await page.close();
}

async function captureAdminDashboard() {
  const page = await authedPage("admin", { width: 1440, height: 1000 });
  await page.route("**/api/admin/applications", route => json(route, {
    overview: { total: 19 },
    applications: [],
  }));
  await page.route("**/api/admin/facility-operations/overview", route => json(route, {
    facilities: { pending_approval: 4 },
    access: { active: 7 },
    publications: { published: 23 },
    engagements: { open_recommendation_requests: 5 },
  }));
  await page.route("**/api/admin/verifications", route => json(route, { overview: { total: 8 }, verification_cases: [] }));
  await page.route("**/api/admin/interviews", route => json(route, { overview: { total: 6 }, interviews: [] }));
  await page.route("**/api/admin/pre-licensure", route => json(route, { overview: { total: 3 }, students: [] }));
  await page.route("**/api/admin/operations/dashboard", route => json(route, {
    operations: {
      work_queues: {
        payment_reviews: 2,
        notification_failures: 1,
        requisitions_submitted: 6,
        shortlists_ready: 3,
        active_placements: 4,
        privacy_requests: 1,
      },
    },
  }));
  await page.goto(`${baseURL}/portal/admin/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByText("Launch operations at a glance.").waitFor();
  await page.screenshot({ path: resolve(outDir, "admin-dashboard-authorized-1440.png"), fullPage: true });
  screenshots.push({ path: "/portal/admin/dashboard", filename: "admin-dashboard-authorized-1440.png", viewport: { width: 1440, height: 1000 } });
  await page.close();
}

async function captureAdminUsers() {
  const page = await authedPage("admin", { width: 1440, height: 1000 });
  await page.route("**/api/admin/users", route => json(route, {
    users: [
      { id: 1, name: "Afyalink Admin", email: "admin@afyalinks.test", phone: "0700000001", roles: ["admin"], is_active: true, last_login_at: "2026-05-27T08:00:00+00:00" },
      { id: 2, name: "Operations Admin", email: "ops.admin@afyalinks.test", phone: "0700000002", roles: ["admin"], is_active: true, last_login_at: null },
    ],
  }));
  await page.goto(`${baseURL}/portal/admin/users`, { waitUntil: "domcontentloaded" });
  await page.getByText("Admin accounts").waitFor();
  await page.screenshot({ path: resolve(outDir, "admin-users-authorized-1440.png"), fullPage: true });
  screenshots.push({ path: "/portal/admin/users", filename: "admin-users-authorized-1440.png", viewport: { width: 1440, height: 1000 } });
  await page.close();
}

async function captureProfessionalDashboard() {
  const page = await authedPage("professional", { width: 1440, height: 1000 });
  await page.route("**/api/professional/dashboard", route => json(route, professionalDashboardData(false)));
  await page.goto(`${baseURL}/portal/professional/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByText("Status, credentials, review, publication.").waitFor();
  await page.screenshot({ path: resolve(outDir, "professional-dashboard-authorized-1440.png"), fullPage: true });
  screenshots.push({ path: "/portal/professional/dashboard", filename: "professional-dashboard-authorized-1440.png", viewport: { width: 1440, height: 1000 } });
  await page.close();

  const studentPage = await authedPage("professional", { width: 1440, height: 1000 });
  await studentPage.route("**/api/professional/dashboard", route => json(route, professionalDashboardData(true)));
  await studentPage.goto(`${baseURL}/portal/professional/waiting-license`, { waitUntil: "domcontentloaded" });
  await studentPage.getByText("License pending. Prepare safely.").waitFor();
  await studentPage.screenshot({ path: resolve(outDir, "student-waiting-license-authorized-1440.png"), fullPage: true });
  screenshots.push({ path: "/portal/professional/waiting-license", filename: "student-waiting-license-authorized-1440.png", viewport: { width: 1440, height: 1000 } });
  await studentPage.close();
}

async function captureFacilityDashboard() {
  const page = await authedPage("facility", { width: 1440, height: 1000 });
  await page.route("**/api/facility/dashboard", route => json(route, facilityDashboardData()));
  await page.goto(`${baseURL}/portal/facility/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByText("Access, needs, shortlists, placements.").waitFor();
  await page.screenshot({ path: resolve(outDir, "facility-dashboard-authorized-1440.png"), fullPage: true });
  screenshots.push({ path: "/portal/facility/dashboard", filename: "facility-dashboard-authorized-1440.png", viewport: { width: 1440, height: 1000 } });
  await page.close();
}

async function captureFacilityRequisitions() {
  const page = await authedPage("facility", { width: 1440, height: 1000 });
  await page.route("**/api/facility/dashboard", route => json(route, facilityDashboardData()));
  await page.route("**/api/facility/requisitions", route => json(route, {
    requisitions: [
      { id: 1, title: "Ward nurse cover", profession_required: "Registered Nurse", county: "Nairobi", employment_type: "locum", urgency: "high", status: "submitted" },
      { id: 2, title: "Clinical officer shift", profession_required: "Clinical Officer", county: "Kiambu", employment_type: "full_time", urgency: "normal", status: "shortlist_ready" },
    ],
  }));
  await page.goto(`${baseURL}/portal/facility/requisitions`, { waitUntil: "domcontentloaded" });
  await page.getByText("Staffing needs, reviewed clearly.").waitFor();
  await page.screenshot({ path: resolve(outDir, "facility-requisitions-authorized-1440.png"), fullPage: true });
  screenshots.push({ path: "/portal/facility/requisitions", filename: "facility-requisitions-authorized-1440.png", viewport: { width: 1440, height: 1000 } });
  await page.close();
}

async function authedPage(role, viewport) {
  const page = await newPage(viewport);
  await mockMe(page, role);
  await page.addInitScript(([key, token]) => {
    window.localStorage.setItem(key, token);
  }, [tokenKeyByRole[role], `${role}-visual-token`]);
  return page;
}

async function newPage(viewport) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(10_000);
  return page;
}

async function mockMe(page, role) {
  await page.route("**/api/me", route => json(route, { user: userByRole[role] }));
}

async function json(route, data) {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ ok: true, data }),
  });
}

function professionalDashboardData(student) {
  return {
    account: { email_verified: true, email: student ? "student@afyalinks.test" : "professional@afyalinks.test" },
    profile: student
      ? {
        id: 10,
        name: "Amina Student",
        applicant_track: "student_awaiting_license",
        target_profession: "Registered Nurse",
        student_status: "completed_training_waiting_license",
        institution_name: "Afya Training College",
        programme_or_course: "Diploma in Nursing",
        county: "Nairobi",
      }
      : {
        id: 9,
        name: "Grace Nurse",
        applicant_track: "licensed_professional",
        profession: "Registered Nurse",
        regulatory_body: "NCK",
        license_number: "NCK-DEMO",
        county: "Nairobi",
      },
    readiness: { ready: !student, missing: student ? ["track.licensed_professional_conversion_required"] : [], warnings: [] },
    credentials: [{ id: 1, document_type: "professional_license", review_status: "accepted" }],
    consent: { accepted_current: true },
    payments: [{ status: "confirmed" }],
    application: { status: student ? "waiting_for_license" : "qualified" },
    verification_cases: [],
    interviews: [],
    facility_visibility: { visible: !student, published: !student, publication_status: student ? "blocked_student_track" : "published", profile_view_count: 4 },
    prelicensure: student
      ? { active: true, student_status: "completed_training_waiting_license", conversion_review_status: "waiting_for_license", license_pending: true, can_request_conversion: false, required_documents: [] }
      : { active: false },
  };
}

function facilityDashboardData() {
  return {
    facility: {
      id: 1,
      display_name: "Hardy Care Clinic",
      legal_name: "Hardy Care Clinic Ltd",
      facility_type: "Clinic",
      county: "Nairobi",
      review_status: "approved",
      submitted_at: new Date().toISOString(),
    },
    membership: { role: "facility_admin" },
    access: {
      active: true,
      active_subscription: { status: "active", plan_code: "facility_marketplace", starts_at: "2026-05-01", ends_at: "2026-08-01", payment_reference: "AFYA-DEMO" },
    },
    requests: [{ id: 1, title: "Hiring support", status: "submitted" }],
    recommendation_requests: [],
    recommendation_packages: [{ id: 1, title: "Ward shortlist", status: "shared" }],
  };
}
