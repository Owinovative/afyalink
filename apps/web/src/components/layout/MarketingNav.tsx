"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BrandLockup } from "@/components/layout/BrandLockup";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect scroll to trigger the frosted glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          background: scrolled ? "rgba(15, 23, 42, 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid transparent",
          padding: scrolled ? "12px 24px" : "24px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <BrandLockup /> 
          </Link>

          {/* Desktop Navigation */}
          <nav style={{ display: "none", gap: "32px", alignItems: "center" }} className="desktop-nav">
            <style>{`
              @media (min-width: 900px) { .desktop-nav { display: flex !important; } }
              .nav-item { color: rgba(255,255,255,0.8); font-weight: 500; font-size: 0.95rem; text-decoration: none; transition: color 0.2s ease; }
              .nav-item:hover { color: #ffffff; }
              .glow-btn { 
                background: linear-gradient(135deg, var(--teal), var(--deep)); 
                color: #fff; 
                padding: 10px 24px; 
                border-radius: 999px; 
                font-weight: 600; 
                text-decoration: none; 
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(3, 152, 158, 0.3);
              }
              .glow-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(3, 152, 158, 0.5);
              }
            `}</style>
            
            <Link href="/professionals" className="nav-item">Professionals</Link>
            <Link href="/facilities" className="nav-item">Facilities</Link>
            <Link href="/matching" className="nav-item">Matching</Link>
            <Link href="/resources" className="nav-item">Resources</Link>
            
            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)" }} />
            
            <Link href="/auth/login" className="nav-item" style={{ fontWeight: 600 }}>Sign In</Link>
            <Link href="/auth/register" className="glow-btn">Get Started</Link>
          </nav>

          {/* Mobile Hamburger (Only shows on small screens) */}
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "flex", flexDirection: "column", gap: "5px", background: "transparent", border: "none", cursor: "pointer", zIndex: 101
            }}
          >
            <style>{`@media (min-width: 900px) { .mobile-toggle { display: none !important; } }`}</style>
            <span style={{ width: "24px", height: "2px", background: "#fff", transition: "all 0.3s ease", transform: mobileMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ width: "24px", height: "2px", background: "#fff", transition: "all 0.3s ease", opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ width: "24px", height: "2px", background: "#fff", transition: "all 0.3s ease", transform: mobileMenuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
      </header>

      {/* Fullscreen Mobile Menu Overlay */}
      <div style={{
        position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.98)", zIndex: 99,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px",
        opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? "all" : "none",
        transition: "opacity 0.4s ease"
      }}>
        <Link href="/professionals" className="nav-item" style={{ fontSize: "1.5rem" }} onClick={() => setMobileMenuOpen(false)}>Professionals</Link>
        <Link href="/facilities" className="nav-item" style={{ fontSize: "1.5rem" }} onClick={() => setMobileMenuOpen(false)}>Facilities</Link>
        <Link href="/matching" className="nav-item" style={{ fontSize: "1.5rem" }} onClick={() => setMobileMenuOpen(false)}>Matching</Link>
        <Link href="/resources" className="nav-item" style={{ fontSize: "1.5rem" }} onClick={() => setMobileMenuOpen(false)}>Resources</Link>
        <div style={{ width: "60px", height: "2px", background: "rgba(255,255,255,0.2)" }} />
        <Link href="/auth/login" className="nav-item" style={{ fontSize: "1.5rem" }} onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
        <Link href="/auth/register" className="glow-btn" style={{ fontSize: "1.25rem", padding: "12px 32px" }} onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
      </div>
    </>
  );
}
