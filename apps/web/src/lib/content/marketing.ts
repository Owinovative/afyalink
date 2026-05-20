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
    title: "A controlled path from credential intake to trusted placement.",
    description:
      "Afyalink separates professional onboarding, verification, interview assessment, publication, facility access, and recommendation workflows so every party sees only the right information at the right time.",
    primaryCta: { label: "Apply as a professional", href: "/auth/register/professional" },
    secondaryCta: { label: "Join as a facility", href: "/auth/register/facility" },
    highlights: [
      { title: "Professional intake", body: "Profiles, credentials, consent, and payment references are collected before submission." },
      { title: "Afyalink review", body: "Admins review records, coordinate verification, schedule interviews, and record outcomes." },
      { title: "Facility access", body: "Approved facilities with active access can browse published candidates and request recommendations." },
    ],
    sections: [
      {
        title: "Professionals stay guided",
        body: "Every stage is broken into a route with the next valid action visible.",
        points: ["Profile readiness", "Credential replacement visibility", "Verification and interview status", "Publication awareness"],
      },
      {
        title: "Facilities stay gated",
        body: "The marketplace is not a public directory. Facility access requires approval and an active entitlement.",
        points: ["Facility onboarding", "Admin review", "Subscription activation", "Watermarked candidate viewing"],
      },
    ],
  },
  professionals: {
    slug: "professionals",
    eyebrow: "Professional portal",
    title: "A guided verification journey for healthcare professionals.",
    description:
      "Professionals can register, verify email, complete a profile, upload credentials privately, accept consent, create a payment reference, submit an application, and track review progress.",
    primaryCta: { label: "Start application", href: "/auth/register/professional" },
    secondaryCta: { label: "Sign in", href: "/auth/login" },
    highlights: [
      { title: "Credential privacy", body: "Uploaded records are handled through private storage architecture and reviewed through controlled admin flows." },
      { title: "Workflow clarity", body: "Profile, credentials, consent, payment, application, verification, and interview states are separated." },
      { title: "Publication transparency", body: "Qualified professionals can see high-level catalogue visibility without exposing facility identities." },
    ],
    sections: [
      {
        title: "Application readiness",
        body: "The backend decides whether a professional is ready to submit. The frontend explains missing prerequisites instead of guessing.",
        points: ["Verified account", "Complete profile", "Current consent", "Payment reference", "Required credentials"],
      },
      {
        title: "Assessment journey",
        body: "Verification and interview outcomes remain visible without leaking internal admin notes.",
        points: ["Regulatory verification status", "Interview scheduling", "Qualification outcome", "Facility publication state"],
      },
    ],
  },
  facilities: {
    slug: "facilities",
    eyebrow: "Facility portal",
    title: "Controlled access to verified healthcare talent.",
    description:
      "Facilities onboard, wait for Afyalink approval, activate access, browse published candidates, view read-only watermarked profiles, and request appointments or curated recommendations.",
    primaryCta: { label: "Join as a facility", href: "/auth/register/facility" },
    secondaryCta: { label: "View access model", href: "/pricing-access" },
    highlights: [
      { title: "Approved organizations only", body: "Facility access starts with onboarding review and membership scoping." },
      { title: "Subscription-gated marketplace", body: "Candidate browsing requires both approved status and active access." },
      { title: "Recommendation workflows", body: "Facilities can request curated packages for role, county, urgency, and experience needs." },
    ],
    sections: [
      {
        title: "Candidate marketplace",
        body: "Facility users can search and filter published candidates while Afyalink keeps private documents and internal notes protected.",
        points: ["Published candidates only", "Read-only profiles", "Allowed credential metadata", "Watermark and audit trail"],
      },
      {
        title: "Commercial access",
        body: "The access model is built for staging-friendly manual confirmation and future M-PESA callbacks.",
        points: ["Pending payment", "Active access", "Suspension and expiry", "Admin override controls"],
      },
    ],
  },
  "trust-security": {
    slug: "trust-security",
    eyebrow: "Security posture",
    title: "Private credentials, permissioned views, and audit-first operations.",
    description:
      "Afyalink does not treat healthcare credentials as public assets. The platform uses private storage boundaries, backend authorization, watermarked views, and audit logs for sensitive actions.",
    primaryCta: { label: "Read verification model", href: "/verification" },
    secondaryCta: { label: "Contact Afyalink", href: "/contact" },
    highlights: [
      { title: "No public raw documents", body: "Facilities receive safe candidate information and approved metadata, not permanent public credential URLs." },
      { title: "Audited profile views", body: "Candidate detail access records facility, user, candidate, timestamp, IP, and user agent where available." },
      { title: "Watermark deterrence", body: "Screenshots cannot be made impossible; Afyalink uses deterrence, policy, auditability, and access control." },
    ],
    sections: [
      {
        title: "Sensitive data boundaries",
        body: "Admin evidence, payment internals, tokens, storage keys, and private notes stay out of facility and professional views.",
        points: ["Backend authorization", "Redacted audit metadata", "Viewer-bound access checks", "No direct storage key exposure"],
      },
      {
        title: "Operational accountability",
        body: "Review, publication, subscription, recommendation, appointment, and profile-view events feed the audit posture.",
        points: ["Admin actions", "Facility access changes", "Candidate publication changes", "Marketplace views"],
      },
    ],
  },
  verification: {
    slug: "verification",
    eyebrow: "Verification engine",
    title: "Credential review, regulatory cases, and interview outcomes in one workflow.",
    description:
      "Afyalink supports credential review, replacement requests, verification case management, interview scheduling, scoring, and qualification decisions before publication.",
    primaryCta: { label: "Apply now", href: "/auth/register/professional" },
    secondaryCta: { label: "How it works", href: "/how-it-works" },
    highlights: [
      { title: "Credential review", body: "Admins approve, reject, or request replacement documents with audit history." },
      { title: "Regulatory cases", body: "Verification cases track external body, status, assignment, and evidence without leaking private notes." },
      { title: "Interview scoring", body: "Structured scoring and qualification outcomes determine whether a candidate can become publishable." },
    ],
    sections: [
      {
        title: "Backend-owned eligibility",
        body: "The frontend never decides publication eligibility on its own.",
        points: ["Submitted application", "Passed verification", "Completed interview", "Recommended qualification", "Current consent"],
      },
      {
        title: "Professional visibility",
        body: "Professionals can track high-level review and publication status without seeing internal admin records.",
        points: ["Application progress", "Verification cases", "Interview schedule", "Catalogue visibility"],
      },
    ],
  },
  "pricing-access": {
    slug: "pricing-access",
    eyebrow: "Facility access",
    title: "Subscription-gated marketplace access for approved healthcare facilities.",
    description:
      "Afyalink's facility access layer supports payment references, active and suspended access states, expiry, and admin-managed staging confirmation.",
    primaryCta: { label: "Join as a facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Talk to Afyalink", href: "/contact" },
    highlights: [
      { title: "Approval first", body: "A facility must be approved before access can become useful." },
      { title: "Active entitlement", body: "Candidate browsing is denied until the facility has active access." },
      { title: "Admin controls", body: "Afyalink can activate, suspend, expire, or cancel access records with audit trails." },
    ],
    sections: [
      {
        title: "Designed for staged rollout",
        body: "The current implementation supports manual reference confirmation while keeping room for production payment callbacks.",
        points: ["Payment intent foundation", "Plan code", "Access window", "Subscription status"],
      },
      {
        title: "Commercial workflow",
        body: "Facilities can request recommendations and appointments once the relationship is established.",
        points: ["Recruitment needs", "Candidate references", "Curated packages", "Scheduled consultations"],
      },
    ],
  },
  about: {
    slug: "about",
    eyebrow: "Company",
    title: "Afyalink is the healthcare trust layer between professionals and facilities.",
    description:
      "The platform is built around regulated hiring realities: credential risk, privacy, auditability, and the need for qualified healthcare staffing pipelines.",
    primaryCta: { label: "Explore platform", href: "/how-it-works" },
    secondaryCta: { label: "Contact", href: "/contact" },
    highlights: [
      { title: "Trust infrastructure", body: "Afyalink is not a public job board. It is workflow infrastructure for verified healthcare placement." },
      { title: "Product discipline", body: "Backend state machines, audit logs, and controlled data exposure shape every workflow." },
      { title: "Marketplace readiness", body: "The facility catalogue is gated, curated, and designed for accountable professional visibility." },
    ],
    sections: [
      {
        title: "Who Afyalink serves",
        body: "Healthcare professionals, facilities, and internal review teams all get purpose-built workspaces.",
        points: ["Professional onboarding", "Facility marketplace", "Admin operations", "Regulatory verification support"],
      },
      {
        title: "What Afyalink protects",
        body: "The product keeps sensitive documents and internal decisions away from public or overbroad access.",
        points: ["Private credentials", "Internal evidence notes", "Payment metadata", "Audit-sensitive operations"],
      },
    ],
  },
  contact: {
    slug: "contact",
    eyebrow: "Contact",
    title: "Start a professional application, facility onboarding, or partnership conversation.",
    description:
      "Use the professional and facility portals for account workflows. For commercial, operational, or partnership questions, contact the Afyalink team.",
    primaryCta: { label: "Join as a facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Apply as a professional", href: "/auth/register/professional" },
    highlights: [
      { title: "Facilities", body: "Onboard, request access, browse candidates, and request recommendations." },
      { title: "Professionals", body: "Create an account and follow the guided verification workflow." },
      { title: "Admins", body: "Use the admin portal for reviews, verification, interviews, publication, and facility operations." },
    ],
    sections: [
      {
        title: "Portal entry points",
        body: "The fastest path is the routed portal that matches your role.",
        points: ["Professional registration", "Facility onboarding", "Admin sign-in", "Recommendation requests"],
      },
      {
        title: "Security note",
        body: "Do not send private credentials through public contact channels. Use the authenticated professional portal.",
        points: ["Private uploads", "Consent records", "Audit logs", "Controlled admin review"],
      },
    ],
  },
  faq: {
    slug: "faq",
    eyebrow: "FAQ",
    title: "Answers for professionals, facilities, and Afyalink operators.",
    description:
      "The platform separates public information from authenticated workflows so every role gets clear next steps without exposing sensitive records.",
    primaryCta: { label: "Open professional portal", href: "/portal/professional" },
    secondaryCta: { label: "Open facility portal", href: "/portal/facility" },
    highlights: [
      { title: "Can facilities see every professional?", body: "No. Only published candidates are visible, and access requires approval plus active entitlement." },
      { title: "Can screenshots be blocked?", body: "No system can make screenshots impossible. Afyalink uses watermarking, access control, warnings, and audit logs." },
      { title: "Who decides workflow state?", body: "The backend remains authoritative for application, verification, interview, subscription, and publication decisions." },
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
