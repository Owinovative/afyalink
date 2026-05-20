import Link from "next/link";
import { marketingLinks } from "@/lib/routes";

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <img alt="" src="/brand/afyalink-logo.png" />
          <span>Afyalink</span>
        </Link>
        <nav className="nav-links" aria-label="Public navigation">
          {marketingLinks.slice(0, 6).map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="button ghost" href="/auth/login">
            Login
          </Link>
          <Link className="button" href="/auth/register/professional">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
