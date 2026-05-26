# Frontend Rebuild Design Direction

This milestone rejects the previous Afyalink visual direction and rebuilds the frontend from a cleaner foundation. The backend product is strong; the visual system had to stop looking like a developer dashboard with marketing sections attached.

## What Was Wrong

- The public site leaned too heavily on repeated cards.
- The hero and page structures did not feel decisive enough for a healthcare trust platform.
- Photography was present, but not used as the primary emotional and credibility layer.
- Desktop layouts could still feel like centered islands rather than full, intentional compositions.
- The portal shell looked functional, but not mature enough for a serious operations product.
- Typography hierarchy and section rhythm were too close to generic SaaS presentation.

## Replacement Direction

Afyalink now targets a premium healthcare trust platform feel:

- classic;
- calm;
- human;
- photo-led;
- operationally clear;
- serious enough for facilities;
- welcoming enough for professionals and students.

The public site should open with real healthcare context first, then explain the platform. It should not lead with fake dashboards, abstract graphics, or dense card grids.

## Benchmark Synthesis

- Apple: disciplined first screen, restrained CTAs, fewer competing messages.
- Airbnb: real photography as emotional proof.
- Mayo Clinic: healthcare authority and calm trust.
- Maven Clinic: modern healthcare warmth and human-centered storytelling.
- Oscar Health: approachable healthcare tone without losing credibility.
- Stripe: clear information architecture for a complex platform.

Afyalink does not clone any of these. The synthesis is: real healthcare photography, editorial layout, clear role paths, backend-governed workflow language, and practical portal density.

## Photography

Public pages use existing local image assets under `apps/web/public/images`. These are intentionally placed for:

- professionals;
- students awaiting license;
- facilities;
- matching and candidate review;
- verification;
- security;
- contact and operations.

No external hotlinks are used at runtime. The current images are acceptable development assets, but final launch should replace them with Afyalink-owned photography.

## Desktop Fullness

The rebuild uses:

- `--hero-max` and `--wide-max` for broad desktop composition;
- large photo-led hero layouts;
- full-width tonal sections;
- editorial splits with controlled image sizes;
- compact proof and process panels instead of loose metric scatter.

The goal is wide and intentional at 1440px and 1920px without becoming cluttered.

## Portals

Portals remain operations software, not marketing pages. The rebuild keeps:

- dense metrics;
- tables and forms;
- backend-driven actions;
- status badges;
- secure candidate watermarks.

It improves:

- panel hierarchy;
- sidebar rhythm;
- table readability;
- form spacing;
- notice and badge clarity;
- overall calmness.

## Preserved Functional Boundaries

The rebuild does not move backend rules into the frontend. The frontend preserves:

- API client behavior;
- token/session handling;
- route structure;
- backend contract helpers;
- workflow form submissions;
- `NEXT_PUBLIC_AFYA_API_BASE`;
- Render-compatible Next.js build/start behavior.
