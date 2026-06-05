"use client";

import { MetricGrid, MetricCard } from "@/components/ui/Metrics";

export default function FacilityDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "40px" }}>
      
      {/* High-Impact Enterprise Welcome Banner */}
      <section style={{ 
        background: "linear-gradient(135deg, var(--deep), var(--ink-strong))", 
        borderRadius: "var(--radius-xl)", 
        padding: "clamp(24px, 4vw, 40px)", 
        color: "#fff",
        boxShadow: "var(--shadow-lift)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(15,118,110,0.4) 0%, transparent 70%)", borderRadius: "50%" }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ color: "var(--teal-soft)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Enterprise Workspace
          </span>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", margin: "8px 0 12px 0", color: "#fff", letterSpacing: "-0.02em" }}>
            Secure Facility Node
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.05rem", margin: 0, maxWidth: "550px", lineHeight: 1.6 }}>
            Your recruitment pipeline is highly optimized. You have checked credentials for 8 clinical matches this week with a perfect compliance rating.
          </p>
        </div>
      </section>

      {/* Metrics Grid */}
      <section>
        <MetricGrid>
          <MetricCard title="Active Requisitions" value="4 open" trend="Looking for talent" status="neutral" />
          <MetricCard title="Candidates Shortlisted" value="18" trend="↑ 4 pending review" status="warning" />
          <MetricCard title="Credential Audits" value="100%" trend="All profiles fully compliant" status="success" />
        </MetricGrid>
      </section>

      {/* Main Grid Splitting */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Left Column: Shortlisted Clinical Candidates */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#fff", border: "1px solid var(--line)" }}>
          <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--ink-strong)" }}>Hiring Pipeline</h2>
              <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Vetted professionals awaiting interview dates</span>
            </div>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Candidate Row 1 */}
            <div 
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)", transition: "all 0.2s ease", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--teal)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line-strong)"}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyCentent: "center", fontWeight: "bold", paddingLeft: "10px" }}>Dr</div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Dr. Alex Mwangi</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Specialist Anaesthetist • 8 Yrs Exp</span>
                </div>
              </div>
              <span className="badge green" style={{ fontSize: "0.75rem" }}>Fully Audited</span>
            </div>

            {/* Candidate Row 2 */}
            <div 
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)", transition: "all 0.2s ease", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--teal)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line-strong)"}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--cream)", color: "var(--gold)", display: "flex", alignItems: "center", justifyCentent: "center", fontWeight: "bold", paddingLeft: "11px" }}>Ns</div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Sister Mary Atieno</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Critical Care Nurse • KRN / KRCHN</span>
                </div>
              </div>
              <span className="badge green" style={{ fontSize: "0.75rem" }}>Fully Audited</span>
            </div>
          </div>

          <button className="button secondary full" style={{ marginTop: "8px" }}>Post a New Requisition</button>
        </div>

        {/* Right Column: Audit Logs & System Interactivity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="card" style={{ background: "#fff", border: "1px solid var(--line)" }}>
            <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--ink-strong)" }}>Security Audit Log</h2>
            </header>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--teal)", marginTop: "6px" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-strong)" }}>You accessed encrypted vault #VLT-042</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>10 minutes ago</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--teal)", marginTop: "6px" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-strong)" }}>Watermark cryptographic lock generated for candidate list</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Yesterday at 4:32 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Node */}
          <div className="card" style={{ background: "var(--mist)", border: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 8px 0", color: "var(--ink-strong)" }}>Need custom vetting?</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "16px", lineHeight: 1.5 }}>
              If you require specialized board checks outside our standard framework, submit a request directly to the Super Admin.
            </p>
            <button className="button full" style={{ background: "#fff", color: "var(--ink-strong)", border: "1px solid var(--line-strong)", fontSize: "0.85rem" }}>
              Contact Super Admin
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
