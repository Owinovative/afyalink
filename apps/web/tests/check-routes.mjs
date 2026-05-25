import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredRoutes = [
  "src/app/(marketing)/page.tsx",
  "src/app/(marketing)/how-it-works/page.tsx",
  "src/app/(marketing)/professionals/page.tsx",
  "src/app/(marketing)/students/page.tsx",
  "src/app/(marketing)/facilities/page.tsx",
  "src/app/(marketing)/trust-security/page.tsx",
  "src/app/(marketing)/verification/page.tsx",
  "src/app/(marketing)/pricing-access/page.tsx",
  "src/app/(marketing)/about/page.tsx",
  "src/app/(marketing)/contact/page.tsx",
  "src/app/(marketing)/faq/page.tsx",
  "src/app/auth/login/page.tsx",
  "src/app/auth/register/professional/page.tsx",
  "src/app/auth/register/student/page.tsx",
  "src/app/auth/register/facility/page.tsx",
  "src/app/auth/verify-email/page.tsx",
  "src/app/auth/forgot-password/page.tsx",
  "src/app/auth/reset-password/page.tsx",
  "src/app/portal/professional/dashboard/page.tsx",
  "src/app/portal/professional/profile/page.tsx",
  "src/app/portal/professional/credentials/page.tsx",
  "src/app/portal/professional/waiting-license/page.tsx",
  "src/app/portal/professional/consent-payment/page.tsx",
  "src/app/portal/professional/application/page.tsx",
  "src/app/portal/professional/verification/page.tsx",
  "src/app/portal/professional/interview/page.tsx",
  "src/app/portal/professional/publication/page.tsx",
  "src/app/portal/facility/dashboard/page.tsx",
  "src/app/portal/facility/onboarding/page.tsx",
  "src/app/portal/facility/access/page.tsx",
  "src/app/portal/facility/candidates/page.tsx",
  "src/app/portal/facility/candidates/[publicationId]/page.tsx",
  "src/app/portal/facility/appointments/page.tsx",
  "src/app/portal/facility/recommendations/page.tsx",
  "src/app/portal/facility/packages/page.tsx",
  "src/app/portal/admin/dashboard/page.tsx",
  "src/app/portal/admin/applications/page.tsx",
  "src/app/portal/admin/pre-licensure/page.tsx",
  "src/app/portal/admin/applications/[id]/page.tsx",
  "src/app/portal/admin/credentials/page.tsx",
  "src/app/portal/admin/payments/page.tsx",
  "src/app/portal/admin/verifications/page.tsx",
  "src/app/portal/admin/verifications/[id]/page.tsx",
  "src/app/portal/admin/interviews/page.tsx",
  "src/app/portal/admin/interviews/[id]/page.tsx",
  "src/app/portal/admin/facilities/page.tsx",
  "src/app/portal/admin/facilities/[id]/page.tsx",
  "src/app/portal/admin/publications/page.tsx",
  "src/app/portal/admin/subscriptions/page.tsx",
  "src/app/portal/admin/appointments/page.tsx",
  "src/app/portal/admin/recommendations/page.tsx",
  "src/app/portal/admin/reports/page.tsx",
  "src/app/portal/admin/notifications/page.tsx",
  "src/app/portal/admin/privacy/page.tsx",
  "src/app/portal/admin/audit/page.tsx",
];

const requiredFiles = [
  "src/components/layout/MarketingLayout.tsx",
  "src/components/layout/PortalLayout.tsx",
  "src/components/layout/BrandLockup.tsx",
  "src/components/marketing/VisualSystem.tsx",
  "src/components/auth/AuthForms.tsx",
  "src/components/professional/ProfessionalPages.tsx",
  "src/components/facility/FacilityPages.tsx",
  "src/components/admin/AdminPages.tsx",
  "src/lib/api/client.ts",
  "src/lib/auth/session.ts",
];

