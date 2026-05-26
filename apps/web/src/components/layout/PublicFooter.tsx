import Link from "next/link";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { contactAddresses } from "@/lib/contact";

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Link className="brand" href="/">
            <BrandLockup />
          </Link>
          <p style={{ marginTop: 16 }}>Verified healthcare talent. Controlled facility access.</p>
        </div>
        <div className="footer-links">
          <strong>Platform</strong>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/matching">Matching</Link>
          <Link href="/verification">Verification</Link>
          <Link href="/trust-security">Trust & security</Link>
        </div>
        <div className="footer-links">
          <strong>Portals</strong>
          <Link href="/auth/register/professional">Professional application</Link>
          <Link href="/auth/register/student">Student track</Link>
          <Link href="/auth/register/facility">Facility onboarding</Link>
          <Link href="/auth/login">Sign in</Link>
        </div>
        <div className="footer-links">
          <strong>Contact</strong>
          <a href={`mailto:${contactAddresses.public}`}>{contactAddresses.public}</a>
          <a href={`mailto:${contactAddresses.support}`}>{contactAddresses.support}</a>
          <Link href="/trust-security">Security model</Link>
        </div>
      </div>
      <div className="footer-note">
        Private records. Approved access. Audited viewing.
      </div>
    </footer>
  );
}
