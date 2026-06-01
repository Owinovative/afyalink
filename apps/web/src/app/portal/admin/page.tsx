import { MetricGrid, MetricCard } from "@/components/ui/Metrics";

export default function AdminDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* 1. Top Level Metrics */}
      <section>
        <h1 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          Command Center
        </h1>
        <MetricGrid>
          <MetricCard title="Pending Registrations" value="12" trend="Requires Review" status="warning" />
          <MetricCard title="Active Professionals" value="342" trend="↑ 14 this week" trendDirection="up" status="success" />
          <MetricCard title="Verified Facilities" value="48" trend="↑ 2 this week" trendDirection="up" status="success" />
        </MetricGrid>
      </section>

      {/* 2. Premium 2-Column Grid for smaller cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Left Card: Recent Applications */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
          <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Recent Applications</h2>
          </header>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
             {/* Example Data Row */}
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--mist)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>John Doe</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Registered Nurse</span>
                </div>
                <span className="badge warning">Pending</span>
             </div>
             {/* Example Data Row */}
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--mist)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ink-strong)" }}>Jane Smith</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Clinical Officer</span>
                </div>
                <span className="badge green">Verified</span>
             </div>
          </div>
          <button className="button secondary full" style={{ marginTop: "auto" }}>View All Applications</button>
        </div>

        {/* Right Card: System Alerts */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
           <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Action Items</h2>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
             <div className="notice warning" style={{ margin: 0 }}>3 payments require manual Paybill verification.</div>
             <div className="notice" style={{ margin: 0 }}>A new facility registration was submitted.</div>
          </div>
        </div>

      </div>

      {/* 3. Full Width Card for large tables/queues */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
         <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Facility Onboarding Queue</h2>
          </header>
          
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-soft)" }}>
            No facilities pending review at this time.
          </div>
      </div>

    </div>
  );
}
