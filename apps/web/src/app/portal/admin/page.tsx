"use client";

import { MetricGrid, MetricCard } from "@/components/ui/Metrics";

export default function AdminDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "40px" }}>
      
      {/* Premium Welcome Banner */}
      <section style={{ 
        background: "linear-gradient(135deg, var(--deep), var(--ink-strong))", 
        borderRadius: "var(--radius-xl)", 
        padding: "clamp(24px, 4vw, 40px)", 
        color: "#fff",
        boxShadow: "var(--shadow-lift)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle background glow effect */}
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(15,118,110,0.4) 0%, transparent 70%)", borderRadius: "50%" }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ color: "var(--teal-soft)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Command Center
          </span>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", margin: "8px 0 12px 0", color: "#fff", letterSpacing: "-0.02em" }}>
            Welcome back, Admin.
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.05rem", margin: 0, maxWidth: "500px", lineHeight: 1.6 }}>
            The system is fully operational. You have 12 pending registrations and 3 financial verifications requiring your attention today.
          </p>
        </div>
      </section>

      {/* Top Level Metrics */}
      <section>
        <MetricGrid>
          <MetricCard title="Total Professionals" value="1,248" trend="↑ 24 this week" trendDirection="up" status="success" />
          <MetricCard title="Verified Facilities" value="86" trend="↑ 2 this week" trendDirection="up" status="success" />
          <MetricCard title="Pending Approvals" value="15" trend="Requires Action" status="warning" />
        </MetricGrid>
      </section>

      {/* Main Content Split */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Left Column: Action Queue */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#fff", border: "1px solid var(--line)" }}>
          <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--ink-strong)" }}>Priority Queue</h2>
              <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Items awaiting review</span>
            </div>
          </header>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
             {/* Beautiful Data Row 1 */}
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)", transition: "all 0.2s ease", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--teal)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line-strong)"}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--cream)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>JD</div>
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>John Doe</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Professional Registration • M-PESA Pending</span>
                  </div>
                </div>
                <button className="button ghost" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>Review</button>
             </div>

             {/* Beautiful Data Row 2 */}
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)", transition: "all 0.2s ease", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--teal)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line-strong)"}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>AH</div>
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Aga Khan Hospital</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Facility Onboarding • Documents Uploaded</span>
                  </div>
                </div>
                <button className="button ghost" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>Review</button>
             </div>
          </div>
          
          <button className="button secondary full" style={{ marginTop: "8px" }}>View Full Queue</button>
        </div>

        {/* Right Column: System Logs & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="card" style={{ background: "#fff", border: "1px solid var(--line)" }}>
             <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--ink-strong)" }}>Recent Activity</h2>
            </header>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
               <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                 <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--teal)", marginTop: "6px" }} />
                 <div>
                   <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-strong)" }}>Jane Smith's license verified.</p>
                   <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>2 hours ago by Super Admin</span>
                 </div>
               </div>
               <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                 <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--rose)", marginTop: "6px" }} />
                 <div>
                   <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-strong)" }}>Payment #TXN-892 rejected.</p>
                   <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>4 hours ago by System</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ background: "var(--mist)", border: "1px solid var(--line)" }}>
             <header style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.15rem", margin: 0, color: "var(--ink-strong)" }}>Quick Actions</h2>
            </header>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button className="button secondary" style={{ background: "#fff", fontSize: "0.85rem" }}>Invite Facility</button>
              <button className="button secondary" style={{ background: "#fff", fontSize: "0.85rem" }}>Generate Report</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
