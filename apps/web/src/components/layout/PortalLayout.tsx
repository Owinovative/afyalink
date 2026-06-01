"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { clearToken, usePortalSession } from "@/lib/auth/session";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { PortalAccessDenied, ProtectedPortalGate } from "@/components/layout/ProtectedPortalGate";
import type { ApiRole } from "@/lib/api/client";

export function PortalLayout({
  role,
  title,
  navigation,
  children,
}: {
  role: ApiRole;
  title: string;
  navigation: Array<{ href: string; label: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const session = usePortalSession(role);
  const loginHref = "/auth/login";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close the mobile menu automatically when the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

   // Extract user initial safely for TypeScript
  const userEmailString = String(session.user?.email || "");
  const userInitial = userEmailString.length > 0 ? userEmailString.charAt(0).toUpperCase() : "U";

  // 1. Loading State
  if (session.status === "loading") {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <BrandLockup kicker={title} />
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--line)", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (session.status === "signed-out") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--paper)" }}>
        <header style={{ flexShrink: 0, height: "72px", background: "#fff", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
          <Link className="brand" href="/" style={{ textDecoration: "none" }}>
            <BrandLockup kicker={title} />
          </Link>
          <Link className="button" href={loginHref} style={{ minHeight: "36px", padding: "8px 16px", fontSize: "0.85rem" }}>
            Sign in
          </Link>
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>
          <ProtectedPortalGate role={role} title={title} />
        </main>
      </div>
    );
  }

  // 3. Wrong Role State
  if (session.status === "wrong-role") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--paper)" }}>
        <header style={{ flexShrink: 0, height: "72px", background: "#fff", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
          <Link className="brand" href="/" style={{ textDecoration: "none" }}>
            <BrandLockup kicker={title} />
          </Link>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link className="button secondary" href={loginHref} style={{ minHeight: "36px", padding: "8px 16px", fontSize: "0.85rem" }}>
              Switch account
            </Link>
            <button className="button ghost" onClick={() => clearToken(role)} style={{ minHeight: "36px", padding: "8px 16px", fontSize: "0.85rem" }}>
              Clear session
            </button>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>
          <PortalAccessDenied requestedRole={role} actualRole={session.actualRole} title={title} />
        </main>
      </div>
    );
  }

  // 4. Authenticated "Premium App Shell" State
  return (
    <>
      {/* 
        Injecting a scoped stylesheet specifically for the Shell's structural behavior. 
        This handles the mobile menu logic perfectly without cluttering globals.css.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        .shell-wrap { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; background: var(--paper); }
        .shell-header { flex-shrink: 0; height: 64px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; padding: 0 24px; justify-content: space-between; z-index: 50; }
        .shell-body { display: flex; flex: 1; overflow: hidden; position: relative; }
        
        .shell-sidebar { width: 260px; flex-shrink: 0; background: #fff; border-right: 1px solid var(--line); display: flex; flex-direction: column; padding: 24px 16px; overflow-y: auto; z-index: 40; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .shell-main { flex: 1; overflow-y: auto; padding: clamp(24px, 4vw, 48px) max(24px, calc((100% - 1100px) / 2)); background: var(--paper); }
        
        .nav-link { display: flex; align-items: center; padding: 10px 14px; margin-bottom: 4px; border-radius: var(--radius-sm); color: var(--ink-soft); font-weight: 600; font-size: 0.875rem; transition: all 0.2s ease; position: relative; }
        .nav-link:hover { background: var(--mist); color: var(--ink-strong); transform: translateX(4px); }
        .nav-link.active { color: var(--teal); background: var(--teal-soft); font-weight: 700; }
        .nav-link.active::before { content: ""; position: absolute; left: -8px; top: 15%; bottom: 15%; width: 4px; background: var(--teal); border-radius: 0 4px 4px 0; }
        
        .mobile-overlay { display: none; position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 30; opacity: 0; transition: opacity 0.3s ease; }
        .hamburger-btn { display: none; background: transparent; border: none; cursor: pointer; padding: 8px; margin-left: -8px; margin-right: 8px; flex-direction: column; gap: 4px; }
        .hamburger-btn span { display: block; width: 22px; height: 2px; background: var(--ink-strong); transition: all 0.2s ease; border-radius: 2px; }

        @media (max-width: 800px) {
          .shell-header { padding: 0 16px; }
          .hamburger-btn { display: flex; }
          .shell-sidebar { position: absolute; inset: 0 auto 0 0; transform: translateX(-100%); box-shadow: var(--shadow-2xl); }
          .shell-sidebar.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          .user-email-text { display: none; }
        }
      `}} />

      <div className="shell-wrap">
        
        {/* Fixed Frosted Header */}
        <header className="shell-header">
          <div style={{ display: "flex", alignItems: "center" }}>
            <button 
              className="hamburger-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              <span style={{ transform: mobileMenuOpen ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
              <span style={{ opacity: mobileMenuOpen ? 0 : 1 }} />
              <span style={{ transform: mobileMenuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
            </button>
            <Link className="brand" href="/" style={{ textDecoration: "none" }}>
              <BrandLockup kicker={title} />
            </Link>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", paddingRight: "16px", borderRight: "1px solid var(--line)" }}>
              <div style={{ 
                width: "32px", 
                height: "32px", 
                borderRadius: "50%", 
                background: "linear-gradient(135deg, var(--teal), var(--deep))", 
                color: "#fff", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontWeight: 700, 
                fontSize: "0.85rem",
                boxShadow: "0 2px 8px rgba(3, 152, 158, 0.2)"
              }}>
                {userInitial}
              </div>
              <span className="user-email-text" style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 600 }}>
                {String(session.user?.email || "Workspace User")}
              </span>
            </div>
            
            <button 
              className="button ghost" 
              onClick={() => clearToken(role)} 
              style={{ minHeight: "32px", padding: "6px 12px", fontSize: "0.8rem", color: "var(--ink-soft)" }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <div className="shell-body">
          
          {/* Mobile Background Overlay */}
          <div 
            className={`mobile-overlay ${mobileMenuOpen ? "open" : ""}`} 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Fixed/Sliding Sidebar */}
          <aside className={`shell-sidebar ${mobileMenuOpen ? "open" : ""}`}>
            <div style={{ marginBottom: "24px", padding: "0 14px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Main Menu
              </span>
            </div>
            
            <nav aria-label="Portal navigation" style={{ display: "flex", flexDirection: "column" }}>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ marginTop: "auto", paddingTop: "32px", borderTop: "1px solid var(--line-light)", textAlign: "center", paddingBottom: "12px" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
                &copy; {new Date().getFullYear()} Afyalink Platform
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--line-strong)", margin: "4px 0 0 0" }}>
                System Secured
              </p>
            </div>
          </aside>

          {/* Scrollable Content Area */}
          <main className="shell-main">
            <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "1100px", margin: "0 auto", animation: "fade-in 0.4s ease-out" }}>
              <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              {children}
            </div>
          </main>
        </div>

      </div>
    </>
  );
}
