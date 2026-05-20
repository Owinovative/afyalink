import Link from "next/link";
import { marketingLinks } from "@/lib/routes";

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">A</span>
            <span>Afyalink</span>
          </Link>
          <p style={{ marginTop: 14 }}>
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
      <div className="container" style={{ marginTop: 34, color: "#9db5b4", fontSize: "0.88rem" }}>
        Afyalink protects sensitive credential data through private storage, authorization, audit trails, and controlled
        viewing workflows.
      </div>
    </footer>
  );
}
