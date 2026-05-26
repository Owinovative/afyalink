# Afyalink Frontend Design System

The Next.js frontend now uses a clean-rebuild healthcare trust design system. The system is classic and restrained: deep clinical green, teal, warm gold, ivory paper, white surfaces, subtle borders, human photography, and disciplined editorial spacing.

## Layout Principles

- Public pages use wide desktop compositions through `--wide-max` and `--hero-max`, but avoid loose dead space.
- The homepage now uses a full first-view photo hero, short executive copy, and immediate role entry points.
- Non-home public pages use route-specific photo heroes and editorial splits.
- Public content should avoid repeated generic cards. Prefer photo heroes, audience tiles, process rails, trust panels, photo bands, and focused CTA sections.
- Portal surfaces stay dense enough for repeated operations, but use calmer panels, clearer tables, softer metric cards, and tighter form rhythm.

## Core Primitives

- `SectionFrame`: full-width section rhythm with plain, soft, warm, or deep tone.
- `SectionIntro`: focused eyebrow/title/body grouping.
- `PhotoHero`: full-width public route hero with large real photography and focused CTAs.
- `ImagePanel`: local photo or SVG visual frame with stable dimensions and responsive `next/image` rendering.
- `AudienceTile`: image-led role entry for professionals, students, and facilities.
- `EditorialSplit`: mature text/photo composition for workflow explanations.
- `ProcessSteps`: compact operational sequence.
- `TrustPanel`: high-signal access/security/workflow proof panel.
- `PhotoBand`: broad human story band.
- `ProofStrip`: compact trust/value proof band.
- `CompactMetricStrip`: tighter proof band for HMS-style section metrics.
- `ProcessTimeline`: numbered operational steps.
- `VisualCard`: elevated but restrained content card.
- `LargeCTA`: full-width conversion band.
- `EditorialPhoto`: wide human healthcare photography panel with a short overlay caption.
- `BrandLockup`: lightweight CSS/text brand mark used in runtime headers and footers so the oversized full logo PNG is not loaded for navigation.

## Image Strategy

Public pages now treat real healthcare photography as the primary visual language. Locally bundled Pexels-derived photo files are stored under `apps/web/public/images`:

- `hero/healthcare-professional-reviewing-records.jpg`
- `professionals/clinical-professional-consultation.jpg`
- `students/nursing-student-training-lab.jpg`
- `facilities/hospital-facility-team.jpg`
- `verification/admin-verification-desk.jpg`
- `security/credential-security-review.jpg`
- `marketplace/facility-candidate-review.jpg`
- `trust/hospital-corridor-care-team.jpg`
- `contact/clinic-director-conversation.jpg`

SVGs remain available for structured workflow support where diagrams are useful:

- `hero/healthcare-trust-canvas.svg`
- `professionals/professional-verification.svg`
- `students/waiting-license-track.svg`
- `facilities/facility-marketplace.svg`
- `verification/verification-operations.svg`
- `security/secure-candidate-viewing.svg`
- `marketplace/candidate-marketplace.svg`
- `recommendations/recommendation-package.svg`
- `backgrounds/clinical-grid.svg`

No external hotlinked stock assets are used at runtime. Source photos are kept below 250 KB each, and non-home pages lazy-load image panels. Commissioned Afyalink photography should replace the royalty-free placeholders when available.

## Accessibility

- Keep semantic headings ordered by page structure.
- Every meaningful image is referenced with descriptive alt text in React.
- Focus states remain visible through `:focus-visible`.
- Form labels remain explicit.
- Text should not be embedded in critical SVG visuals where it would become inaccessible.
