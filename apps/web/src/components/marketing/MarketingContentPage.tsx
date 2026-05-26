import Link from "next/link";
import {
  AudienceCard,
  FeatureSplit,
  ImagePanel,
  LargeCTA,
  PhotoMosaic,
  ProcessTimeline,
  SectionFrame,
  SectionIntro,
  TrustBand,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";
import type { MarketingPageContent } from "@/lib/content/marketing";

const pageCompanions: Record<string, string[]> = {
  "how-it-works": ["home", "verification", "facilities"],
  matching: ["facilities", "marketplace", "trust-security"],
  professionals: ["professionals", "verification", "trust-security"],
  students: ["students", "professionals", "verification"],
  facilities: ["facilities", "marketplace", "matching"],
  "trust-security": ["trust-security", "verification", "facilities"],
  verification: ["verification", "professionals", "trust-security"],
  "pricing-access": ["pricing-access", "facilities", "recommendations"],
  about: ["about", "professionals", "facilities"],
  contact: ["contact", "facilities", "professionals"],
  faq: ["faq", "students", "trust-security"],
};

function visualsFor(slug: string) {
  const keys = pageCompanions[slug] ?? ["home", "professionals", "facilities"];
  return keys.map((key) => getVisualForSlug(key));
}

function PageSpecificSection({ page }: { page: MarketingPageContent }) {
  if (page.slug === "contact") return <ContactPanel page={page} />;
  if (page.slug === "faq") return <FaqPanel page={page} />;

  if (page.slug === "matching") {
    return (
      <SectionFrame tone="warm">
        <div className="wide-container operational-story">
          <div>
            <div className="eyebrow">Placement logic</div>
            <h2>Matching is explainable, reviewed, and never an automatic rejection engine.</h2>
            <p>
              Requisitions, eligibility filters, deterministic scoring, AI-assisted draft rationale, and admin review
              stay separate so placement decisions remain accountable.
            </p>
          </div>
          <ProcessTimeline
            steps={[
              { title: "Define demand", body: "Facilities submit role, county, urgency, start date, and employment type." },
              { title: "Score eligible supply", body: "Students and unpublished candidates are blocked from normal matching." },
              { title: "Review shortlist", body: "Admins inspect explanations before anything is shared." },
              { title: "Track placement", body: "Placement outcomes and communication remain auditable." },
            ]}
          />
        </div>
      </SectionFrame>
    );
  }

  if (page.slug === "trust-security") {
    return (
      <SectionFrame tone="deep">
        <div className="wide-container">
          <TrustBand
            items={[
              { title: "Private storage", body: "R2/S3-compatible credential files stay outside the public web app." },
              { title: "Watermarking", body: "Candidate viewing is deterred, traceable, and policy-backed." },
              { title: "Audit trail", body: "Sensitive operations record actor, entity, state, and redacted metadata." },
              { title: "Privacy requests", body: "Operations teams can manage access and privacy lifecycle work." },
            ]}
          />
        </div>
      </SectionFrame>
    );
  }

  if (page.slug === "pricing-access") {
    return (
      <SectionFrame tone="warm">
        <div className="wide-container pricing-panel">
          <VisualCard title="Professional application" body="Applicants prepare records and payment references before submission. Fees and policy can remain configurable." />
          <VisualCard title="Facility access" body="Approved facilities activate access before marketplace browsing, matching, recommendation packages, and placement work." />
          <VisualCard title="Recommendation support" body="Commercial terms should be discussed with Afyalink until public pricing is finalized." />
        </div>
      </SectionFrame>
    );
  }

  return (
    <SectionFrame tone="warm">
      <div className="wide-container audience-grid">
        <AudienceCard
          eyebrow="Professional"
          title="Readiness before exposure."
          body="Profile, credential, consent, payment, verification, and interview state remain visible to the applicant."
          visual={getVisualForSlug("professionals")}
          href="/professionals"
          cta="Professional path"
        />
        <AudienceCard
          eyebrow="Facility"
          title="Access before browsing."
          body="Facility users must be approved and active before catalogue, matching, or shortlist workflows."
          visual={getVisualForSlug("facilities")}
          href="/facilities"
          cta="Facility path"
        />
        <AudienceCard
          eyebrow="Operations"
          title="Audit before scale."
          body="Afyalink operators manage review, publication, recommendations, matching, privacy, and placement state."
          visual={getVisualForSlug("verification")}
          href="/verification"
          cta="Verification model"
        />
      </div>
    </SectionFrame>
  );
}

export function MarketingContentPage({ page }: { page: MarketingPageContent }) {
  const [primary, secondary, tertiary] = visualsFor(page.slug);
  const firstSection = page.sections[0];
  const secondSection = page.sections[1];

  return (
    <>
      <section className={`hero editorial-page-hero page-${page.slug}`}>
        <div className="hero-container hero-shell">
          <div className="hero-copy">
            <div className="eyebrow">{page.eyebrow}</div>
            <h1>{page.title}</h1>
            <p className="lead">{page.description}</p>
            <div className="hero-actions">
              {page.primaryCta ? (
                <Link className="button" href={page.primaryCta.href}>
                  {page.primaryCta.label}
                </Link>
              ) : null}
              {page.secondaryCta ? (
                <Link className="button secondary" href={page.secondaryCta.href}>
                  {page.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
          <PhotoMosaic primary={primary} secondary={secondary} tertiary={tertiary} />
        </div>
      </section>

      <SectionFrame>
        <div className="wide-container page-opening">
          <SectionIntro
            eyebrow="What matters"
            title={firstSection?.title ?? "Afyalink keeps the workflow explicit."}
            body={firstSection?.body ?? page.description}
          />
          <TrustBand
            items={page.highlights.slice(0, 4).map((item) => ({
              title: item.title,
              body: item.body,
            }))}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="soft">
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Workflow"
            title={firstSection?.title ?? page.title}
            body={firstSection?.body ?? page.description}
            points={firstSection?.points ?? page.highlights.map((item) => item.title)}
            visual={secondary}
            cta={page.primaryCta}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container feature-split reverse">
          <div className="feature-copy">
            <div className="eyebrow">Operational clarity</div>
            <h2>{secondSection?.title ?? "Backend rules stay authoritative."}</h2>
            <p>
              {secondSection?.body ??
                "Afyalink pages explain the model, but workflow permissions, eligibility, and access decisions remain server-owned."}
            </p>
          </div>
          <ImagePanel src={tertiary.src} alt={tertiary.alt} tone={tertiary.tone} />
        </div>
      </SectionFrame>

      <PageSpecificSection page={page} />

      <SectionFrame tone="deep">
        <div className="wide-container">
          <LargeCTA
            eyebrow={page.eyebrow}
            title="Continue inside the right Afyalink route."
            body="Public pages orient the work. Secure portals handle records, state, permissions, review, and placement operations."
            primary={page.primaryCta ?? { label: "Start", href: "/" }}
            secondary={page.secondaryCta}
          />
        </div>
      </SectionFrame>
    </>
  );
}

function ContactPanel({ page }: { page: MarketingPageContent }) {
  return (
    <SectionFrame tone="warm">
      <div className="wide-container contact-grid">
        <div>
          <SectionIntro
            eyebrow="Contact routes"
            title="Use contact for access, commercial, and partnership conversations."
            body="Credentials, applications, and private documents belong inside authenticated portals, not public forms."
          />
          <ProcessTimeline
            steps={[
              { title: "Facility access", body: "Discuss onboarding, access, recommendations, requisitions, and placement support." },
              { title: "Professional support", body: "Use the professional portal for records; contact Afyalink for process questions." },
              { title: "Security questions", body: "Raise privacy, audit, storage, or access-control topics without sending credential files." },
            ]}
          />
        </div>
        <section className="form-card">
          <div className="eyebrow">Message Afyalink</div>
          <h2>{page.title}</h2>
          <form className="form-grid">
            <label>
              Name
              <input name="name" placeholder="Your name" />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="you@example.com" />
            </label>
            <label className="full">
              Purpose
              <select name="purpose" defaultValue="facility_access">
                <option value="facility_access">Facility access</option>
                <option value="professional_application">Professional application</option>
                <option value="student_track">Student awaiting-license path</option>
                <option value="security">Security or privacy</option>
              </select>
            </label>
            <label className="full">
              Message
              <textarea name="message" placeholder="Tell Afyalink what you need." />
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

function FaqPanel({ page }: { page: MarketingPageContent }) {
  const groups = [
    { title: "Professionals", items: page.highlights.slice(0, 2) },
    { title: "Students", items: page.highlights.slice(2, 4) },
    { title: "Facilities and security", items: page.highlights.slice(4) },
  ];

  return (
    <SectionFrame tone="warm">
      <div className="wide-container">
        <SectionIntro
          eyebrow="FAQ"
          title="Short answers, grouped by role."
          body="Afyalink avoids burying key decisions in long public copy. The portal provides live state after sign-in."
        />
        <div className="faq-grid">
          {groups.map((group) => (
            <article className="visual-card faq-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="data-list">
                {group.items.map((item) => (
                  <div key={item.title}>
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
