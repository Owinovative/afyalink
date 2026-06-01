"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, type CSSProperties } from "react";
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
    <main className="auth-wrap" style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "var(--paper)",
      padding: "clamp(20px, 4vw, 40px)"
    }}>
      <div className="auth-shell" style={{
        display: "grid",
        gridTemplateColumns: "minmax(300px, 0.8fr) minmax(400px, 1.2fr)",
        width: "100%",
        maxWidth: "1200px",
        minHeight: "720px",
        background: "#fff",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lift)",
        overflow: "hidden"
      }}>
        
        {/* Left Side: Cinematic Context */}
        <aside style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(32px, 4vw, 48px)",
          color: "#fff",
          background: `linear-gradient(180deg, rgba(2, 6, 23, 0.2) 0%, rgba(2, 6, 23, 0.9) 100%), url("${scene.image}") center / cover no-repeat`
        }}>
          <div>
            <Link href="/">
              <BrandLockup variant="full" />
            </Link>
          </div>
          
          <div style={{ position: "relative", zIndex: 2, marginTop: "auto" }}>
            <span style={{ color: "var(--teal-soft)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px", display: "block" }}>
              Secure Access
            </span>
            <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 3vw, 2.75rem)", lineHeight: 1.1, marginBottom: "12px" }}>
              {scene.title}
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "400px", marginBottom: "24px" }}>
              {scene.body}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {scene.chips.map((chip) => (
                <span key={chip} style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}>{chip}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Authentication Router */}
        <section style={{ 
          padding: "clamp(32px, 5vw, 64px)", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center",
          background: "#fff" 
        }}>
          
          {mode === "professional-register" || mode === "student-register" || mode === "facility-register" ? (
            <RegistrationFlow mode={mode === "professional-register" ? "professional" : mode === "student-register" ? "student" : "facility"} />
          ) : (
            <div style={{ maxWidth: "440px", width: "100%", margin: "0 auto" }}>
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "2rem", color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  {titleFor(mode)}
                </h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "1rem", margin: 0 }}>
                  {bodyFor(mode)}
                </p>
              </div>

              {error ? <Feedback message={error} tone="error" /> : null}
              {message ? <Feedback message={message} tone="success" /> : null}

              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
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

                <div style={{ marginTop: "12px", display: "flex", gap: "12px", flexDirection: "column" }}>
                  <button className="button full" type="submit" disabled={busy} style={{ minHeight: "48px", fontSize: "1rem" }}>
                    {busy ? "Working..." : mode === "login" ? "Sign In" : "Continue"}
                  </button>
                  <Link className="button ghost full" href="/" style={{ minHeight: "48px" }}>
                    Return to website
                  </Link>
                </div>
              </form>

              {/* Seamless Bottom Navigation for specific modes */}
              {mode === "login" && (
                <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", margin: 0 }}>
                    Don't have an account?
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginTop: "12px" }}>
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
