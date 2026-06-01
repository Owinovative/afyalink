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

  if (session.status === "signed-out") {
    return (
      <div className="portal-frame">
        <header className="marketing-nav">
          <div className="portal-topbar">
            <Link className="brand" href="/">
              <BrandLockup kicker={title} />
            </Link>
            <div className="nav-actions">
              <Link className="button" href={loginHref}>
                Sign in
              </Link>
            </div>
          </div>
        </header>
        <ProtectedPortalGate role={role} title={title} />
      </div>
    );
  }

  if (session.status === "wrong-role") {
    return (
      <div className="portal-frame">
        <header className="marketing-nav">
          <div className="portal-topbar">
            <Link className="brand" href="/">
              <BrandLockup kicker={title} />
            </Link>
            <div className="nav-actions">
              <Link className="button secondary" href={loginHref}>
                Switch account
              </Link>
              <button className="button ghost" onClick={() => clearToken(role)}>
                Clear session
              </button>
            </div>
          </div>
        </header>
        <PortalAccessDenied requestedRole={role} actualRole={session.actualRole} title={title} />
      </div>
    );
  }

  if (session.status === "loading") {
    return (
      <div className="portal-frame">
        <header className="marketing-nav">
          <div className="portal-topbar">
            <Link className="brand" href="/">
              <BrandLockup kicker={title} />
            </Link>
          </div>
        </header>
        <main className="portal-locked">
          <section className="portal-gate-card" aria-label={`${title} access check`}>
            <div className="portal-gate-brand">
              <BrandLockup kicker={title} />
            </div>
            <span className="eyebrow">Checking access</span>
            <h1>Authenticating...</h1>
            <p>Loading your secure workspace.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="portal-frame">
      <header className="marketing-nav">
        <div className="portal-topbar">
          <Link className="brand" href="/">
            <BrandLockup kicker={title} />
          </Link>
          <div className="nav-actions">
            <Link className="button secondary" href={loginHref}>
              Switch account
            </Link>
            <button className="button ghost" onClick={() => clearToken(role)}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="portal-shell">
        <aside className="portal-side">
          <nav aria-label="Portal navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  color: pathname === item.href ? "var(--ink-strong)" : "var(--ink-soft)",
                  background: pathname === item.href ? "var(--mist)" : "transparent",
                  fontWeight: pathname === item.href ? 700 : 500,
                  transition: "all 0.2s ease",
                  marginBottom: "4px"
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="portal-main">
          {children}
        </main>
      </div>
    </div>
  );
}
