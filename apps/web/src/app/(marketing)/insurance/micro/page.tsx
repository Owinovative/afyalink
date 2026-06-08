"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { apiRequest, asRecord } from "@/lib/api/client";
import { Feedback } from "@/components/ui/Feedback";

type Livestock = { type: string; otherType?: string; quantity: string };

export default function MicroInsuranceWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quoteResult, setQuoteResult] = useState<Record<string, unknown> | null>(null);

  const [phone, setPhone] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");

  const [kycData, setKycData] = useState<Record<string, any>>({
    mobile_money_transactions: "",
    monthly_credit_usage: "",
    owns_livestock: false,
    livestock: [] as Livestock[],
    residence_ownership: "",
    dependents: "",
    primary_income_source: "",
    emergency_fund: false,
    chama_member: false,
    income_interruptions: "",
    education_level: "",
    farm_commercially: false,
    transportation: "",
    health_coverage: "",
    mobile_phones_in_household: "1",
    internet_usage: "",
    use_mobile_banking: false,
    bank_loan_history: false,
    preferred_language: "",
    age_bracket: "",
    marital_status: "",
    region_type: "",
  });

  const handleLivestockChange = (index: number, field: keyof Livestock, value: string) => {
    const updated = [...kycData.livestock];
    updated[index] = { ...updated[index], [field]: value };
    setKycData({ ...kycData, livestock: updated });
  };

  const addLivestock = () => {
    setKycData({
      ...kycData,
      livestock: [...kycData.livestock, { type: "Cattle", quantity: "1" }],
    });
  };

  const removeLivestock = (index: number) => {
    const updated = [...kycData.livestock];
    updated.splice(index, 1);
    setKycData({ ...kycData, livestock: updated });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = asRecord(
        await apiRequest("/api/insurance/micro/underwrite", {
          method: "POST",
          body: { phone, paymentFrequency, kycData },
        })
      );
      setQuoteResult(asRecord(response.quote));
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate quote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    padding: "16px", borderRadius: "12px", border: "1px solid var(--line-strong)", 
    outlineColor: "var(--teal)", fontSize: "1rem", background: "#fff", transition: "all 0.2s ease", 
    width: "100%", color: "var(--ink-strong)", marginBottom: "16px"
  };

  const labelStyle = {
    display: "block", fontSize: "0.95rem", fontWeight: 600, color: "var(--ink-strong)", marginBottom: "8px"
  };

  const renderStep1 = () => (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "24px", color: "var(--ink-strong)" }}>Financial Profile (1/3)</h2>
      
      <label style={labelStyle}>Phone Number (M-PESA Registered)</label>
      <input required type="tel" placeholder="07XX XXX XXX" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />

      <label style={labelStyle}>1. Monthly Mobile Money Transactions</label>
      <select required style={inputStyle} value={kycData.mobile_money_transactions} onChange={e => setKycData({...kycData, mobile_money_transactions: e.target.value})}>
        <option value="">Select...</option>
        <option value="0-4,999">0 - 4,999 KES</option>
        <option value="5,000-19,999">5,000 - 19,999 KES</option>
        <option value="20,000-49,999">20,000 - 49,999 KES</option>
        <option value="50,000+">50,000+ KES</option>
      </select>

      <label style={labelStyle}>2. Average Monthly Credit/Loan Usage</label>
      <select required style={inputStyle} value={kycData.monthly_credit_usage} onChange={e => setKycData({...kycData, monthly_credit_usage: e.target.value})}>
        <option value="">Select...</option>
        <option value="None">None</option>
        <option value="1-5,000">1 - 5,000 KES</option>
        <option value="5,001-20,000">5,001 - 20,000 KES</option>
        <option value="20,000+">20,000+ KES</option>
      </select>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>3. Do you own livestock?</label>
        <label style={{ marginRight: "16px" }}><input type="radio" checked={kycData.owns_livestock} onChange={() => setKycData({...kycData, owns_livestock: true})} /> Yes</label>
        <label><input type="radio" checked={!kycData.owns_livestock} onChange={() => setKycData({...kycData, owns_livestock: false})} /> No</label>
      </div>

      {kycData.owns_livestock && (
        <div style={{ padding: "16px", background: "var(--mist)", borderRadius: "12px", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px" }}>Livestock Details</h3>
          {kycData.livestock.map((ls: Livestock, i: number) => (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
              <select style={{...inputStyle, marginBottom: 0}} value={ls.type} onChange={e => handleLivestockChange(i, "type", e.target.value)}>
                <option value="Cattle">Cattle</option>
                <option value="Sheep">Sheep / Goats</option>
                <option value="Poultry">Poultry</option>
                <option value="Other">Other</option>
              </select>
              {ls.type === "Other" && (
                <input placeholder="Specify" style={{...inputStyle, marginBottom: 0}} value={ls.otherType || ""} onChange={e => handleLivestockChange(i, "otherType", e.target.value)} />
              )}
              <input type="number" min="1" style={{...inputStyle, marginBottom: 0, width: "80px"}} value={ls.quantity} onChange={e => handleLivestockChange(i, "quantity", e.target.value)} />
              <button type="button" onClick={() => removeLivestock(i)} style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addLivestock} style={{ color: "var(--teal)", background: "none", border: "1px solid var(--teal)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>+ Add Livestock</button>
        </div>
      )}

      <label style={labelStyle}>4. Primary Residence Ownership</label>
      <select required style={inputStyle} value={kycData.residence_ownership} onChange={e => setKycData({...kycData, residence_ownership: e.target.value})}>
        <option value="">Select...</option>
        <option value="Own">Own</option>
        <option value="Rent">Rent</option>
        <option value="Family">Family Owned</option>
      </select>

      <label style={labelStyle}>5. Number of Dependents</label>
      <select required style={inputStyle} value={kycData.dependents} onChange={e => setKycData({...kycData, dependents: e.target.value})}>
        <option value="">Select...</option>
        <option value="0">0</option>
        <option value="1-2">1 - 2</option>
        <option value="3-5">3 - 5</option>
        <option value="6+">6+</option>
      </select>

      <label style={labelStyle}>6. Primary Source of Income</label>
      <select required style={inputStyle} value={kycData.primary_income_source} onChange={e => setKycData({...kycData, primary_income_source: e.target.value})}>
        <option value="">Select...</option>
        <option value="Employment">Formal Employment</option>
        <option value="Business">Business / Trading</option>
        <option value="Farming">Farming</option>
        <option value="Remittances">Remittances / Family</option>
      </select>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>7. Do you have an emergency fund?</label>
        <label style={{ marginRight: "16px" }}><input type="radio" checked={kycData.emergency_fund} onChange={() => setKycData({...kycData, emergency_fund: true})} /> Yes</label>
        <label><input type="radio" checked={!kycData.emergency_fund} onChange={() => setKycData({...kycData, emergency_fund: false})} /> No</label>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "24px", color: "var(--ink-strong)" }}>Demographics (2/3)</h2>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>8. Are you part of a savings group / Chama?</label>
        <label style={{ marginRight: "16px" }}><input type="radio" checked={kycData.chama_member} onChange={() => setKycData({...kycData, chama_member: true})} /> Yes</label>
        <label><input type="radio" checked={!kycData.chama_member} onChange={() => setKycData({...kycData, chama_member: false})} /> No</label>
      </div>

      <label style={labelStyle}>9. How often do you experience income interruptions?</label>
      <select required style={inputStyle} value={kycData.income_interruptions} onChange={e => setKycData({...kycData, income_interruptions: e.target.value})}>
        <option value="">Select...</option>
        <option value="Rarely">Rarely</option>
        <option value="Sometimes">Sometimes</option>
        <option value="Frequently">Frequently</option>
      </select>

      <label style={labelStyle}>10. Highest Level of Education</label>
      <select required style={inputStyle} value={kycData.education_level} onChange={e => setKycData({...kycData, education_level: e.target.value})}>
        <option value="">Select...</option>
        <option value="None">None</option>
        <option value="Primary">Primary</option>
        <option value="Secondary">Secondary</option>
        <option value="Tertiary">Tertiary / University</option>
      </select>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>11. Do you farm crops commercially?</label>
        <label style={{ marginRight: "16px" }}><input type="radio" checked={kycData.farm_commercially} onChange={() => setKycData({...kycData, farm_commercially: true})} /> Yes</label>
        <label><input type="radio" checked={!kycData.farm_commercially} onChange={() => setKycData({...kycData, farm_commercially: false})} /> No</label>
      </div>

      <label style={labelStyle}>12. Main mode of transportation</label>
      <select required style={inputStyle} value={kycData.transportation} onChange={e => setKycData({...kycData, transportation: e.target.value})}>
        <option value="">Select...</option>
        <option value="Walking">Walking</option>
        <option value="Public">Public Transit (Matatu)</option>
        <option value="Motorcycle">Motorcycle (Boda Boda)</option>
        <option value="Car">Personal Car</option>
      </select>

      <label style={labelStyle}>13. Current Health Coverage Status</label>
      <select required style={inputStyle} value={kycData.health_coverage} onChange={e => setKycData({...kycData, health_coverage: e.target.value})}>
        <option value="">Select...</option>
        <option value="NHIF">National Health Fund (NHIF/SHIF)</option>
        <option value="Private">Private Insurance</option>
        <option value="None">None (Out of pocket)</option>
      </select>

      <label style={labelStyle}>14. Number of mobile phones in household</label>
      <input required type="number" min="0" style={inputStyle} value={kycData.mobile_phones_in_household} onChange={e => setKycData({...kycData, mobile_phones_in_household: e.target.value})} />
    </div>
  );

  const renderStep3 = () => (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "24px", color: "var(--ink-strong)" }}>Final Details (3/3)</h2>

      <label style={labelStyle}>15. Internet Usage Frequency</label>
      <select required style={inputStyle} value={kycData.internet_usage} onChange={e => setKycData({...kycData, internet_usage: e.target.value})}>
        <option value="">Select...</option>
        <option value="Daily">Daily</option>
        <option value="Weekly">Weekly</option>
        <option value="Rarely">Rarely / Never</option>
      </select>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>16. Do you use mobile banking apps?</label>
        <label style={{ marginRight: "16px" }}><input type="radio" checked={kycData.use_mobile_banking} onChange={() => setKycData({...kycData, use_mobile_banking: true})} /> Yes</label>
        <label><input type="radio" checked={!kycData.use_mobile_banking} onChange={() => setKycData({...kycData, use_mobile_banking: false})} /> No</label>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>17. Have you ever taken a formal bank loan?</label>
        <label style={{ marginRight: "16px" }}><input type="radio" checked={kycData.bank_loan_history} onChange={() => setKycData({...kycData, bank_loan_history: true})} /> Yes</label>
        <label><input type="radio" checked={!kycData.bank_loan_history} onChange={() => setKycData({...kycData, bank_loan_history: false})} /> No</label>
      </div>

      <label style={labelStyle}>18. Preferred Language for Communications</label>
      <select required style={inputStyle} value={kycData.preferred_language} onChange={e => setKycData({...kycData, preferred_language: e.target.value})}>
        <option value="">Select...</option>
        <option value="English">English</option>
        <option value="Swahili">Swahili</option>
        <option value="Local">Local Dialect</option>
      </select>

      <label style={labelStyle}>19. Age Bracket</label>
      <select required style={inputStyle} value={kycData.age_bracket} onChange={e => setKycData({...kycData, age_bracket: e.target.value})}>
        <option value="">Select...</option>
        <option value="18-25">18 - 25</option>
        <option value="26-35">26 - 35</option>
        <option value="36-50">36 - 50</option>
        <option value="50+">50+</option>
      </select>

      <label style={labelStyle}>20. Marital Status</label>
      <select required style={inputStyle} value={kycData.marital_status} onChange={e => setKycData({...kycData, marital_status: e.target.value})}>
        <option value="">Select...</option>
        <option value="Single">Single</option>
        <option value="Married">Married</option>
        <option value="Divorced">Divorced / Separated</option>
        <option value="Widowed">Widowed</option>
      </select>

      <label style={labelStyle}>21. Geographic Region Type</label>
      <select required style={inputStyle} value={kycData.region_type} onChange={e => setKycData({...kycData, region_type: e.target.value})}>
        <option value="">Select...</option>
        <option value="Urban">Urban City</option>
        <option value="PeriUrban">Peri-urban / Outskirts</option>
        <option value="Rural">Rural</option>
      </select>

      <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "2px dashed var(--line-strong)" }}>
        <label style={labelStyle}>22. Preferred Payment Frequency</label>
        <select required style={{...inputStyle, borderColor: "var(--teal)", borderWidth: "2px"}} value={paymentFrequency} onChange={e => setPaymentFrequency(e.target.value)}>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="half_yearly">Half-Yearly</option>
          <option value="annually">Annually</option>
        </select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ animation: "fadeIn 0.5s ease-out", textAlign: "center" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto" }}>
        ✓
      </div>
      <h1 style={{ fontSize: "2rem", color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: "8px" }}>Your Micro-Insurance Quote</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", marginBottom: "32px" }}>Notification sent to: <strong style={{ color: "var(--ink-strong)" }}>{phone}</strong></p>
      
      <div style={{ background: "linear-gradient(135deg, var(--teal), var(--deep))", borderRadius: "16px", padding: "32px", color: "#fff", marginBottom: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Total Premium ({paymentFrequency})</span>
        <div style={{ fontSize: "3.5rem", fontWeight: 800, margin: "12px 0", lineHeight: 1 }}>
          <span style={{ fontSize: "1.5rem", verticalAlign: "middle", opacity: 0.8 }}>KES</span> {quoteResult ? (Number(quoteResult.premium_cents) / 100).toLocaleString() : 0}
        </div>
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.9)", margin: 0 }}>
          Based on a clamped monthly base of KES {quoteResult ? (Number(quoteResult.monthly_base_cents) / 100).toLocaleString() : 0}.
        </p>
      </div>

      <button onClick={() => window.location.href = "/"} style={{ 
        padding: "16px", borderRadius: "12px", background: "var(--ink-strong)", color: "#fff", 
        fontSize: "1.1rem", fontWeight: 600, border: "none", cursor: "pointer", width: "100%",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
      }}>
        Return Home
      </button>
    </div>
  );

  return (
    <main style={{ backgroundColor: "var(--paper)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "24px", background: "#fff", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}><BrandLockup variant="compact" /></Link>
        <Link href="/insurance" style={{ color: "var(--ink-soft)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500 }}>Cancel</Link>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ background: "#fff", width: "100%", maxWidth: "540px", borderRadius: "24px", padding: "clamp(24px, 5vw, 48px)", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid var(--line)" }}>
          {error && <div style={{ marginBottom: "20px" }}><Feedback message={error} tone="error" /></div>}

          {step < 4 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
              <div style={{ height: "4px", flex: 1, background: "var(--teal)", borderRadius: "4px" }} />
              <div style={{ height: "4px", flex: 1, background: step >= 2 ? "var(--teal)" : "var(--line-strong)", borderRadius: "4px", transition: "background 0.3s ease" }} />
              <div style={{ height: "4px", flex: 1, background: step >= 3 ? "var(--teal)" : "var(--line-strong)", borderRadius: "4px", transition: "background 0.3s ease" }} />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {step < 4 && (
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                {step > 1 && (
                  <button type="button" onClick={() => { setStep(step - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "16px", borderRadius: "12px", background: "transparent", border: "1px solid var(--line-strong)", color: "var(--ink-strong)", fontSize: "1.1rem", fontWeight: 600, cursor: "pointer", width: "30%" }}>
                    Back
                  </button>
                )}
                <button type="submit" disabled={isSubmitting} style={{ padding: "16px", borderRadius: "12px", background: isSubmitting ? "var(--ink-soft)" : "var(--teal)", color: "#fff", fontSize: "1.1rem", fontWeight: 600, border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", boxShadow: isSubmitting ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)", flex: 1 }}>
                  {isSubmitting ? "Calculating..." : (step === 3 ? "Generate Quote ✨" : "Continue →")}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </main>
  );
}
