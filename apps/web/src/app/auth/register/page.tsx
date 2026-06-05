import Link from "next/link";

export const metadata = {
  title: "Create an Account | Afyalink",
  description: "Join the verified healthcare talent network.",
};

export default function RegisterHub() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "440px", margin: "0 auto" }}>
      
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "1.85rem", color: "var(--ink-strong)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          Create your account
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>
          Choose your account type to get started.
        </p>
      </div>

      <style>{`.hover-card:hover { border-color: var(--teal) !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(3, 152, 158, 0.12); }`}</style>

      {/* Professional Selection Card */}
      <Link href="/auth/register/professional" style={{ textDecoration: "none" }}>
        <div 
          className="hover-card" 
          style={{ padding: "20px", border: "2px solid var(--line-strong)", borderRadius: "var(--radius-lg)", display: "flex", gap: "20px", alignItems: "center", background: "#fff", transition: "all 0.3s ease", cursor: "pointer" }}
        >
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>
            🩺
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px 0", color: "var(--ink-strong)" }}>I am a Professional</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
              Licensed clinical officers, nurses, and doctors.
            </p>
          </div>
        </div>
      </Link>

      {/* Student Selection Card */}
      <Link href="/auth/register/student" style={{ textDecoration: "none" }}>
        <div 
          className="hover-card" 
          style={{ padding: "20px", border: "2px solid var(--line-strong)", borderRadius: "var(--radius-lg)", display: "flex", gap: "20px", alignItems: "center", background: "#fff", transition: "all 0.3s ease", cursor: "pointer" }}
        >
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>
            🎓
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px 0", color: "var(--ink-strong)" }}>I am a Student</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
              Medical and nursing students building early profiles.
            </p>
          </div>
        </div>
      </Link>

      {/* Facility Selection Card */}
      <Link href="/auth/register/facility" style={{ textDecoration: "none" }}>
        <div 
          className="hover-card" 
          style={{ padding: "20px", border: "2px solid var(--line-strong)", borderRadius: "var(--radius-lg)", display: "flex", gap: "20px", alignItems: "center", background: "#fff", transition: "all 0.3s ease", cursor: "pointer" }}
        >
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--mist)", color: "var(--ink-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>
            🏥
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px 0", color: "var(--ink-strong)" }}>We are a Facility</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
              Hospitals and clinics looking to hire verified talent.
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
