import Link from "next/link";
import { BreadcrumbStructuredData } from "@/components/seo/StructuredData";

const proofItems = ["Reviewed matches", "Clear reasons", "Human control"];

const steps = [
  { title: "Score", body: "Fit signals" },
  { title: "Review", body: "Human review" },
  { title: "Share", body: "Reasoned shortlist" },
];

export function MatchingExperience() {
  return (
    <div className="matching-experience">
      <BreadcrumbStructuredData path="/matching" name="Matching" />
      <section className="matching-hero">
        <div className="matching-hero-overlay" />
        <div className="matching-hero-content">
          <span className="eyebrow">Matching</span>
          <h1>Matches explained before sharing.</h1>
          <p>Reviewed fit. Clear reasons. Human approval.</p>
          <div className="home-chip-row">
            {proofItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="hero-actions">
            <Link className="button" href="/portal/facility/requisitions">
              Open requisitions
            </Link>
            <Link className="button secondary translucent" href="/trust-security">
              Trust model
            </Link>
          </div>
        </div>
      </section>

      <section className="matching-process">
        <div>
          <span className="eyebrow">Process</span>
          <h2>Score. Review. Share.</h2>
        </div>
        <ol>
          {steps.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="matching-review-panel review-bg" aria-label="Secure healthcare record review before candidate sharing.">
        <div className="matching-review-copy">
          <span className="eyebrow">Human review</span>
          <h2>Fit is explained.</h2>
          <p>Candidates are reviewed before a shortlist reaches a facility.</p>
          <div className="matching-reason-grid">
            <span>Role</span>
            <span>County</span>
            <span>Credentials</span>
            <span>Availability</span>
          </div>
        </div>
      </section>

      <section className="matching-split trust-bg" aria-label="Healthcare team discussing placement decisions.">
        <div>
          <span className="eyebrow">Control</span>
          <h2>No blind dumps.</h2>
          <p>Fit signals and risk flags stay reviewable before sharing.</p>
          <div className="home-chip-row">
            <span>Score</span>
            <span>Reason</span>
            <span>Review</span>
          </div>
          <div className="hero-actions">
            <Link className="button secondary" href="/portal/professional/placement-preferences">
              Set availability
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
