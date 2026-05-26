import Link from "next/link";
import { BrandLockup } from "@/components/layout/BrandLockup";

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Link className="brand" href="/">
            <BrandLockup />
          </Link>
          <p style={{ marginTop: 16 }}>Verified talent. Controlled access.</p>
        </div>
        <div className="footer-links">
          <strong>Platform</strong>
          <Link href="/matching">Matching</Link>
          <Link href="/verification">Verification</Link>
          <Link href="/trust-security">Trust</Link>
        </div>
        <div className="footer-links">
          <strong>Portals</strong>
          <Link href="/auth/register/professional">Professional</Link>
          <Link href="/auth/register/student">Student</Link>
          <Link href="/auth/register/facility">Facility</Link>
          <Link href="/auth/login">Sign in</Link>
        </div>
        <div className="footer-links">
          <strong>Trust</strong>
          <Link href="/trust-security">Security</Link>
          <Link href="/verification">Review</Link>
          <Link href="/pricing-access">Access</Link>
        </div>
      </div>
      <div className="footer-note">
        Private records. Approved access. Audited viewing.
      </div>
    </footer>
  );
}
