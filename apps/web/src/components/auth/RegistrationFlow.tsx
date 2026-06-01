"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { Feedback } from "@/components/ui/Feedback";
import { Field, formValues, TextArea } from "@/components/ui/Forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest, asRecord } from "@/lib/api/client";

type AuthMode = "professional" | "student" | "facility";

function titleFor(mode: AuthMode) {
  switch (mode) {
    case "professional": return "Professional application";
    case "student": return "Student early registration";
    case "facility": return "Facility onboarding";
  }
}

function bodyFor(mode: AuthMode) {
  switch (mode) {
    case "professional": return "Create an account and continue your profile.";
    case "student": return "Start early. Publication waits for license conversion.";
    case "facility": return "Create owner access. Approval unlocks browsing.";
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
    <section className="auth-card form-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="auth-card-brand">
        <BrandLockup kicker="Secure account" />
      </div>

      {/* Premium Step Tracker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
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
              transition: "all 0.3s ease"
            }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: currentStep >= step.num ? "var(--teal)" : "var(--line)",
                color: currentStep >= step.num ? "#fff" : "var(--ink)",
                fontSize: "0.8rem", fontWeight: 700,
                boxShadow: currentStep === step.num ? "0 0 0 4px var(--teal-soft)" : "none"
              }}>
                {currentStep > step.num ? "✓" : step.num}
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: currentStep >= step.num ? "var(--ink-strong)" : "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {step.label}
              </span>
            </div>
            {i < 3 && (
              <div style={{
                height: "2px", flex: 1, margin: "0 12px", borderRadius: "2px", alignSelf: "flex-start", marginTop: "13px",
                background: currentStep > step.num ? "var(--teal)" : "var(--line)",
                transition: "all 0.3s ease"
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Dynamic Header based on Step */}
      <div>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          {currentStep === 1 ? titleFor(mode) : 
           currentStep === 2 ? "Registration Payment" : 
           currentStep === 3 ? "Secure Your Account" : 
           currentStep === 4 ? "Verify Your Email" : "Registration Complete"}
        </h2>
        <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "0.95rem" }}>
          {currentStep === 1 ? bodyFor(mode) : 
           currentStep === 2 ? "Complete the one-time fee to proceed." : 
           currentStep === 3 ? "Create a strong password for your workspace." : 
           currentStep === 4 ? "Enter the 6-digit code sent to your email." : "Your account is ready."}
        </p>
      </div>

      {error ? <Feedback message={error} tone="error" /> : null}
      {message ? <Feedback message={message} tone="success" /> : null}

      {/* STEP 1: DRAFT (Details) */}
      {currentStep === 1 && (
        <form className="form-grid" onSubmit={handleStart}>
          <Field label={mode === "facility" ? "Owner full name" : "Full name"} name="name" required autoComplete="name" />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label={mode === "facility" ? "Owner/facility phone" : "Phone"} name="phone" required autoComplete="tel" inputMode="tel" />

          {mode === "professional" && (
            <p className="form-note full">Licensed profile fields continue after account creation.</p>
          )}

          {mode === "student" && (
            <>
              <label>
                Student or graduate status
                <select name="student_status" required defaultValue="completed_training_waiting_license">
                  <option value="in_training">Currently in training</option>
                  <option value="completed_training_waiting_license">Completed, waiting for license</option>
                </select>
              </label>
              <Field label="Target profession" name="target_profession" required placeholder="Registered Nurse..." />
              <Field label="Institution name" name="institution_name" required />
              <Field label="Programme or course" name="programme_or_course" required />
              <Field label="Graduation/completion date" name="graduation_or_completion_date" type="date" />
              <Field label="Expected regulatory body" name="expected_regulatory_body" />
              <Field label="County or location" name="county" required />
              <label>
                Placement type after license
                <select name="placement_type" defaultValue="">
                  <option value="">Choose later</option>
                  <option value="full_time">Full time</option>
                  <option value="locum">Locum</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
              <Field label="Availability after licensure" name="availability_after_licensure" />
              <TextArea label="Short note" name="notes" placeholder="Optional context for review." />
              <p className="form-note full">Students are not shown as licensed candidates until license conversion is reviewed.</p>
            </>
          )}

          {mode === "facility" && (
            <>
              <Field label="Facility legal name" name="legal_name" required autoComplete="organization" />
              <Field label="Display name" name="display_name" required />
              <label>
                Facility type
                <select name="facility_type" required defaultValue="">
                  <option value="" disabled>Select type</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <Field label="Registration or license number" name="registration_number" />
              <Field label="County" name="county" required />
              <Field label="City or town" name="location" />
              <Field label="Contact person" name="contact_person" required />
              <TextArea label="Physical address" name="physical_address" placeholder="Building, road, area." />
            </>
          )}

          <div className="form-actions full" style={{ marginTop: "12px" }}>
            <button className="button full" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Continue to Payment"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PAYMENT PENDING */}
      {currentStep === 2 && (
        <form className="form-grid" onSubmit={handlePayment}>
          <div className="full" style={{ background: "var(--mist)", padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Amount Due</span>
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--ink-strong)", lineHeight: 1 }}>
              {priceDetails ? `${priceDetails.currency} ${Number(priceDetails.amount_cents) / 100}` : "..."}
            </div>
          </div>

          <div className="full" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div 
              onClick={() => setPaymentMethod("stk")}
              style={{ padding: "16px", borderRadius: "var(--radius-sm)", border: paymentMethod === "stk" ? "2px solid var(--teal)" : "1px solid var(--line-strong)", background: paymentMethod === "stk" ? "var(--teal-soft)" : "#fff", cursor: "pointer", transition: "all 0.2s ease" }}>
              <strong style={{ display: "block", color: "var(--ink-strong)", marginBottom: "4px" }}>M-PESA Prompt</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Send a prompt to your phone.</span>
            </div>
            <div 
              onClick={() => setPaymentMethod("paybill")}
              style={{ padding: "16px", borderRadius: "var(--radius-sm)", border: paymentMethod === "paybill" ? "2px solid var(--teal)" : "1px solid var(--line-strong)", background: paymentMethod === "paybill" ? "var(--teal-soft)" : "#fff", cursor: "pointer", transition: "all 0.2s ease" }}>
              <strong style={{ display: "block", color: "var(--ink-strong)", marginBottom: "4px" }}>Manual Paybill</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>I already have a receipt code.</span>
            </div>
          </div>

          {paymentMethod === "stk" ? (
            <Field label="M-PESA Phone Number" name="phone_number" inputMode="tel" defaultValue={String(registration?.phone ?? "")} />
          ) : (
            <>
              <Field label="M-PESA Receipt/Transaction Code" name="paybill_reference" />
              <Field label="Phone number used to pay" name="payer_phone" />
            </>
          )}

          <div className="form-actions full" style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
            <button className="button full" type="submit" disabled={busy}>
              {busy ? "Processing..." : paymentMethod === "stk" ? "Send M-PESA Prompt" : "Submit Receipt"}
            </button>
            <button className="button secondary full" type="button" onClick={refreshStatus} disabled={busy}>
              Refresh Payment Status
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PASSWORD CREATION */}
      {currentStep === 3 && (
        <form className="form-grid" onSubmit={handlePassword}>
          <div className="full notice success" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>✅</span> Payment verified successfully.
          </div>
          <div className="full">
             <Field
              label="Secure Password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={10}
              pattern="(?=.*[A-Za-z])(?=.*\d).{10,}"
              title="Use at least 10 characters with letters and numbers."
            />
          </div>
          <div className="full">
             <Field
              label="Confirm Password"
              name="password_confirmation"
              type="password"
              required
              autoComplete="new-password"
              minLength={10}
            />
          </div>
          <div className="form-actions full" style={{ marginTop: "12px" }}>
            <button className="button full" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Secure Account"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: OTP VERIFICATION */}
      {currentStep === 4 && (
        <form className="form-grid" onSubmit={handleOtp}>
          <div className="full" style={{ textAlign: "center", padding: "20px 0" }}>
             <label style={{ fontSize: "1rem", color: "var(--ink-strong)", marginBottom: "16px", display: "block" }}>
                Enter the 6-digit code sent to<br/><strong>{String(registration?.email ?? "your email")}</strong>
             </label>
             <input 
                name="code" 
                required 
                inputMode="numeric" 
                pattern="\d{6}" 
                title="Enter the 6-digit code"
                placeholder="• • • • • •"
                style={{ 
                  fontSize: "2rem", letterSpacing: "0.5em", textAlign: "center", 
                  padding: "16px", fontWeight: 700, width: "100%", maxWidth: "300px", margin: "0 auto", display: "block" 
                }} 
             />
          </div>
          
          <div className="form-actions full" style={{ display: "grid", gap: "12px", maxWidth: "300px", margin: "0 auto", width: "100%" }}>
            <button className="button full" type="submit" disabled={busy}>
              {busy ? "Verifying..." : "Verify Email"}
            </button>
            <button className="button ghost full" type="button" onClick={handleResendOtp} disabled={busy}>
              Resend Code
            </button>
          </div>
        </form>
      )}

      {/* STEP 5: DONE */}
      {currentStep === 5 && (
        <div className="form-grid" style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="full" style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
          <h3 className="full" style={{ fontSize: "1.5rem" }}>Registration Complete!</h3>
          <p className="full">
            {status === "approval_pending" 
              ? "Your facility is now pending admin approval. You will receive an email once your workspace is unlocked." 
              : "Your workspace is ready."}
          </p>
          <div className="full" style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
            <Link className="button" href="/auth/login" style={{ minWidth: "200px" }}>
              Sign In
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
