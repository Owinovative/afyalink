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
    body: "Trusted paths for professionals and facilities. We handle the verification, you handle the care.",
    image: "/images/hero/healthcare-professional-reviewing-records.jpg",
    alt: "Healthcare professional reviewing clinical records.",
    primary: { label: "Get started", href: "/auth/register/professional" },
    secondary: { label: "Sign in", href: "/auth/login" },
    chips: ["Verify", "Interview", "Match"],
  },
  {
    eyebrow: "Professionals",
    title: "Apply. Verify. Get placed.",
    body: "Build a protected record. We keep your credentials secure and match you with top facilities.",
    image: "/images/professionals/clinical-professional-consultation.jpg",
    alt: "Healthcare professional consulting in a clinic.",
    primary: { label: "Apply now", href: "/auth/register/professional" },
    secondary: { label: "Learn more", href: "/professionals" },
    chips: ["Profile", "Credentials", "Publication"],
  },
  {
    eyebrow: "Facilities",
    title: "Find trusted staff faster.",
    body: "Turn your staffing needs into reviewed shortlists. Approved access only.",
    image: "/images/facilities/hospital-facility-team.jpg",
    alt: "Healthcare facility team in a hospital corridor.",
    primary: { label: "Join facility", href: "/auth/register/facility" },
    secondary: { label: "View model", href: "/facilities" },
    chips: ["Access", "Shortlists", "Placements"],
  },
  {
    eyebrow: "Trust",
    title: "Private records. Audited access.",
    body: "Consent-aware workflows, watermarked views, and complete audit trails for every action.",
    image: "/images/security/credential-security-review.jpg",
    alt: "Healthcare record review on a secure clinical workstation.",
    primary: { label: "Security model", href: "/trust-security" },
    secondary: { label: "Verification", href: "/verification" },
    chips: ["Private", "Controlled", "Audited"],
  },
];

export function HomeExperience() {
  const [active, setActive] = useState(0);
  const [timerSeed, setTimerSeed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  const rail = useMemo(() => {
    return [0, 1].map((offset) => slides[(active + offset + 1) % slides.length]);
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
      <section className="home-slide-stage" aria-live="polite" onKeyDown={handleKeyDown} tabIndex={0} style={{ position: "relative", minHeight: "100vh" }}>
        {slides.map((slide, index) => (
          <article 
            className={`home-slide ${index === active ? "active" : ""}`} 
            key={slide.title} 
            aria-hidden={index !== active}
            style={{
              opacity: index === active ? 1 : 0,
              transform: index === active ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity 0.8s ease-in-out, transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              position: 'absolute',
              inset: 0,
              zIndex: index === active ? 2 : 1
            }}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
            <div 
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, rgba(2, 6, 23, 0.9) 0%, rgba(2, 6, 23, 0.7) 40%, transparent 100%)'
              }} 
            />
            <div 
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(2, 6, 23, 0.8) 0%, transparent 40%)'
              }} 
            />
            
            <div className="home-slide-content" style={{
              transform: index === active ? 'translateY(0)' : 'translateY(20px)',
              transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              margin: '0 auto',
              paddingTop: 'clamp(140px, 20vh, 220px)', // <-- THE FIX IS HERE. Pushes text below navbar.
              paddingLeft: '24px',
              paddingRight: '24px',
              maxWidth: '800px'
            }}>
              <span className="eyebrow" style={{ color: 'var(--teal-soft)', letterSpacing: '0.15em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700 }}>{slide.eyebrow}</span>
              <h1 style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.3)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', margin: '12px 0', lineHeight: 1.1 }}>{slide.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', maxWidth: '600px', lineHeight: 1.6 }}>{slide.body}</p>
              
              <div className="home-chip-row" style={{ marginTop: '16px', marginBottom: '32px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {slide.chips.map((chip) => (
                  <span key={chip} style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#fff',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>{chip}</span>
                ))}
              </div>
              
              <div className="hero-actions" style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Link href={slide.primary.href} style={{ 
                  background: 'var(--teal)', color: '#fff', padding: '14px 32px', fontSize: '1.05rem', 
                  fontWeight: 600, borderRadius: '99px', textDecoration: 'none', transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 15px rgba(3, 152, 158, 0.4)'
                }}>
                  {slide.primary.label}
                </Link>
                {slide.secondary && (
                  <Link href={slide.secondary.href} style={{ 
                    background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '14px 32px', fontSize: '1.05rem', 
                    fontWeight: 600, borderRadius: '99px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {slide.secondary.label}
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}

        {/* Floating Glassmorphism Controls */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: 'max(24px, calc((100vw - var(--wide-max)) / 2 + 24px))',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '12px 24px',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <button 
            type="button" 
            onClick={() => goTo(active - 1)} 
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: '4px' }}
          >
            ← Prev
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => goTo(index)}
                style={{
                  width: index === active ? '32px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  border: 'none',
                  background: index === active ? '#ffffff' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  cursor: 'pointer',
                  padding: 0
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={() => goTo(active + 1)} 
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: '4px' }}
          >
            Next →
          </button>
        </div>

        {/* Animated Progress Bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', zIndex: 10, background: 'rgba(255,255,255,0.1)' }}>
          <div key={`${active}-${timerSeed}`} style={{
            height: '100%',
            background: 'var(--teal-soft)',
            animation: `home-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
            boxShadow: '0 0 10px var(--teal-soft)'
          }} />
        </div>
      </section>
    </main>
  );
}
