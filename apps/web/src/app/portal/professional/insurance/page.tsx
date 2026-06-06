"use client";

import { useState } from "react";
import Link from "next/link";
import { MetricGrid, MetricCard } from "@/components/ui/Metrics"; // Ensure this matches your UI library path
import { Feedback } from "@/components/ui/Feedback";

export default function ProfessionalInsuranceDashboard() {
  const [busy, setBusy] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  // Simulated Authenticated User Data
  const user = {
    name: "Dr. Alex Mwangi",
    role: "Professional",
    isVerified: true,
    licenseNumber: "KMPDC-88492"
  };

  const handleOneClickApply = (planName: string) => {
    setBusy(planName);
    setSuccess("");
    // Simulate API call to the backend we just built
    setTimeout(() => {
      setBusy(null);
      setSuccess(`Successfully initiated coverage for ${planName}. Check your email for the policy document.`);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "40px", animation: "fadeIn 0.5s ease" }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      {/* Premium User Banner */}
      <section style={{ 
        background: "linear-gradient(135deg, var(--teal), var(--deep))", 
        borderRadius: "24px", 
        padding: "clamp(32px, 5vw, 48px)", 
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(3, 152, 158, 0.15)"
      }}>
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "6px 12px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Verified Profile Active
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--paper)", fontWeight: 600 }}>{user.licenseNumber}</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)", margin: "0 0 12px 0", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Protection & Indemnity.
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "1.1rem", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
            Because your profile is already verified by Afyalink, you bypass the paperwork. Access premium medical and malpractice cover instantly.
          </p>
        </div>
      </section>

      {success && <Feedback message={success} tone="success" />}

      {/* Active Coverage Tracker */}
      <section>
        <h2 style={{ fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "16px" }}>Your Active Policies</h2>
        <MetricGrid>
          <MetricCard 
            title="Professional Indemnity" 
            value="Inactive" 
            trend="Required for most Locum shifts." 
            status="warning" 
          />
          <MetricCard 
            title="Personal Health Cover" 
            value="Inactive" 
            trend="Protect yourself and dependents." 
            status="neutral" 
          />
        </MetricGrid>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "8px 0" }} />

      {/* 1-Click Marketplace */}
      <section>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--ink-strong)", marginBottom: "8px", letterSpacing: "-0.02em" }}>Exclusive Member Plans</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "1rem", margin: 0 }}>Partnered rates available only to verified Afyalink professionals.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
          
          {/* Plan 1: Malpractice / Indemnity */}
          <div style={{ background: "#fff", border: "1px solid var(--line-strong)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "20px" }}>
              ⚖️
            </div>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "8px" }}>Malpractice & Indemnity</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6, flex: 1, margin: "0 0 24px 0" }}>
              Up to KES 10M aggregate cover. Essential protection for clinical officers, nurses, and doctors taking independent locum shifts.
            </p>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink-strong)", marginBottom: "24px" }}>
              KES 1,500 <span style={{ fontSize: "0.9rem", color: "var(--ink-soft)", fontWeight: 500 }}>/ month</span>
            </div>
            <button 
              onClick={() => handleOneClickApply("Malpractice Indemnity")}
              disabled={busy !== null}
              style={{ 
                width: "100%", padding: "14px", borderRadius: "12px", background: busy === "Malpractice Indemnity" ? "var(--ink-soft)" : "var(--ink-strong)", 
                color: "#fff", fontSize: "1.05rem", fontWeight: 600, border: "none", cursor: busy ? "not-allowed" : "pointer"
              }}
            >
              {busy === "Malpractice Indemnity" ? "Processing..." : "1-Click Apply"}
            </button>
          </div>

          {/* Plan 2: Comprehensive Medical */}
          <div style={{ background: "#fff", border: "2px solid var(--teal)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 8px 30px rgba(3, 152, 158, 0.1)" }}>
            <div style={{ position: "absolute", top: "-14px", right: "24px", background: "var(--teal)", color: "#fff", padding: "4px 12px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Recommended
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "20px" }}>
              🏥
            </div>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "8px" }}>Comprehensive Health Cover</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6, flex: 1, margin: "0 0 24px 0" }}>
              Premium inpatient and outpatient cover. Includes maternity, optical, and dental. Add dependents easily after activation.
            </p>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink-strong)", marginBottom: "24px" }}>
              KES 4,500 <span style={{ fontSize: "0.9rem", color: "var(--ink-soft)", fontWeight: 500 }}>/ month</span>
            </div>
            <button 
              onClick={() => handleOneClickApply("Comprehensive Health Cover")}
              disabled={busy !== null}
              style={{ 
                width: "100%", padding: "14px", borderRadius: "12px", background: busy === "Comprehensive Health Cover" ? "var(--ink-soft)" : "var(--teal)", 
                color: "#fff", fontSize: "1.05rem", fontWeight: 600, border: "none", cursor: busy ? "not-allowed" : "pointer",
                boxShadow: busy === "Comprehensive Health Cover" ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)"
              }}
            >
              {busy === "Comprehensive Health Cover" ? "Processing..." : "1-Click Apply"}
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}
