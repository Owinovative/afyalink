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
    eyebrow: "Pathway",
    title: "Apply. Verify. Place.",
    description: "One controlled path from intake to placement.",
    primaryCta: { label: "Apply now", href: "/auth/register/professional" },
    secondaryCta: { label: "Facility access", href: "/auth/register/facility" },
    highlights: [
      { title: "Apply", body: "Start from the right route." },
      { title: "Verify", body: "Credentials stay private." },
      { title: "Place", body: "Only eligible profiles move forward." },
    ],
    sections: [
      {
        title: "Clear next steps.",
        body: "Each role sees the next safe action.",
        points: ["Profile", "Credentials", "Review", "Access"],
      },
      {
        title: "Controlled visibility.",
        body: "Facility access starts after approval.",
        points: ["Onboard", "Approve", "Activate", "View"],
      },
    ],
  },
  matching: {
    slug: "matching",
    eyebrow: "Matching",
    title: "Matches explained before sharing.",
    description: "Reviewed shortlists, not blind candidate dumps.",
    primaryCta: { label: "Open requisitions", href: "/portal/facility/requisitions" },
    secondaryCta: { label: "Set availability", href: "/portal/professional/placement-preferences" },
    highlights: [
      { title: "Need", body: "Role and location first." },
      { title: "Fit", body: "Eligibility before ranking." },
      { title: "Review", body: "Humans approve sharing." },
    ],
    sections: [
      {
        title: "Demand comes first.",
        body: "Requisitions shape every match.",
        points: ["Role", "County", "Urgency", "Start date"],
      },
      {
        title: "No silent rejection.",
        body: "Reasons stay visible to operators.",
        points: ["Score", "Reason", "Risk", "Review"],
      },
    ],
  },
  professionals: {
    slug: "professionals",
    eyebrow: "Professionals",
    title: "Get verified. Become match-ready.",
    description: "Build a private record and become opportunity-ready.",
    primaryCta: { label: "Start application", href: "/auth/register/professional" },
    secondaryCta: { label: "Sign in", href: "/auth/login" },
    highlights: [
      { title: "Profile", body: "Keep details current." },
      { title: "Credentials", body: "Upload privately." },
      { title: "Opportunities", body: "Set availability." },
    ],
    sections: [
      {
        title: "Submit when ready.",
        body: "The portal shows what is missing.",
        points: ["Email", "Profile", "Consent", "Payment", "Credentials"],
      },
      {
        title: "Track your status.",
        body: "See review, interview, and publication state.",
        points: ["Verification", "Interview", "Qualification", "Publication"],
      },
    ],
  },
  students: {
    slug: "students",
    eyebrow: "Students",
    title: "Start before your license.",
    description: "Prepare early. Publication waits for license conversion.",
    primaryCta: { label: "Register early", href: "/auth/register/student" },
    secondaryCta: { label: "Licensed path", href: "/professionals" },
    highlights: [
      { title: "Start", body: "No license number needed." },
      { title: "Upload", body: "Add early records." },
      { title: "Wait", body: "Not facility-publishable." },
    ],
    sections: [
      {
        title: "Complete now.",
        body: "Build your pre-licensure profile.",
        points: ["Status", "School", "Programme", "Location"],
      },
      {
        title: "Unlock later.",
        body: "License evidence starts conversion.",
        points: ["License", "Review", "Application", "Publication"],
      },
    ],
  },
  facilities: {
    slug: "facilities",
    eyebrow: "Facilities",
    title: "Hire through approved access.",
    description: "Request reviewed candidates and place with confidence.",
    primaryCta: { label: "Join facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Access model", href: "/pricing-access" },
    highlights: [
      { title: "Approved", body: "Onboarding comes first." },
      { title: "Gated", body: "Access must be active." },
      { title: "Curated", body: "Shortlists are reviewed." },
    ],
    sections: [
      {
        title: "Browse responsibly.",
        body: "Only eligible candidates appear.",
        points: ["Verified profiles", "Read-only views", "Watermarks", "Audit"],
      },
      {
        title: "Request support.",
        body: "Use recommendations and appointments.",
        points: ["Requisitions", "Shortlists", "Packages", "Placements"],
      },
    ],
  },
  "trust-security": {
    slug: "trust-security",
    eyebrow: "Trust",
    title: "Private records. Audited access.",
    description: "Protected credentials. Controlled views. Clear audit trails.",
    primaryCta: { label: "Verification", href: "/verification" },
    secondaryCta: { label: "Contact", href: "/contact" },
    highlights: [
      { title: "Private", body: "No public document links." },
      { title: "Controlled", body: "Roles gate every view." },
      { title: "Audited", body: "Sensitive actions leave trails." },
    ],
    sections: [
      {
        title: "Access stays bounded.",
        body: "Facilities see safe summaries only.",
        points: ["Roles", "Consent", "Watermark", "Redaction"],
      },
      {
        title: "Views stay accountable.",
        body: "Watermarks and audit trails deter misuse.",
        points: ["Viewer", "Time", "Facility", "Purpose"],
      },
    ],
  },
  verification: {
    slug: "verification",
    eyebrow: "Verification",
    title: "Review before publication.",
    description: "Credentials, checks, and interviews stay traceable.",
    primaryCta: { label: "Apply now", href: "/auth/register/professional" },
    secondaryCta: { label: "How it works", href: "/how-it-works" },
    highlights: [
      { title: "Credentials", body: "Reviewed with history." },
      { title: "Regulator", body: "Cases stay traceable." },
      { title: "Interview", body: "Scored before publication." },
    ],
    sections: [
      {
        title: "Status stays clear.",
        body: "Applicants see the right next step.",
        points: ["Submit", "Verify", "Interview", "Qualify"],
      },
      {
        title: "Candidates see enough.",
        body: "Internal notes stay hidden.",
        points: ["Progress", "Schedule", "Outcome", "Visibility"],
      },
    ],
  },
  "pricing-access": {
    slug: "pricing-access",
    eyebrow: "Access",
    title: "Simple approved access.",
    description: "Facility access is confirmed directly during rollout.",
    primaryCta: { label: "Join facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Talk to us", href: "/contact" },
    highlights: [
      { title: "Professionals", body: "Application readiness flow." },
      { title: "Facilities", body: "Approved access only." },
      { title: "Recommendations", body: "Curated support on request." },
    ],
    sections: [
      {
        title: "Built for rollout.",
        body: "Manual payment review remains available.",
        points: ["Reference", "Review", "Activate", "Renew"],
      },
      {
        title: "Access is accountable.",
        body: "Entitlements can pause or expire.",
        points: ["Active", "Suspended", "Expired", "Cancelled"],
      },
    ],
  },
  about: {
    slug: "about",
    eyebrow: "About",
    title: "Built for safer staffing.",
    description: "A trust layer for healthcare review, sharing, and placement.",
    primaryCta: { label: "How it works", href: "/how-it-works" },
    secondaryCta: { label: "Contact", href: "/contact" },
    highlights: [
      { title: "Not a job board", body: "A controlled trust layer." },
      { title: "State-driven", body: "Backend rules lead." },
      { title: "Human reviewed", body: "Final decisions stay accountable." },
    ],
    sections: [
      {
        title: "Three audiences.",
        body: "Each role gets a focused workspace.",
        points: ["Professionals", "Students", "Facilities", "Admins"],
      },
      {
        title: "Sensitive by design.",
        body: "Records stay private by default.",
        points: ["Credentials", "Payments", "Evidence", "Audit"],
      },
    ],
  },
  contact: {
    slug: "contact",
    eyebrow: "Contact",
    title: "Talk to Afyalink.",
    description: "For access, support, partnerships, and security questions.",
    primaryCta: { label: "Join facility", href: "/auth/register/facility" },
    secondaryCta: { label: "Apply now", href: "/auth/register/professional" },
    highlights: [
      { title: "Facilities", body: "Access and support." },
      { title: "Professionals", body: "Application help." },
      { title: "Security", body: "Privacy questions." },
    ],
    sections: [
      {
        title: "Choose a topic.",
        body: "Keep credentials inside portals.",
        points: ["Facility", "Professional", "Student", "Security"],
      },
      {
        title: "Keep records private.",
        body: "Private documents stay inside portals.",
        points: ["Uploads", "Consent", "Review", "Audit"],
      },
    ],
  },
  faq: {
    slug: "faq",
    eyebrow: "FAQ",
    title: "Short answers by role.",
    description: "Short answers for each Afyalink role.",
    primaryCta: { label: "Professional portal", href: "/portal/professional" },
    secondaryCta: { label: "Facility portal", href: "/portal/facility" },
    highlights: [
      { title: "Can I register before license?", body: "Yes. Use the student awaiting-license path." },
      { title: "Will facilities see students?", body: "No. Students are not published as licensed candidates." },
      { title: "What happens after license?", body: "Upload evidence and complete conversion review." },
      { title: "Can facilities see everyone?", body: "No. Only published candidates appear." },
      { title: "Can screenshots be blocked?", body: "No. Watermarks and audits create accountability." },
      { title: "Who owns workflow state?", body: "The backend remains authoritative." },
      { title: "Are payments automatic?", body: "Manual review remains available during rollout." },
    ],
    sections: [
      {
        title: "Professional questions",
        body: "Use your portal for readiness and status.",
        points: ["Email", "Credentials", "Application", "Publication"],
      },
      {
        title: "Facility questions",
        body: "Complete onboarding and activation before browsing candidates.",
        points: ["Review", "Access", "Catalogue", "Packages"],
      },
    ],
  },
};
