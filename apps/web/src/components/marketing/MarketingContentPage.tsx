import Link from "next/link";
import {
  FeatureSplit,
  ImagePanel,
  LargeCTA,
  ProcessTimeline,
  CompactMetricStrip,
  SectionFrame,
  SectionIntro,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";
import type { MarketingPageContent } from "@/lib/content/marketing";

const companionVisuals: Record<string, ReturnType<typeof getVisualForSlug>> = {
  "how-it-works": getVisualForSlug("facilities"),
  matching: getVisualForSlug("facilities"),
  professionals: getVisualForSlug("verification"),
  students: getVisualForSlug("professionals"),
  facilities: getVisualForSlug("trust-security"),
  "trust-security": getVisualForSlug("verification"),
  verification: getVisualForSlug("professionals"),
  "pricing-access": getVisualForSlug("recommendations"),
  about: getVisualForSlug("facilities"),
  contact: getVisualForSlug("contact"),
  faq: getVisualForSlug("how-it-works"),
};

function pageTone(slug: string) {
  if (slug === "trust-security" || slug === "facilities") return "deep";
  if (slug === "pricing-access" || slug === "contact") return "warm";
  return "soft";
}

export function MarketingContentPage({ page }: { page: MarketingPageContent }) {
  const visual = getVisualForSlug(page.slug);
  const companion = companionVisuals[page.slug] ?? getVisualForSlug("home");

  return (
    <>
      <section className="hero">
        <div className="hero-container hero-grid">
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
          <ImagePanel src={visual.src} alt={visual.alt} tone={visual.tone} />
        </div>
      </section>

      <SectionFrame tone={pageTone(page.slug)}>
        <div className="wide-container">
          <CompactMetricStrip
            items={page.highlights.map((item) => ({
              value: item.title,
              label: "Platform layer",
              body: item.body,
            }))}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Product workflow"
            title={page.sections[0]?.title ?? page.title}
            body={page.sections[0]?.body ?? page.description}
            points={page.sections[0]?.points ?? page.highlights.map((item) => item.title)}
            visual={companion}
            cta={page.primaryCta}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="soft">
        <div className="wide-container">
          <div className="process-band">
            <div className="feature-copy">
              <div className="eyebrow">Operating detail</div>
              <h2>{page.sections[1]?.title ?? "Workflow controls stay explicit."}</h2>
              <p>{page.sections[1]?.body ?? "Afyalink keeps business rules in backend services and renders safe, role-aware next steps in the frontend."}</p>
              <ProcessTimeline
                steps={(page.sections[1]?.points ?? page.highlights.map((item) => item.title)).map((point) => ({
                  title: point,
                  body: "Handled through routed pages, backend authorization, and clear product state.",
                }))}
              />
            </div>
          </div>
        </div>
      </SectionFrame>

      {page.slug === "contact" ? <ContactPanel page={page} /> : null}
      {page.slug === "faq" ? <FaqPanel page={page} /> : null}

      <SectionFrame>
        <div className="wide-container">
          <SectionIntro
            eyebrow="Role-aware paths"
            title="Start from the workspace that fits your role."
            body="Public pages explain Afyalink. Portals handle records, permissions, and live workflow state."
            align="center"
          />
          <div className="grid-3">
            <VisualCard
              eyebrow="Professional"
              title="Prepare for verification."
              body="Build your profile, upload credentials, accept consent, and submit when ready."
            >
              <div className="action-row" style={{ marginTop: 18 }}>
                <Link className="button secondary" href="/auth/register/professional">
                  Start application
                </Link>
              </div>
            </VisualCard>
            <VisualCard
              eyebrow="Facility"
              title="Request access."
              body="Submit facility details, activate access, browse candidates, and request recommendations."
            >
              <div className="action-row" style={{ marginTop: 18 }}>
                <Link className="button secondary" href="/auth/register/facility">
                  Join as facility
                </Link>
              </div>
            </VisualCard>
            <VisualCard
              eyebrow="Operations"
              title="Run review workflows."
              body="Manage applications, credentials, interviews, facilities, publication, and audit."
            >
              <div className="action-row" style={{ marginTop: 18 }}>
                <Link className="button secondary" href="/portal/admin">
                  Open admin
                </Link>
              </div>
            </VisualCard>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="deep">
        <div className="wide-container">
          <LargeCTA
            eyebrow={page.eyebrow}
            title="Move from public guidance to secure workflow."
            body="Choose your role, then continue in the routed portal where permissions and state are enforced."
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
            title="Use the secure portal for records. Use contact for partnership and access conversations."
            body="Private credentials should never move through a public contact channel. Afyalink keeps sensitive workflows inside authenticated routes."
          />
          <ProcessTimeline
            steps={[
              { title: "Professional application", body: "Use the professional registration path for credentials, consent, and application readiness." },
              { title: "Facility onboarding", body: "Use the facility path for organization review, access activation, and marketplace entry." },
              { title: "Commercial conversation", body: "Use contact for facility access, recommendation workflows, or partnership discussions." },
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
                <option value="partnership">Partnership</option>
                <option value="security">Security question</option>
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
  return (
    <SectionFrame tone="warm">
      <div className="wide-container">
        <SectionIntro
          eyebrow="Common questions"
          title="Clear answers for professionals, facilities, and security reviewers."
          body="Afyalink separates public explanation from authenticated workflow state so each answer points to the right route."
        />
        <div className="faq-grid">
          {[...page.highlights, ...page.sections].map((item) => (
            <VisualCard key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}
