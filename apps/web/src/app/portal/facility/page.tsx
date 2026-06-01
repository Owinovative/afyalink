import { MetricGrid, MetricCard } from "@/components/ui/Metrics";
import Link from "next/link";

export default function FacilityDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* 1. Welcome & Hiring Metrics */}
      <section>
        <h1 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          Facility Dashboard
        </h1>
        <MetricGrid>
          <MetricCard 
            title="Active Requisitions" 
            value="3" 
            trend="Searching network" 
            trendDirection="neutral" 
            status="neutral" 
          />
          <MetricCard 
            title="Shortlisted Candidates" 
            value="18" 
            trend="Ready for review" 
            trendDirection="up" 
            status="success" 
          />
          <MetricCard 
            title="Interviews Scheduled" 
            value="4" 
            trend="Next 7 days" 
            status="warning" 
          />
        </MetricGrid>
      </section>

      {/* 2. Premium 2-Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Left Card: Active Job Requisitions */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
          <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Open Roles</h2>
            <Link href="/portal/facility/requisitions/new" className="button secondary" style={{ padding: "4px 12px", minHeight: "28px", fontSize: "0.75rem" }}>+ Post Role</Link>
          </header>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--mist)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>ICU Registered Nurse</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Full-time • 5 matches</span>
                </div>
                <span className="badge green">Active</span>
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--mist)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Locum Pharmacist</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Weekend Shift • 12 matches</span>
                </div>
                <span className="badge green">Active</span>
             </div>
          </div>
          <button className="button ghost full" style={{ marginTop: "auto" }}>View All Requisitions</button>
        </div>

        {/* Right Card: Network Alerts */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
           <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Network Alerts</h2>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
             <div className="notice success" style={{ margin: 0 }}>2 new candidates match your ICU Nurse requisition.</div>
             <div className="notice warning" style={{ margin: 0 }}>Facility operating license expires in 45 days.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
