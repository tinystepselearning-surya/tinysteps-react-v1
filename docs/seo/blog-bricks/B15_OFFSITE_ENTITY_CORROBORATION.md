# B15 — Off-Site Entity Corroboration

## Purpose

B15 closes the gap between Tiny Steps' canonical on-site entity and the public profiles that can corroborate that identity outside tinystepslearning.com.

B10 owns technical GEO/LLM discoverability. B14 owns trust, founder, academic-design and schools authority. B15 does not duplicate those bricks. Its job is narrower: keep the same entity facts and official profile URLs consistent wherever search engines, LLMs and families encounter Tiny Steps.

## Canonical entity contract

- Organization type: `EducationalOrganization`
- Organization name: `Tiny Steps Early Education`
- Public brand: `Tiny Steps Learning`
- Website: `https://tinystepslearning.com/`
- Canonical organization ID: `https://tinystepslearning.com/#educational-organization`
- Founder entity: `https://tinystepslearning.com/#founder`
- Core programs: Phonics, Grammar, Public Speaking
- Delivery model: live online classes

## Code-controlled

B15 keeps these repository-controlled surfaces aligned:

1. The `EducationalOrganization.sameAs` URLs published by the production schema.
2. A reusable `OFFICIAL_PUBLIC_PROFILES` contract for public profile labels and URLs.
3. Crawlable, human-visible official-profile links on `/team`, the site's primary entity/leadership authority page.
4. Footer social links derived from the same canonical profile contract instead of separately hard-coded URLs.
5. Tests that fail if the visible profile contract, footer and organization schema drift apart.
6. The existing `OFFSITE_CORROBORATION_PACK` for consistent company descriptions, founder bios, categories and safe review-request language.

B15 adds no new external account merely for SEO and makes no unverified accreditation, review or directory claim.

## Declared official profiles

The current public organization identities confirmed for Tiny Steps are:

- Facebook Page — `https://www.facebook.com/profile.php?id=61593673422886`
- Instagram — `https://www.instagram.com/tiny_steps_oel/`
- YouTube — `https://www.youtube.com/@TinyStepsLearning-1157`
- LinkedIn company page — `https://www.linkedin.com/company/tiny-steps-learning/`

These four URLs are the canonical `EducationalOrganization.sameAs` set and therefore also drive the human-visible `/team` identity cards and footer social links.

### Platform URL distinctions

Tiny Steps also confirmed the Facebook profile/account URL `https://www.facebook.com/profile.php?id=61585755667285`. It is intentionally **not** used as the canonical organization `sameAs` identity because the separately confirmed Facebook **Page** is the stronger organization-level public entity surface.

LinkedIn administration is accessed through `https://www.linkedin.com/company/110927266/admin/dashboard/`. That URL is intentionally **not** published because it is an administration surface, not a public organization identity.

The member-facing LinkedIn URL may appear in the browser as `https://www.linkedin.com/company/tiny-steps-learning/?viewAsMember=true`. The canonical public URL stored in schema and website links deliberately removes the view-state query parameter and remains `https://www.linkedin.com/company/tiny-steps-learning/`.

Facebook, Instagram, YouTube and LinkedIn can restrict crawler access, so crawler fetchability alone is not treated as proof of ownership. URLs should be changed only after Tiny Steps confirms the public identity surface directly.

## Manual external-profile work

Repository code cannot change third-party account metadata. Profile maintenance must be done directly on each platform.

For each official profile, manually keep these facts consistent where the platform supports them:

- `Tiny Steps Learning` as the public-facing brand
- `Tiny Steps Early Education` where a legal/organization name field is appropriate
- `https://tinystepslearning.com/` as the primary website
- Phonics, Grammar and Public Speaking as the core program set
- live online English learning for children ages 3–12 as the service context
- Hyderabad, Telangana, India only where a location field is relevant
- founder naming consistent with the `/team` page where founder information is shown

Do not create or claim a profile URL until the profile exists and is controlled by Tiny Steps.

Do not add Trustpilot, Justdial, Sulekha, Google Business Profile, review platforms, school-board entities, directories or accreditation bodies to `sameAs` merely because they are desirable SEO surfaces. Add a URL only after the real public profile exists, is controlled or legitimately represents Tiny Steps, and the identity details have been checked.

## Review safety

- Ask for honest reviews only.
- Never gate review requests by expected sentiment.
- Never offer incentives in exchange for positive reviews.
- Never manufacture ratings, review counts or testimonials.
- Never imply CBSE, ICSE, IB, Cambridge or government endorsement unless independently true and documented.

## B15 completion contract

B15 is considered implementation-complete when:

- the official profile contract is reusable in production UI;
- `/team` exposes the official profiles as ordinary crawlable links;
- the footer consumes the same canonical profile contract;
- the organization schema and visible profile contract are identical under automated tests;
- no conflicting organization ID is introduced;
- no new unsupported external identity is added;
- focused B15 tests, root tests, typecheck/lint/build and normal PR CI pass on the same final branch SHA.

External account metadata updates remain a manual distribution task and are not prerequisites for the repository implementation to be technically complete.
