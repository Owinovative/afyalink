# Minimal-Copy Visual Audit

## Scope

This audit covers the emergency visual reset for the Afyalink web frontend. The rejected pattern is not missing functionality; it is over-explanation. Pages must communicate through photography, hierarchy, short labels, and routed actions instead of documentation-style copy.

## Public Routes

| Route | Unnecessary text | Visual weakness | Card/section correction |
| --- | --- | --- | --- |
| `/` | Workflow explanations repeat backend rules already shown in portals. | Strong photos exist, but long section bodies make the page read like docs. | Rebuild into hero, three image tiles, label-only workflow, one staffing split, one security badge strip, one CTA. |
| `/professionals` | Too much explanation around readiness, credentials, and status. | Journey should feel aspirational and practical, not procedural. | Replace paragraphs with four short steps and badge-style outcomes. |
| `/students` | The safety rule is repeated in several sentences. | The student path needs one confident photo-led story. | Use four compact labels: start, upload, wait, convert. |
| `/facilities` | Access gating, recommendations, and placement copy repeats. | Executive page feels diluted by operational prose. | Use staffing photo, short access points, and a direct CTA. |
| `/matching` | Deterministic matching explanation is too long for public marketing. | Matching needs clarity, not a policy essay. | Use compact steps: need, fit, explain, review. |
| `/how-it-works` | Describes every workflow detail. | The page should scan as a controlled path. | Use visual process rail and short role entry tiles. |
| `/verification` | Backend-authoritative wording is repeated. | Verification should show checkpoints quickly. | Use credential, regulator, interview, publish labels. |
| `/trust-security` | Security concepts are over-explained across multiple blocks. | Needs calm trust signals, not legal-style prose. | Use four badges: private, controlled, watermarked, audited. |
| `/pricing-access` | Payment and rollout language is verbose. | Commercial page needs honest simplicity. | Use three compact access blocks and contact CTA. |
| `/about` | Mission copy is too explanatory. | About should be short and editorial. | Keep one mission line and three proof labels. |
| `/contact` | Contact guidance overexplains portal boundaries. | Form should feel focused and light. | Use short labels and one photo-led support cue. |
| `/faq` | Answers risk becoming long explanations. | FAQ can carry more copy, but must stay compact. | Keep grouped answers under 45 words each. |

## Auth Routes

| Route | Current issue | Correction |
| --- | --- | --- |
| `/auth/login` | Side panel explains roles in paragraph form. | Short heading, one line, role chips. |
| `/auth/register/professional` | Body lists every later step. | Say only: create account, continue profile. |
| `/auth/register/student` | Safety language is important but too long. | One clear rule: not publishable until license conversion. |
| `/auth/register/facility` | Onboarding and approval copy repeats public pages. | Short owner-access message. |
| `/auth/verify-email` | Acceptable, but can be shorter. | Keep token instruction only. |
| `/auth/forgot-password` | Acceptable, but can be shorter. | Keep email instruction only. |
| `/auth/reset-password` | Acceptable. | Keep reset instruction only. |

## Portal Areas

| Area | Weakness | Correction |
| --- | --- | --- |
| Professional portal | Dashboard card descriptions explain workflows instead of showing status. | Use short status labels and concise empty states. |
| Student waiting-license state | Important safety rule needs to be clearer and shorter. | Use badge language: waiting license, documents started, license pending. |
| Facility portal | Empty states and request panels over-explain support flows. | Use compact operational labels and short next actions. |
| Admin portal | Admin can be dense, but helper copy is wordy. | Keep queue labels, metric titles, and short empty states. |

## Component Corrections

- `PhotoHero` stays, but public hero copy must be shorter.
- `MarketingContentPage` should stop generating repeated audience sections on every route.
- `TrustPanel` should carry badges, not paragraphs.
- `ProcessSteps` should use two-to-five-word labels and short captions.
- `VisualCard` should be used sparingly; repeated card grids make the site feel cheap.
- Auth side copy should become a compact role lockup, not another explanation panel.

## Acceptance Notes

- Homepage should fall from a documentation-like word count to roughly one third of its previous visible copy.
- Public page hero bodies should stay below 20 words.
- Most public page sections should stay below 45 visible words.
- FAQ is the only public page allowed to carry longer copy, with every answer under 45 words.
