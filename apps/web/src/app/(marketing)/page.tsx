import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Healthcare trust infrastructure</div>
            <h1>Afyalink connects verified professionals with trusted facilities.</h1>
            <p className="lead">
              A secure verification, interview, publication, and placement platform for healthcare professionals,
              facilities, regulators, and Afyalink operations teams.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/auth/register/professional">
                Apply as a Professional
              </Link>
              <Link className="button secondary" href="/auth/register/facility">
                Join as a Facility
              </Link>
              <Link className="button ghost" href="/how-it-works">
                Explore how it works
              </Link>
            </div>
          </div>
          <div className="product-visual" aria-label="Afyalink verification and marketplace signals">
            <div className="signal-stack">
              {[
                ["Credential Verified", "Private document handling with admin review and replacement workflows."],
                ["Interview Scored", "Structured scheduling, rubric scoring, and qualification outcomes."],
                ["Facility Matched", "Subscription-gated browsing and curated recommendation packages."],
                ["Secure Access", "Watermarked read-only views, audit logs, and no public raw credential URLs."],
              ].map(([title, body]) => (
                <div className="signal-card" key={title}>
                  <strong>
                    {title}
                    <span className="badge green">Live workflow</span>
                  </strong>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section soft">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Verify • Interview • Recommend • Connect</div>
            <h2>Built for healthcare staffing where trust, privacy, and accountability matter.</h2>
            <p className="lead">
              Afyalink is not a generic recruitment page. It is a workflow platform with backend-owned state,
              permission boundaries, and facility access controls.
            </p>
          </div>
          <div className="grid-4">
            {[
              ["Private credentials", "Credential records stay behind controlled storage and review boundaries."],
              ["Audit trails", "Sensitive workflow events and candidate views are logged for accountability."],
              ["Regulatory workflows", "Verification cases support assignment, status, notes, and evidence tracking."],
              ["Controlled access", "Facilities see published candidate summaries only after approval and active access."],
            ].map(([title, body]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container grid-3">
          {[
            ["For professionals", "Register, verify email, submit credentials, consent, pay, apply, and track progress.", "/professionals"],
            ["For facilities", "Onboard, activate access, browse published candidates, and request recommendations.", "/facilities"],
            ["For Afyalink admins", "Review applications, manage verification, interviews, facilities, publications, and audit.", "/portal/admin"],
          ].map(([title, body, href]) => (
            <article className="card" key={title}>
              <div className="eyebrow">Workspace</div>
              <h2>{title}</h2>
              <p>{body}</p>
              <div className="action-row" style={{ marginTop: 18 }}>
                <Link className="button secondary" href={href}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section soft">
        <div className="container split-panel">
          <div>
            <div className="eyebrow">Security and privacy</div>
            <h2>Secure candidate viewing is built around controls, deterrence, and auditability.</h2>
            <p className="lead">
              Facilities get read-only candidate profiles with watermarking and profile-view audit logs. Private raw
              documents and admin-only notes are not exposed through the public marketplace.
            </p>
          </div>
          <div className="card">
            <h3>Access rules</h3>
            <div className="table-lite">
              <div>
                <span>Facility approved</span>
                <span className="badge green">Required</span>
              </div>
              <div>
                <span>Subscription active</span>
                <span className="badge green">Required</span>
              </div>
              <div>
                <span>Candidate published</span>
                <span className="badge green">Required</span>
              </div>
              <div>
                <span>Profile view audited</span>
                <span className="badge green">Always</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
