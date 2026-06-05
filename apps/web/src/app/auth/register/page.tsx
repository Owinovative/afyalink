import Link from "next/link";

export const metadata = {
  title: "Create an Account | Afyalink",
  description: "Join the verified healthcare talent network.",
};

export default function RegisterHub() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "1.75rem", color: "var(--ink-strong)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          Create your account
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>
          How do you want to use the Afyalink platform?
        </p>
      </div>

      {/* Professional Selection Card */}
      <Link href="/auth/register/professional" style={{ textDecoration: "none" }}>
        <div 
          className="card hover-card" 
          style={{ padding: "24px", border: "2px solid var(--line-strong)", borderRadius: "var(--radius-lg)", display: "flex", gap: "20px", alignItems: "center", background: "#fff", transition: "all 0.2s ease", cursor: "pointer" }}
        >
          <style>{`.hover-card:hover { border-color: var(--teal) !important; transform: translateY(-2px); box-shadow: var(--shadow-md); }`}</style>
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>
            🩺
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px 0", color: "var(--ink-strong)" }}>I am a Professional</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
              Nurses, doctors, and clinical officers looking for secure credentialing and jobs.
            </p>
          </div>
        </div>
      </Link>

      {/* Facility Selection Card */}
      <Link href="/auth/register/facility" style={{ textDecoration: "none" }}>
        <div 
          className="card hover-card" 
          style={{ padding: "24px", border: "2px solid var(--line-strong)", borderRadius: "var(--radius-lg)", display: "flex", gap: "20px", alignItems: "center", background: "#fff", transition: "all 0.2s ease", cursor: "pointer" }}
        >
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "var(--mist)", color: "var(--ink-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>
            🏥
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px 0", color: "var(--ink-strong)" }}>We are a Facility</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
              Hospitals and clinics looking to hire verified clinical talent.
            </p>
          </div>
        </div>
      </Link>

      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
          Already have an account? <Link href="/auth/login" style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>

    </div>
  );
}
