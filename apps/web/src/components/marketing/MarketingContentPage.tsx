import Link from "next/link";
import type { MarketingPageContent } from "@/lib/content/marketing";

export function MarketingContentPage({ page }: { page: MarketingPageContent }) {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
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
          <div className="product-visual" aria-label="Afyalink workflow signals">
            <div className="signal-stack">
              {page.highlights.map((item) => (
                <div className="signal-card" key={item.title}>
                  <strong>
                    {item.title}
                    <span className="badge">Controlled</span>
                  </strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section soft">
        <div className="container grid-2">
          {page.sections.map((section) => (
            <article className="card" key={section.title}>
              <div className="eyebrow">Platform layer</div>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              <div className="table-lite" style={{ marginTop: 18 }}>
                {section.points.map((point) => (
                  <div key={point}>
                    <span>{point}</span>
                    <span className="badge green">Built in</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
