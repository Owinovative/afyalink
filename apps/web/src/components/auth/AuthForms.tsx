"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { Feedback } from "@/components/ui/Feedback";
import { Field, formValues } from "@/components/ui/Forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest, asRecord, type ApiRole } from "@/lib/api/client";
import { clearAllTokens, portalByRole, resolveRoleGroup, setToken } from "@/lib/auth/session";
import { RegistrationFlow } from "@/components/auth/RegistrationFlow";

type AuthMode = "login" | "professional-register" | "student-register" | "facility-register" | "verify-email" | "forgot" | "reset";

function titleFor(mode: AuthMode) {
  switch (mode) {
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

function bodyFor(mode: AuthMode) {
  switch (mode) {
    case "verify-email":
      return "Paste the token from your email.";
    case "forgot":
      return "Enter your email for reset instructions.";
    case "reset":
      return "Use your token and new password.";
    default:
      return "Sign in to your workspace.";
  }
}

const authScenes: Record<AuthMode, { title: string; body: string; image: string; chips: string[] }> = {
  login: {
    title: "Secure workspace access.",
    body: "Role-based portals keep records protected.",
    image: "/images/security/credential-security-review.jpg",
    chips: ["Protected", "Audited", "Role gated"],
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
    image: "/images/contact/clinic-director-conversation.jpg",
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
        <aside className="auth-aside" style={{ "--auth-image": `url("${scene.image}")` } as CSSProperties}>
          <div className="auth-brand">
            <BrandLockup variant="full" />
          </div>
          <div className="eyebrow">Secure access</div>
          <h1>{scene.title}</h1>
          <p>{scene.body}</p>
          <div className="auth-pill-row" aria-label="Account flow">
            {scene.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
          <div className="table-lite">
            <div>
              <span>Licensed professionals</span>
              <span className="badge green">Verified path</span>
            </div>
            <div>
              <span>Students awaiting license</span>
              <span className="badge gold">Pre-licensure</span>
            </div>
            <div>
              <span>Facilities</span>
              <span className="badge green">Access gated</span>
            </div>
          </div>
        </aside>

        {mode === "professional-register" ? (
          <RegistrationFlow mode="professional" />
        ) : mode === "student-register" ? (
          <RegistrationFlow mode="student" />
        ) : mode === "facility-register" ? (
          <RegistrationFlow mode="facility" />
        ) : (
          <section className="auth-card form-card">
            <div className="auth-card-brand">
              <BrandLockup kicker="Secure account" />
            </div>
            <PageHeader
              eyebrow="Afyalink account"
              title={titleFor(mode)}
              body={bodyFor(mode)}
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
              
              {mode === "login" || mode === "forgot" ? (
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              ) : null}
              
              {mode === "login" || mode === "reset" ? (
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "login" ? undefined : 10}
                  pattern={mode === "login" ? undefined : passwordPattern}
                  title={mode === "login" ? undefined : passwordTitle}
                />
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
                <Link href="/auth/register/student">Student awaiting-license registration</Link>
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
        )}
      </div>
    </main>
  );
}
