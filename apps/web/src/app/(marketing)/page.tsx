import Link from "next/link";
import {
  AudienceCard,
  FeatureSplit,
  LargeCTA,
  PhotoMosaic,
  ProcessTimeline,
  SectionFrame,
  SectionIntro,
  TrustBand,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";

const heroVisual = getVisualForSlug("home");
const facilityVisual = getVisualForSlug("facilities");
const studentVisual = getVisualForSlug("students");

export default function HomePage() {
  return (
    <>
      <section className="hero full-hero editorial-hero">
        <div className="hero-container hero-shell">
          <div className="hero-copy">
            <div className="eyebrow">Healthcare trust infrastructure</div>
            <h1>Trusted healthcare hiring starts before the shortlist.</h1>
            <p className="lead">
              Afyalink verifies professional readiness, protects private credentials, and gives approved facilities a
              controlled path from need to placement.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/auth/register/professional">
                Apply as a professional
              </Link>
              <Link className="button secondary" href="/auth/register/facility">
                Join as a facility
              </Link>
            </div>
            <TrustBand
              items={[
                { title: "Private", body: "credential intake" },
                { title: "Audited", body: "verification decisions" },
                { title: "Gated", body: "facility access" },
              ]}
            />
          </div>
          <PhotoMosaic
            primary={heroVisual}
            secondary={facilityVisual}
            tertiary={studentVisual}
            priority
          />
        </div>
      </section>

      <SectionFrame className="audience-section">
        <div className="wide-container">
          <SectionIntro
            eyebrow="Three entry points"
            title="A calm, controlled platform for every Afyalink role."
            body="Public pages guide people to the right portal. The backend decides which actions are valid."
            align="center"
          />
          <div className="audience-grid">
            <AudienceCard
              eyebrow="Licensed professionals"
              title="Build a verified profile."
              body="Upload credentials, consent to verification, complete assessment, and set placement preferences."
              visual={getVisualForSlug("professionals")}
              href="/professionals"
              cta="View professional path"
            />
            <AudienceCard
              eyebrow="Students and graduates"
              title="Start early without being misrepresented."
              body="Prepare a pre-licensure profile now; unlock the licensed workflow only after license evidence is reviewed."
              visual={getVisualForSlug("students")}
              href="/students"
              cta="View student path"
            />
            <AudienceCard
              eyebrow="Facilities"
              title="Hire through approved access."
              body="Submit requisitions, review matched shortlists, and track placements through Afyalink operations."
              visual={getVisualForSlug("facilities")}
              href="/facilities"
              cta="View facility access"
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="soft">
        <div className="wide-container feature-split">
          <div className="feature-copy">
            <div className="eyebrow">Trust workflow</div>
            <h2>From credential intake to placement, every step is explicit.</h2>
            <p>
              Afyalink separates sensitive review work from facility visibility. Candidates become market-visible only
              after qualification, consent, publication, and access rules align.
            </p>
          </div>
          <ProcessTimeline
            steps={[
              { title: "Submit credentials", body: "Private uploads, profile data, consent, and payment reference." },
              { title: "Verify and interview", body: "Credential review, regulatory cases, interview scoring, and qualification." },
              { title: "Publish safely", body: "Admin-controlled catalogue status and watermarked candidate profiles." },
              { title: "Match and place", body: "Facility requisitions, explainable matching, shortlists, and placement tracking." },
            ]}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Facility demand"
            title="Requisitions, matching, shortlists, and placements now sit in one operating model."
            body="Facilities can move from a staffing need to reviewed candidate packages without turning Afyalink into an open directory."
            points={[
              "Structured facility requisitions",
              "Deterministic matching with human review",
              "Shortlists with rationale",
              "Placement lifecycle visibility",
            ]}
            visual={getVisualForSlug("matching")}
            cta={{ label: "Explore matching", href: "/matching" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="deep">
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Security posture"
            title="Private records stay private even when opportunity moves quickly."
            body="Afyalink uses private object storage, role permissions, watermarked views, consent, privacy requests, and audit trails."
            points={[
              "No public raw credential URLs",
              "Viewer-bound candidate access",
              "Redacted provider callback data",
              "ASVS-readiness foundations",
            ]}
            visual={getVisualForSlug("trust-security")}
            reverse
            cta={{ label: "Trust and security", href: "/trust-security" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="warm">
        <div className="wide-container human-story">
          <div>
            <div className="eyebrow">Human placement story</div>
            <h2>Healthcare staffing is personal. The system still has to be rigorous.</h2>
            <p>
              Afyalink gives professionals a fair preparation path, gives facilities accountable access, and gives
              operations teams the controls to protect trust at scale.
            </p>
          </div>
          <div className="grid-3">
            <VisualCard title="Professionals" body="Clear readiness, privacy, and placement preferences." />
            <VisualCard title="Facilities" body="Approved access to published, qualified candidates." />
            <VisualCard title="Afyalink teams" body="Review, audit, matching, communication, and placement controls." />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container">
          <LargeCTA
            eyebrow="Start with the right path"
            title="Move from interest to a secure Afyalink workspace."
            body="Choose the route that matches your role. The portal will show exactly what is ready, blocked, or awaiting review."
            primary={{ label: "Apply as a professional", href: "/auth/register/professional" }}
            secondary={{ label: "Join as a facility", href: "/auth/register/facility" }}
          />
        </div>
      </SectionFrame>
    </>
  );
}
