import Link from "next/link";
import {
  FeatureSplit,
  LargeCTA,
  ProofStrip,
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
            <h1>Verified healthcare talent, governed from intake to placement.</h1>
            <p className="lead">
              Afyalink gives professionals, facilities, and operators a secure way to verify credentials, manage
              interviews, publish qualified candidates, and coordinate trusted healthcare hiring.
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
          <div className="product-visual" aria-label={heroVisual.alt}>
            <img src={heroVisual.src} alt={heroVisual.alt} loading="eager" />
          </div>
        </div>
      </section>

      <SectionFrame tone="soft">
        <div className="wide-container">
          <ProofStrip
            items={[
              { value: "Verify", label: "Credential and regulatory review", body: "Private intake, replacement requests, and audit-backed review." },
              { value: "Interview", label: "Structured assessment", body: "Scheduling, scoring, outcomes, and qualification controls." },
              { value: "Publish", label: "Candidate catalogue gate", body: "Admin publication only after eligibility and consent checks." },
              { value: "Connect", label: "Facility marketplace", body: "Approved, active facilities browse secure read-only profiles." },
            ]}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container platform-triad">
          <div className="portal-preview">
            <div>
              <div className="eyebrow">Three-sided platform</div>
              <h2>One trust operating system for professionals, facilities, and Afyalink teams.</h2>
              <p>
                The product is designed around healthcare risk: every role has its own workspace, every sensitive
                transition is owned by the backend, and every marketplace view is intentionally shaped.
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
              title="A clear route from profile to publishable qualification."
              body="Professionals see the next valid step without guessing whether credentials, consent, payment, verification, or interview records are ready."
            />
            <VisualCard
              eyebrow="Facilities"
              title="A controlled marketplace, not a public directory."
              body="Facilities need approval and active access before viewing published candidates, recommendation packages, or secure profiles."
            />
            <VisualCard
              eyebrow="Operators"
              title="Review, verification, interviews, publication, and audit in one console."
              body="Admin screens remain operationally dense while the product surface becomes easier to scan and manage."
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="warm">
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Professional journey"
            title="A respectful verification path for healthcare professionals."
            body="Afyalink separates account readiness, profile completion, private credential upload, current consent, payment reference creation, application submission, verification, interview, and publication status."
            points={["Profile and credential readiness", "Consent and payment reference state", "Verification and interview visibility", "High-level facility catalogue awareness"]}
            visual={getVisualForSlug("professionals")}
            cta={{ label: "Professional portal", href: "/professionals" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="wide-container">
          <FeatureSplit
            eyebrow="Students and recent graduates"
            title="Still waiting for your license? Start building your Afyalink profile now."
            body="Afyalink now supports a waiting-license track for students and graduates who want to prepare early without being misrepresented as licensed, verified, or facility-publishable candidates."
            points={["Pre-licensure profile and training history", "Student ID, training proof, transcript, and completion evidence", "Professional license upload when issued", "Admin conversion before full application workflow"]}
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
            title="Approved facilities get secure access to curated candidate profiles."
            body="Facility onboarding, access subscription status, candidate publication, profile viewing, appointment requests, and recommendation packages are kept behind explicit authorization gates."
            points={["Approved organizations only", "Active access required", "Published candidates only", "Profile views watermarked and audited"]}
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
            body="Afyalink does not expose raw private documents publicly. Secure candidate views use authorization, deterrent watermarking, legal warning UX, and audit trails. Screenshots cannot be made impossible, so the product focuses on realistic controls and accountability."
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
            body="The product surface is polished, but the underlying experience stays operational: readiness checks, state machines, access gates, and audit logs remain the source of product trust."
            align="center"
          />
          <div className="grid-4">
            {[
              ["Credential intake", "Private upload and admin review workflows with replacement paths."],
              ["Verification cases", "Regulatory body registry, assignments, statuses, and evidence handling."],
              ["Interview scoring", "Scheduling, rescheduling, rubric scoring, and qualification outcomes."],
              ["Facility access", "Onboarding approval and subscription-gated marketplace entry."],
              ["Candidate publication", "Admin-controlled catalogue visibility for qualified professionals."],
              ["Secure profiles", "Read-only, watermarked candidate details with audit records."],
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
