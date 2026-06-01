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
    case "professional":
      return "Professional application";
    case "student":
      return "Student early registration";
    case "facility":
      return "Facility onboarding";
  }
}

function bodyFor(mode: AuthMode) {
  switch (mode) {
    case "professional":
      return "Create an account and continue your profile.";
    case "student":
      return "Start early. Publication waits for license conversion.";
    case "facility":
      return "Create owner access. Approval unlocks browsing.";
  }
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

  useEffect(() => {
    apiRequest("/api/registration/pricing", { method: "GET" })
      .then((res) => setPricing(asRecord(asRecord(res).data).pricing as Record<string, unknown>))
      .catch(() => {});
  }, []);

  const priceDetails = pricing ? asRecord(pricing[mode]) : null;

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
      setMessage("Details saved. Proceed to payment.");
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
      if (values.payment_method === "stk") {
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
      setMessage("Password created. Check your email for the verification code.");
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
      setMessage("Email verified successfully.");
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
    <section className="auth-card form-card">
      <div className="auth-card-brand">
        <BrandLockup kicker="Secure account" />
      </div>
      <PageHeader eyebrow="Registration" title={titleFor(mode)} body={bodyFor(mode)} />

      {error ? (
        <div style={{ marginBottom: 18 }}>
          <Feedback message={error} tone="error" />
        </div>
      ) : null}
      {message ? (
        <div style={{ marginBottom: 18 }}>
          <Feedback message={message} tone="success" />
        </div>
      ) : null}

      {/* STEP 1: DRAFT (Details) */}
      {status === "draft" && (
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
              <Field label="Target profession" name="target_profession" required placeholder="Registered Nurse, Clinical Officer..." />
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
                  <option value="part_time">Part time</option>
                  <option value="locum">Locum</option>
                  <option value="internship">Internship</option>
                  <option value="attachment">Attachment</option>
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
                  <option value="medical_center">Medical center</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="training_institution">Training institution</option>
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

          <button className="button full" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Continue to Payment"}
          </button>
        </form>
      )}

      {/* STEP 2: PAYMENT PENDING */}
      {status === "payment_pending" && (
        <form className="form-grid" onSubmit={handlePayment}>
          <div className="full notice">
            <strong>Registration Fee: </strong>
            {priceDetails ? `${priceDetails.currency} ${Number(priceDetails.amount_cents) / 100}` : "Loading..."}
          </div>

          <label className="full">
            Payment Method
            <select name="payment_method" defaultValue="stk">
              <option value="stk">M-PESA Prompt (STK Push)</option>
              <option value="paybill">I already paid via Paybill</option>
            </select>
          </label>

          <Field label="M-PESA Phone Number (For Prompt)" name="phone_number" inputMode="tel" defaultValue={String(registration?.phone ?? "")} />
          
          <div className="full" style={{ borderTop: "1px solid var(--line)", margin: "10px 0", paddingTop: "10px" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>If you paid manually, enter the details below:</p>
          </div>
          <Field label="M-PESA Receipt/Transaction Code" name="paybill_reference" />
          <Field label="Phone number used to pay" name="payer_phone" />

          <button className="button full" type="submit" disabled={busy}>
            {busy ? "Processing..." : "Submit Payment"}
          </button>
          
          <button className="button secondary full" type="button" onClick={refreshStatus} disabled={busy}>
            Check Payment Status
          </button>
        </form>
      )}

      {/* STEP 3: PASSWORD CREATION */}
      {status === "payment_verified" && (
        <form className="form-grid" onSubmit={handlePassword}>
          <div className="full notice success">
            Payment verified successfully. Please secure your account.
          </div>
          <Field
            label="Password"
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
          <button className="button full" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Create Password"}
          </button>
        </form>
      )}

      {/* STEP 4: OTP VERIFICATION */}
      {(status === "password_created" || status === "email_verification_pending") && (
        <form className="form-grid" onSubmit={handleOtp}>
          <div className="full notice">
            We sent a 6-digit verification code to {String(registration?.email ?? "your email")}.
          </div>
          <Field label="6-Digit Code" name="code" required inputMode="numeric" pattern="\d{6}" title="Enter the 6-digit code" />
          <button className="button full" type="submit" disabled={busy}>
            {busy ? "Verifying..." : "Verify Email"}
          </button>
          <button className="button ghost full" type="button" onClick={handleResendOtp} disabled={busy}>
            Resend Code
          </button>
        </form>
      )}

      {/* STEP 5: DONE */}
      {(status === "email_verified" || status === "active" || status === "approval_pending") && (
        <div className="form-grid">
          <div className="full notice success">
            Registration complete!
            {status === "approval_pending" && " Your facility is now pending admin approval."}
          </div>
          <Link className="button full" href="/auth/login">
            Sign In to Your Workspace
          </Link>
        </div>
      )}
    </section>
  );
}
