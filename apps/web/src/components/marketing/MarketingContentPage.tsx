import Link from "next/link";
import {
  CTASection,
  EditorialSplit,
  PageIntro,
  PhotoBand,
  PhotoHero,
  SectionFrame,
  TrustPanel,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";
import { BreadcrumbStructuredData } from "@/components/seo/StructuredData";
import { contactAddresses } from "@/lib/contact";
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
            <a href={`mailto:${contactAddresses.public}`}>{contactAddresses.public}</a>
            <a href={`mailto:${contactAddresses.support}`}>{contactAddresses.support}</a>
          </div>
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

export function MarketingContentPage({ page }: { page: MarketingPageContent }) {
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
        <div className="wide-container page-opening">
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
