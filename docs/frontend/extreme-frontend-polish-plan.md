# Extreme Frontend Polish Plan

## Current Visual Problems

- Homepage felt like a long static marketing page.
- Header spacing and CTA scale made the nav feel heavy.
- Public pages leaned too much on explanatory sections.
- Matching did not feel image-led or premium enough.
- Portal screens could expose internal layouts before sign-in.
- Facility requisitions looked like plain forms and lists.

## PR Fix Strategy

- Replace the homepage with a focused photo-led slider.
- Put public-page hero text over real healthcare photography.
- Reduce copy to short headlines, badges, and CTA labels.
- Tighten header, brand mark, nav text, and button sizing.
- Give portal locked states a clean image-led protected screen.
- Redesign facility dashboard and requisitions as product surfaces.

## Homepage Slider Plan

- Use 6 slides maximum: Afyalink, Professionals, Students, Facilities, Matching, Trust.
- Use local healthcare imagery from `apps/web/public/images`.
- Auto-advance every 15 seconds.
- Provide Previous, Next, and dot controls.
- Reset the timer after manual interaction.
- Support keyboard left/right navigation.
- Respect reduced-motion by disabling auto-advance.

## Image Strategy

- Use only local assets.
- Use `next/image` for page and slider imagery.
- Prioritize real healthcare photos over SVGs for hero surfaces.
- Keep SVGs available for supporting visual system assets.
- Avoid external hotlinks and placeholder imagery.

## Portal Gating Strategy

- Gate portal shells before rendering internal dashboard children.
- Use role-scoped local session tokens already used by the app.
- Show a minimal protected state when no token is present.
- Keep backend routes and API contracts unchanged.
- Apply the same shell gate to professional, facility, and admin portals.

## Screenshot QA Plan

Capture visual QA at desktop and mobile widths for:

- `/`
- `/matching`
- `/professionals`
- `/students`
- `/facilities`
- `/trust-security`
- `/verification`
- `/portal/facility/requisitions`
- `/portal/facility/dashboard`
- `/portal/professional/dashboard`
- `/portal/admin/dashboard`

Checks:

- No horizontal overflow.
- Header appears smaller and cleaner.
- Homepage auto-advances after roughly 15 seconds.
- Previous/Next controls work.
- Portal pages hide internal data when logged out.
- Facility requisitions show the redesigned logged-in shell when a token is present.
