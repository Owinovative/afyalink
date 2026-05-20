"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearToken, useSessionToken } from "@/lib/auth/session";
import type { ApiRole } from "@/lib/api/client";

export function PortalLayout({
  role,
  title,
  links,
  children,
}: {
  role: ApiRole;
  title: string;
  links: Array<{ href: string; label: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const token = useSessionToken(role);
  const loginHref = "/auth/login";

  return (
    <div className="portal-frame">
      <header className="marketing-nav">
        <div className="portal-topbar">
          <Link className="brand" href="/">
            <img alt="" src="/brand/afyalink-logo.png" />
            <span>{title}</span>
          </Link>
          <div className="nav-actions">
            <Link className="button secondary" href={loginHref}>
              {token ? "Switch account" : "Sign in"}
            </Link>
            {token ? (
              <button className="button ghost" onClick={() => clearToken(role)}>
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="portal-shell">
        <aside className="portal-side">
          <nav aria-label={`${title} navigation`}>
            {links.map((link) => (
              <Link href={link.href} key={link.href} aria-current={pathname === link.href ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="portal-main">
          {!token ? (
            <div className="notice">
              Sign in to load live records. Backend authorization remains the source of truth for every workflow action.
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
