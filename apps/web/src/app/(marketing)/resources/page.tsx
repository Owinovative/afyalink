import Link from "next/link";

export const metadata = {
  title: "Resources & Downloads | Afyalink",
  description: "Download public health articles, guides, and policy documents.",
};

export default function ResourcesPage() {
  return (
    <main>
      {/* Clean Premium Header */}
      <section className="section-frame section-deep" style={{ padding: "clamp(64px, 8vw, 96px) 0 48px" }}>
        <div className="container" style={{ textAlign: "center", color: "#fff" }}>
          <span className="eyebrow" style={{ color: "var(--teal-soft)" }}>Knowledge Base</span>
          <h1 style={{ color: "#fff", marginBottom: "16px", fontSize: "clamp(2.5rem, 4vw, 3.5rem)" }}>
            Platform Resources
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Access public guidelines, healthcare policies, and Afyalink platform documentation. 
            Sign in to your workspace for secure, role-specific downloads.
          </p>
        </div>
      </section>

      {/* Downloads Grid */}
      <section className="section-frame section-mist" style={{ minHeight: "60vh" }}>
        <div className="container">
          
          {/* Search & Filter Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <input 
              type="search" 
              placeholder="Search articles and documents..." 
              style={{ maxWidth: "400px", background: "#fff" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <span className="badge" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>All</span>
              <span className="badge" style={{ background: "#fff" }}>Guidelines</span>
              <span className="badge" style={{ background: "#fff" }}>Reports</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            
            {/* Download Card 1 */}
            <article className="card" style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="badge green">Public Guide</span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>PDF • 2.4 MB</span>
              </div>
              <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0", color: "var(--ink-strong)" }}>
                2026 National Clinical Guidelines
              </h3>
              <p style={{ fontSize: "0.95rem", color: "var(--ink-soft)", flex: 1 }}>
                Updated standard operating procedures for critical care facilities across the region.
              </p>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
                <a href="#" className="button secondary full" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Download Document</span>
                  <span>↓</span>
                </a>
              </div>
            </article>

            {/* Download Card 2 */}
            <article className="card" style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="badge green">Report</span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>PDF • 1.1 MB</span>
              </div>
              <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0", color: "var(--ink-strong)" }}>
                Healthcare Staffing Trends Q1
              </h3>
              <p style={{ fontSize: "0.95rem", color: "var(--ink-soft)", flex: 1 }}>
                An analysis of nursing and clinical officer shortages and placement success rates.
              </p>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
                <a href="#" className="button secondary full" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Download Document</span>
                  <span>↓</span>
                </a>
              </div>
            </article>

            {/* Private Gateway Card */}
            <article className="card" style={{ display: "flex", flexDirection: "column", background: "var(--paper)", borderStyle: "dashed", borderColor: "var(--line-strong)", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--line)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "1.5rem" }}>
                🔒
              </div>
              <h3 style={{ fontSize: "1.1rem", margin: "0 0 8px 0", color: "var(--ink-strong)" }}>
                Looking for secure documents?
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", marginBottom: "24px" }}>
                Facility onboarding packets and professional exam prep materials are securely gated.
              </p>
              <Link href="/auth/login" className="button">
                Sign in to Workspace
              </Link>
            </article>

          </div>
        </div>
      </section>
    </main>
  );
}
