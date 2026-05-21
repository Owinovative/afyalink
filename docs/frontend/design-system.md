# Afyalink Frontend Design System

The Next.js frontend uses a benchmark-synthesized, photo-led healthcare technology design system. The system is intentionally classic and restrained: deep navy/teal, natural green, warm gold, ivory/stone surfaces, subtle borders, and disciplined spacing.

## Layout Principles

- Public pages use wide desktop compositions through `--wide-max` and `--hero-max`.
- The homepage hero is near full viewport height on desktop and pairs focused copy with a large real healthcare photograph.
- Public content should avoid repeated generic cards. Prefer image panels, proof strips, feature splits, timelines, and strong CTA bands.
- Portal surfaces stay dense enough for repeated operations, but use clearer hierarchy, refined metrics, stronger page headers, and a darker sidebar shell.

## Core Primitives

- `SectionFrame`: full-width section rhythm with plain, soft, warm, or deep tone.
- `SectionIntro`: focused eyebrow/title/body grouping.
- `ImagePanel`: local photo or SVG visual frame with stable dimensions and responsive `next/image` rendering.
- `FeatureSplit`: editorial copy plus visual panel.
- `ProofStrip`: compact trust/value proof band.
- `ProcessTimeline`: numbered operational steps.
- `VisualCard`: elevated but restrained content card.
- `LargeCTA`: full-width conversion band.
- `EditorialPhoto`: wide human healthcare photography panel with a short overlay caption.

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

No external hotlinked stock assets are used at runtime. Commissioned Afyalink photography should replace the royalty-free placeholders when available.

## Accessibility

- Keep semantic headings ordered by page structure.
- Every meaningful image is referenced with descriptive alt text in React.
- Focus states remain visible through `:focus-visible`.
- Form labels remain explicit.
- Text should not be embedded in critical SVG visuals where it would become inaccessible.
