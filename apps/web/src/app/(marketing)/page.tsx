import {
  AudienceTile,
  CTASection,
  EditorialSplit,
  PhotoHero,
  ProcessSteps,
  SectionFrame,
  TrustPanel,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";

const workflowSteps = [
  { title: "Apply", body: "Choose the right path." },
  { title: "Verify", body: "Check records privately." },
  { title: "Interview", body: "Assess before sharing." },
  { title: "Match", body: "Explain each fit." },
  { title: "Place", body: "Track the outcome." },
];

export default function HomePage() {
  return (
    <>
      <PhotoHero
        eyebrow="Afyalink"
        title="Verified healthcare talent, placed safely."
        body="A calmer way to verify, match, and place healthcare professionals."
        primary={getVisualForSlug("home")}
        secondary={getVisualForSlug("facilities")}
        actions={[
          { label: "Apply now", href: "/auth/register/professional" },
          { label: "Join facility", href: "/auth/register/facility", kind: "secondary" },
        ]}
      />

      <SectionFrame tone="white" className="audience-section">
        <div className="wide-container">
          <div className="audience-grid">
            <AudienceTile
              eyebrow="Professionals"
              title="Get verified."
              body="Upload records. Track status."
              visual={getVisualForSlug("professionals")}
              href="/professionals"
              cta="Open path"
            />
            <AudienceTile
              eyebrow="Students"
              title="Start early."
              body="Prepare before licensure."
              visual={getVisualForSlug("students")}
              href="/students"
              cta="Open path"
            />
            <AudienceTile
              eyebrow="Facilities"
              title="Hire safely."
              body="Request reviewed candidates."
              visual={getVisualForSlug("facilities")}
              href="/facilities"
              cta="Open path"
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="mist">
        <div className="wide-container">
          <ProcessSteps steps={workflowSteps} />
        </div>
      </SectionFrame>

      <SectionFrame tone="white">
        <div className="wide-container">
          <EditorialSplit
            eyebrow="Facility staffing"
            title="Needs become shortlists."
            body="Facilities submit roles. Afyalink reviews matches."
            points={["Requisitions", "Eligibility", "Human review", "Placement"]}
            visual={getVisualForSlug("matching")}
            cta={{ label: "Explore matching", href: "/matching" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="ink">
        <div className="wide-container">
          <TrustPanel
            items={[
              { title: "Private", body: "Credentials stay protected." },
              { title: "Controlled", body: "Access requires approval." },
              { title: "Watermarked", body: "Views stay accountable." },
              { title: "Audited", body: "Sensitive actions leave trails." },
            ]}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="cream">
        <div className="wide-container">
          <EditorialSplit
            eyebrow="Secure access"
            title="Candidate views stay accountable."
            body="Facilities see approved summaries, not raw private documents."
            points={["Read-only profiles", "Safe summaries", "Access history", "Consent-aware"]}
            visual={getVisualForSlug("trust-security")}
            reverse
            cta={{ label: "Trust model", href: "/trust-security" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="ink">
        <div className="wide-container">
          <CTASection
            eyebrow="Start"
            title="Choose your Afyalink path."
            body="Professional, student, and facility workflows stay separate."
            primary={{ label: "Apply now", href: "/auth/register/professional" }}
            secondary={{ label: "Register student", href: "/auth/register/student" }}
          />
        </div>
      </SectionFrame>
    </>
  );
}
