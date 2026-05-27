# Ten-Hour Frontend Polish Audit

Branch: `feat/ten-hour-frontend-polish-premium-launch-ui`

## Public Site

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Homepage | The slider works, but the hero type is still oversized and the controls feel utilitarian. | Slide copy is mostly short, but CTAs are not aligned to the requested language. | Desktop can lean too heavily on one huge headline. | Strong photos exist but supporting image rail needs a more refined treatment. | Mobile has tight lower controls and large type. | Reduce hero scale, refine overlay/rail/controls, align slide copy and CTAs, keep 15s auto advance. |
| Public pages | Photo-led pages exist, but many routes still share the same structure and can feel templated. | Some route descriptions still sound operational instead of premium. | The trust panel and split can leave sections feeling repetitive. | Real photos are used, but page-specific rhythm can be stronger. | Section spacing is acceptable but large headings crowd smaller viewports. | Add a stronger signal deck, tighten copy, refine hero scale, improve public section rhythm. |
| Matching | Strongest public page, but can still feel like a single dark hero plus simple process cards. | Copy is concise. | The lower sections need more premium depth. | Good photo strip, but cards can be cleaner. | Mobile stacking works but lower controls need tighter rhythm. | Refine hero, process cards, and review section styles. |
| Contact | Correct launch contact values are present. | Form copy is short. | Contact details feel like loose pills rather than a premium contact module. | Good contact photo exists. | Mobile form is usable. | Strengthen contact panel, keep email hidden if blank. |
| Footer | Clean but still a bit plain. | Copy is short. | Brand area could use better visual grouping. | No photo needed. | Mobile stacks. | Tighten footer grouping and link sizing. |

## Header and Navigation

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop nav | Text is smaller than before but still needs a sleeker active state and tighter action sizing. | Not wordy. | Not empty. | Brand mark is CSS-based and crisp. | Works on desktop. | Smaller nav text, active states, refined brand sizing. |
| Mobile nav | Public nav links disappear below 900px, leaving no real mobile menu. | Not wordy. | Mobile header lacks navigation depth. | No image needed. | Needs accessible menu behavior. | Add an accessible mobile menu with compact links and CTAs. |

## Auth Pages

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Login/register/reset | Layout is photo-led, but every auth mode uses the same side story. | Form helper text is mostly short. | Some reset/verify views feel oversized for small forms. | Strong photo exists but not role-specific. | Mobile stacks, but headings remain large. | Add mode-specific photo copy, tighter form shell, smaller headings, better badge rhythm. |

## Protected Portal Gating

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Logged-out portal state | Protected gate works and hides workspace content. | Copy is short. | Card can feel isolated. | Role photos are used. | Mobile is acceptable. | Refine protected gate proportions and keep content hidden. |

## Professional and Student Portal

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Professional dashboard | Operationally clear, but lacks a premium guided dashboard top section. | Some helper text is status-heavy but short. | Metric grid starts abruptly. | No portal imagery needed, but a refined header band helps. | Cards stack well. | Add a compact guided hero and status steps. |
| Waiting-license | Correctly avoids licensed implication, but could be warmer and more clearly staged. | Copy is short. | Checklist is plain. | No photo needed inside portal. | Mobile is fine. | Add clearer pre-licensure chips and improved secure panel styling. |

## Facility Portal

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Facility dashboard | Has hero and metrics, but product polish can improve. | Copy is short. | Organization/access cards are basic. | Hero photo background works. | Mobile stacks. | Improve metrics, panel styling, and action hierarchy. |
| Requisitions | Much better than plain form, but list/detail cards still look generic. | Copy is short. | Empty state is too plain. | Strong backgrounds exist. | Form stacks. | Add board stats, stronger cards, improved empty and form aside styling. |
| Marketplace/shortlists/placements/team | Functional but card-heavy. | Copy is concise. | Some pages start as a plain card. | No added photos needed. | Tables/cards stack. | Improve shared card/data row styling and empty states globally. |

## Admin Portal

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Admin dashboard | Dense and useful, but it needs a clearer command-center top band. | Copy is short. | Metric grid starts cold. | Admin should stay operational, not decorative. | Sidebar stacks. | Add command hero, refine metrics, data rows, and queue cards. |
| Admin queues | Useful but visually repetitive. | Copy is mostly labels. | Empty states are basic. | No imagery needed. | Data rows stack. | Improve row hierarchy and compact operational polish. |

## Global Styling

| Area | What looks weak | Too wordy | Too empty | Imagery | Spacing/mobile | This PR changes |
| --- | --- | --- | --- | --- | --- | --- |
| Typography | Public hero sizes remain too large in places; portal headings need restraint. | N/A | N/A | N/A | Smaller screens need more controlled type. | Use more controlled clamps and tighter line heights. |
| Components | Cards and data rows are clean but generic. | N/A | Empty states lack brand presence. | Image treatment is good but can be sharper. | Focus states exist. | Refine buttons, badges, rows, cards, empty states, focus and responsive spacing. |
| Performance | Images are local and `next/image` is used. | N/A | N/A | Source set is enough for this PR. | No obvious asset bloat. | Avoid new heavy dependencies and reuse existing assets. |
