import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "For Facilities | Afyalink",
  description: "Hire verified healthcare professionals from a secure, audited talent network.",
};

export default function FacilitiesPage() {
  return (
    <main>
      {/* Cinematic Hero */}
      <section className="photo-hero">
        <Image
          src="/images/facilities/hospital-facility-team.jpg"
          alt="Healthcare facility team collaborating"
          fill
          priority
          className="photo-hero-bg"
        />
        <div className="photo-hero-overlay" />
        
        <div className="hero-shell hero-container">
          <div className="hero-copy">
            <span className="eyebrow">For Healthcare Facilities</span>
            <h1>Hire verified talent.<br/>Without the friction.</h1>
            <p className="lead">
              Afyalink is an audited, premium network of clinical professionals. 
              Skip the manual credential checks and connect instantly with verified, ready-to-work staff.
            </p>
            <div className="hero-actions" style={{ marginTop: "16px" }}>
              <Link href="/auth/register/facility" className="button">
                Register Facility
              </Link>
              <Link href="/contact" className="button translucent">
                Contact Sales
              </Link>
            </div>
            
            <div className="hero-proof-pills" style={{ marginTop: "32px" }}>
              <span>✓ Pre-verified licenses</span>
              <span>✓ Instant shortlisting</span>
              <span>✓ Secure credential viewing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Feature Split */}
      <section className="section-frame section-white">
        <div className="container">
          <div className="editorial-split reverse">
            <figure className="photo-panel panel-portrait">
              <Image 
                src="/images/marketplace/facility-candidate-review.jpg" 
                alt="Facility admin reviewing candidates" 
                fill 
                className="media-image"
              />
            </figure>
            <div className="feature-copy">
              <span className="eyebrow">The Talent Network</span>
              <h2>Quality assurance, built into the platform.</h2>
              <p>
                Every professional on Afyalink has passed a strict vetting process. We audit their statutory documents and practicing licenses before they ever appear in your search results.
              </p>
              <ul className="check-list" style={{ marginTop: "16px" }}>
                <li>View watermarked, tamper-proof documents.</li>
                <li>Filter by profession, specialty, and availability.</li>
                <li>Manage your entire hiring pipeline in a secure workspace.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* High-Impact CTA */}
      <section className="section-frame section-deep">
        <div className="container" style={{ textAlign: "center", padding: "64px 0" }}>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Transform your staffing process today.</h2>
          <p style={{ color: "var(--teal-soft)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 32px" }}>
            Join the leading hospitals and clinics relying on Afyalink for secure, verified healthcare recruitment.
          </p>
          <Link href="/auth/register/facility" className="button" style={{ background: "#fff", color: "var(--deep)" }}>
            Create your facility account
          </Link>
        </div>
      </section>
    </main>
  );
}
