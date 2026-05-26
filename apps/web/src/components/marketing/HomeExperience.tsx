"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

const AUTO_ADVANCE_MS = 15000;

type HomeSlide = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  chips: string[];
};

const slides: HomeSlide[] = [
  {
    eyebrow: "Afyalink",
    title: "Verified healthcare talent.",
    body: "Private checks. Reviewed placement.",
    image: "/images/hero/healthcare-professional-reviewing-records.jpg",
    alt: "Healthcare professional reviewing clinical records.",
    primary: { label: "Apply now", href: "/auth/register/professional" },
    secondary: { label: "Join facility", href: "/auth/register/facility" },
    chips: ["Verify", "Interview", "Match"],
  },
  {
    eyebrow: "Professionals",
    title: "Apply. Verify. Get placed.",
    body: "Build a protected record.",
    image: "/images/professionals/clinical-professional-consultation.jpg",
    alt: "Healthcare professional consulting in a clinic.",
    primary: { label: "Professional path", href: "/professionals" },
    secondary: { label: "Register", href: "/auth/register/professional" },
    chips: ["Profile", "Credentials", "Publication"],
  },
  {
    eyebrow: "Students",
    title: "Start before license.",
    body: "Prepare early. Publish later.",
    image: "/images/students/nursing-student-training-lab.jpg",
    alt: "Healthcare students practicing in a training lab.",
    primary: { label: "Student path", href: "/students" },
    secondary: { label: "Register", href: "/auth/register/student" },
    chips: ["Pre-license", "Documents", "Convert later"],
  },
  {
    eyebrow: "Facilities",
    title: "Trusted staff, faster.",
    body: "Needs become reviewed shortlists.",
    image: "/images/facilities/hospital-facility-team.jpg",
    alt: "Healthcare facility team in a hospital corridor.",
    primary: { label: "Facility path", href: "/facilities" },
    secondary: { label: "Requisitions", href: "/matching" },
    chips: ["Access", "Shortlists", "Placements"],
  },
  {
    eyebrow: "Matching",
    title: "Reviewed matches, not dumps.",
    body: "Every shared profile has a reason.",
    image: "/images/marketplace/facility-candidate-review.jpg",
    alt: "Facility team reviewing candidate information.",
    primary: { label: "Explore matching", href: "/matching" },
    secondary: { label: "Trust model", href: "/trust-security" },
    chips: ["Need", "Fit", "Review"],
  },
  {
    eyebrow: "Trust",
    title: "Private records. Audited access.",
    body: "Credentials stay protected.",
    image: "/images/security/credential-security-review.jpg",
    alt: "Healthcare record review on a secure clinical workstation.",
    primary: { label: "Trust model", href: "/trust-security" },
    secondary: { label: "Verification", href: "/verification" },
    chips: ["Private", "Controlled", "Audited"],
  },
];

export function HomeExperience() {
  const [active, setActive] = useState(0);
  const [timerSeed, setTimerSeed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rail = useMemo(() => {
    return [0, 1, 2].map((offset) => slides[(active + offset + 1) % slides.length]);
  }, [active]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [active, timerSeed, reducedMotion]);

  function goTo(index: number) {
    setActive((index + slides.length) % slides.length);
    setTimerSeed((value) => value + 1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(active - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(active + 1);
    }
  }

  return (
    <main className="home-experience" aria-label="Afyalink homepage experience">
      <section className="home-slide-stage" aria-live="polite" onKeyDown={handleKeyDown} tabIndex={0}>
        {slides.map((slide, index) => (
          <article className={`home-slide ${index === active ? "active" : ""}`} key={slide.title} aria-hidden={index !== active}>
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="home-slide-image"
            />
            <div className="home-slide-overlay" />
            <div className="home-slide-content">
              <span className="eyebrow">{slide.eyebrow}</span>
              <h1>{slide.title}</h1>
              <p>{slide.body}</p>
              <div className="home-chip-row">
                {slide.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
              <div className="hero-actions">
                <Link className="button" href={slide.primary.href}>{slide.primary.label}</Link>
                {slide.secondary ? <Link className="button secondary translucent" href={slide.secondary.href}>{slide.secondary.label}</Link> : null}
              </div>
            </div>
          </article>
        ))}

        <div className="home-image-rail" aria-hidden="true">
          {rail.map((slide) => (
            <figure key={`${active}-${slide.title}`}>
              <Image src={slide.image} alt="" width={360} height={260} sizes="(max-width: 900px) 28vw, 220px" loading="eager" />
            </figure>
          ))}
        </div>

        <div className="home-slider-controls" aria-label="Homepage slides">
          <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous homepage section">
            Prev
          </button>
          <div className="home-dots" role="tablist" aria-label="Homepage sections">
            {slides.map((slide, index) => (
              <button
                type="button"
                role="tab"
                key={slide.title}
                aria-label={`Show ${slide.eyebrow}`}
                aria-selected={index === active}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
          <button type="button" onClick={() => goTo(active + 1)} aria-label="Next homepage section">
            Next
          </button>
        </div>
        <div className="home-progress" aria-hidden="true">
          <span key={`${active}-${timerSeed}`} style={{ animationDuration: `${AUTO_ADVANCE_MS}ms` }} />
        </div>
      </section>
    </main>
  );
}
