import Link from "next/link";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { marketingLinks } from "@/lib/routes";

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Link className="brand" href="/">
            <BrandLockup />
          </Link>
          <p style={{ marginTop: 16 }}>
            Secure healthcare verification, controlled facility access, and audited candidate recommendation workflows.
          </p>
        </div>
        <div className="footer-links">
          <strong>Platform</strong>
          {marketingLinks.slice(0, 4).map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="footer-links">
          <strong>Portals</strong>
          <Link href="/auth/register/professional">Professional application</Link>
          <Link href="/auth/register/facility">Facility onboarding</Link>
          <Link href="/auth/login">Sign in</Link>
        </div>
        <div className="footer-links">
          <strong>Trust</strong>
          <Link href="/trust-security">Security model</Link>
          <Link href="/verification">Verification workflow</Link>
          <Link href="/pricing-access">Facility access</Link>
        </div>
      </div>
      <div className="footer-note">
        Afyalink protects sensitive credential data through private storage, authorization, audit trails, and controlled
        viewing workflows.
      </div>
    </footer>
  );
}
