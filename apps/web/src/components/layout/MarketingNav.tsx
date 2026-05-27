"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLockup } from "@/components/layout/BrandLockup";

const primaryLinks = [
  { href: "/professionals", label: "Professionals" },
  { href: "/students", label: "Students" },
  { href: "/facilities", label: "Facilities" },
  { href: "/matching", label: "Matching" },
  { href: "/trust-security", label: "Trust" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function active(href: string) {
    return pathname === href ? "page" : undefined;
  }

  return (
    <header className="marketing-nav">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <BrandLockup />
        </Link>
        <nav className="nav-links" aria-label="Public navigation">
          {primaryLinks.map((link) => (
            <Link href={link.href} key={link.href} aria-current={active(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="button ghost" href="/auth/login">
            Sign in
          </Link>
          <Link className="button" href="/auth/register/professional">
            Get started
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Toggle navigation"
            aria-controls="mobile-public-navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className={`mobile-nav-panel ${open ? "open" : ""}`} id="mobile-public-navigation">
        <nav aria-label="Mobile public navigation">
          {primaryLinks.map((link) => (
            <Link href={link.href} key={link.href} aria-current={active(link.href)} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/pricing-access" aria-current={active("/pricing-access")} onClick={() => setOpen(false)}>
            Access
          </Link>
          <Link href="/contact" aria-current={active("/contact")} onClick={() => setOpen(false)}>
            Contact
          </Link>
          <Link href="/auth/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <Link href="/auth/register/professional" onClick={() => setOpen(false)}>
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
