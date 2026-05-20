# Afyalink Frontend Design System

The Next.js frontend uses a premium, image-led healthcare technology design system. The system is intentionally classic and restrained: deep navy/teal, natural green, warm gold, ivory/stone surfaces, subtle borders, and disciplined spacing.

## Layout Principles

- Public pages use wide desktop compositions through `--wide-max` and `--hero-max`.
- The homepage hero is near full viewport height on desktop and pairs focused copy with a large local SVG visual.
- Public content should avoid repeated generic cards. Prefer image panels, proof strips, feature splits, timelines, and strong CTA bands.
- Portal surfaces stay dense enough for repeated operations, but use clearer hierarchy, refined metrics, stronger page headers, and a darker sidebar shell.

## Core Primitives

- `SectionFrame`: full-width section rhythm with plain, soft, warm, or deep tone.
- `SectionIntro`: focused eyebrow/title/body grouping.
- `ImagePanel`: local SVG visual frame with stable dimensions.
- `FeatureSplit`: editorial copy plus visual panel.
- `ProofStrip`: compact trust/value proof band.
- `ProcessTimeline`: numbered operational steps.
- `VisualCard`: elevated but restrained content card.
- `LargeCTA`: full-width conversion band.

## Image Strategy

All current visuals are locally authored SVG assets under `apps/web/public/images`:

- `hero/healthcare-trust-canvas.svg`
- `professionals/professional-verification.svg`
- `students/waiting-license-track.svg`
- `facilities/facility-marketplace.svg`
- `verification/verification-operations.svg`
- `security/secure-candidate-viewing.svg`
- `marketplace/candidate-marketplace.svg`
- `recommendations/recommendation-package.svg`
- `backgrounds/clinical-grid.svg`

No external hotlinked stock assets are used. This avoids licensing risk, broken images, and staging availability problems.

## Accessibility

- Keep semantic headings ordered by page structure.
- Every meaningful SVG image is referenced with descriptive alt text in React.
- Focus states remain visible through `:focus-visible`.
- Form labels remain explicit.
- Text should not be embedded in critical SVG visuals where it would become inaccessible.

