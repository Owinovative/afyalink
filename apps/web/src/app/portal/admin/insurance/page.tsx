"use client";

import { useState } from "react";
import Link from "next/link";
import "@/app/portal/portal-utilities.css";

// Simulated Backend Data matching our Polymorphic Schema
const mockPolicies = [
  { id: "AFL-INS-8F2D1A", type: "family", owner: "John Doe", category: "Public B2C", premium: 8500, status: "verifying", date: "2026-06-05" },
  { id: "AFL-INS-B39E4C", type: "indemnity", owner: "Dr. Alex Mwangi", category: "Professional", premium: 1500, status: "approved", date: "2026-06-06" },
  { id: "AFL-INS-C77X9P", type: "corporate", owner: "Aga Khan Hospital", category: "Facility B2B", premium: 142000, status: "flagged", date: "2026-06-06" },
  { id: "AFL-INS-9L2M1Z", type: "individual", owner: "Jane Smith", category: "Public B2C", premium: 4500, status: "approved", date: "2026-06-04" },
  { id: "AFL-INS-1X8P2K", type: "indemnity", owner: "City Health Clinic", category: "Facility B2B", premium: 32000, status: "verifying", date: "2026-06-03" },
];

export default function AdminInsuranceOverview() {
  const [filter, setFilter] = useState("all");

  const filteredPolicies = mockPolicies.filter(p => filter === "all" || p.status === filter || p.category.toLowerCase().includes(filter));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fadeIn 0.4s ease" }}>

      
      {/* 1. Page Header & Efficiency Score */}
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1 className="display-font" style={{ fontSize: "2.25rem", color: "var(--ink-strong)", margin: "0 0 8px 0", lineHeight: 1.1 }}>
            Claims & Underwriting
          </h1>
          <p style={{ color: "var(--ink)", fontSize: "1rem", margin: 0 }}>
            Manage and track healthcare insurance policies and claims.
          </p>
        </div>
        
        {/* Efficiency Score Widget */}
        <div style={{ 
          background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-xl)", 
          padding: "12px 16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--shadow-soft)" 
        }}>
          <div style={{ position: "relative", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--line)" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--deep-2)" strokeWidth="8" strokeDasharray="283" strokeDashoffset="28" strokeLinecap="round" />
            </svg>
            <span style={{ position: "absolute", fontSize: "0.85rem", fontWeight: 700, color: "var(--deep-2)" }}>92</span>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, margin: "0 0 2px 0" }}>Efficiency Score</p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-strong)", margin: 0 }}>Excellent processing rate</p>
          </div>
        </div>
      </header>

      {/* 2. Filters & Search Bar */}
      <section style={{ 
        display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between", 
        background: "var(--white)", padding: "16px", borderRadius: "var(--radius-xl)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" 
      }}>
        <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "400px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "20px" }}>search</span>
          <input 
            type="text" 
            placeholder="Search Policy ID, Provider, or Client..." 
            style={{ width: "100%", padding: "10px 16px 10px 40px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", color: "var(--ink-strong)", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto" }} className="hide-scrollbar">
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "var(--radius-md)", background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>filter_list</span> Filter
          </button>
          <div style={{ height: "24px", width: "1px", background: "var(--line-strong)", margin: "0 4px" }} />
          
          {["all", "verifying", "approved", "flagged"].map((f) => (
            <button 
              key={f} onClick={() => setFilter(f)}
              style={{ 
                padding: "6px 16px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", fontWeight: filter === f ? 600 : 500, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap",
                background: filter === f ? "var(--line)" : "transparent", color: filter === f ? "var(--ink-strong)" : "var(--ink)", border: "none", transition: "all 0.2s ease" 
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Claims / Policy Data Table */}
      <section style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-soft)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }} className="custom-scrollbar">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", background: "rgba(247, 249, 251, 0.5)" }}>
                <th style={{ padding: "16px 24px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600 }}>Policy / Claim ID</th>
                <th style={{ padding: "16px 24px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600 }}>Entity / Provider</th>
                <th style={{ padding: "16px 24px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "16px 24px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600, textAlign: "right" }}>Premium / Amount</th>
                <th style={{ padding: "16px 24px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "16px 24px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy) => {
                // Determine Row Styling based on Status
                let statusBg = "var(--line)";
                let statusColor = "var(--ink)";
                let dotColor = "var(--muted)";
                let rowBg = "transparent";
                
                if (policy.status === "approved") {
                  statusBg = "rgba(0, 133, 91, 0.1)";
                  statusColor = "var(--deep-2)";
                  dotColor = "var(--deep-2)";
                } else if (policy.status === "flagged") {
                  statusBg = "#FFFBEB";
                  statusColor = "#D97706";
                  dotColor = "#D97706";
                  rowBg = "rgba(245, 158, 11, 0.03)";
                }

                return (
                  <tr key={policy.id} className="hover-row" style={{ borderBottom: "1px solid var(--line)", transition: "background 0.2s ease", backgroundColor: rowBg }}>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--teal)" }}>{policy.id}</span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-strong)", border: "1px solid var(--line-strong)" }}>
                          {policy.owner.charAt(0)}
                        </div>
                        <span style={{ fontSize: "0.9rem", color: "var(--ink-strong)", fontWeight: 500 }}>{policy.owner}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ fontSize: "0.9rem", color: "var(--ink)" }}>{policy.category}</span>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span style={{ fontSize: "0.9rem", color: "var(--ink-strong)", fontWeight: 600 }}>KES {policy.premium.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: statusBg, color: statusColor, fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize", border: policy.status === "flagged" ? "1px solid #FDE68A" : "none" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor }} />
                        {policy.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      <button className="action-btn" style={{ background: "transparent", border: "none", color: policy.status === "flagged" ? "#D97706" : "var(--teal)", cursor: "pointer", padding: "4px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{policy.status === "flagged" ? "warning" : "visibility"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line)", background: "rgba(247, 249, 251, 0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--ink)" }}>Showing {filteredPolicies.length} entries</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ width: "32px", height: "32px", borderRadius: "var(--radius-xs)", background: "var(--white)", border: "1px solid var(--line-strong)", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span></button>
            <button style={{ width: "32px", height: "32px", borderRadius: "var(--radius-xs)", background: "var(--teal)", border: "none", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>1</button>
            <button style={{ width: "32px", height: "32px", borderRadius: "var(--radius-xs)", background: "var(--white)", border: "1px solid var(--line-strong)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span></button>
          </div>
        </div>
      </section>
    </div>
  );
}
