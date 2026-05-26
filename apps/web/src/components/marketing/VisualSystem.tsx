import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export type VisualTone = "teal" | "green" | "gold" | "deep";

const visualBySlug: Record<string, { src: string; alt: string; tone: VisualTone }> = {
  home: {
    src: "/images/hero/healthcare-professional-reviewing-records.jpg",
    alt: "Healthcare professionals reviewing a patient record in a clinical setting.",
    tone: "deep",
  },
  "how-it-works": {
    src: "/images/verification/admin-verification-desk.jpg",
    alt: "Clinical administrator reviewing healthcare records for verification.",
    tone: "teal",
  },
  matching: {
    src: "/images/facilities/hospital-facility-team.jpg",
    alt: "Healthcare facility team reviewing staffing needs and candidate recommendations.",
    tone: "deep",
  },
  professionals: {
    src: "/images/professionals/clinical-professional-consultation.jpg",
    alt: "Healthcare professional consulting with a patient in a clinic.",
    tone: "green",
  },
  students: {
    src: "/images/students/nursing-student-training-lab.jpg",
    alt: "Healthcare students practicing clinical skills in a training lab.",
    tone: "gold",
  },
  facilities: {
    src: "/images/facilities/hospital-facility-team.jpg",
    alt: "Healthcare facility team standing together in a hospital corridor.",
    tone: "deep",
  },
  "trust-security": {
    src: "/images/security/credential-security-review.jpg",
    alt: "Healthcare worker reviewing protected records on a clinical workstation.",
    tone: "teal",
  },
  verification: {
    src: "/images/verification/admin-verification-desk.jpg",
    alt: "Credential verification desk with healthcare records under review.",
    tone: "green",
  },
  "pricing-access": {
    src: "/images/marketplace/facility-candidate-review.jpg",
    alt: "Healthcare team reviewing candidate and staffing information together.",
    tone: "gold",
  },
  marketplace: {
    src: "/images/marketplace/facility-candidate-review.jpg",
    alt: "Healthcare team reviewing candidate and staffing information together.",
    tone: "green",
  },
  recommendations: {
    src: "/images/trust/hospital-corridor-care-team.jpg",
    alt: "Healthcare team in a hospital corridor discussing care operations.",
    tone: "gold",
  },
  about: {
    src: "/images/trust/hospital-corridor-care-team.jpg",
    alt: "Hospital care team working together in a clinical corridor.",
    tone: "deep",
  },
  contact: {
    src: "/images/contact/clinic-director-conversation.jpg",
    alt: "Healthcare professionals in conversation about clinical operations.",
    tone: "gold",
  },
  faq: {
    src: "/images/security/credential-security-review.jpg",
    alt: "Clinical record review representing secure workflow questions.",
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
  variant = "compact",
  className = "",
}: {
  src: string;
  alt: string;
  tone?: VisualTone;
  priority?: boolean;
  variant?: "compact" | "hero" | "wide";
  className?: string;
}) {
  const isVector = src.endsWith(".svg");

  return (
    <figure className={`image-panel image-${variant} tone-${tone} ${isVector ? "is-vector" : "is-photo"} ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={variant === "hero" ? 1100 : 920}
        height={variant === "hero" ? 760 : 620}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={variant === "hero" ? "(max-width: 1080px) calc(100vw - 32px), 46vw" : "(max-width: 1080px) calc(100vw - 32px), 38vw"}
        unoptimized={isVector}
        className="media-image"
      />
    </figure>
  );
}

export function PhotoMosaic({
  primary,
  secondary,
  tertiary,
  priority = false,
}: {
  primary: { src: string; alt: string; tone?: VisualTone };
  secondary: { src: string; alt: string; tone?: VisualTone };
  tertiary: { src: string; alt: string; tone?: VisualTone };
  priority?: boolean;
}) {
  return (
    <div className="photo-mosaic" aria-label="Afyalink healthcare trust imagery">
      <ImagePanel src={primary.src} alt={primary.alt} tone={primary.tone} priority={priority} variant="hero" />
      <div className="photo-mosaic-stack">
        <ImagePanel src={secondary.src} alt={secondary.alt} tone={secondary.tone} variant="compact" />
        <ImagePanel src={tertiary.src} alt={tertiary.alt} tone={tertiary.tone} variant="compact" />
      </div>
    </div>
  );
}

export function EditorialPhoto({
  visual,
  caption,
}: {
  visual: { src: string; alt: string; tone?: VisualTone };
  caption: string;
}) {
  return (
    <figure className={`editorial-photo tone-${visual.tone ?? "teal"}`}>
      <Image
        src={visual.src}
        alt={visual.alt}
        width={1080}
        height={620}
        sizes="(max-width: 900px) calc(100vw - 32px), 58vw"
        className="media-image"
      />
      <figcaption>{caption}</figcaption>
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

export function ProofStrip({ items, compact = false }: { items: Array<{ label: string; value: string; body?: string }>; compact?: boolean }) {
  return (
    <div className={`proof-strip ${compact ? "compact" : ""}`}>
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

export function CompactMetricStrip({ items }: { items: Array<{ label: string; value: string; body?: string }> }) {
  return <ProofStrip items={items} compact />;
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

export function AudienceCard({
  eyebrow,
  title,
  body,
  visual,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  visual: { src: string; alt: string; tone?: VisualTone };
  href: string;
  cta: string;
}) {
  return (
    <article className="audience-card">
      <ImagePanel src={visual.src} alt={visual.alt} tone={visual.tone} />
      <div className="audience-card-body">
        <div className="eyebrow">{eyebrow}</div>
        <h3>{title}</h3>
        <p>{body}</p>
        <Link className="text-link" href={href}>
          {cta}
        </Link>
      </div>
    </article>
  );
}

export function TrustBand({
  items,
}: {
  items: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="trust-band">
      {items.map((item) => (
        <div key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </div>
      ))}
    </div>
  );
}

export function PhotoCard({
  title,
  body,
  visual,
}: {
  title: string;
  body: string;
  visual: { src: string; alt: string; tone?: VisualTone };
}) {
  return (
    <article className="photo-card">
      <ImagePanel src={visual.src} alt={visual.alt} tone={visual.tone} />
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
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

export const CTASection = LargeCTA;
export const CompactHero = ImagePanel;
export const PhotoHero = ImagePanel;
export const MediaSplit = FeatureSplit;
export const ProcessSteps = ProcessTimeline;
export const EditorialBand = EditorialPhoto;
