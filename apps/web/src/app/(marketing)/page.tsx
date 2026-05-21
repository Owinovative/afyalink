import Link from "next/link";
import {
  CompactMetricStrip,
  FeatureSplit,
  ImagePanel,
  LargeCTA,
  SectionFrame,
  SectionIntro,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";

const heroVisual = getVisualForSlug("home");

export default function HomePage() {
  return (
    <>
      <section className="hero full-hero">
        <div className="hero-container hero-shell">
          <div className="hero-copy">
            <div className="eyebrow">Healthcare trust infrastructure</div>
            <h1>Verified healthcare talent. Controlled from intake to placement.</h1>
            <p className="lead">
              Afyalink helps professionals, facilities, and review teams manage credentials, verification,
              interviews, publication, and trusted placement.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/auth/register/professional">
                Apply as a professional
              </Link>
              <Link className="button secondary" href="/auth/register/facility">
                Join as a facility
              </Link>
              <Link className="button ghost" href="/how-it-works">
                Explore the model
              </Link>
            </div>
            <div className="hero-trustline" aria-label="Afyalink trust signals">
              <span>Private credential handling</span>
              <span>Backend-owned workflow state</span>
              <span>Watermarked candidate access</span>
            </div>
          </div>
          <ImagePanel src={heroVisual.src} alt={heroVisual.alt} tone={heroVisual.tone} priority variant="hero" />
        </div>
      </section>

      <SectionFrame tone="soft">
        <div className="wide-container">
          <CompactMetricStrip
            items={[
              { value: "Verify", label: "Credential review", body: "Private intake and audit-backed review." },
              { value: "Interview", label: "Assessment", body: "Scheduling, scoring, and outcomes." },
              { value: "Publish", label: "Catalogue gate", body: "Admin-controlled visibility." },
              { value: "Connect", label: "Facility access", body: "Approved facilities only." },
            ]}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container platform-triad">
          <div className="portal-preview">
            <div>
              <div className="eyebrow">Three-sided platform</div>
              <h2>One trust workspace for professionals, facilities, and Afyalink teams.</h2>
              <p>
                Each role has a focused workspace. Sensitive transitions stay backend-owned. Marketplace access stays
                gated.
              </p>
            </div>
            <div className="table-lite">
              <div>
                <span>Professional intake</span>
                <span className="badge green">Guided</span>
              </div>
              <div>
                <span>Admin operations</span>
                <span className="badge gold">Audited</span>
              </div>
              <div>
                <span>Facility access</span>
                <span className="badge green">Gated</span>
              </div>
            </div>
          </div>
          <div className="platform-stack">
            <VisualCard
              eyebrow="Professionals"
              title="Profile to qualification."
              body="Professionals see the next valid step across profile, credentials, consent, payment, verification, and interview."
            />
            <VisualCard
              eyebrow="Facilities"
              title="Controlled marketplace."
              body="Facilities need approval and active access before viewing published candidates or recommendations."
            />
            <VisualCard
              eyebrow="Operators"
              title="Review console."
              body="Admin screens keep applications, verification, interviews, publication, and audit in one operational view."
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="warm">
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Professional journey"
            title="A respectful path for licensed professionals."
            body="Profile, credentials, consent, payment reference, submission, verification, interview, and publication stay clearly separated."
            points={["Profile and credential readiness", "Consent and payment state", "Verification and interview visibility", "Catalogue awareness"]}
            visual={getVisualForSlug("professionals")}
            cta={{ label: "Professional portal", href: "/professionals" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Students and recent graduates"
            title="Waiting for a license? Start early without being misrepresented."
            body="Students and graduates can prepare a pre-licensure profile and convert only after license evidence is ready."
            points={["Training history", "Preliminary documents", "License upload when issued", "Admin conversion before full workflow"]}
            visual={getVisualForSlug("students")}
            reverse
            cta={{ label: "Student waiting-license path", href: "/students" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="soft">
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Facility marketplace"
            title="Approved facilities review published candidates securely."
            body="Facility onboarding, access status, candidate publication, appointments, and recommendations stay behind explicit authorization gates."
            points={["Approved organizations only", "Active access required", "Published candidates only", "Watermarked profile views"]}
            visual={getVisualForSlug("facilities")}
            cta={{ label: "Facility platform", href: "/facilities" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="deep">
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Security and privacy"
            title="Candidate access is controlled, visible, and accountable."
            body="Afyalink avoids public raw document exposure. Candidate views use authorization, watermarking, warnings, and audit trails."
            points={["No permanent public credential URLs", "Facility and viewer-bound access checks", "Dynamic watermark overlays", "Profile and sensitive views audited"]}
            visual={getVisualForSlug("trust-security")}
            cta={{ label: "Trust and security", href: "/trust-security" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container">
          <SectionIntro
            eyebrow="Platform capabilities"
            title="Built around real healthcare staffing workflows."
            body="The product surface stays clean while readiness checks, access gates, state machines, and audit logs carry the trust model."
            align="center"
          />
          <div className="grid-4">
            {[
              ["Credential intake", "Private upload, review, and replacement paths."],
              ["Verification cases", "Regulatory body registry, assignments, statuses, and evidence handling."],
              ["Interview scoring", "Scheduling, rescheduling, rubric scoring, and qualification outcomes."],
              ["Facility access", "Onboarding approval and subscription-gated marketplace entry."],
              ["Candidate publication", "Admin-controlled catalogue visibility for qualified professionals."],
              ["Secure profiles", "Read-only, watermarked candidate details."],
              ["Recommendations", "Role-based requests and curated candidate packages."],
              ["Appointments", "Facility consultation and hiring request lifecycle management."],
            ].map(([title, body]) => (
              <VisualCard key={title} title={title} body={body} />
            ))}
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="soft">
        <div className="wide-container">
          <LargeCTA
            eyebrow="Start with the right portal"
            title="Use Afyalink as a professional, facility, or operations team."
            body="Each role gets a routed workspace with clear next steps, controlled access, and backend-enforced workflow transitions."
            primary={{ label: "Apply as a professional", href: "/auth/register/professional" }}
            secondary={{ label: "Join as a facility", href: "/auth/register/facility" }}
          />
        </div>
      </SectionFrame>
    </>
  );
}
