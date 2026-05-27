import Link from "next/link";
import {
  CTASection,
  EditorialSplit,
  ImagePanel,
  PageIntro,
  PhotoBand,
  PhotoHero,
  ProcessSteps,
  SectionFrame,
  TrustPanel,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";
import { BreadcrumbStructuredData } from "@/components/seo/StructuredData";
import { publicContact } from "@/lib/contact";
import type { MarketingPageContent } from "@/lib/content/marketing";

const companionBySlug: Record<string, string> = {
  professionals: "verification",
  students: "professionals",
  facilities: "matching",
  matching: "facilities",
  "how-it-works": "trust-security",
  verification: "professionals",
  "trust-security": "verification",
  "pricing-access": "facilities",
  about: "contact",
  contact: "about",
  faq: "trust-security",
};

type PriorityPageConfig = {
  heroBody: string;
  secondaryVisual: string;
  stepsEyebrow: string;
  stepsTitle: string;
  steps: Array<{ title: string; body: string }>;
  visualTitle: string;
  visualBody: string;
  visualPoints: string[];
  proofTitle: string;
  proofItems: Array<{ title: string; body: string }>;
};

const priorityPages: Record<string, PriorityPageConfig> = {
  professionals: {
    heroBody: "Private profile. Verified records. Placement-ready status.",
    secondaryVisual: "verification",
    stepsEyebrow: "Path",
    stepsTitle: "Profile to opportunity.",
    steps: [
      { title: "Profile", body: "Core details" },
      { title: "Credentials", body: "Private uploads" },
      { title: "Verification", body: "Traceable checks" },
      { title: "Interview", body: "Reviewed outcome" },
      { title: "Opportunities", body: "Availability-led" },
    ],
    visualTitle: "Credential readiness.",
    visualBody: "See gaps before submission.",
    visualPoints: ["Email", "Profile", "Consent", "Payment", "Credentials"],
    proofTitle: "Built for serious professionals.",
    proofItems: [
      { title: "Private records", body: "Documents stay gated." },
      { title: "Clear status", body: "Know the next step." },
      { title: "Reviewed sharing", body: "Publication is controlled." },
      { title: "Placement ready", body: "Set availability." },
    ],
  },
  students: {
    heroBody: "Prepare early. Facilities see you only after conversion.",
    secondaryVisual: "professionals",
    stepsEyebrow: "Pre-license",
    stepsTitle: "Start now. Convert later.",
    steps: [
      { title: "Start", body: "No license needed" },
      { title: "Upload", body: "Early documents" },
      { title: "Track", body: "Readiness visible" },
      { title: "License", body: "Submit evidence" },
      { title: "Convert", body: "Review first" },
    ],
    visualTitle: "Waiting-license clarity.",
    visualBody: "Student status stays separate from licensed publication.",
    visualPoints: ["School", "Programme", "County", "License later"],
    proofTitle: "Warm, safe, honest.",
    proofItems: [
      { title: "Student track", body: "No false license status." },
      { title: "Early profile", body: "Prepare responsibly." },
      { title: "Conversion review", body: "License evidence required." },
      { title: "No premature visibility", body: "Facilities wait." },
    ],
  },
  facilities: {
    heroBody: "Create needs. Receive reviewed shortlists. Track placements.",
    secondaryVisual: "matching",
    stepsEyebrow: "Facility flow",
    stepsTitle: "Need to placement.",
    steps: [
      { title: "Onboard", body: "Facility review" },
      { title: "Access", body: "Approved browsing" },
      { title: "Request", body: "Structured need" },
      { title: "Shortlist", body: "Reviewed fit" },
      { title: "Place", body: "Tracked workflow" },
    ],
    visualTitle: "Secure candidate access.",
    visualBody: "Profiles stay watermarked and access-gated.",
    visualPoints: ["Approved facility", "Active access", "Watermarked views", "Audit"],
    proofTitle: "Executive staffing control.",
    proofItems: [
      { title: "Requisitions", body: "State the need." },
      { title: "Shortlists", body: "Reviewed before sharing." },
      { title: "Placements", body: "Track outcomes." },
      { title: "Team access", body: "Role scoped." },
    ],
  },
  "trust-security": {
    heroBody: "Consent-aware workflows, watermarked views, and audit trails.",
    secondaryVisual: "verification",
    stepsEyebrow: "Trust model",
    stepsTitle: "Controlled by design.",
    steps: [
      { title: "Private", body: "No public files" },
      { title: "Consent", body: "Applicant aware" },
      { title: "Roles", body: "Access scoped" },
      { title: "Watermark", body: "Views accountable" },
      { title: "Audit", body: "Actions traceable" },
    ],
    visualTitle: "Candidate viewing is controlled.",
    visualBody: "Facilities see approved summaries, not raw documents.",
    visualPoints: ["Redaction", "Watermarks", "Viewer trail", "Purpose"],
    proofTitle: "Security without clutter.",
    proofItems: [
      { title: "Documents", body: "Private by default." },
      { title: "Portals", body: "Role-gated access." },
      { title: "Shortlists", body: "Shared intentionally." },
      { title: "Privacy", body: "Requests tracked." },
    ],
  },
};

function pricingSection() {
  return (
    <SectionFrame tone="cream">
      <div className="wide-container pricing-panel">
        <VisualCard title="Professionals" body="Apply, verify, prepare." />
        <VisualCard title="Facilities" body="Approved access only." />
        <VisualCard title="Recommendations" body="Curated support on request." />
      </div>
    </SectionFrame>
  );
}

function contactSection() {
  return (
    <SectionFrame tone="cream">
      <div className="wide-container contact-grid">
        <PhotoBand
          visual={getVisualForSlug("contact")}
          eyebrow="Contact"
          title="Use the right channel."
          body="Keep private records inside portals."
        />
        <section className="form-card">
          <span className="eyebrow">Message</span>
          <h2>Send a focused note</h2>
          <div className="contact-addresses" aria-label="Afyalink inboxes">
            <span>{publicContact.location}</span>
            {publicContact.phoneHref ? <a href={publicContact.phoneHref}>{publicContact.phone}</a> : null}
            <a href={publicContact.siteUrl}>{publicContact.website}</a>
            {publicContact.email ? <a href={`mailto:${publicContact.email}`}>{publicContact.email}</a> : null}
            {publicContact.supportEmail ? <a href={`mailto:${publicContact.supportEmail}`}>{publicContact.supportEmail}</a> : null}
          </div>
          <form className="form-grid">
            <label>
              Name
              <input placeholder="Your name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="Email address" />
            </label>
            <label>
              Topic
              <select defaultValue="facility">
                <option value="facility">Facility access</option>
                <option value="professional">Professional application</option>
                <option value="student">Student awaiting license</option>
                <option value="security">Security or privacy</option>
              </select>
            </label>
            <label className="full">
              Message
              <textarea placeholder="How can Afyalink help?" />
            </label>
            <button className="button full" type="button">
              Prepare note
            </button>
          </form>
        </section>
      </div>
    </SectionFrame>
  );
}

function faqSection(page: MarketingPageContent) {
  const groups = [
    { title: "Professionals", items: page.highlights.slice(0, 2) },
    { title: "Students", items: page.highlights.slice(0, 3) },
    { title: "Facilities", items: page.highlights.slice(3, 5) },
    { title: "Security", items: page.highlights.slice(4, 7) },
  ];

  return (
    <SectionFrame tone="mist">
      <div className="wide-container">
        <PageIntro eyebrow="FAQ" title="Short answers by role." body="Public answers stay short. Portals hold live status." align="center" />
        <div className="faq-grid">
          {groups.map((group) => (
            <article className="visual-card faq-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="data-list">
                {group.items.map((item) => (
                  <div key={`${group.title}-${item.title}`}>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

function PriorityPublicPage({ page, config }: { page: MarketingPageContent; config: PriorityPageConfig }) {
  const visual = getVisualForSlug(page.slug);
  const secondary = getVisualForSlug(config.secondaryVisual);
  const path = `/${page.slug}`;
  const visualBackground = {
    backgroundImage: `linear-gradient(180deg, rgba(7, 31, 28, 0.08), rgba(7, 31, 28, 0.82)), url("${visual.src}")`,
  };
  const secondaryBackground = {
    backgroundImage: `linear-gradient(180deg, rgba(7, 31, 28, 0.08), rgba(7, 31, 28, 0.82)), url("${secondary.src}")`,
  };

  return (
    <>
      <BreadcrumbStructuredData path={path} name={page.eyebrow} />
      <PhotoHero
        eyebrow={page.eyebrow}
        title={page.title}
        body={config.heroBody}
        primary={visual}
        secondary={secondary}
        backgroundOnly
        actions={[
          ...(page.primaryCta ? [{ label: page.primaryCta.label, href: page.primaryCta.href }] : []),
          ...(page.secondaryCta ? [{ label: page.secondaryCta.label, href: page.secondaryCta.href, kind: "secondary" as const }] : []),
        ]}
      />

      <SectionFrame tone="white" className="priority-public-section">
        <div className="wide-container priority-background-surface priority-path-grid" style={secondaryBackground} aria-label={secondary.alt}>
          <div className="priority-path-copy">
            <PageIntro eyebrow={config.stepsEyebrow} title={config.stepsTitle} />
            <ProcessSteps steps={config.steps} />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="cream" className="priority-proof-section">
        <div className="wide-container priority-background-surface priority-readiness-panel" style={visualBackground} aria-label={visual.alt}>
          <div className="priority-readiness-copy">
            <span className="eyebrow">Readiness</span>
            <h2>{config.visualTitle}</h2>
            <p>{config.visualBody}</p>
            <div className="matching-reason-grid">
              {config.visualPoints.map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>
            {page.primaryCta ? (
              <Link className="button secondary" href={page.primaryCta.href}>
                {page.primaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="white" className="priority-trust-section">
        <div className="wide-container">
          <PageIntro eyebrow="Proof" title={config.proofTitle} align="center" />
          <TrustPanel items={config.proofItems} />
        </div>
      </SectionFrame>

      <SectionFrame tone="ink">
        <div className="wide-container">
          <CTASection
            eyebrow={page.eyebrow}
            title={page.primaryCta?.label ?? "Continue"}
            body={page.description}
            primary={page.primaryCta ?? { label: "Create account", href: "/auth/register/professional" }}
            secondary={page.secondaryCta ?? { label: "Sign in", href: "/auth/login" }}
          />
        </div>
      </SectionFrame>
    </>
  );
}

export function MarketingContentPage({ page }: { page: MarketingPageContent }) {
  const priorityConfig = priorityPages[page.slug];
  if (priorityConfig) {
    return <PriorityPublicPage page={page} config={priorityConfig} />;
  }

  const visual = getVisualForSlug(page.slug);
  const companion = getVisualForSlug(companionBySlug[page.slug] ?? "home");
  const firstSection = page.sections[0];
  const secondSection = page.sections[1];
  const path = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <>
      <BreadcrumbStructuredData path={path} name={page.eyebrow} />
      <PhotoHero
        eyebrow={page.eyebrow}
        title={page.title}
        body={page.description}
        primary={visual}
        secondary={companion}
        actions={[
          ...(page.primaryCta ? [{ label: page.primaryCta.label, href: page.primaryCta.href }] : []),
          ...(page.secondaryCta ? [{ label: page.secondaryCta.label, href: page.secondaryCta.href, kind: "secondary" as const }] : []),
        ]}
      />

      <SectionFrame tone="white" className="compact-public-section">
        <div className="wide-container page-opening public-signal-grid">
          <ImagePanel visual={companion} variant="wide" caption={page.eyebrow} />
          <TrustPanel
            items={page.highlights.slice(0, 4).map((highlight) => ({
              title: highlight.title,
              body: highlight.body,
            }))}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="white">
        <div className="wide-container">
          <EditorialSplit
            eyebrow={firstSection?.title ? "Flow" : "Model"}
            title={firstSection?.title ?? secondSection?.title ?? "Controlled healthcare workflows."}
            body={firstSection?.body ?? secondSection?.body ?? "Status and access stay explicit."}
            points={(firstSection?.points ?? secondSection?.points ?? page.highlights.map((highlight) => highlight.title)).slice(0, 4)}
            visual={companion}
            cta={page.primaryCta}
          />
        </div>
      </SectionFrame>

      {page.slug === "contact" ? contactSection() : null}
      {page.slug === "faq" ? faqSection(page) : null}
      {page.slug === "pricing-access" ? pricingSection() : null}

      <SectionFrame tone="ink">
        <div className="wide-container">
          <CTASection
            eyebrow="Portals"
            title="Open the right workspace."
            body="Role-based access starts here."
            primary={page.primaryCta ?? { label: "Create account", href: "/auth/register/professional" }}
            secondary={page.secondaryCta ?? { label: "Sign in", href: "/auth/login" }}
          />
        </div>
      </SectionFrame>
    </>
  );
}
