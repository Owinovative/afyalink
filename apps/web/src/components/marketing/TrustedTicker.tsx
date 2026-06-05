"use client";

export function TrustedTicker() {
  const partners = [
    "Aga Khan University Hospital",
    "Nairobi Hospital",
    "Kenyatta National Hospital",
    "Gertrude's Children's",
    "Matter Hospital",
    "AAR Healthcare",
    "Avenue Healthcare",
    "Bliss Medical Centre",
  ];

  // We duplicate the array so the infinite scroll loops seamlessly without a gap
  const marqueeItems = [...partners, ...partners];

  return (
    <section className="trusted-ticker-wrap" aria-label="Trusted Healthcare Facilities">
      <style>{`
        .trusted-ticker-wrap {
          background: #fff;
          padding: 48px 0;
          border-bottom: 1px solid var(--line-light);
          overflow: hidden;
          position: relative;
        }
        
        /* Fade edges for a cinematic entrance/exit */
        .trusted-ticker-wrap::before,
        .trusted-ticker-wrap::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 150px;
          z-index: 2;
          pointer-events: none;
        }
        .trusted-ticker-wrap::before {
          left: 0;
          background: linear-gradient(to right, #fff, transparent);
        }
        .trusted-ticker-wrap::after {
          right: 0;
          background: linear-gradient(to left, #fff, transparent);
        }

        .ticker-header {
          text-align: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 32px;
        }

        .ticker-track {
          display: flex;
          width: fit-content;
          animation: marquee 40s linear infinite;
        }
        
        /* Pause the animation if the user hovers over the logos */
        .ticker-track:hover {
          animation-play-state: paused;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 40px;
          color: var(--ink-soft);
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          white-space: nowrap;
          filter: grayscale(100%) opacity(0.6);
          transition: all 0.3s ease;
          cursor: default;
        }

        .ticker-item:hover {
          filter: grayscale(0%) opacity(1);
          color: var(--teal);
          transform: scale(1.05);
        }
      `}</style>

      <div className="ticker-header">
        Trusted by leading healthcare providers across the region
      </div>

      <div className="ticker-track">
        {marqueeItems.map((partner, index) => (
          <div key={`${partner}-${index}`} className="ticker-item">
            {partner}
          </div>
        ))}
      </div>
    </section>
  );
}
