"use client";

import { useState } from "react";
import Link from "next/link";
import { MetricGrid, MetricCard } from "@/components/ui/Metrics";

// Simulated Backend Data based on our Polymorphic Schema
const mockPolicies = [
  { id: "AFL-INS-8F2D1A", type: "family", owner: "John Doe", category: "Public B2C", premium: 8500, status: "active", date: "2026-06-05" },
  { id: "AFL-INS-B39E4C", type: "indemnity", owner: "Dr. Alex Mwangi", category: "Professional", premium: 1500, status: "active", date: "2026-06-06" },
  { id: "AFL-INS-C77X9P", type: "corporate", owner: "Aga Khan Hospital", category: "Facility B2B", premium: 142000, status: "pending_payment", date: "2026-06-06" },
  { id: "AFL-INS-9L2M1Z", type: "individual", owner: "Jane Smith", category: "Public B2C", premium: 4500, status: "active", date: "2026-06-04" },
];

export default function AdminInsuranceOverview() {
  const [filter, setFilter] = useState("all");

  const filteredPolicies = mockPolicies.filter(p => filter === "all" || p.category.toLowerCase().includes(filter));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", animation: "fadeIn 0.4s ease" }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "var(--ink-strong)", letterSpacing: "-0.02em", margin: "0 0 8px 0" }}>Insurance Operations</h1>
          <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "1.05rem" }}>Monitor and manage Afyalink cover across all network tiers.</p>
        </div>
        <button style={{ padding: "12px 24px", background: "var(--teal)", color: "#fff", borderRadius: "8px", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(3, 152, 158, 0.2)" }}>
          Download Report ⬇️
        </button>
      </header>

      {/* High-Level Analytics */}
      <MetricGrid>
        <MetricCard 
          title="Total Monthly Premium" 
          value="KES 845,000" 
          trend="+12% from last month" 
          status="success" 
        />
        <MetricCard 
          title="Active Policies" 
          value="1,204" 
          trend="Across all tiers" 
          status="neutral" 
        />
        <MetricCard 
          title="Pending Corporate Payments" 
          value="3" 
          trend="Action required" 
          status="warning" 
        />
      </MetricGrid>

      {/* Policy Management Table */}
      <section style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--line-strong)", overflow: "hidden" }}>
        
        {/* Table Controls */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--paper)" }}>
          <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--ink-strong)" }}>Recent Underwriting</h2>
          
          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "public", "professional", "facility"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                style={{ 
                  padding: "8px 16px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                  background: filter === f ? "var(--ink-strong)" : "transparent",
                  color: filter === f ? "#fff" : "var(--ink-soft)",
                  border: filter === f ? "none" : "1px solid var(--line-strong)",
                  transition: "all 0.2s ease"
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* The Data Grid */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)", color: "var(--ink-soft)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Policy Ref</th>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Owner / Beneficiary</th>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Monthly Premium</th>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "16px 24px", fontWeight: 600, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} style={{ borderBottom: "1px solid var(--line)", transition: "background 0.2s ease" }} className="table-row-hover">
                  <td style={{ padding: "16px 24px", color: "var(--ink-strong)", fontWeight: 600, fontSize: "0.95rem" }}>
                    {policy.id}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <strong style={{ display: "block", color: "var(--ink-strong)", fontSize: "0.95rem", marginBottom: "4px" }}>{policy.owner}</strong>
                    <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem", textTransform: "capitalize" }}>{policy.type} Plan</span>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      background: policy.category === "Public B2C" ? "var(--paper)" : policy.category === "Professional" ? "rgba(3, 152, 158, 0.1)" : "rgba(15, 23, 42, 0.1)",
                      color: policy.category === "Public B2C" ? "var(--ink-strong)" : policy.category === "Professional" ? "var(--teal)" : "var(--deep)",
                      padding: "4px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700 
                    }}>
                      {policy.category}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", color: "var(--ink-strong)", fontWeight: 500 }}>
                    KES {policy.premium.toLocaleString()}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      color: policy.status === "active" ? "#10b981" : "#f59e0b",
                      fontSize: "0.85rem", fontWeight: 600, textTransform: "capitalize"
                    }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: policy.status === "active" ? "#10b981" : "#f59e0b" }} />
                      {policy.status.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <button style={{ background: "transparent", color: "var(--teal)", border: "1px solid var(--teal-soft)", padding: "6px 16px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <style>{`.table-row-hover:hover { background-color: var(--paper); }`}</style>
        </div>
      </section>

    </div>
  );
}
