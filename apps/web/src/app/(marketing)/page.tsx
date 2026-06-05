import { HomeExperience } from "@/components/marketing/HomeExperience";
import { TrustedTicker } from "@/components/marketing/TrustedTicker";
import Link from "next/link";

export const metadata = {
  title: "Afyalink | The Verified Healthcare Talent Network",
  description: "Connect verified clinical professionals with top-tier healthcare facilities.",
};

export default function HomePage() {
  return (
    <main style={{ backgroundColor: "#fff" }}>
      {/* 1. The Cinematic Hero Slider (Untouched, because it's beautiful) */}
      <HomeExperience />

      {/* 2. The Authority Building Ticker */}
      <TrustedTicker />

      {/* 3. The Minimalist Architecture Overview */}
      <section style={{ padding: "clamp(80px, 10vw, 140px) 24px", background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "clamp(2rem, 4vw, 3rem)", 
            fontWeight: 500, 
            letterSpacing: "-0.03em", 
            color: "var(--ink-strong)", 
            marginBottom: "24px",
            lineHeight: 1.1
          }}>
            The secure bridge between clinical talent and premier facilities.
          </h2>
          <p style={{ 
            fontSize: "clamp(1.1rem, 2vw, 1.25rem)", 
            color: "var(--ink-soft)", 
            lineHeight: 1.6, 
            marginBottom: "64px" 
          }}>
            Afyalink eliminates the friction of medical staffing. We cryptographically verify credentials so you can focus on what matters most—delivering exceptional care.
          </p>
        </div>

        {/* Clean, borderless text grid instead of heavy cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "48px", 
          maxWidth: "1100px", 
          margin: "0 auto",
          textAlign: "left"
        }}>
          
          {/* Feature 1 */}
          <div>
            <h3 style={{ 
              fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "16px", 
              borderBottom: "2px solid var(--teal)", paddingBottom: "12px", display: "inline-block" 
            }}>
              Verified Credentials
            </h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Every professional profile undergoes rigorous admin auditing against national medical registries, ensuring 100% compliance before matching.
            </p>
          </div>

          {/* Feature 2 */}
          <div>
            <h3 style={{ 
              fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "16px", 
              borderBottom: "2px solid var(--deep)", paddingBottom: "12px", display: "inline-block" 
            }}>
              Intelligent Matching
            </h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Facilities can instantly filter and shortlist vetted talent by specialty, shift availability, and verified clinical experience.
            </p>
          </div>

          {/* Feature 3 */}
          <div>
            <h3 style={{ 
              fontSize: "1.25rem", color: "var(--ink-strong)", marginBottom: "16px", 
              borderBottom: "2px solid var(--line-strong)", paddingBottom: "12px", display: "inline-block" 
            }}>
              Secure Audit Trails
            </h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Total transparency. Professionals track who views their documents, while facilities receive secure, watermarked access.
            </p>
          </div>

        </div>
      </section>

      {/* 4. The Clean, Soft Call to Action */}
      <section style={{ 
        padding: "clamp(64px, 8vw, 100px) 24px", 
        background: "var(--mist)", 
        textAlign: "center",
        borderTop: "1px solid var(--line)"
      }}>
        <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "var(--ink-strong)", marginBottom: "32px", letterSpacing: "-0.02em" }}>
          Ready to get started?
        </h2>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link 
            href="/auth/register/professional" 
            style={{ 
              background: "var(--teal)", color: "#fff", padding: "14px 32px", 
              fontSize: "1.05rem", fontWeight: 600, borderRadius: "99px", textDecoration: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 12px rgba(3, 152, 158, 0.2)"
            }}
          >
            I am a Professional
          </Link>
          <Link 
            href="/auth/register/facility" 
            style={{ 
              background: "#fff", color: "var(--ink-strong)", padding: "14px 32px", 
              fontSize: "1.05rem", fontWeight: 600, borderRadius: "99px", textDecoration: "none",
              border: "1px solid var(--line-strong)", transition: "transform 0.2s ease"
            }}
          >
            I represent a Facility
          </Link>
        </div>
      </section>
    </main>
  );
}
