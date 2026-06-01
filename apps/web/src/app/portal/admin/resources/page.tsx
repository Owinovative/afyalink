"use client";

export default function SuperAdminResources() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
        <div>
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Super Admin Key</span>
          <h1 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", margin: 0, letterSpacing: "-0.02em" }}>
            Content & Downloads Manager
          </h1>
        </div>
        <button className="button">
          + Upload New Resource
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.7fr)", gap: "24px" }}>
        
        {/* Left: Document Library */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Active Documents</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Data Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "1rem", color: "var(--ink-strong)" }}>2026 National Clinical Guidelines</strong>
                  <span className="badge green">Public</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Uploaded: June 1, 2026 • 243 Downloads</span>
              </div>
              <button className="button ghost" style={{ color: "var(--rose)" }}>Delete</button>
            </div>

            {/* Data Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "1rem", color: "var(--ink-strong)" }}>Facility Onboarding Packet v4</strong>
                  <span className="badge warning">Private - Facilities Only</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Uploaded: May 15, 2026 • 12 Downloads</span>
              </div>
              <button className="button ghost" style={{ color: "var(--rose)" }}>Delete</button>
            </div>

          </div>
        </div>

        {/* Right: Upload Form */}
        <div className="card" style={{ background: "var(--mist)", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 16px 0" }}>Upload Interface</h2>
          
          <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label>
              Document Title
              <input type="text" placeholder="e.g. Q3 Healthcare Report" required />
            </label>
            
            <label>
              Access Level
              <select required style={{ cursor: "pointer" }}>
                <option value="public">Public (Everyone)</option>
                <option value="private_all">Private (All Logged-in Users)</option>
                <option value="private_professional">Private (Professionals Only)</option>
                <option value="private_facility">Private (Facilities Only)</option>
              </select>
            </label>

            <label>
              File (PDF, DOCX)
              <div style={{ border: "2px dashed var(--line-strong)", borderRadius: "var(--radius-sm)", padding: "24px", textAlign: "center", background: "#fff", cursor: "pointer", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                Click to browse or drag file here
              </div>
            </label>

            <button type="submit" className="button full" style={{ marginTop: "8px" }}>
              Publish Resource
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
