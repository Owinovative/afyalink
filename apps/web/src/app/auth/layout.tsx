import { BrandLockup } from "@/components/layout/BrandLockup";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--paper)" }}>
      
      {/* Left Side: Cinematic Brand Panel (Hidden on mobile) */}
      <div className="auth-brand-panel" style={{ flex: 1, position: "relative", display: "none", backgroundColor: "var(--deep)", overflow: "hidden" }}>
        <style>{`@media (min-width: 900px) { .auth-brand-panel { display: block !important; } }`}</style>
        
        {/* Background Image & Overlay */}
        <Image 
          src="/images/hero/healthcare-professional-reviewing-records.jpg" 
          alt="Healthcare Professional" 
          fill 
          style={{ objectFit: "cover", opacity: 0.4 }}
          priority
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(2,6,23,0.2) 0%, rgba(2,6,23,0.9) 100%)" }} />

        <div style={{ position: "relative", zIndex: 10, padding: "48px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <BrandLockup />
          </Link>

          <div style={{ color: "#fff", maxWidth: "480px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              <span className="badge green" style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981" }}>
                Audited & Secure
              </span>
            </div>
            <h1 style={{ fontSize: "2.5rem", letterSpacing: "-0.02em", marginBottom: "16px", lineHeight: 1.1 }}>
              The verified network for clinical talent.
            </h1>
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
              Join thousands of healthcare professionals and premier facilities using Afyalink to securely manage credentials and hiring.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: The Form Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        
        {/* Mobile Logo (Only shows on small screens) */}
        <div className="mobile-auth-header" style={{ padding: "24px", display: "none", borderBottom: "1px solid var(--line)" }}>
          <style>{`@media (max-width: 899px) { .mobile-auth-header { display: flex !important; } }`}</style>
          <Link href="/" style={{ textDecoration: "none" }}>
            <BrandLockup />
          </Link>
        </div>

        {/* Form Container */}
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(24px, 5vw, 64px)" }}>
          <div style={{ width: "100%", maxWidth: "440px", animation: "fade-in-up 0.5s ease-out" }}>
            <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            
            {/* THIS IS WHERE YOUR PAGES (Login/Register) WILL INJECT */}
            {children}
            
          </div>
        </main>
      </div>
      
    </div>
  );
}
