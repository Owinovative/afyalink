"use client";

import { MetricGrid, MetricCard } from "@/components/ui/Metrics";
import Link from "next/link";

export default function ProfessionalDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "40px" }}>
      
      {/* Cinematic Welcome Banner */}
      <section style={{ 
        background: "linear-gradient(135deg, var(--deep), #064e3b)", 
        borderRadius: "var(--radius-xl)", 
        padding: "clamp(24px, 4vw, 40px)", 
        color: "#fff",
        boxShadow: "var(--shadow-lift)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(3,152,158,0.3) 0%, transparent 70%)", borderRadius: "50%" }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ color: "var(--teal-soft)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Professional Portal
          </span>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", margin: "8px 0 12px 0", color: "#fff", letterSpacing: "-0.02em" }}>
            Your Profile is Secure.
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.05rem", margin: 0, maxWidth: "550px", lineHeight: 1.6 }}>
            Your statutory documents are currently watermarked and encrypted. Complete your CPD logs to boost your matching visibility by 45%.
          </p>
        </div>
      </section>

      {/* Metrics Grid */}
      <section>
        <MetricGrid>
          <MetricCard title="Verification Status" value="Vetted" trend="Verified by Board" status="success" />
          <MetricCard title="Profile Views" value="142" trend="↑ 18 this week" trendDirection="up" status="neutral" />
          <MetricCard title="Active Matches" value="7" trend="Ready for interview" status="warning" />
        </MetricGrid>
      </section>

      {/* Main Split Interface */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Document Vault Status Card */}
        <div className="card" style={{ background: "#fff", border: "1px solid var(--line)" }}>
          <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--ink-strong)" }}>Credential Vault</h2>
            <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Status of your uploaded regulatory certificates</span>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Doc Row 1 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "var(--paper)", borderRadius: "var(--radius-md)", border: "1px solid var(--line-strong)" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>National Practicing License</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Expires: Dec 2026</span>
              </div>
              <span className="badge green">Active & Audited</span>
            </div>
            
            {/* Doc Row 2 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "var(--paper)", borderRadius: "var(--radius-md)", border: "1px solid var(--line-strong)" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>Degree / Diploma Certificate</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Verified via Institution</span>
              </div>
              <span className="badge green">Active & Audited</span>
            </div>

            {/* Doc Row 3 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "var(--paper)", borderRadius: "var(--radius-md)", border: "1px solid var(--line-strong)" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>Current CPD Log Sheet</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Awaiting updates</span>
              </div>
              <span className="badge warning">Action Required</span>
            </div>
          </div>

          <button className="button secondary full" style={{ marginTop: "20px" }}>Update Documents</button>
        </div>

        {/* Live Placement Pipeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="card" style={{ background: "#fff", border: "1px solid var(--line)" }}>
            <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--ink-strong)" }}>Recent Placement Alerts</h2>
            </header>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", padding: "4px 0" }} className="hover-row">
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--teal)", marginTop: "6px" }} />
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Nairobi Hospital shortlisted you</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Role: Senior ICU Clinical Officer (Full-Time)</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Received 1 hour ago</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", padding: "4px 0" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--ink-soft)", marginTop: "6px" }} />
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Aga Khan University updated matching criteria</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Your profile matches their new emergency room pipeline expansion.</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Yesterday</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Learning & Downloads Integration */}
          <div className="card" style={{ background: "var(--mist)", border: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: "1.05rem", margin: "0 0 8px 0" }}>Knowledge Base Shortcut</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "16px" }}>
              The Super Admin published new professional licensing frameworks and study materials.
            </p>
            <Link href="/resources" className="button secondary full" style={{ background: "#fff", fontSize: "0.85rem", textAlign: "center" }}>
              Go to Resource Downloads
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
