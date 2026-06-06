"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { apiRequest, asRecord } from "@/lib/api/client";
import { Feedback } from "@/components/ui/Feedback";

type CoverType = "individual" | "family";
type Tier = "basic" | "standard" | "premium";

interface QuoteResult {
  number: string;
  premium: number;
  type: string;
}

export default function PublicQuoteFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    coverType: "individual" as CoverType,
    dependents: "0",
    tier: "standard" as Tier,
  });

  const handleNext = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      setStep(2);
      return;
    }
    
    if (step === 2) {
      setIsCalculating(true);
      try {
        // 🔥 THE REAL BACKEND CONNECTION
        const response = asRecord(
          await apiRequest("/api/insurance/public/quote", {
            method: "POST",
            body: formData,
          })
        );
        
        // Save the server-calculated result
        setQuoteResult(asRecord(response.policy) as unknown as QuoteResult);
        setStep(3);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to calculate quote. Please try again.");
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const inputStyle = {
    padding: "16px", borderRadius: "12px", border: "1px solid var(--line-strong)", 
    outlineColor: "var(--teal)", fontSize: "1rem", background: "#fff", transition: "all 0.2s ease", 
    width: "100%", color: "var(--ink-strong)"
  };

  const labelStyle = {
    display: "block", fontSize: "0.95rem", fontWeight: 600, color: "var(--ink-strong)", marginBottom: "8px"
  };

  return (
    <main style={{ backgroundColor: "var(--paper)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Minimal Header */}
      <header style={{ padding: "24px", background: "#fff", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <BrandLockup variant="compact" />
        </Link>
        <Link href="/insurance" style={{ color: "var(--ink-soft)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500 }}>
          Cancel
        </Link>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        
        <div style={{ 
          background: "#fff", width: "100%", maxWidth: "540px", borderRadius: "24px", 
          padding: "clamp(24px, 5vw, 48px)", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid var(--line)" 
        }}>
          
          {error && <div style={{ marginBottom: "20px" }}><Feedback message={error} tone="error" /></div>}

          {/* Step Indicator */}
          {step < 3 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
              <div style={{ height: "4px", flex: 1, background: "var(--teal)", borderRadius: "4px" }} />
              <div style={{ height: "4px", flex: 1, background: step >= 2 ? "var(--teal)" : "var(--line-strong)", borderRadius: "4px", transition: "background 0.3s ease" }} />
              <div style={{ height: "4px", flex: 1, background: step === 3 ? "var(--teal)" : "var(--line-strong)", borderRadius: "4px", transition: "background 0.3s ease" }} />
            </div>
          )}

          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
              <h1 style={{ fontSize: "2rem", color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: "8px" }}>Let's get to know you.</h1>
              <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", marginBottom: "32px" }}>Basic details to help us calculate your custom quote.</p>
              
              <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>Full Legal Name</label>
                  <input required type="text" placeholder="John Doe" style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input required type="email" placeholder="john@example.com" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input required type="tel" placeholder="07XX XXX XXX" style={inputStyle} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input required type="date" style={inputStyle} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>

                <button type="submit" style={{ 
                  marginTop: "16px", padding: "16px", borderRadius: "12px", background: "var(--teal)", 
                  color: "#fff", fontSize: "1.1rem", fontWeight: 600, border: "none", cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(3, 152, 158, 0.3)", transition: "transform 0.2s ease"
                }}>
                  Continue to Coverage →
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Coverage Details */}
          {step === 2 && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
              <h1 style={{ fontSize: "2rem", color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: "8px" }}>Tailor your plan.</h1>
              <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", marginBottom: "32px" }}>Select the coverage level that fits your needs.</p>
              
              <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Cover Type Selector */}
                <div>
                  <label style={labelStyle}>Who are we covering?</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div 
                      onClick={() => setFormData({...formData, coverType: "individual"})}
                      style={{ 
                        padding: "20px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
                        border: formData.coverType === "individual" ? "2px solid var(--teal)" : "1px solid var(--line-strong)",
                        background: formData.coverType === "individual" ? "rgba(3, 152, 158, 0.05)" : "#fff"
                      }}>
                      <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "8px" }}>👤</span>
                      <strong style={{ color: "var(--ink-strong)" }}>Just Me</strong>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, coverType: "family"})}
                      style={{ 
                        padding: "20px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
                        border: formData.coverType === "family" ? "2px solid var(--teal)" : "1px solid var(--line-strong)",
                        background: formData.coverType === "family" ? "rgba(3, 152, 158, 0.05)" : "#fff"
                      }}>
                      <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "8px" }}>👨‍👩‍👧‍👦</span>
                      <strong style={{ color: "var(--ink-strong)" }}>My Family</strong>
                    </div>
                  </div>
                </div>

                {formData.coverType === "family" && (
                  <div style={{ animation: "fadeIn 0.3s ease" }}>
                    <label style={labelStyle}>Number of Dependents (Spouse + Children)</label>
                    <select style={inputStyle} value={formData.dependents} onChange={e => setFormData({...formData, dependents: e.target.value})}>
                      <option value="1">1 Dependent</option>
                      <option value="2">2 Dependents</option>
                      <option value="3">3 Dependents</option>
                      <option value="4">4+ Dependents</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Preferred Inpatient Limit</label>
                  <select style={inputStyle} value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value as Tier})}>
                    <option value="basic">KES 500,000 (Basic)</option>
                    <option value="standard">KES 1,000,000 (Standard)</option>
                    <option value="premium">KES 5,000,000+ (Premium)</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setStep(1)} style={{ 
                    padding: "16px", borderRadius: "12px", background: "transparent", border: "1px solid var(--line-strong)", 
                    color: "var(--ink-strong)", fontSize: "1.1rem", fontWeight: 600, cursor: "pointer", width: "30%"
                  }}>
                    Back
                  </button>
                  <button type="submit" disabled={isCalculating} style={{ 
                    padding: "16px", borderRadius: "12px", background: isCalculating ? "var(--ink-soft)" : "var(--teal)", 
                    color: "#fff", fontSize: "1.1rem", fontWeight: 600, border: "none", cursor: isCalculating ? "not-allowed" : "pointer",
                    boxShadow: isCalculating ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
                  }}>
                    {isCalculating ? (
                      <><div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Calculating...</>
                    ) : "Generate Quote ✨"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: The Quote Result (Populated from the Backend) */}
          {step === 3 && quoteResult && (
            <div style={{ animation: "fadeIn 0.5s ease-out", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto" }}>
                ✓
              </div>
              <h1 style={{ fontSize: "2rem", color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: "8px" }}>Here is your quote, {formData.name.split(" ")[0]}.</h1>
              <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", marginBottom: "32px" }}>Policy Ref: <strong style={{ color: "var(--ink-strong)" }}>{quoteResult.number}</strong></p>
              
              <div style={{ background: "linear-gradient(135deg, var(--deep), var(--ink-strong))", borderRadius: "16px", padding: "32px", color: "#fff", marginBottom: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--teal-soft)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Estimated Monthly Premium</span>
                <div style={{ fontSize: "3.5rem", fontWeight: 800, margin: "12px 0", lineHeight: 1 }}>
                  <span style={{ fontSize: "1.5rem", verticalAlign: "middle", opacity: 0.8 }}>KES</span> {quoteResult.premium.toLocaleString()}
                </div>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", margin: 0 }}>Billed annually at KES {(quoteResult.premium * 12).toLocaleString()}.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button style={{ 
                  padding: "16px", borderRadius: "12px", background: "var(--teal)", color: "#fff", 
                  fontSize: "1.1rem", fontWeight: 600, border: "none", cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(3, 152, 158, 0.3)"
                }}>
                  Proceed to Payment Application
                </button>
                <button onClick={() => setStep(2)} style={{ 
                  padding: "16px", borderRadius: "12px", background: "transparent", border: "none", 
                  color: "var(--ink-soft)", fontSize: "1rem", fontWeight: 600, cursor: "pointer"
                }}>
                  Recalculate with different limits
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </main>
  );
}
