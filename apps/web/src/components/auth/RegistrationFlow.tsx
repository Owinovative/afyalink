"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Feedback } from "@/components/ui/Feedback";
import { Field, formValues, TextArea } from "@/components/ui/Forms";
import { apiRequest, asRecord } from "@/lib/api/client";

type AuthMode = "professional" | "student" | "facility";

function titleFor(mode: AuthMode) {
  switch (mode) {
    case "professional": return "Professional Application";
    case "student": return "Student Registration";
    case "facility": return "Facility Onboarding";
  }
}

function bodyFor(mode: AuthMode) {
  switch (mode) {
    case "professional": return "Create your secure account to build your clinical profile.";
    case "student": return "Start early. Your profile publishes upon license conversion.";
    case "facility": return "Create admin access. Approval unlocks the talent pool.";
  }
}

// Helper to determine step number
function getStepNumber(status: string) {
  if (status === "draft") return 1;
  if (status === "payment_pending") return 2;
  if (status === "payment_verified") return 3;
  if (status === "password_created" || status === "email_verification_pending") return 4;
  return 5; // Complete
}

export function RegistrationFlow({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [registration, setRegistration] = useState<Record<string, unknown> | null>(null);
  const [pricing, setPricing] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stk" | "paybill">("stk");
  
  // UI States for Polish
  const [otpFocused, setOtpFocused] = useState(false);

  const currentStep = getStepNumber(status);
  const priceDetails = pricing ? asRecord(pricing[mode]) : null;

  useEffect(() => {
    apiRequest("/api/registration/pricing", { method: "GET" })
      .then((res) => setPricing(asRecord(asRecord(res).data).pricing as Record<string, unknown>))
      .catch(() => {});
  }, []);

  async function refreshStatus() {
    if (!reference) return;
    setBusy(true);
    setError("");
    try {
      const data = asRecord(await apiRequest(`/api/registration/${reference}`, { method: "GET" }));
      const reg = asRecord(data.registration);
      setRegistration(reg);
      setStatus(String(reg.status));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not fetch status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = asRecord(
        await apiRequest("/api/registration/start", {
          method: "POST",
          body: { ...formValues(event), account_type: mode },
        })
      );
      const reg = asRecord(data.registration);
      setRegistration(reg);
      setReference(String(reg.registration_reference));
      setStatus(String(reg.status));
      window.scrollTo(0, 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start registration.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const values = formValues(event);
    try {
      if (paymentMethod === "stk") {
        await apiRequest(`/api/registration/${reference}/stk`, {
          method: "POST",
          body: { phone_number: values.phone_number },
        });
        setMessage("STK Push sent to your phone. Please complete the prompt, then click Refresh Status.");
      } else {
        await apiRequest(`/api/registration/${reference}/paybill`, {
          method: "POST",
          body: { reference: values.paybill_reference, payer_phone: values.payer_phone },
        });
        setMessage("Payment reference submitted. Click Refresh Status to check verification.");
      }
      await refreshStatus();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit payment.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = asRecord(
        await apiRequest(`/api/registration/${reference}/password`, {
          method: "POST",
          body: formValues(event),
        })
      );
      const reg = asRecord(data.registration);
      setRegistration(reg);
      setStatus(String(reg.status));
      window.scrollTo(0, 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = asRecord(
        await apiRequest(`/api/registration/${reference}/otp/verify`, {
          method: "POST",
          body: formValues(event),
        })
      );
      const reg = asRecord(data.registration);
      setRegistration(reg);
      setStatus(String(reg.status));
      window.scrollTo(0, 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResendOtp() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/registration/${reference}/otp/resend`, { method: "POST" });
      setMessage("A new verification code has been sent to your email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resend code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: "100%" }}>
      
      {/* Premium Step Tracker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        {[
          { num: 1, label: "Details" },
          { num: 2, label: "Payment" },
          { num: 3, label: "Secure" },
          { num: 4, label: "Verify" }
        ].map((step, i) => (
          <div key={step.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
              opacity: currentStep >= step.num ? 1 : 0.4,
              transition: "all 0.4s ease"
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: currentStep >= step.num ? "var(--teal)" : "var(--paper)",
                border: currentStep >= step.num ? "none" : "2px solid var(--line-strong)",
                color: currentStep >= step.num ? "#fff" : "var(--ink-soft)",
                fontSize: "0.85rem", fontWeight: 700,
                boxShadow: currentStep === step.num ? "0 0 0 4px rgba(3, 152, 158, 0.15)" : "none"
              }}>
                {currentStep > step.num ? "✓" : step.num}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: currentStep >= step.num ? "var(--ink-strong)" : "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {step.label}
              </span>
            </div>
            {i < 3 && (
              <div style={{
                height: "2px", flex: 1, margin: "0 12px", borderRadius: "2px", alignSelf: "flex-start", marginTop: "15px",
                background: currentStep > step.num ? "var(--teal)" : "var(--line)",
                transition: "all 0.4s ease"
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Dynamic Header based on Step */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          {currentStep === 1 ? titleFor(mode) : 
           currentStep === 2 ? "Registration Payment" : 
           currentStep === 3 ? "Secure Your Account" : 
           currentStep === 4 ? "Verify Your Email" : "Registration Complete"}
        </h2>
        <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "0.95rem" }}>
          {currentStep === 1 ? bodyFor(mode) : 
           currentStep === 2 ? "Complete the one-time verification fee to proceed." : 
           currentStep === 3 ? "Create a strong password for your workspace." : 
           currentStep === 4 ? "Enter the 6-digit code sent to your email." : "Your account is fully set up."}
        </p>
      </div>

      {error ? <Feedback message={error} tone="error" /> : null}
      {message ? <Feedback message={message} tone="success" /> : null}

      {/* STEP 1: DRAFT (Details) */}
      {currentStep === 1 && (
        <form className="form-grid" onSubmit={handleStart} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field label={mode === "facility" ? "Owner full name" : "Full name"} name="name" required autoComplete="name" />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label={mode === "facility" ? "Owner/facility phone" : "Phone"} name="phone" required autoComplete="tel" inputMode="tel" />

          {mode === "professional" && (
            <div style={{ background: "var(--mist)", padding: "12px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
              Licensed profile fields (CPD, credentials) will be completed inside your portal after account creation.
            </div>
          )}

          {mode === "student" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-strong)" }}>Student or graduate status</label>
                <select name="student_status" required defaultValue="completed_training_waiting_license" style={{ padding: "12px", borderRadius: "var(--radius-md)", border: "2px solid var(--line-strong)", outline: "none", background: "#fff" }}>
                  <option value="in_training">Currently in training</option>
                  <option value="completed_training_waiting_license">Completed, waiting for license</option>
                </select>
              </div>
              <Field label="Target profession" name="target_profession" required placeholder="Registered Nurse..." />
              <Field label="Institution name" name="institution_name" required />
              <Field label="Programme or course" name="programme_or_course" required />
              <Field label="Graduation/completion date" name="graduation_or_completion_date" type="date" />
              <Field label="Expected regulatory body" name="expected_regulatory_body" />
              <Field label="County or location" name="county" required />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-strong)" }}>Placement type after license</label>
                <select name="placement_type" defaultValue="" style={{ padding: "12px", borderRadius: "var(--radius-md)", border: "2px solid var(--line-strong)", outline: "none", background: "#fff" }}>
                  <option value="">Choose later</option>
                  <option value="full_time">Full time</option>
                  <option value="locum">Locum</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <Field label="Availability after licensure" name="availability_after_licensure" />
              <TextArea label="Short note" name="notes" placeholder="Optional context for review." />
              <div style={{ background: "var(--mist)", padding: "12px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                Students are not visible to facilities until their license conversion is approved.
              </div>
            </>
          )}

          {mode === "facility" && (
            <>
              <Field label="Facility legal name" name="legal_name" required autoComplete="organization" />
              <Field label="Display name" name="display_name" required />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-strong)" }}>Facility type</label>
                <select name="facility_type" required defaultValue="" style={{ padding: "12px", borderRadius: "var(--radius-md)", border: "2px solid var(--line-strong)", outline: "none", background: "#fff" }}>
                  <option value="" disabled>Select type</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Field label="Registration or license number" name="registration_number" />
              <Field label="County" name="county" required />
              <Field label="City or town" name="location" />
              <Field label="Contact person" name="contact_person" required />
              <TextArea label="Physical address" name="physical_address" placeholder="Building, road, area." />
            </>
          )}

          <div style={{ marginTop: "16px" }}>
            <button 
              type="submit" 
              disabled={busy}
              style={{ 
                width: "100%", padding: "14px", borderRadius: "var(--radius-md)", 
                background: busy ? "var(--ink-soft)" : "linear-gradient(135deg, var(--teal), var(--deep))",
                color: "#fff", fontSize: "1.05rem", fontWeight: 600, border: "none",
                cursor: busy ? "not-allowed" : "pointer", transition: "all 0.3s ease",
                boxShadow: busy ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
              }}
            >
              {busy ? (
                <><div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Saving Details...</>
              ) : "Continue to Payment →"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PAYMENT PENDING */}
      {currentStep === 2 && (
        <form style={{ display: "flex", flexDirection: "column", gap: "20px" }} onSubmit={handlePayment}>
          <div style={{ background: "linear-gradient(135deg, var(--deep), var(--ink-strong))", padding: "24px", borderRadius: "var(--radius-lg)", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--teal-soft)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Total Due Today</span>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "#fff", lineHeight: 1, marginTop: "8px" }}>
              {priceDetails ? `${priceDetails.currency} ${Number(priceDetails.amount_cents) / 100}` : "..."}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div 
              onClick={() => setPaymentMethod("stk")}
              style={{ 
                padding: "20px", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.2s ease",
                border: paymentMethod === "stk" ? "2px solid var(--teal)" : "2px solid var(--line)", 
                background: paymentMethod === "stk" ? "rgba(3, 152, 158, 0.05)" : "#fff",
                boxShadow: paymentMethod === "stk" ? "0 4px 12px rgba(3, 152, 158, 0.1)" : "none"
              }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📱</div>
              <strong style={{ display: "block", color: "var(--ink-strong)", marginBottom: "4px" }}>M-PESA Prompt</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: 1.4, display: "block" }}>Send a payment prompt directly to your phone.</span>
            </div>
            <div 
              onClick={() => setPaymentMethod("paybill")}
              style={{ 
                padding: "20px", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.2s ease",
                border: paymentMethod === "paybill" ? "2px solid var(--teal)" : "2px solid var(--line)", 
                background: paymentMethod === "paybill" ? "rgba(3, 152, 158, 0.05)" : "#fff",
                boxShadow: paymentMethod === "paybill" ? "0 4px 12px rgba(3, 152, 158, 0.1)" : "none"
              }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🧾</div>
              <strong style={{ display: "block", color: "var(--ink-strong)", marginBottom: "4px" }}>Manual Paybill</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: 1.4, display: "block" }}>I already paid and have a transaction code.</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            {paymentMethod === "stk" ? (
              <Field label="M-PESA Phone Number" name="phone_number" inputMode="tel" defaultValue={String(registration?.phone ?? "")} />
            ) : (
              <>
                <Field label="M-PESA Transaction Code" name="paybill_reference" placeholder="e.g. QKZ8L9M3N" />
                <Field label="Phone number used to pay" name="payer_phone" inputMode="tel" />
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            <button 
              type="submit" disabled={busy}
              style={{ 
                padding: "14px", borderRadius: "var(--radius-md)", 
                background: busy ? "var(--ink-soft)" : "linear-gradient(135deg, var(--teal), var(--deep))",
                color: "#fff", fontSize: "1.05rem", fontWeight: 600, border: "none",
                cursor: busy ? "not-allowed" : "pointer", transition: "all 0.3s ease",
                boxShadow: busy ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
              }}
            >
              {busy ? (
                <><div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Processing...</>
              ) : paymentMethod === "stk" ? "Send M-PESA Prompt" : "Submit Receipt"}
            </button>
            <button 
              type="button" onClick={refreshStatus} disabled={busy}
              style={{ 
                padding: "14px", borderRadius: "var(--radius-md)", background: "transparent",
                color: "var(--ink-strong)", fontSize: "1rem", fontWeight: 600, border: "2px solid var(--line-strong)",
                cursor: busy ? "not-allowed" : "pointer", transition: "all 0.2s ease"
              }}
            >
              ↻ Refresh Payment Status
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PASSWORD CREATION */}
      {currentStep === 3 && (
        <form style={{ display: "flex", flexDirection: "column", gap: "20px" }} onSubmit={handlePassword}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#065f46", padding: "16px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "12px", fontWeight: 600 }}>
            <span style={{ fontSize: "1.5rem" }}>✓</span> Payment verified successfully.
          </div>
          <Field
            label="Create Password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={10}
            pattern="(?=.*[A-Za-z])(?=.*\d).{10,}"
            title="Use at least 10 characters with letters and numbers."
          />
          <Field
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            required
            autoComplete="new-password"
            minLength={10}
          />
          <button 
            type="submit" disabled={busy}
            style={{ 
              marginTop: "12px", padding: "14px", borderRadius: "var(--radius-md)", 
              background: busy ? "var(--ink-soft)" : "linear-gradient(135deg, var(--teal), var(--deep))",
              color: "#fff", fontSize: "1.05rem", fontWeight: 600, border: "none",
              cursor: busy ? "not-allowed" : "pointer", transition: "all 0.3s ease",
              boxShadow: busy ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)",
              display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
            }}
          >
            {busy ? (
              <><div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Securing...</>
            ) : "Save Password & Continue"}
          </button>
        </form>
      )}

      {/* STEP 4: OTP VERIFICATION */}
      {currentStep === 4 && (
        <form style={{ display: "flex", flexDirection: "column", gap: "24px" }} onSubmit={handleOtp}>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
             <label style={{ fontSize: "1rem", color: "var(--ink-strong)", marginBottom: "16px", display: "block" }}>
               Enter the 6-digit code sent to<br/><strong style={{ color: "var(--teal)" }}>{String(registration?.email ?? "your email")}</strong>
             </label>
             <input 
                name="code" 
                required 
                inputMode="numeric" 
                pattern="\d{6}" 
                title="Enter the 6-digit code"
                placeholder="• • • • • •"
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
                style={{ 
                  fontSize: "2.5rem", letterSpacing: "0.25em", textAlign: "center", 
                  padding: "16px", fontWeight: 800, width: "100%", maxWidth: "340px", margin: "0 auto", display: "block",
                  borderRadius: "var(--radius-md)", outline: "none", color: "var(--ink-strong)",
                  border: `2px solid ${otpFocused ? "var(--teal)" : "var(--line-strong)"}`,
                  boxShadow: otpFocused ? "0 0 0 4px rgba(3, 152, 158, 0.15)" : "none",
                  transition: "all 0.2s ease", background: "#fff"
                }} 
             />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "340px", margin: "0 auto", width: "100%" }}>
            <button 
              type="submit" disabled={busy}
              style={{ 
                padding: "14px", borderRadius: "var(--radius-md)", 
                background: busy ? "var(--ink-soft)" : "linear-gradient(135deg, var(--teal), var(--deep))",
                color: "#fff", fontSize: "1.05rem", fontWeight: 600, border: "none",
                cursor: busy ? "not-allowed" : "pointer", transition: "all 0.3s ease",
                boxShadow: busy ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
              }}
            >
              {busy ? (
                <><div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Verifying...</>
              ) : "Verify Email"}
            </button>
            <button 
              type="button" onClick={handleResendOtp} disabled={busy}
              style={{ 
                padding: "14px", borderRadius: "var(--radius-md)", background: "transparent",
                color: "var(--ink-soft)", fontSize: "0.95rem", fontWeight: 600, border: "none",
                cursor: busy ? "not-allowed" : "pointer", transition: "all 0.2s ease"
              }}
            >
              Resend Code
            </button>
          </div>
        </form>
      )}

      {/* STEP 5: DONE */}
      {currentStep === 5 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto" }}>
            ✓
          </div>
          <h3 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", marginBottom: "12px", letterSpacing: "-0.02em" }}>Registration Complete!</h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", maxWidth: "400px", margin: "0 auto 32px auto", lineHeight: 1.6 }}>
            {status === "approval_pending" 
              ? "Your facility is now pending admin approval. You will receive an email once your workspace is unlocked." 
              : "Your secure workspace is ready. You can now log in."}
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link 
              href="/auth/login" 
              style={{ 
                padding: "14px 32px", borderRadius: "var(--radius-md)", textDecoration: "none",
                background: "linear-gradient(135deg, var(--teal), var(--deep))",
                color: "#fff", fontSize: "1.05rem", fontWeight: 600,
                boxShadow: "0 4px 15px rgba(3, 152, 158, 0.3)", transition: "all 0.3s ease"
              }}
            >
              Go to Login Page
            </Link>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
