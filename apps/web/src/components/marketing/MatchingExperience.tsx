import Image from "next/image";
import Link from "next/link";
import { BreadcrumbStructuredData } from "@/components/seo/StructuredData";

const proofItems = ["Reviewed matches", "Clear reasons", "Human control"];

const steps = [
  { title: "Score", body: "Fit signals" },
  { title: "Review", body: "Human check" },
  { title: "Share", body: "Reasoned shortlist" },
];

export function MatchingExperience() {
  return (
    <div className="matching-experience">
      <BreadcrumbStructuredData path="/matching" name="Matching" />
      <section className="matching-hero">
        <Image
          src="/images/marketplace/facility-candidate-review.jpg"
          alt="Healthcare facility team reviewing candidate information."
          fill
          priority
          sizes="100vw"
          className="matching-hero-image"
        />
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
        <div className="matching-photo-strip" aria-hidden="true">
          <figure>
            <Image src="/images/facilities/hospital-facility-team.jpg" alt="" width={320} height={220} />
          </figure>
          <figure>
            <Image src="/images/verification/admin-verification-desk.jpg" alt="" width={320} height={220} />
          </figure>
          <figure>
            <Image src="/images/professionals/clinical-professional-consultation.jpg" alt="" width={320} height={220} />
          </figure>
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

      <section className="matching-split">
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
        <Image
          src="/images/trust/hospital-corridor-care-team.jpg"
          alt="Healthcare team discussing placement decisions."
          width={760}
          height={520}
          sizes="(max-width: 900px) 100vw, 48vw"
        />
      </section>
    </div>
  );
}
