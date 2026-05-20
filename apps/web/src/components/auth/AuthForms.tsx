"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Feedback } from "@/components/ui/Feedback";
import { Field, formValues } from "@/components/ui/Forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest, asRecord, type ApiRole } from "@/lib/api/client";
import { setToken } from "@/lib/auth/session";

type AuthMode = "login" | "professional-register" | "facility-register" | "verify-email" | "forgot" | "reset";

const portalByRole: Record<ApiRole, string> = {
  professional: "/portal/professional/dashboard",
  facility: "/portal/facility/dashboard",
  admin: "/portal/admin/dashboard",
};

function titleFor(mode: AuthMode) {
  switch (mode) {
    case "professional-register":
      return "Create a professional account";
    case "facility-register":
      return "Create a facility account";
    case "verify-email":
      return "Verify your email";
    case "forgot":
      return "Request a password reset";
    case "reset":
      return "Reset your password";
    default:
      return "Sign in to Afyalink";
  }
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [role, setRole] = useState<ApiRole>("professional");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tokenFromQuery, setTokenFromQuery] = useState("");

  useEffect(() => {
    setTokenFromQuery(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const values = formValues(event);

      if (mode === "login") {
        const data = asRecord(await apiRequest("/api/auth/login", { method: "POST", body: values }));
        const token = String(data.token ?? "");
        const user = asRecord(data.user);
        const inferredRole = (user.role === "Admin" ? "admin" : user.role === "FacilityOwner" ? "facility" : role) as ApiRole;
        const targetRole = role === "admin" || role === "facility" || role === "professional" ? role : inferredRole;

        if (!token) throw new Error("The API did not return a session token.");
        setToken(targetRole, token);
        setMessage("Signed in. Redirecting to your portal.");
        router.push(portalByRole[targetRole]);
        return;
      }

      if (mode === "professional-register") {
        const data = asRecord(await apiRequest("/api/auth/register", { method: "POST", body: values }));
        const token = String(data.token ?? "");
        if (token) setToken("professional", token);
        setMessage("Professional account created. Check the email verification instructions and continue your profile.");
        router.push("/portal/professional/dashboard");
        return;
      }

      if (mode === "facility-register") {
        const data = asRecord(await apiRequest("/api/facility/auth/register", { method: "POST", body: values }));
        const token = String(data.token ?? "");
        if (token) setToken("facility", token);
        setMessage("Facility account created. Continue onboarding from the facility dashboard.");
        router.push("/portal/facility/dashboard");
        return;
      }

      if (mode === "verify-email") {
        await apiRequest("/api/auth/email/verify", {
          method: "POST",
          body: { token: String(values.token ?? tokenFromQuery) },
        });
        setMessage("Email verified. You can now continue your application.");
        return;
      }

      if (mode === "forgot") {
        await apiRequest("/api/auth/password/forgot", { method: "POST", body: values });
        setMessage("If that email exists, reset instructions have been queued.");
        return;
      }

      await apiRequest("/api/auth/password/reset", { method: "POST", body: values });
      setMessage("Password reset complete. You can sign in with your new password.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card form-card">
        <PageHeader
          eyebrow="Afyalink account"
          title={titleFor(mode)}
          body="Use the routed account pages for sessions, verification, and recovery. Backend authorization remains authoritative after sign-in."
        />
        <form className="form-grid" onSubmit={submit}>
          {mode === "login" ? (
            <label className="full">
              Portal
              <select value={role} onChange={(event) => setRole(event.target.value as ApiRole)}>
                <option value="professional">Professional</option>
                <option value="facility">Facility</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          ) : null}
          {mode === "professional-register" || mode === "facility-register" ? (
            <>
              <Field label="Full name" name="name" required />
              <Field label="Phone" name="phone" required />
            </>
          ) : null}
          {mode === "login" || mode === "professional-register" || mode === "facility-register" || mode === "forgot" ? (
            <Field label="Email" name="email" type="email" required />
          ) : null}
          {mode === "login" || mode === "professional-register" || mode === "facility-register" || mode === "reset" ? (
            <Field label="Password" name="password" type="password" required />
          ) : null}
          {mode === "verify-email" || mode === "reset" ? (
            <Field label="Token" name="token" required defaultValue={tokenFromQuery} />
          ) : null}
          <div className="form-actions full">
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Working..." : "Continue"}
            </button>
            <Link className="button secondary" href="/">
              Back to site
            </Link>
          </div>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
        <div className="table-lite" style={{ marginTop: 20 }}>
          <div>
            <Link href="/auth/register/professional">Professional registration</Link>
            <span />
          </div>
          <div>
            <Link href="/auth/register/facility">Facility registration</Link>
            <span />
          </div>
          <div>
            <Link href="/auth/forgot-password">Forgot password</Link>
            <span />
          </div>
        </div>
      </section>
    </main>
  );
}
