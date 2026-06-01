"use client";

import Link from "next/link";

export function MatchingExperience() {
  return (
    <main className="matching-experience">
      
      {/* 1. Cinematic Hero */}
      <section className="matching-hero">
        <div className="matching-hero-content">
          <span className="eyebrow" style={{ color: 'var(--teal-soft)', letterSpacing: '0.15em' }}>Intelligent Matching</span>
          <h1>The right professional.<br/>Exactly when you need them.</h1>
          <p>
            Stop sifting through unverified resumes. Afyalink's matching engine connects premium facilities with audited, ready-to-work clinical talent.
          </p>
          <div className="hero-actions" style={{ marginTop: "32px" }}>
            <Link href="/auth/register/facility" className="button">
              Start Hiring
            </Link>
            <Link href="/professionals" className="button translucent">
              Join as a Professional
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Process Section */}
      <section className="section-frame section-white">
        <div className="matching-process">
          <div>
            <span className="eyebrow">The Pipeline</span>
            <h2 style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", marginTop: "8px", letterSpacing: "-0.02em" }}>
              From requisition to placement in days.
            </h2>
            <p style={{ fontSize: "1.1rem", color: "var(--ink-soft)", marginTop: "16px" }}>
              We handle the sourcing, the background checks, and the initial availability screening so your HR team can focus on the final interview.
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <strong style={{ display: "block", color: "var(--ink-strong)", fontSize: "1.05rem" }}>Define the Role</strong>
              <p style={{ color: "var(--ink-soft)" }}>Post a detailed requisition including specialty, shift type, and required experience.</p>
            </li>
            <li>
              <span>02</span>
              <strong style={{ display: "block", color: "var(--ink-strong)", fontSize: "1.05rem" }}>Network Search</strong>
              <p style={{ color: "var(--ink-soft)" }}>Our algorithm scans thousands of verified profiles for exact matches in your region.</p>
            </li>
            <li>
              <span>03</span>
              <strong style={{ display: "block", color: "var(--ink-strong)", fontSize: "1.05rem" }}>Curated Shortlist</strong>
              <p style={{ color: "var(--ink-soft)" }}>Receive a vetted list of interested, available professionals within 48 hours.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* 3. Secure Review Panel */}
      <section className="section-frame section-mist">
        <div className="container">
          <div className="matching-review-panel">
            <div className="matching-review-copy">
              <span className="eyebrow" style={{ color: "var(--teal-soft)" }}>Secure Review</span>
              <h2>Evaluate with confidence.</h2>
              <p>
                Review watermarked statutory documents, practicing licenses, and verified CPD points before initiating contact.
              </p>
              <div className="matching-reason-grid" style={{ marginTop: "24px" }}>
                <span>Nursing Council Check</span>
                <span>Identity Verification</span>
                <span>Education Audit</span>
                <span>Reference Checks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust Banner */}
      <section className="section-frame section-white">
        <div className="container">
          <div className="matching-split trust-bg">
            <div className="matching-review-copy">
              <span className="eyebrow" style={{ color: "var(--teal-soft)" }}>Built for Trust</span>
              <h2>Privacy-first candidate discovery.</h2>
              <p>
                Professionals control their visibility. Facilities get audited access to sensitive credentials. A perfect balance of opportunity and security.
              </p>
              <div className="hero-actions" style={{ marginTop: "24px" }}>
                <Link href="/trust-security" className="button" style={{ background: "#fff", color: "var(--deep)" }}>
                  View Security Model
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
