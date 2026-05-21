export type MarketingPageContent = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  highlights: Array<{ title: string; body: string }>;
  sections: Array<{ title: string; body: string; points: string[] }>;
};

export const marketingPages: Record<string, MarketingPageContent> = {
  "how-it-works": {
    slug: "how-it-works",
    eyebrow: "Operating model",
    title: "From intake to trusted placement, in controlled steps.",
    description:
      "Afyalink guides professionals, reviewers, and facilities through one secure verification and placement workflow.",
    primaryCta: { label: "Start professional path", href: "/auth/register/professional" },
    secondaryCta: { label: "Facility access", href: "/auth/register/facility" },
    highlights: [
      { title: "Intake", body: "Profile, credentials, consent, and payment reference." },
      { title: "Review", body: "Credential review, verification cases, and interviews." },
      { title: "Access", body: "Approved facilities see only published candidates." },
    ],
    sections: [
      {
        title: "Every role gets a clear next step.",
        body: "The portal shows what is complete, what is missing, and what the backend allows next.",
        points: ["Profile readiness", "Credential status", "Verification state", "Publication awareness"],
      },
      {
        title: "Facility access is gated.",
        body: "The marketplace is not a public directory. Approval and active access are required.",
        points: ["Onboarding", "Review", "Access activation", "Watermarked viewing"],
      },
    ],
  },
  professionals: {
    slug: "professionals",
    eyebrow: "Professional portal",
    title: "A clearer path for licensed healthcare professionals.",
    description:
      "Create your profile, upload credentials privately, submit when ready, and follow verification through to interview and publication status.",
    primaryCta: { label: "Start application", href: "/auth/register/professional" },
    secondaryCta: { label: "Sign in", href: "/auth/login" },
    highlights: [
      { title: "Private records", body: "Credential uploads stay inside controlled review flows." },
      { title: "Clear readiness", body: "The dashboard explains what is missing before submission." },
      { title: "Publication status", body: "See whether your profile is visible without exposing facility identities." },
    ],
    sections: [
      {
        title: "Submit only when ready.",
        body: "Afyalink checks account, profile, consent, payment reference, and credentials before submission.",
        points: ["Verified account", "Complete profile", "Current consent", "Payment reference", "Required credentials"],
      },
      {
        title: "Track assessment without noise.",
        body: "Verification and interview status remain visible without exposing internal admin notes.",
        points: ["Regulatory verification", "Interview scheduling", "Qualification outcome", "Catalogue state"],
      },
    ],
  },
  students: {
    slug: "students",
    eyebrow: "Students and graduates",
    title: "Waiting for your license? Start early with Afyalink.",
    description:
      "Students and recent graduates can build a pre-licensure profile now, then convert safely after license evidence is ready.",
    primaryCta: { label: "Register early", href: "/auth/register/student" },
    secondaryCta: { label: "Licensed path", href: "/professionals" },
    highlights: [
      { title: "Prepare now", body: "Add training details and preliminary documents." },
      { title: "Stay accurate", body: "You are not shown as licensed or facility-publishable." },
      { title: "Convert later", body: "Upload license evidence when issued, then enter the licensed workflow." },
    ],
    sections: [
      {
        title: "What you can complete now.",
        body: "Build your early profile without needing a professional license number.",
        points: ["Student or graduate status", "Institution and programme", "National ID or passport", "Training or completion evidence"],
      },
      {
        title: "What waits for licensure.",
        body: "Application submission, verification, interview, and publication stay locked until conversion.",
        points: ["License upload", "Admin review", "Application readiness", "Facility catalogue eligibility"],
      },
    ],
  },
  facilities: {
    slug: "facilities",
    eyebrow: "Facility portal",
    title: "Verified candidate access for approved facilities.",
    description:
      "Onboard your organization, activate access, review published candidates, and request curated recommendations.",
    primaryCta: { label: "Join as a facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Access model", href: "/pricing-access" },
    highlights: [
      { title: "Approved only", body: "Organizations are reviewed before marketplace access." },
      { title: "Access gated", body: "Browsing requires active facility entitlement." },
      { title: "Curated support", body: "Request candidate packages by role, location, and urgency." },
    ],
    sections: [
      {
        title: "Browse with confidence.",
        body: "Facility users can search published candidates without seeing private documents or internal notes.",
        points: ["Published candidates only", "Read-only profiles", "Approved metadata", "Watermark and audit trail"],
      },
      {
        title: "Access remains controlled.",
        body: "Subscription states support manual confirmation now and future payment automation later.",
        points: ["Pending payment", "Active access", "Suspension", "Expiry"],
      },
    ],
  },
  "trust-security": {
    slug: "trust-security",
    eyebrow: "Security posture",
    title: "Private credentials. Permissioned views. Full auditability.",
    description:
      "Afyalink keeps sensitive records behind private storage, backend authorization, watermarked views, and audit logs.",
    primaryCta: { label: "Verification model", href: "/verification" },
    secondaryCta: { label: "Contact Afyalink", href: "/contact" },
    highlights: [
      { title: "No public documents", body: "Facilities see safe summaries and approved metadata." },
      { title: "Audited views", body: "Candidate profile access records viewer, facility, and timestamp." },
      { title: "Watermark deterrence", body: "Screenshots cannot be impossible; access remains controlled and logged." },
    ],
    sections: [
      {
        title: "Sensitive data stays bounded.",
        body: "Admin evidence, payment internals, tokens, storage keys, and private notes stay out of facility views.",
        points: ["Backend authorization", "Redacted audit metadata", "Viewer-bound access checks", "No direct storage key exposure"],
      },
      {
        title: "Every sensitive action has a trail.",
        body: "Review, publication, access, recommendation, appointment, and profile-view events are logged.",
        points: ["Admin actions", "Access changes", "Publication changes", "Marketplace views"],
      },
    ],
  },
  verification: {
    slug: "verification",
    eyebrow: "Verification engine",
    title: "Credential review, verification, interview, and publication control.",
    description:
      "Afyalink keeps each assessment step explicit before any candidate can be published.",
    primaryCta: { label: "Apply now", href: "/auth/register/professional" },
    secondaryCta: { label: "How it works", href: "/how-it-works" },
    highlights: [
      { title: "Credential review", body: "Approve, reject, or request replacement with history." },
      { title: "Regulatory cases", body: "Track body, status, assignment, and evidence safely." },
      { title: "Interview scoring", body: "Structured outcomes determine publishability." },
    ],
    sections: [
      {
        title: "Eligibility belongs to the backend.",
        body: "The frontend renders status. It does not invent publication rules.",
        points: ["Submitted application", "Passed verification", "Completed interview", "Recommended qualification", "Current consent"],
      },
      {
        title: "Professionals see useful status.",
        body: "Applicants can track review and publication status without internal admin records.",
        points: ["Application progress", "Verification cases", "Interview schedule", "Catalogue visibility"],
      },
    ],
  },
  "pricing-access": {
    slug: "pricing-access",
    eyebrow: "Facility access",
    title: "Facility access without fake public pricing.",
    description:
      "Afyalink supports approved facility access, payment references, active or suspended status, and admin confirmation.",
    primaryCta: { label: "Join as a facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Talk to Afyalink", href: "/contact" },
    highlights: [
      { title: "Approval first", body: "Facility review comes before useful marketplace access." },
      { title: "Active entitlement", body: "Browsing is denied until access is active." },
      { title: "Admin controls", body: "Activate, suspend, expire, or cancel with audit trails." },
    ],
    sections: [
      {
        title: "Built for staged rollout.",
        body: "Manual reference confirmation works now; payment callbacks can be added later.",
        points: ["Payment intent foundation", "Plan code", "Access window", "Subscription status"],
      },
      {
        title: "Commercial workflow stays practical.",
        body: "Facilities can request recommendations and appointments when access is established.",
        points: ["Recruitment needs", "Candidate references", "Curated packages", "Scheduled consultations"],
      },
    ],
  },
  about: {
    slug: "about",
    eyebrow: "Company",
    title: "Healthcare hiring needs trust infrastructure.",
    description:
      "Afyalink helps professionals, facilities, and reviewers manage credential risk, privacy, and placement readiness.",
    primaryCta: { label: "Explore platform", href: "/how-it-works" },
    secondaryCta: { label: "Contact", href: "/contact" },
    highlights: [
      { title: "Not a public job board", body: "Afyalink is workflow infrastructure for verified placement." },
      { title: "State-driven product", body: "Backend rules, audit logs, and access boundaries shape each flow." },
      { title: "Curated marketplace", body: "Facility visibility is gated, reviewed, and accountable." },
    ],
    sections: [
      {
        title: "Built for three audiences.",
        body: "Professionals, facilities, and Afyalink operators each get a focused workspace.",
        points: ["Professional onboarding", "Facility marketplace", "Admin operations", "Regulatory verification support"],
      },
      {
        title: "Designed around sensitive records.",
        body: "Private documents and internal decisions stay away from public or overbroad access.",
        points: ["Private credentials", "Internal evidence notes", "Payment metadata", "Audit-sensitive operations"],
      },
    ],
  },
  contact: {
    slug: "contact",
    eyebrow: "Contact",
    title: "Start the right Afyalink conversation.",
    description:
      "Use secure portals for records. Use contact for facility access, commercial, operations, or partnership questions.",
    primaryCta: { label: "Join as a facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Apply as a professional", href: "/auth/register/professional" },
    highlights: [
      { title: "Facilities", body: "Onboard, activate access, and request support." },
      { title: "Professionals", body: "Create an account and follow verification readiness." },
      { title: "Operations", body: "Manage reviews, publication, access, and audit workflows." },
    ],
    sections: [
      {
        title: "Use the right entry point.",
        body: "The fastest path is the routed portal that matches your role.",
        points: ["Professional registration", "Facility onboarding", "Admin sign-in", "Recommendation requests"],
      },
      {
        title: "Keep credentials out of contact forms.",
        body: "Private records belong in the authenticated professional portal.",
        points: ["Private uploads", "Consent records", "Audit logs", "Controlled admin review"],
      },
    ],
  },
  faq: {
    slug: "faq",
    eyebrow: "FAQ",
    title: "Clear answers for each Afyalink role.",
    description:
      "Public pages explain the model. Portals handle records, permissions, and live workflow state.",
    primaryCta: { label: "Open professional portal", href: "/portal/professional" },
    secondaryCta: { label: "Open facility portal", href: "/portal/facility" },
    highlights: [
      { title: "Can I register before my license?", body: "Yes. Use the student awaiting-license path." },
      { title: "Will facilities see students?", body: "No. Waiting-license applicants are not published." },
      { title: "What happens after licensure?", body: "Upload license evidence and move through conversion review." },
      { title: "Can facilities see everyone?", body: "No. Only published candidates are visible to approved, active facilities." },
      { title: "Can screenshots be blocked?", body: "No. Afyalink uses watermarking, access control, warnings, and audit logs." },
      { title: "Who decides workflow state?", body: "The backend remains authoritative." },
    ],
    sections: [
      {
        title: "Professional questions",
        body: "Professionals should use their dashboard for readiness, credentials, consent, payment, verification, interview, and publication state.",
        points: ["Email verification", "Credential replacement", "Application submission", "Facility visibility"],
      },
      {
        title: "Facility questions",
        body: "Facilities must complete onboarding and access activation before browsing the candidate catalogue.",
        points: ["Review status", "Access status", "Marketplace browsing", "Recommendation packages"],
      },
    ],
  },
};
