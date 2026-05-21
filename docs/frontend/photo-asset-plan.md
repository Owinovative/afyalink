# Photo Asset Plan

Afyalink uses local image assets so public pages do not hotlink external photography at runtime. The design goal is photo-supported healthcare credibility with controlled bandwidth.

| File | Approx. size | Intended usage | Reason kept |
| --- | ---: | --- | --- |
| `images/hero/healthcare-professional-reviewing-records.jpg` | 40 KB | Homepage hero | Strong clinical record-review moment with very low weight. |
| `images/professionals/clinical-professional-consultation.jpg` | 84 KB | Professional page and journey panels | Human clinical professional context. |
| `images/students/nursing-student-training-lab.jpg` | 110 KB | Student awaiting-license page | Training-lab context for pre-licensure applicants. |
| `images/facilities/hospital-facility-team.jpg` | 132 KB | Facility page | Facility team credibility without implying a named partner. |
| `images/verification/admin-verification-desk.jpg` | 99 KB | Verification and how-it-works pages | Records/review context. |
| `images/security/credential-security-review.jpg` | 182 KB | Trust/security and FAQ | Secure clinical workstation context. |
| `images/marketplace/facility-candidate-review.jpg` | 109 KB | Pricing/access and marketplace sections | Facility review context. |
| `images/trust/hospital-corridor-care-team.jpg` | 219 KB | About and recommendation support | Broad team/trust context; still below the normal 250 KB target. |
| `images/contact/clinic-director-conversation.jpg` | 76 KB | Contact page | Professional conversation context. |

## Loading Policy

- Use `next/image` for all meaningful public photos.
- Use `priority` only for the homepage hero image.
- Use lazy loading for all other public images.
- Keep most image panels at `16:10`, `4:3`, or `3:2` with explicit max-heights.
- Avoid extra editorial photos on every generic page; one route-level hero photo is usually enough.
- Keep each normal source photo under 250 KB and keep homepage initial image payload far below 1.5 MB.

## Future Replacement

Replace these royalty-free/product-development assets with commissioned Afyalink-owned photography before final brand launch. Priority replacement subjects: Kenyan/African healthcare professionals, student clinical training, facility review teams, verification desk work, and Afyalink support conversations.
