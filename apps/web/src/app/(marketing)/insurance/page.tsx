import Link from "next/link";

export const metadata = {
  title: "Afyalink Insurance | Health & Indemnity Cover",
  description: "Premium health insurance for individuals, families, clinical professionals, and verified healthcare facilities.",
};

export default function InsuranceHubPage() {
  return (
    <main style={{ backgroundColor: "#fff", minHeight: "100vh", paddingTop: "120px", paddingBottom: "80px" }}>
      
      {/* Hero Section */}
      <section style={{ textAlign: "center", padding: "0 24px", maxWidth: "900px", margin: "0 auto 80px auto" }}>
        <span style={{ 
          background: "rgba(3, 152, 158, 0.1)", color: "var(--teal)", padding: "6px 16px", 
          borderRadius: "99px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" 
        }}>
          Afyalink Cover
        </span>
        <h1 style={{ 
          fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--ink-strong)", 
          letterSpacing: "-0.03em", lineHeight: 1.1, margin: "24px 0" 
        }}>
          Healthcare protection,<br />built for everyone.
        </h1>
        <p style={{ fontSize: "clamp(1.1rem, 2vw, 1.25rem)", color: "var(--ink-soft)", lineHeight: 1.6, maxWidth: "700px", margin: "0 auto" }}>
          Whether you are securing your family's health, protecting your clinical license, or insuring your hospital staff, we have a tailored plan for you.
        </p>
      </section>

      {/* The 3-Tier Routing Grid */}
      <section style={{ padding: "0 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
          
          {/* 1. PUBLIC TIER */}
          <div style={{ 
            border: "1px solid var(--line-strong)", borderRadius: "24px", padding: "40px", 
            background: "#fff", display: "flex", flexDirection: "column", transition: "transform 0.3s ease, box-shadow 0.3s ease",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
          }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--mist)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "24px" }}>
              👨‍👩‍👧‍👦
            </div>
            <h2 style={{ fontSize: "1.5rem", color: "var(--ink-strong)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              Individuals & Families
            </h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, flex: 1 }}>
              Comprehensive inpatient and outpatient medical cover for the general public. Access top-tier hospitals nationwide with zero hassle.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", color: "var(--ink-strong)", fontSize: "0.95rem", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li>✓ Inpatient & Outpatient limits</li>
              <li>✓ Maternity & Dental add-ons</li>
              <li>✓ No Afyalink account required</li>
            </ul>
            <Link href="/insurance/micro" style={{ 
              display: "block", textAlign: "center", padding: "16px", borderRadius: "12px", 
              background: "var(--paper)", color: "var(--ink-strong)", fontWeight: 600, textDecoration: "none",
              border: "1px solid var(--line-strong)"
            }}>
              Get a Free Quote
            </Link>
          </div>

          {/* 2. PROFESSIONAL & STUDENT TIER */}
          <div style={{ 
            border: "2px solid var(--teal)", borderRadius: "24px", padding: "40px", 
            background: "rgba(3, 152, 158, 0.02)", display: "flex", flexDirection: "column", position: "relative",
            boxShadow: "0 8px 30px rgba(3, 152, 158, 0.1)"
          }}>
            <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "var(--teal)", color: "#fff", padding: "4px 16px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Most Popular
            </div>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "24px" }}>
              🩺
            </div>
            <h2 style={{ fontSize: "1.5rem", color: "var(--ink-strong)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              Professionals & Students
            </h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, flex: 1 }}>
              Protect your license and your health. Exclusive rates on Medical Cover bundled with Malpractice & Professional Indemnity.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", color: "var(--ink-strong)", fontSize: "0.95rem", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li>✓ Professional Indemnity (Up to 10M)</li>
              <li>✓ Discounted premium medical cover</li>
              <li>✓ Pre-filled using your verified profile</li>
            </ul>
            <Link href="/auth/login?redirect=/portal/professional/insurance" style={{ 
              display: "block", textAlign: "center", padding: "16px", borderRadius: "12px", 
              background: "var(--teal)", color: "#fff", fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 15px rgba(3, 152, 158, 0.3)"
            }}>
              Log In to Apply
            </Link>
          </div>

          {/* 3. FACILITY TIER (Gated) */}
          <div style={{ 
            border: "1px solid var(--line-strong)", borderRadius: "24px", padding: "40px", 
            background: "#fff", display: "flex", flexDirection: "column"
          }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--deep)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "24px" }}>
              🏥
            </div>
            <h2 style={{ fontSize: "1.5rem", color: "var(--ink-strong)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              Healthcare Facilities
            </h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, flex: 1 }}>
              Bulk corporate health covers and locum indemnity management. <strong style={{ color: "var(--ink-strong)" }}>Requires a verified Afyalink partner account.</strong>
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", color: "var(--ink-strong)", fontSize: "0.95rem", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li>✓ Automated staff enrollment</li>
              <li>✓ Blanket locum indemnity covers</li>
              <li>✓ Exclusive B2B corporate rates</li>
            </ul>
            <Link href="/auth/login?redirect=/portal/facility/insurance" style={{ 
              display: "block", textAlign: "center", padding: "16px", borderRadius: "12px", 
              background: "var(--deep)", color: "#fff", fontWeight: 600, textDecoration: "none"
            }}>
              Access Facility Portal
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
