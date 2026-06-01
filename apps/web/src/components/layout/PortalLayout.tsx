"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  // 4. Authenticated "App Shell" State
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--paper)" }}>
      
      {/* Fixed Header */}
      <header style={{
        flexShrink: 0,
        height: "64px",
        background: "#fff",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        justifyContent: "space-between",
        zIndex: 40
      }}>
        <Link className="brand" href="/" style={{ textDecoration: "none" }}>
          <BrandLockup kicker={title} />
        </Link>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 600 }}>
            {String(session.user?.email || "Workspace User")}
          </span>
          <Link className="button secondary" href={loginHref} style={{ minHeight: "32px", padding: "6px 12px", fontSize: "0.8rem" }}>
            Switch
          </Link>
          <button className="button ghost" onClick={() => clearToken(role)} style={{ minHeight: "32px", padding: "6px 12px", fontSize: "0.8rem" }}>
            Sign out
          </button>
        </div>
      </header>

      {/* Main Workspace Workspace (Flex Row) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Fixed Sidebar */}
        <aside style={{
          width: "260px",
          flexShrink: 0,
          background: "#fff",
          borderRight: "1px solid var(--line)",
          overflowY: "auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column"
        }}>
          <nav aria-label="Portal navigation" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    color: isActive ? "var(--teal)" : "var(--ink-soft)",
                    background: isActive ? "var(--teal-soft)" : "transparent",
                    fontWeight: isActive ? 700 : 600,
                    fontSize: "0.85rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: "auto", paddingTop: "24px", paddingBottom: "12px", fontSize: "0.75rem", color: "var(--muted)", textAlign: "center" }}>
            &copy; {new Date().getFullYear()} Afyalink Dashboard
          </div>
        </aside>

        {/* Scrollable Content Area */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "clamp(24px, 4vw, 48px) max(24px, calc((100% - 1000px) / 2))",
          background: "var(--paper)"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
