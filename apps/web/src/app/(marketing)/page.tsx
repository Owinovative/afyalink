import {
  AudienceTile,
  CTASection,
  EditorialSplit,
  PhotoBand,
  PhotoHero,
  ProcessSteps,
  SectionFrame,
  PageIntro,
  TrustPanel,
  VisualCard,
  getVisualForSlug,
} from "@/components/marketing/VisualSystem";

const workflowSteps = [
  { title: "Apply", body: "Professionals and students enter the correct path from the start." },
  { title: "Verify", body: "Credential and regulatory checks stay private, structured, and auditable." },
  { title: "Interview", body: "Assessment outcomes are recorded before publication or placement." },
  { title: "Publish", body: "Only eligible, consented candidates become visible to approved facilities." },
  { title: "Match", body: "Facility needs are matched with explainable eligibility and human review." },
  { title: "Place", body: "Shortlists, communication, and placement outcomes stay traceable." },
];

export default function HomePage() {
  return (
    <>
      <PhotoHero
        eyebrow="Healthcare trust platform"
        title="Verified healthcare talent, placed with confidence."
        body="Afyalink connects licensed professionals, students awaiting registration, and approved facilities through secure verification, matching, and placement workflows."
        primary={getVisualForSlug("home")}
        secondary={getVisualForSlug("facilities")}
        actions={[
          { label: "Apply as a professional", href: "/auth/register/professional" },
          { label: "Join as a facility", href: "/auth/register/facility", kind: "secondary" },
        ]}
      />

      <SectionFrame tone="white" className="audience-section">
        <div className="wide-container">
          <PageIntro
            eyebrow="Choose the right path"
            title="One platform. Three carefully separated journeys."
            body="Afyalink is not a public job board. It is controlled infrastructure for readiness, verification, access, and placement."
            align="center"
          />
          <div className="audience-grid">
            <AudienceTile
              eyebrow="Licensed professionals"
              title="Build a verified professional record."
              body="Upload credentials privately, complete review, and set availability for future placement."
              visual={getVisualForSlug("professionals")}
              href="/professionals"
              cta="Professional journey"
            />
            <AudienceTile
              eyebrow="Students and graduates"
              title="Start early while waiting for license."
              body="Create a pre-licensure profile without being represented as a licensed candidate."
              visual={getVisualForSlug("students")}
              href="/students"
              cta="Student pathway"
            />
            <AudienceTile
              eyebrow="Healthcare facilities"
              title="Access candidates through approved controls."
              body="Submit staffing needs, receive reviewed shortlists, and track placement outcomes."
              visual={getVisualForSlug("facilities")}
              href="/facilities"
              cta="Facility access"
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="mist">
        <div className="wide-container">
          <div className="workflow-panel">
            <PageIntro
              eyebrow="Trust workflow"
              title="The platform stays useful because the rules stay explicit."
              body="Every movement from applicant intake to facility placement is governed by backend state, permissions, and audit records."
            />
            <ProcessSteps steps={workflowSteps} />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="white">
        <div className="wide-container">
          <EditorialSplit
            eyebrow="Facility staffing"
            title="Demand starts with real requisitions, not uncontrolled browsing."
            body="Facilities describe the role, location, urgency, and hiring context. Afyalink then supports matching, reviewed shortlists, and placement follow-through."
            points={["Structured staffing needs", "Eligibility-aware matching", "Human-reviewed shortlists", "Placement lifecycle tracking"]}
            visual={getVisualForSlug("matching")}
            cta={{ label: "Explore matching", href: "/matching" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="ink">
        <div className="wide-container">
          <EditorialSplit
            eyebrow="Secure candidate access"
            title="Facilities see only what they are allowed to see."
            body="Private documents stay private. Candidate views are permissioned, watermarked, and audited so access is accountable even after a profile is shared."
            points={["Private R2/S3-compatible document storage", "Approved facility access only", "Watermarked profile viewing", "Redacted audit and payment metadata"]}
            visual={getVisualForSlug("trust-security")}
            reverse
            cta={{ label: "Trust and security", href: "/trust-security" }}
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="cream">
        <div className="wide-container">
          <PhotoBand
            visual={getVisualForSlug("about")}
            eyebrow="Human placement story"
            title="Afyalink is the operating layer between professional readiness and facility need."
            body="The product is intentionally calm: professionals control records, students prepare safely, facilities request talent responsibly, and Afyalink operators keep the final decisions accountable."
          />
        </div>
      </SectionFrame>

      <SectionFrame tone="white">
        <div className="wide-container">
          <div className="grid-3 capability-row">
            <VisualCard title="Verification first" body="Credential review, regulatory cases, interview scoring, and publication remain separate workflow states." />
            <VisualCard title="Access second" body="Facility marketplace browsing requires approved organization status and active entitlement." />
            <VisualCard title="Placement with context" body="Matching and shortlists are guided by requisitions, eligibility, and human review." />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="ink">
        <div className="wide-container">
          <TrustPanel
            items={[
              { title: "Private credentials", body: "No public raw document links." },
              { title: "Waiting-license safety", body: "Students are never published as licensed." },
              { title: "Audited viewing", body: "Candidate access leaves a trail." },
              { title: "Human review", body: "Matching does not auto-reject people." },
            ]}
          />
          <CTASection
            eyebrow="Start with the right Afyalink path"
            title="Create the account that matches your role."
            body="Afyalink keeps professional, student, facility, and admin workflows separate so sensitive decisions stay controlled."
            primary={{ label: "Apply as a professional", href: "/auth/register/professional" }}
            secondary={{ label: "Register as a student", href: "/auth/register/student" }}
          />
        </div>
      </SectionFrame>
    </>
  );
}
