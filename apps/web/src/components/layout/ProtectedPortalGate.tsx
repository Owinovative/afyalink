import Image from "next/image";
import Link from "next/link";
import { BrandLockup } from "@/components/layout/BrandLockup";
import type { ApiRole } from "@/lib/api/client";
import { portalByRole } from "@/lib/auth/session";

const roleCopy: Record<ApiRole, { label: string; image: string; alt: string }> = {
  professional: {
    label: "Your workspace is protected.",
    image: "/images/professionals/clinical-professional-consultation.jpg",
    alt: "Healthcare professional in a clinical consultation.",
  },
  facility: {
    label: "Facility workspace is protected.",
    image: "/images/facilities/hospital-facility-team.jpg",
    alt: "Healthcare facility team in a hospital corridor.",
  },
  admin: {
    label: "Admin workspace is protected.",
    image: "/images/verification/admin-verification-desk.jpg",
    alt: "Credential verification desk with clinical records.",
  },
};

export function ProtectedPortalGate({ role, title }: { role: ApiRole; title: string }) {
  const copy = roleCopy[role];

  return (
    <main className="portal-locked">
      <Image src={copy.image} alt={copy.alt} fill priority sizes="100vw" className="portal-locked-image" />
      <div className="portal-locked-overlay" />
      <section className="portal-gate-card" aria-label={`${title} protected sign-in state`}>
        <div className="portal-gate-brand">
          <BrandLockup kicker={title} />
        </div>
        <span className="eyebrow">{title}</span>
        <h1>Sign in to continue.</h1>
        <p>{copy.label}</p>
        <div className="action-row">
          <Link className="button" href="/auth/login">
            Sign in
          </Link>
          <Link className="button secondary" href="/">
            Public site
          </Link>
        </div>
      </section>
    </main>
  );
}

export function PortalAccessDenied({
  requestedRole,
  actualRole,
  title,
}: {
  requestedRole: ApiRole;
  actualRole: ApiRole | null;
  title: string;
}) {
  const copy = roleCopy[requestedRole];
  const dashboard = actualRole ? portalByRole[actualRole] : "/auth/login";

  return (
    <main className="portal-locked">
      <Image src={copy.image} alt={copy.alt} fill priority sizes="100vw" className="portal-locked-image" />
      <div className="portal-locked-overlay" />
      <section className="portal-gate-card" aria-label={`${title} access denied`}>
        <div className="portal-gate-brand">
          <BrandLockup kicker={title} />
        </div>
        <span className="eyebrow">Access denied</span>
        <h1>Wrong workspace.</h1>
        <p>This workspace belongs to {requestedRole} users.</p>
        <div className="action-row">
          <Link className="button" href={dashboard}>
            Go to your dashboard
          </Link>
          <Link className="button secondary" href="/auth/login">
            Switch account
          </Link>
        </div>
      </section>
    </main>
  );
}