const requiredVisualAssets = [
  "public/images/hero/healthcare-trust-canvas.svg",
  "public/images/hero/healthcare-professional-reviewing-records.jpg",
  "public/images/professionals/professional-verification.svg",
  "public/images/professionals/clinical-professional-consultation.jpg",
  "public/images/students/waiting-license-track.svg",
  "public/images/students/nursing-student-training-lab.jpg",
  "public/images/facilities/facility-marketplace.svg",
  "public/images/facilities/hospital-facility-team.jpg",
  "public/images/verification/verification-operations.svg",
  "public/images/verification/admin-verification-desk.jpg",
  "public/images/security/secure-candidate-viewing.svg",
  "public/images/security/credential-security-review.jpg",
  "public/images/marketplace/candidate-marketplace.svg",
  "public/images/marketplace/facility-candidate-review.jpg",
  "public/images/recommendations/recommendation-package.svg",
  "public/images/trust/hospital-corridor-care-team.jpg",
  "public/images/contact/clinic-director-conversation.jpg",
  "public/images/backgrounds/clinical-grid.svg",
];

const missing = [...requiredRoutes, ...requiredFiles, ...requiredVisualAssets].filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error(`Missing routed platform files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (!packageJson.dependencies?.next || !packageJson.dependencies?.react || !packageJson.dependencies?.["react-dom"]) {
  console.error("Next.js dependencies are missing from apps/web/package.json.");
  process.exit(1);
}

const apiClient = readFileSync(join(root, "src/lib/api/client.ts"), "utf8");
if (!apiClient.includes("NEXT_PUBLIC_AFYA_API_BASE") || !apiClient.includes("Authorization")) {
  console.error("API client must use NEXT_PUBLIC_AFYA_API_BASE and bearer authorization.");
  process.exit(1);
}

const facilityClient = readFileSync(join(root, "src/components/facility/FacilityPages.tsx"), "utf8");
if (!facilityClient.includes("secure-profile") || !facilityClient.includes("data-watermark")) {
  console.error("Facility candidate detail must preserve secure profile watermark UI.");
  process.exit(1);
}

const globalCss = readFileSync(join(root, "src/app/globals.css"), "utf8");
for (const className of ["hero-shell", "feature-split", "image-panel", "proof-strip", "large-cta", "process-band", "auth-shell"]) {
  if (!globalCss.includes(className)) {
    console.error(`Premium visual system class .${className} is missing from globals.css.`);
    process.exit(1);
  }
}

const visualSystem = readFileSync(join(root, "src/components/marketing/VisualSystem.tsx"), "utf8");
if (!visualSystem.includes("next/image") || !visualSystem.includes("CompactMetricStrip")) {
  console.error("Marketing visual system must use next/image and expose compact metric compositions.");
  process.exit(1);
}

const runtimeSources = [
  "src/components/layout/MarketingNav.tsx",
  "src/components/layout/PublicFooter.tsx",
  "src/components/layout/PortalLayout.tsx",
].map((file) => readFileSync(join(root, file), "utf8")).join("\n");
if (runtimeSources.includes("afyalink-logo.png")) {
  console.error("Runtime header/footer must not load the oversized full logo PNG.");
  process.exit(1);
}

const rasterAssets = requiredVisualAssets.filter((file) => /\.(jpg|jpeg|png)$/i.test(file));
const oversized = rasterAssets
  .map((file) => ({ file, size: statSync(join(root, file)).size }))
  .filter(({ file, size }) => !file.includes("/brand/") && size > 250 * 1024);
if (oversized.length > 0) {
  console.error(`Photo assets exceed the 250 KB page-image budget:\n${oversized.map(({ file, size }) => `- ${file}: ${Math.round(size / 1024)} KB`).join("\n")}`);
  process.exit(1);
}

const legacyFiles = ["index.html", "src/app.js", "src/styles.css", "scripts/build-render.mjs"];
const presentLegacy = legacyFiles.filter((file) => existsSync(join(root, file)));
if (presentLegacy.length > 0) {
  console.error(`Legacy static files should not remain in the routed Next app:\n${presentLegacy.join("\n")}`);
  process.exit(1);
}

console.log(`Afyalink routed platform check passed (${requiredRoutes.length} routes verified).`);
