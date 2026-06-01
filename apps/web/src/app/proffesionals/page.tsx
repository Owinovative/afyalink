import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "For Professionals | Afyalink",
  description: "Build a verified clinical profile and connect with top healthcare facilities.",
};

export default function ProfessionalsPage() {
  return (
    <main>
      {/* Cinematic Hero */}
      <section className="photo-hero">
        <Image
          src="/images/professionals/clinical-professional-consultation.jpg"
          alt="Clinical professional consulting with a patient"
          fill
          priority
          className="photo-hero-bg"
        />
        <div className="photo-hero-overlay" />
        
        <div className="hero-shell hero-container">
          <div className="hero-copy">
            <span className="eyebrow">For Clinical Professionals</span>
            <h1>Your credentials.<br/>Your career. Verified.</h1>
            <p className="lead">
              Afyalink provides a secure, audited workspace for healthcare professionals. 
              Build your verified record once, and let top-tier facilities come to you.
            </p>
            <div className="hero-actions" style={{ marginTop: "16px" }}>
              <Link href="/auth/register/professional" className="button">
                Apply for Workspace
              </Link>
              <Link href="/auth/register/student" className="button translucent">
                Student Early Access
              </Link>
            </div>
            
            <div className="hero-proof-pills" style={{ marginTop: "32px" }}>
              <span>✓ End-to-end Encryption</span>
              <span>✓ Verified by regulators</span>
              <span>✓ Direct facility matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Feature Split */}
      <section className="section-frame section-white">
        <div className="container">
          <div className="editorial-split">
            <figure className="photo-panel panel-portrait">
              <Image 
                src="/images/security/credential-security-review.jpg" 
                alt="Secure credential review process" 
                fill 
                className="media-image"
              />
            </figure>
            <div className="feature-copy">
              <span className="eyebrow">The Afyalink Standard</span>
              <h2>Stop sending your documents through insecure channels.</h2>
              <p>
                Emailing PDFs and carrying physical folders is outdated and insecure. 
                Afyalink gives you a private, cryptographically secure vault for your licenses, 
                degrees, and identity documents.
              </p>
              <ul className="check-list" style={{ marginTop: "16px" }}>
                <li>Facilities only see watermarked, read-only versions.</li>
                <li>You receive a complete audit log of who viewed your profile.</li>
                <li>Your data is never shared without explicit placement intent.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Band */}
      <section className="section-frame section-mist">
        <div className="container">
          <div className="section-intro center">
            <span className="eyebrow">How it works</span>
            <h2>Three steps to placement.</h2>
            <p>We handle the verification overhead so you can focus on patient care.</p>
          </div>
          
          <ul className="process-steps">
            <li>
              <span>01. Build Profile</span>
              <h3 style={{ margin: "12px 0 8px" }}>Submit Credentials</h3>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--ink-soft)" }}>
                Upload your statutory documents, practicing licenses, and CV into your secure vault.
              </p>
            </li>
            <li>
              <span>02. Verification</span>
              <h3 style={{ margin: "12px 0 8px" }}>Admin Audit</h3>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--ink-soft)" }}>
                Our team verifies your records against national regulatory databases to grant you a "Verified" badge.
              </p>
            </li>
            <li>
              <span>03. Matching</span>
              <h3 style={{ margin: "12px 0 8px" }}>Get Shortlisted</h3>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--ink-soft)" }}>
                Premium facilities browse verified profiles and initiate contact for full-time or locum placements.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* High-Impact CTA */}
      <section className="section-frame section-deep">
        <div className="container" style={{ textAlign: "center", padding: "64px 0" }}>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Ready to elevate your career?</h2>
          <p style={{ color: "var(--teal-soft)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 32px" }}>
            Join the network of verified healthcare professionals redefining medical staffing in Africa.
          </p>
          <Link href="/auth/register/professional" className="button" style={{ background: "#fff", color: "var(--deep)" }}>
            Create your secure account
          </Link>
        </div>
      </section>
    </main>
  );
}
