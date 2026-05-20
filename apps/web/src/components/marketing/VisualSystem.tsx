import Link from "next/link";
import type { ReactNode } from "react";

export type VisualTone = "teal" | "green" | "gold" | "deep";

const visualBySlug: Record<string, { src: string; alt: string; tone: VisualTone }> = {
  home: {
    src: "/images/hero/healthcare-trust-canvas.svg",
    alt: "Illustration of Afyalink healthcare verification, facility access, and secure candidate review workflows.",
    tone: "deep",
  },
  "how-it-works": {
    src: "/images/verification/verification-operations.svg",
    alt: "Illustration of professional intake, Afyalink review, and facility access workflow stages.",
    tone: "teal",
  },
  professionals: {
    src: "/images/professionals/professional-verification.svg",
    alt: "Illustration of a healthcare professional moving through credential verification and interview steps.",
    tone: "green",
  },
  students: {
    src: "/images/students/waiting-license-track.svg",
    alt: "Illustration of a healthcare student preparing an Afyalink profile while waiting for a professional license.",
    tone: "gold",
  },
  facilities: {
    src: "/images/facilities/facility-marketplace.svg",
    alt: "Illustration of a healthcare facility reviewing secure marketplace candidate profiles.",
    tone: "deep",
  },
  "trust-security": {
    src: "/images/security/secure-candidate-viewing.svg",
    alt: "Illustration of a watermarked candidate profile protected by audit logging and access controls.",
    tone: "teal",
  },
  verification: {
    src: "/images/verification/verification-operations.svg",
    alt: "Illustration of credential review, regulatory verification, interview scoring, and publication approval.",
    tone: "green",
  },
  "pricing-access": {
    src: "/images/marketplace/candidate-marketplace.svg",
    alt: "Illustration of subscription-gated candidate marketplace access.",
    tone: "gold",
  },
  recommendations: {
    src: "/images/recommendations/recommendation-package.svg",
    alt: "Illustration of an Afyalink recommendation package with shortlisted candidates and rationale.",
    tone: "gold",
  },
  about: {
    src: "/images/hero/healthcare-trust-canvas.svg",
    alt: "Illustration of Afyalink as healthcare trust infrastructure across professionals, facilities, and operations.",
    tone: "deep",
  },
  contact: {
    src: "/images/recommendations/recommendation-package.svg",
    alt: "Illustration of Afyalink contact and recommendation workflow packaging.",
    tone: "gold",
  },
  faq: {
    src: "/images/security/secure-candidate-viewing.svg",
    alt: "Illustration of secure candidate access and workflow answers.",
    tone: "teal",
  },
};

export function getVisualForSlug(slug: string) {
  return visualBySlug[slug] ?? visualBySlug.home;
}

export function SectionFrame({
  children,
  tone = "plain",
  className = "",
}: {
  children: ReactNode;
  tone?: "plain" | "soft" | "deep" | "warm";
  className?: string;
}) {
  return <section className={`section-frame ${tone === "plain" ? "" : `section-${tone}`} ${className}`}>{children}</section>;
}

export function SectionIntro({
  eyebrow,
  title,
  body,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`section-intro ${align === "center" ? "center" : ""}`}>
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export function ImagePanel({
  src,
  alt,
  tone = "teal",
  priority = false,
}: {
  src: string;
  alt: string;
  tone?: VisualTone;
  priority?: boolean;
}) {
  return (
    <figure className={`image-panel tone-${tone}`}>
      <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} />
    </figure>
  );
}

export function FeatureSplit({
  eyebrow,
  title,
  body,
  points,
  visual,
  reverse = false,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: { src: string; alt: string; tone?: VisualTone };
  reverse?: boolean;
  cta?: { label: string; href: string };
}) {
  return (
    <div className={`feature-split ${reverse ? "reverse" : ""}`}>
      <div className="feature-copy">
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{body}</p>
        <ul className="check-list">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        {cta ? (
          <Link className="button secondary" href={cta.href}>
            {cta.label}
          </Link>
        ) : null}
      </div>
      <ImagePanel src={visual.src} alt={visual.alt} tone={visual.tone} />
    </div>
  );
}

export function ProofStrip({ items }: { items: Array<{ label: string; value: string; body?: string }> }) {
  return (
    <div className="proof-strip">
      {items.map((item) => (
        <div className="proof-item" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          {item.body ? <p>{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function ProcessTimeline({ steps }: { steps: Array<{ title: string; body: string }> }) {
  return (
    <ol className="process-timeline">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function VisualCard({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <article className="visual-card">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
    </article>
  );
}

export function LargeCTA({
  eyebrow,
  title,
  body,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="large-cta">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="action-row">
        <Link className="button" href={primary.href}>
          {primary.label}
        </Link>
        {secondary ? (
          <Link className="button secondary" href={secondary.href}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
