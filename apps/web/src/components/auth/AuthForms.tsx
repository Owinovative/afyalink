"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Feedback } from "@/components/ui/Feedback";
import { formValues } from "@/components/ui/Forms";
import { apiRequest, asRecord, type ApiRole } from "@/lib/api/client";
import { clearAllTokens, portalByRole, resolveRoleGroup, setToken } from "@/lib/auth/session";
import { RegistrationFlow } from "@/components/auth/RegistrationFlow";

type AuthMode = "login" | "professional-register" | "student-register" | "facility-register" | "verify-email" | "forgot" | "reset";

function titleFor(mode: AuthMode) {
  switch (mode) {
    case "verify-email": return "Verify your email";
    case "forgot": return "Reset password";
    case "reset": return "Set new password";
    default: return "Welcome back";
  }
}

function bodyFor(mode: AuthMode) {
  switch (mode) {
    case "verify-email": return "Paste the secure token sent to your email address.";
    case "forgot": return "Enter your email to receive secure reset instructions.";
    case "reset": return "Use your secure token and create a new password.";
    default: return "Sign in to your secure workspace.";
  }
}

const passwordPattern = "(?=.*[A-Za-z])(?=.*\\d).{10,}";
const passwordTitle = "Use at least 10 characters with letters and numbers.";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [role, setRole] = useState<ApiRole>("professional");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tokenFromQuery, setTokenFromQuery] = useState("");

  // UI Focus States for the Premium look
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
        setMessage("Signed in. Redirecting to your portal...");
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

  // Registration modes route smoothly to our premium Registration Flow
  if (mode === "professional-register" || mode === "student-register" || mode === "facility-register") {
    return <RegistrationFlow mode={mode === "professional-register" ? "professional" : mode === "student-register" ? "student" : "facility"} />;
  }

  const inputStyle = (fieldName: string) => ({
    padding: "16px", borderRadius: "12px", outline: "none", fontSize: "1.05rem", width: "100%",
    border: `2px solid ${focusedField === fieldName ? "var(--teal)" : "var(--line-strong)"}`,
    boxShadow: focusedField === fieldName ? "0 0 0 4px rgba(3, 152, 158, 0.12)" : "none",
    transition: "all 0.2s ease", background: "#fff", color: "var(--ink-strong)"
  });

  return (
    <div style={{ width: "100%", maxWidth: "440px", margin: "0 auto" }}>
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.25rem", color: "var(--ink-strong)", marginBottom: "12px", letterSpacing: "-0.03em" }}>
          {titleFor(mode)}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "1.1rem", margin: 0, lineHeight: 1.5 }}>
          {bodyFor(mode)}
        </p>
      </div>

      {error ? <Feedback message={error} tone="error" /> : null}
      {message ? <Feedback message={message} tone="success" /> : null}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
        
        {/* Role Selector (Only for Login) */}
        {mode === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ink-strong)" }}>Select Workspace</label>
            <select 
              value={role} 
              onChange={(event) => setRole(event.target.value as ApiRole)}
              onFocus={() => setFocusedField("role")}
              onBlur={() => setFocusedField(null)}
              style={{ ...inputStyle("role"), cursor: "pointer" }}
            >
              <option value="professional">Professional & Student Portal</option>
              <option value="facility">Facility Portal</option>
              <option value="admin">Command Center (Admin)</option>
            </select>
          </div>
        ) : null}

        {/* Email Field */}
        {mode === "login" || mode === "forgot" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ink-strong)" }}>Email Address</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={inputStyle("email")}
            />
          </div>
        ) : null}

        {/* Password Field */}
        {mode === "login" || mode === "reset" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ink-strong)" }}>Password</label>
              {mode === "login" && (
                <Link href="/auth/forgot-password" style={{ fontSize: "0.9rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
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
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              style={inputStyle("password")}
            />
          </div>
        ) : null}

        {/* Token Field (For Email Verify or Reset Password) */}
        {mode === "verify-email" || mode === "reset" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ink-strong)" }}>Security Token</label>
            <input
              name="token"
              required
              defaultValue={tokenFromQuery}
              placeholder="Paste token here"
              onFocus={() => setFocusedField("token")}
              onBlur={() => setFocusedField(null)}
              style={inputStyle("token")}
            />
          </div>
        ) : null}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={busy}
          style={{ 
            marginTop: "8px", padding: "16px", borderRadius: "12px", 
            background: busy ? "var(--ink-soft)" : "linear-gradient(135deg, var(--teal), var(--deep))",
            color: "#fff", fontSize: "1.1rem", fontWeight: 600, border: "none",
            cursor: busy ? "not-allowed" : "pointer", transition: "all 0.3s ease",
            boxShadow: busy ? "none" : "0 8px 20px rgba(3, 152, 158, 0.25)",
            display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"
          }}
        >
          {busy ? (
            <>
              <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              Processing...
            </>
          ) : (
            mode === "login" ? "Sign In" : "Continue"
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>

      {/* Seamless Bottom Navigation for specific modes */}
      {mode === "login" && (
        <div style={{ marginTop: "40px", paddingTop: "32px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
          <p style={{ fontSize: "1.05rem", color: "var(--ink-soft)" }}>
            Don't have an account yet? <Link href="/auth/register" style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>Create one here</Link>
          </p>
        </div>
      )}
      {mode !== "login" && (
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <Link href="/auth/login" style={{ fontSize: "1rem", color: "var(--ink-soft)", textDecoration: "none", fontWeight: 500 }}>
            ← Return to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
