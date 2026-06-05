import { HomeExperience } from "@/components/marketing/HomeExperience";
import { TrustedTicker } from "@/components/marketing/TrustedTicker";
import Link from "next/link";

export const metadata = {
  title: "Afyalink | The Verified Healthcare Talent Network",
  description: "Connect verified clinical professionals with top-tier healthcare facilities.",
};

export default function HomePage() {
  return (
    <main>
      {/* 1. The Cinematic Hero Slider */}
      <HomeExperience />

      {/* 2. The Authority Building Ticker */}
      <TrustedTicker />

      {/* 3. The Platform Architecture Overview */}
      <section className="section-frame section-mist" style={{ padding: "clamp(64px, 8vw, 120px) 0" }}>
        <div className="container">
          
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 64px auto" }}>
            <span className="eyebrow" style={{ color: "var(--teal)" }}>The Afyalink Architecture</span>
            <h2 style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)", letterSpacing: "-0.02em", color: "var(--ink-strong)", margin: "16px 0" }}>
              A unified ecosystem for clinical credentialing and hiring.
            </h2>
            <p style={{ fontSize: "1.1rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
              We removed the friction from medical staffing. By building a cryptographically secure, 
              audited credential vault, we connect verified professionals with premium facilities instantly.
            </p>
          </div>

          {/* Premium 3-Column Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            
            {/* Feature 1 */}
            <div className="card" style={{ background: "#fff", border: "1px solid var(--line)", padding: "40px 32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "24px" }}>
                🛡️
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "12px" }}>Verified Credentials</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "24px" }}>
                Every professional profile undergoes rigorous admin auditing against national medical and nursing council registries.
              </p>
              <Link href="/professionals" style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
                Explore Professional Vaults →
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ background: "#fff", border: "1px solid var(--line)", padding: "40px 32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--deep)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "24px" }}>
                ⚡
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "12px" }}>Intelligent Matching</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "24px" }}>
                Facilities can instantly filter talent by specialty, shift availability, and verified clinical experience.
              </p>
              <Link href="/matching" style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
                See How Matching Works →
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="card" style={{ background: "#fff", border: "1px solid var(--line)", padding: "40px 32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--mist)", color: "var(--ink-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "24px" }}>
                🔒
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "12px" }}>Audit Trails</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "24px" }}>
                Complete transparency. Professionals know exactly when their documents are viewed, and facilities get secure, watermarked access.
              </p>
              <Link href="/trust-security" style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
                Read our Security Model →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 4. The Final Call to Action Strip */}
      <section style={{ background: "linear-gradient(135deg, var(--deep), var(--ink-strong))", padding: "80px 24px", textAlign: "center", color: "#fff" }}>
        <h2 style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", marginBottom: "24px", color: "#fff" }}>Ready to transform healthcare staffing?</h2>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/register/professional" className="button" style={{ background: "#fff", color: "var(--deep)", padding: "14px 32px", fontSize: "1.05rem" }}>
            I am a Professional
          </Link>
          <Link href="/auth/register/facility" className="button translucent" style={{ border: "1px solid rgba(255,255,255,0.3)", padding: "14px 32px", fontSize: "1.05rem" }}>
            I represent a Facility
          </Link>
        </div>
      </section>
    </main>
  );
}
