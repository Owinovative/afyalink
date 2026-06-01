"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { BrandLockup } from "./BrandLockup";

export function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header 
        className="marketing-nav"
        style={{
          background: scrolled ? "rgba(252, 252, 252, 0.85)" : "rgba(252, 252, 252, 1)",
          boxShadow: scrolled ? "0 4px 24px -4px rgba(15, 23, 42, 0.04)" : "none",
          transition: "all 0.3s ease",
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent"
        }}
      >
        <div className="nav-inner">
          <Link className="brand" href="/" aria-label="Afyalink Home">
            <BrandLockup />
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <Link href="/professionals" aria-current={pathname.startsWith("/professionals") ? "page" : undefined}>
              Professionals
            </Link>
            <Link href="/facilities" aria-current={pathname.startsWith("/facilities") ? "page" : undefined}>
              Facilities
            </Link>
            <Link href="/resources" className="nav-link">Resources</Link>
            <Link href="/trust-security" aria-current={pathname.startsWith("/trust") ? "page" : undefined}>
              Trust & Security
            </Link>
          </nav>

          <div className="nav-actions">
            <Link className="button ghost" href="/auth/login">
              Sign in
            </Link>
            <Link className="button" href="/auth/register/facility">
              Hire talent
            </Link>
            <button 
              className="mobile-menu-button" 
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              <span style={{ transform: mobileOpen ? "rotate(45deg) translate(4px, 4px)" : "none", transition: "transform 0.2s" }} />
              <span style={{ opacity: mobileOpen ? 0 : 1, transition: "opacity 0.2s" }} />
              <span style={{ transform: mobileOpen ? "rotate(-45deg) translate(4px, -4px)" : "none", transition: "transform 0.2s" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="mobile-nav-panel open" style={{ position: "fixed", top: "72px", left: 0, right: 0, zIndex: 70, boxShadow: "var(--shadow-lift)" }}>
          <nav>
            <Link href="/professionals">Professionals</Link>
            <Link href="/facilities">Facilities</Link>
            <Link href="/trust-security">Trust & Security</Link>
            <div style={{ height: "1px", background: "var(--line)", margin: "8px 0" }} />
            <Link href="/auth/login" style={{ color: "var(--teal)" }}>Sign in to workspace</Link>
            <Link href="/auth/register/professional">Apply as Professional</Link>
          </nav>
        </div>
      )}
    </>
  );
}
