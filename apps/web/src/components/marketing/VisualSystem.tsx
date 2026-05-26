import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type VisualTone = "clinical" | "human" | "trust" | "warm";

export type VisualAsset = {
  src: string;
  alt: string;
  tone: VisualTone;
};

const visualBySlug: Record<string, VisualAsset> = {
  home: {
    src: "/images/hero/healthcare-professional-reviewing-records.jpg",
    alt: "Healthcare professionals reviewing records in a clinical setting.",
    tone: "clinical",
  },
  professionals: {
    src: "/images/professionals/clinical-professional-consultation.jpg",
    alt: "Healthcare professional speaking with a patient in a clinic.",
    tone: "human",
  },
  students: {
    src: "/images/students/nursing-student-training-lab.jpg",
    alt: "Healthcare students practicing clinical skills in a training lab.",
    tone: "warm",
  },
  facilities: {
    src: "/images/facilities/hospital-facility-team.jpg",
    alt: "Healthcare facility team standing together in a hospital corridor.",
    tone: "clinical",
  },
  matching: {
    src: "/images/marketplace/facility-candidate-review.jpg",
    alt: "Facility team reviewing staffing and candidate information.",
    tone: "human",
  },
  "how-it-works": {
    src: "/images/verification/admin-verification-desk.jpg",
    alt: "Clinical administrator reviewing healthcare credential records.",
    tone: "trust",
  },
  verification: {
    src: "/images/verification/admin-verification-desk.jpg",
    alt: "Credential verification desk with healthcare records under review.",
    tone: "trust",
  },
  "trust-security": {
    src: "/images/security/credential-security-review.jpg",
    alt: "Healthcare worker reviewing protected records on a clinical workstation.",
    tone: "trust",
  },
  "pricing-access": {
    src: "/images/trust/hospital-corridor-care-team.jpg",
    alt: "Healthcare team discussing staffing operations in a hospital corridor.",
    tone: "warm",
  },
  about: {
    src: "/images/trust/hospital-corridor-care-team.jpg",
    alt: "Hospital care team working together in a clinical corridor.",
    tone: "clinical",
  },
  contact: {
    src: "/images/contact/clinic-director-conversation.jpg",
    alt: "Healthcare professionals in conversation about clinical operations.",
    tone: "warm",
  },
  faq: {
    src: "/images/security/credential-security-review.jpg",
    alt: "Secure clinical record review representing Afyalink questions.",
    tone: "trust",
  },
  marketplace: {
    src: "/images/marketplace/facility-candidate-review.jpg",
    alt: "Healthcare team reviewing candidate and staffing information together.",
    tone: "human",
  },
  recommendations: {
    src: "/images/trust/hospital-corridor-care-team.jpg",
    alt: "Healthcare team discussing placement recommendations.",
    tone: "warm",
  },
};

export function getVisualForSlug(slug: string): VisualAsset {
  return visualBySlug[slug] ?? visualBySlug.home;
}

export function SectionFrame({
  children,
  tone = "white",
  className = "",
}: {
  children: ReactNode;
  tone?: "white" | "mist" | "cream" | "ink";
  className?: string;
}) {
  return <section className={`section-frame section-${tone} ${className}`}>{children}</section>;
}

export function PageIntro({
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
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export function ImagePanel({
  visual,
  priority = false,
  variant = "story",
  caption,
  className = "",
}: {
  visual: VisualAsset;
  priority?: boolean;
  variant?: "hero" | "story" | "wide" | "portrait";
  caption?: string;
  className?: string;
}) {
  const isVector = visual.src.endsWith(".svg");

  return (
    <figure className={`image-panel photo-panel panel-${variant} tone-${visual.tone} ${isVector ? "is-vector" : "is-photo"} ${className}`}>
      <Image
        src={visual.src}
        alt={visual.alt}
        width={variant === "hero" ? 1280 : 960}
        height={variant === "hero" ? 860 : 680}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={variant === "hero" ? "(max-width: 980px) 100vw, 54vw" : "(max-width: 980px) 100vw, 42vw"}
        unoptimized={isVector}
        className="media-image"
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function PhotoHero({
  eyebrow,
  title,
  body,
  primary,
  secondary,
  actions,
}: {
  eyebrow: string;
  title: string;
  body: string;
  primary: VisualAsset;
  secondary?: VisualAsset;
  actions: Array<{ label: string; href: string; kind?: "primary" | "secondary" }>;
}) {
  return (
    <section className="hero photo-hero">
      <div className="hero-container hero-shell">
        <div className="hero-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="lead">{body}</p>
          <div className="hero-actions">
            {actions.map((action) => (
              <Link className={`button ${action.kind === "secondary" ? "secondary" : ""}`} href={action.href} key={action.href}>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hero-photo-stack">
          <ImagePanel visual={primary} variant="hero" priority />
          {secondary ? <ImagePanel visual={secondary} variant="portrait" className="hero-small-photo" /> : null}
        </div>
      </div>
    </section>
  );
}

export function EditorialSplit({
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
  points?: string[];
  visual: VisualAsset;
  reverse?: boolean;
  cta?: { label: string; href: string };
}) {
  return (
    <div className={`feature-split editorial-split ${reverse ? "reverse" : ""}`}>
      <div className="feature-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        {points?.length ? (
          <ul className="check-list">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : null}
        {cta ? (
          <Link className="button secondary" href={cta.href}>
            {cta.label}
          </Link>
        ) : null}
      </div>
      <ImagePanel visual={visual} variant="story" />
    </div>
  );
}

export function AudienceTile({
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
  visual: VisualAsset;
  href: string;
  cta: string;
}) {
  return (
    <Link className="audience-tile audience-card" href={href}>
      <ImagePanel visual={visual} variant="wide" />
      <div className="audience-card-body">
        <span className="eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{body}</p>
        <span className="text-link">{cta}</span>
      </div>
    </Link>
  );
}

export function ProcessSteps({ steps }: { steps: Array<{ title: string; body: string }> }) {
  return (
    <ol className="process-steps process-timeline process-band">
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

export function TrustPanel({ items }: { items: Array<{ title: string; body: string }> }) {
  return (
    <div className="trust-panel trust-band">
      {items.map((item) => (
        <div key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </div>
      ))}
    </div>
  );
}

export function ProofStrip({
  items,
  compact = false,
}: {
  items: Array<{ value: string; label: string; body?: string }>;
  compact?: boolean;
}) {
  return (
    <div className={`proof-strip ${compact ? "compact" : ""}`}>
      {items.map((item) => (
        <div className="proof-item" key={`${item.value}-${item.label}`}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          {item.body ? <p>{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function CompactMetricStrip({ items }: { items: Array<{ value: string; label: string; body?: string }> }) {
  return <ProofStrip compact items={items} />;
}

export function PhotoBand({
  visual,
  eyebrow,
  title,
  body,
}: {
  visual: VisualAsset;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="photo-band">
      <ImagePanel visual={visual} variant="wide" />
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </div>
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
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
    </article>
  );
}

export function CTASection({
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
        <span className="eyebrow">{eyebrow}</span>
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

export const SectionIntro = PageIntro;
export const FeatureSplit = EditorialSplit;
export const MediaSplit = EditorialSplit;
export const AudienceCard = AudienceTile;
export const ProcessTimeline = ProcessSteps;
export const TrustBand = TrustPanel;
export const LargeCTA = CTASection;
export const EditorialPhoto = PhotoBand;
export const CompactHero = ImagePanel;
