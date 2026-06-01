import { MetricGrid, MetricCard } from "@/components/ui/Metrics";
import Link from "next/link";

export default function ProfessionalDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* 1. Welcome & Status Metrics */}
      <section>
        <h1 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          My Workspace
        </h1>
        <MetricGrid>
          <MetricCard 
            title="Profile Status" 
            value="Verified" 
            trend="Visible to facilities" 
            trendDirection="up" 
            status="success" 
          />
          <MetricCard 
            title="Profile Views" 
            value="14" 
            trend="This month" 
            trendDirection="neutral" 
            status="neutral" 
          />
          <MetricCard 
            title="Active Applications" 
            value="2" 
            trend="Awaiting response" 
            status="warning" 
          />
        </MetricGrid>
      </section>

      {/* 2. Premium 2-Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Left Card: Credential Vault */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
          <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Credential Vault</h2>
            <Link href="/portal/professional/credentials" className="button secondary" style={{ padding: "4px 12px", minHeight: "28px", fontSize: "0.75rem" }}>Update</Link>
          </header>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--mist)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Nursing Council License</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Expires: Oct 2027</span>
                </div>
                <span className="badge green">Valid</span>
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--mist)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>National ID</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Verified by Admin</span>
                </div>
                <span className="badge green">Valid</span>
             </div>
          </div>
        </div>

        {/* Right Card: Recommended Facilities or Alerts */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
           <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Action Items</h2>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
             <div className="notice success" style={{ margin: 0 }}>Your profile was recently viewed by Aga Khan Hospital.</div>
             <div className="notice" style={{ margin: 0 }}>Upload your latest CPD points to boost your ranking.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
