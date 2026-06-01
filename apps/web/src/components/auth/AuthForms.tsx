"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { Feedback } from "@/components/ui/Feedback";
import { Field, formValues } from "@/components/ui/Forms";
import { apiRequest, asRecord, type ApiRole } from "@/lib/api/client";
import { clearAllTokens, portalByRole, resolveRoleGroup, setToken } from "@/lib/auth/session";
import { RegistrationFlow } from "@/components/auth/RegistrationFlow";

type AuthMode = "login" | "professional-register" | "student-register" | "facility-register" | "verify-email" | "forgot" | "reset";

function titleFor(mode: AuthMode) {
  switch (mode) {
    case "verify-email": return "Verify your email";
    case "forgot": return "Reset password";
    case "reset": return "Set new password";
    default: return "Sign in to Afyalink";
  }
}

function bodyFor(mode: AuthMode) {
  switch (mode) {
    case "verify-email": return "Paste the token sent to your email.";
    case "forgot": return "Enter your email to receive reset instructions.";
    case "reset": return "Use your secure token and create a new password.";
    default: return "Welcome back. Sign in to your workspace.";
  }
}

const authScenes: Record<AuthMode, { title: string; body: string; image: string; chips: string[] }> = {
  login: {
    title: "Secure workspace access.",
    body: "Role-based portals keep records protected and audited.",
    image: "/images/security/credential-security-review.jpg",
    chips: ["Protected", "Audited", "Role-gated"],
  },
  "professional-register": {
    title: "Build a verified profile.",
    body: "Credentials, review, interview, opportunity.",
    image: "/images/professionals/clinical-professional-consultation.jpg",
    chips: ["Profile", "Credentials", "Review"],
  },
  "student-register": {
    title: "Start before license.",
    body: "Prepare early. Publish later.",
    image: "/images/students/nursing-student-training-lab.jpg",
    chips: ["Pre-license", "Documents", "Conversion"],
  },
  "facility-register": {
    title: "Open facility access.",
    body: "Onboard, activate, request, shortlist.",
    image: "/images/facilities/hospital-facility-team.jpg",
    chips: ["Onboard", "Access", "Shortlists"],
  },
  "verify-email": {
    title: "Confirm ownership.",
    body: "Email verification protects every workspace.",
    image: "/images/verification/admin-verification-desk.jpg",
    chips: ["Token", "Verify", "Continue"],
  },
  forgot: {
    title: "Recover access safely.",
    body: "Reset instructions stay account-bound.",
    image: "/images/security/credential-security-review.jpg",
    chips: ["Request", "Email", "Reset"],
  },
  reset: {
    title: "Set a new password.",
    body: "Use your reset token to continue.",
    image: "/images/trust/hospital-corridor-care-team.jpg",
    chips: ["Token", "Password", "Sign in"],
  },
};

const passwordPattern = "(?=.*[A-Za-z])(?=.*\\d).{10,}";
const passwordTitle = "Use at least 10 characters with letters and numbers.";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const scene = authScenes[mode];
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
        const targetRole = resolveRoleGroup(user);

        if (!token) throw new Error("The API did not return a session token.");
        if (!targetRole) throw new Error("No portal role is assigned to this account.");
        clearAllTokens();
        setToken(targetRole, token, user);
        setMessage("Signed in. Redirecting to your portal.");
        router.push(portalByRole[targetRole]);
        return;
      }

      if (mode === "verify-email") {
        await apiRequest("/api/auth/email/verify", {
          method: "POST",
          body: { token: String(values.token ?? tokenFromQuery) },
        });
        setMessage("Email verified. You can now sign in.");
        return;
      }

      if (mode === "forgot") {
        await apiRequest("/api/auth/password/forgot", { method: "POST", body: values });
        setMessage("If that email exists, reset instructions have been queued.");
        return;
      }

      if (mode === "reset") {
        await apiRequest("/api/auth/password/reset", { method: "POST", body: values });
        setMessage("Password reset complete. You can sign in with your new password.");
        return;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-shell">
        
        {/* Left Side: Cinematic Context (Handled by CSS for mobile) */}
        <aside 
          className="auth-aside" 
          style={{ backgroundImage: `linear-gradient(180deg, rgba(7, 31, 28, 0.4), rgba(7, 31, 28, 0.9)), url("${scene.image}")` }}
        >
          <div className="auth-brand">
            <Link href="/">
              <BrandLockup variant="full" />
            </Link>
          </div>
          
          <div>
            <span className="eyebrow" style={{ color: "var(--teal-soft)", marginBottom: "8px" }}>Secure Access</span>
            <h1>{scene.title}</h1>
            <p>{scene.body}</p>
            <div className="auth-pill-row" style={{ marginTop: "16px" }}>
              {scene.chips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Authentication Router */}
        <section className="auth-card">
          {mode === "professional-register" || mode === "student-register" || mode === "facility-register" ? (
            <RegistrationFlow mode={mode === "professional-register" ? "professional" : mode === "student-register" ? "student" : "facility"} />
          ) : (
            <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  {titleFor(mode)}
                </h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", margin: 0 }}>
                  {bodyFor(mode)}
                </p>
              </div>

              {error ? <Feedback message={error} tone="error" /> : null}
              {message ? <Feedback message={message} tone="success" /> : null}

              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                {mode === "login" ? (
                  <label>
                    Select Workspace
                    <select value={role} onChange={(event) => setRole(event.target.value as ApiRole)} style={{ cursor: "pointer" }}>
                      <option value="professional">Professional Portal</option>
                      <option value="facility">Facility Portal</option>
                      <option value="admin">Command Center (Admin)</option>
                    </select>
                  </label>
                ) : null}
                
                {mode === "login" || mode === "forgot" ? (
                  <Field label="Email Address" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
                ) : null}
                
                {mode === "login" || mode === "reset" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ margin: 0 }}>Password</label>
                      {mode === "login" && (
                        <Link href="/auth/forgot-password" style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 600 }}>
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      minLength={mode === "login" ? undefined : 10}
                      pattern={mode === "login" ? undefined : passwordPattern}
                      title={mode === "login" ? undefined : passwordTitle}
                    />
                  </div>
                ) : null}
                
                {mode === "verify-email" || mode === "reset" ? (
                  <Field label="Security Token" name="token" required defaultValue={tokenFromQuery} />
                ) : null}

                <div className="form-actions" style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button className="button full" type="submit" disabled={busy}>
                    {busy ? "Working..." : mode === "login" ? "Sign In" : "Continue"}
                  </button>
                  <Link className="button ghost full" href="/">
                    Return to website
                  </Link>
                </div>
              </form>

              {/* Seamless Bottom Navigation for specific modes */}
              {mode === "login" && (
                <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 0 }}>
                    Don't have an account?
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "12px" }}>
                    <Link href="/auth/register/professional" style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: 600 }}>Professional</Link>
                    <span style={{ color: "var(--line-strong)" }}>|</span>
                    <Link href="/auth/register/student" style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: 600 }}>Student</Link>
                    <span style={{ color: "var(--line-strong)" }}>|</span>
                    <Link href="/auth/register/facility" style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: 600 }}>Facility</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
