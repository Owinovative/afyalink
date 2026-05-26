import Image from "next/image";
import Link from "next/link";
import type { ApiRole } from "@/lib/api/client";

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
