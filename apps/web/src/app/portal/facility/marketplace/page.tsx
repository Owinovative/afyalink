"use client";

import { useState } from "react";

// Mock Data representing verified professionals in your network
const mockTalent = [
  {
    id: "PRO-1",
    name: "Sarah Jenkins, RN",
    role: "ICU Specialist",
    rating: 4.9,
    shifts: 124,
    tags: ["BLS", "ACLS", "CCRN"],
    experience: "6 Years",
    location: "Local (5mi)",
    rate: "$82/hr",
    initials: "SJ",
  },
  {
    id: "PRO-2",
    name: "Dr. Marcus Cole",
    role: "ER Physician",
    rating: 5.0,
    shifts: 89,
    tags: ["Board Cert", "ATLS", "Top Rated"],
    experience: "11 Years",
    location: "Regional (15mi)",
    rate: "$210/hr",
    initials: "MC",
  },
  {
    id: "PRO-3",
    name: "Elena Rostova, NP",
    role: "Pediatrics",
    rating: 4.8,
    shifts: 56,
    tags: ["PALS", "NRP"],
    experience: "4 Years",
    location: "Local (8mi)",
    rate: "$95/hr",
    initials: "ER",
  },
];

export default function TalentMarketplace() {
  const [activeSpecialty, setActiveSpecialty] = useState("ICU");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", animation: "fadeIn 0.5s ease" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .talent-card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: var(--shadow-sm);
          position: relative;
        }
        .talent-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lift);
          border-color: var(--line-strong);
        }
        
        .primary-btn {
          width: 100%; padding: 12px; border-radius: 999px; background: var(--teal); color: #fff; 
          border: none; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
          display: flex; justify-content: center; alignItems: center; gap: 8px;
        }
        .primary-btn:hover { background: var(--deep); box-shadow: 0 4px 12px rgba(0, 103, 107, 0.2); }
        
        .ghost-btn {
          width: 100%; padding: 12px; border-radius: 999px; background: transparent; color: var(--teal); 
          border: 1px solid rgba(0, 103, 107, 0.3); font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
        }
        .ghost-btn:hover { background: rgba(0, 103, 107, 0.05); }

        .filter-tag {
          padding: 6px 14px; border-radius: 999px; border: 1px solid var(--line-strong); 
          font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; background: var(--white); color: var(--ink-soft);
        }
        .filter-tag.active {
          background: rgba(0, 103, 107, 0.1); border-color: var(--teal); color: var(--teal);
        }
      `}</style>

      {/* 1. Header & Insights Banner */}
      <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
          <div>
            <h1 className="display-font" style={{ fontSize: "2.25rem", color: "var(--ink-strong)", margin: "0 0 8px 0" }}>Talent Marketplace</h1>
            <p style={{ color: "var(--ink)", margin: 0, maxWidth: "600px" }}>Discover and deploy verified clinical professionals instantly to maintain operational excellence.</p>
          </div>
          <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "20px" }}>search</span>
            <input 
              type="text" 
              placeholder="Search specialties, names..." 
              style={{ width: "100%", padding: "10px 16px 10px 40px", background: "var(--white)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-md)", fontSize: "0.9rem" }}
            />
          </div>
        </div>

        {/* Premium Gradient Insights Banner */}
        <div style={{ 
          background: "linear-gradient(135deg, var(--ink-strong), var(--teal))", 
          borderRadius: "var(--radius-lg)", padding: "24px", color: "#fff", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px",
          boxShadow: "var(--shadow-soft)", position: "relative", overflow: "hidden"
        }}>
          {/* Decorative Pattern overlay */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", zIndex: 1 }}>
            <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined icon-filled" style={{ color: "#fff" }}>trending_up</span>
            </div>
            <div>
              <h3 className="display-font" style={{ fontSize: "1.2rem", color: "#fff", margin: "0 0 4px 0" }}>High Demand Alert: Critical Care</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", maxWidth: "500px" }}>ICU RN availability is down 12% regionally this week. Secure coverage early to avoid premium surge pricing.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", zIndex: 1 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", padding: "12px 20px", borderRadius: "12px" }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>Avg Rate</p>
              <p className="display-font" style={{ fontSize: "1.5rem", margin: 0, color: "#fff" }}>$85/hr</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", padding: "12px 20px", borderRadius: "12px" }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>Available</p>
              <p className="display-font" style={{ fontSize: "1.5rem", margin: 0, color: "#fff" }}>142</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Workspace (Sidebar + Grid) */}
      <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Filters Sidebar */}
        <aside style={{ 
          width: "280px", flexShrink: 0, background: "var(--white)", border: "1px solid var(--line)", 
          borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-sm)" 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>Filters</h3>
            <button style={{ background: "transparent", border: "none", color: "var(--teal)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>Reset</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Specialties Filter */}
            <div>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 700, margin: "0 0 12px 0" }}>Specialties</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["ICU", "ER", "Med-Surg", "Pediatrics", "Telemetry"].map(spec => (
                  <button 
                    key={spec} 
                    className={`filter-tag ${activeSpecialty === spec ? "active" : ""}`}
                    onClick={() => setActiveSpecialty(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 700, margin: "0 0 12px 0" }}>Availability</p>
              <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", background: "var(--paper)", color: "var(--ink-strong)", outline: "none" }}>
                <option>Immediate Start</option>
                <option>Next 7 Days</option>
                <option>Next 14 Days</option>
              </select>
            </div>
            
            {/* Experience Filter */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 700, margin: 0 }}>Experience</p>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--teal)" }}>3+ Years</span>
              </div>
              <input type="range" min="1" max="10" defaultValue="3" style={{ width: "100%", accentColor: "var(--teal)", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.75rem", color: "var(--muted)" }}>
                <span>1 yr</span>
                <span>10+ yrs</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Talent Grid */}
        <div style={{ flex: 1, minWidth: "300px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {mockTalent.map((talent) => (
            <div key={talent.id} className="talent-card">
              
              {/* Bookmark Icon */}
              <button style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>bookmark_border</span>
              </button>

              {/* Profile Head */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--cream)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 700, color: "var(--teal)" }}>
                    {talent.initials}
                  </div>
                  {/* Verified Badge */}
                  <div style={{ position: "absolute", bottom: "-4px", right: "-4px", background: "var(--deep-2)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }} title="Verified Credential">
                    <span className="material-symbols-outlined icon-filled" style={{ fontSize: "14px" }}>verified</span>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", margin: "0 0 4px 0", color: "var(--ink-strong)" }}>{talent.name}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: 600, margin: "0 0 4px 0" }}>{talent.role}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                    <span className="material-symbols-outlined icon-filled" style={{ fontSize: "14px", color: "var(--gold)" }}>star</span>
                    <span style={{ fontWeight: 700, color: "var(--ink-strong)" }}>{talent.rating}</span>
                    <span>({talent.shifts} shifts)</span>
                  </div>
                </div>
              </div>

              {/* Specs & Tags */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px", flex: 1 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                  {talent.tags.map(tag => (
                    <span key={tag} style={{ background: "var(--cream)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Experience</span>
                    <span style={{ fontWeight: 600, color: "var(--ink-strong)" }}>{talent.experience}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Location</span>
                    <span style={{ fontWeight: 600, color: "var(--ink-strong)" }}>{talent.location}</span>
                  </div>
                </div>
              </div>

              {/* Actions & Rate */}
              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--muted)" }}>Est. Rate</span>
                  <span className="display-font" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink-strong)" }}>{talent.rate}</span>
                </div>
                
                {talent.id === "PRO-3" ? (
                  <button className="ghost-btn">View Profile</button>
                ) : (
                  <button className="primary-btn">
                    Quick Hire <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
