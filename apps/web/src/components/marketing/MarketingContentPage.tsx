import Link from "next/link";
import {
  AudienceTile,
  CTASection,
  EditorialSplit,
  PageIntro,
  PhotoBand,
  PhotoHero,
  ProcessSteps,
  SectionFrame,
  TrustPanel,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";
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

const pageSteps: Record<string, Array<{ title: string; body: string }>> = {
  professionals: [
    { title: "Profile", body: "Complete professional details and work history." },
    { title: "Credentials", body: "Upload private documents for review." },
    { title: "Assessment", body: "Move through verification and interview." },
    { title: "Placement", body: "Set preferences for future opportunities." },
  ],
  students: [
    { title: "Register early", body: "Join without a license number." },
    { title: "Prepare records", body: "Upload training and identity evidence." },
    { title: "Wait accurately", body: "Remain outside licensed publication." },
    { title: "Convert", body: "Upload license evidence when issued." },
  ],
  facilities: [
    { title: "Onboard", body: "Submit organization details for Afyalink review." },
    { title: "Activate access", body: "Confirm entitlement before browsing." },
    { title: "Request talent", body: "Create requisitions and request recommendations." },
    { title: "Place safely", body: "Track shortlists, communication, and outcomes." },
  ],
  matching: [
    { title: "Requisition", body: "Facility need is structured first." },
    { title: "Eligibility", body: "Only qualified and consented candidates are considered." },
    { title: "Explanation", body: "Score reasons and ineligible reasons are visible to admins." },
    { title: "Review", body: "Human operators approve shortlists." },
  ],
  "trust-security": [
    { title: "Private storage", body: "Raw credentials stay outside public access." },
    { title: "Authorization", body: "Roles and access state gate every sensitive view." },
    { title: "Watermark", body: "Candidate views identify the viewer and context." },
    { title: "Audit", body: "Sensitive actions are recorded with redaction." },
  ],
};

function stepsFor(page: MarketingPageContent) {
  return pageSteps[page.slug] ?? [
    { title: "Enter", body: page.highlights[0]?.body ?? "Start from the correct route." },
    { title: "Review", body: page.highlights[1]?.body ?? "Move through controlled workflow state." },
    { title: "Control", body: page.highlights[2]?.body ?? "Keep access governed by backend rules." },
    { title: "Track", body: "Use audit-ready portals for the live workflow." },
  ];
}

function pricingSection() {
  return (
    <SectionFrame tone="cream">
      <div className="wide-container pricing-panel">
        <VisualCard title="Professionals" body="Application and payment reference workflows remain connected to readiness and admin review." />
        <VisualCard title="Facilities" body="Access is reviewed, entitlement-gated, and suitable for manual confirmation before provider automation." />
        <VisualCard title="Recommendations" body="Curated packages and appointments can support commercial facility engagement without fake public prices." />
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
          eyebrow="Contact Afyalink"
          title="Use the right channel for sensitive work."
          body="Private records belong inside authenticated portals. Use this page for facility access, partnerships, support, and operational questions."
        />
        <section className="form-card">
          <span className="eyebrow">Message details</span>
          <h2>Send a focused inquiry</h2>
          <form className="form-grid">
            <label>
              Name
              <input placeholder="Your name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="you@example.com" />
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
              Prepare inquiry
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
        <PageIntro eyebrow="FAQ" title="Short answers by role." body="Afyalink keeps public explanations concise. Live workflow status belongs in authenticated portals." align="center" />
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

export function MarketingContentPage({ page }: { page: MarketingPageContent }) {
  const visual = getVisualForSlug(page.slug);
  const companion = getVisualForSlug(companionBySlug[page.slug] ?? "home");
  const firstSection = page.sections[0];
  const secondSection = page.sections[1];

  return (
    <>
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

      <SectionFrame tone="white">
        <div className="wide-container page-opening">
          <PageIntro
            eyebrow="Why this page matters"
            title={firstSection?.title ?? page.title}
            body={firstSection?.body ?? page.description}
          />
          <TrustPanel
            items={page.highlights.slice(0, 4).map((highlight) => ({
              title: highlight.title,
              body: highlight.body,
            }))}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="mist">
        <div className="wide-container">
          <ProcessSteps steps={stepsFor(page)} />
        </div>
      </SectionFrame>

      <SectionFrame tone="white">
        <div className="wide-container">
          <EditorialSplit
            eyebrow="Operational model"
            title={secondSection?.title ?? "Designed for controlled healthcare workflows."}
            body={secondSection?.body ?? "Afyalink keeps identity, access, verification, matching, and publication state explicit."}
            points={secondSection?.points ?? page.highlights.map((highlight) => highlight.title)}
            visual={companion}
            cta={page.primaryCta}
          />
        </div>
      </SectionFrame>

      {page.slug === "contact" ? contactSection() : null}
      {page.slug === "faq" ? faqSection(page) : null}
      {page.slug === "pricing-access" ? pricingSection() : null}

      {page.slug !== "contact" && page.slug !== "faq" && page.slug !== "pricing-access" ? (
        <SectionFrame tone="cream">
          <div className="wide-container">
            <div className="audience-grid compact">
              <AudienceTile
                eyebrow="Professional path"
                title="For licensed professionals"
                body="Credential readiness, assessment, publication awareness, and placement preferences."
                visual={getVisualForSlug("professionals")}
                href="/professionals"
                cta="Open path"
              />
              <AudienceTile
                eyebrow="Student path"
                title="For students awaiting license"
                body="Early profile building without being represented as licensed or publishable."
                visual={getVisualForSlug("students")}
                href="/students"
                cta="Open path"
              />
              <AudienceTile
                eyebrow="Facility path"
                title="For approved facilities"
                body="Gated access, requisitions, recommendations, shortlists, and placements."
                visual={getVisualForSlug("facilities")}
                href="/facilities"
                cta="Open path"
              />
            </div>
          </div>
        </SectionFrame>
      ) : null}

      <SectionFrame tone="ink">
        <div className="wide-container">
          <CTASection
            eyebrow="Afyalink portals"
            title="Move from public overview to the right secure workspace."
            body="Create the account that matches your role. Backend authorization remains the source of truth after sign-in."
            primary={page.primaryCta ?? { label: "Create account", href: "/auth/register/professional" }}
            secondary={page.secondaryCta ?? { label: "Sign in", href: "/auth/login" }}
          />
        </div>
      </SectionFrame>
    </>
  );
}
