import Link from "next/link";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { publicContact } from "@/lib/contact";

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
          <strong>Contact</strong>
          <span>{publicContact.location}</span>
          {publicContact.phoneHref ? <a href={publicContact.phoneHref}>{publicContact.phone}</a> : null}
          <a href={publicContact.siteUrl}>{publicContact.website}</a>
          {publicContact.email ? <a href={`mailto:${publicContact.email}`}>{publicContact.email}</a> : null}
          {publicContact.supportEmail ? <a href={`mailto:${publicContact.supportEmail}`}>{publicContact.supportEmail}</a> : null}
          <Link href="/trust-security">Security</Link>
        </div>
      </div>
      <div className="footer-note">
        Private records. Approved access. Audited viewing.
      </div>
    </footer>
  );
}
