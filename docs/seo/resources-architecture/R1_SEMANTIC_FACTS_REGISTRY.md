# Resources Architecture — Brick 1 Semantic Facts Registry

Status: **implemented on the Brick 1 branch**

Brick 1 creates one machine-readable source of truth for the public facts that will be reused by the Resources architecture, programme pages, structured data, off-site identity work and later data-driven content.

## Canonical source

`src/config/semanticFacts.ts`

This file owns the approved public semantic facts for:

- brand and website identity;
- founder identity and founder profile URL;
- core public audience and programme-level public age ranges;
- standard 1:1 delivery format and duration;
- free demo-assessment format, duration, count and price;
- standard public pricing facts;
- phonics, grammar and speaking programme labels, paths, claims and lesson counts;
- service area and delivery geography;
- contact email, telephone and WhatsApp number;
- official organization profile URLs;
- `EducationalOrganization.sameAs` inclusion policy;
- learner-reach facts;
- school-partnership public pricing facts;
- proof/outcome safety policy;
- concluded Summer Camp 2026 status.

The registry is versioned as `2026-09-12-r1`.

## Canonical programme facts

### Phonics & Reading

| Level | Public age | Lessons |
| --- | --- | ---: |
| Phonics Foundations | Ages 3–7 | 31 |
| Early Phonics | Ages 4–8 | 40 |
| Advanced Phonics | Ages 6–12 | 30 |
| **Total** |  | **101** |

The 31 / 40 / 30 split is not invented by Brick 1. It is the current repository curriculum truth and is tested against `src/content/phonicsCurriculum.ts`.

### Grammar & Writing

| Level | Public age | Lessons |
| --- | --- | ---: |
| Beginner Grammar | Ages 5–10 | 36 |
| Advanced Grammar | Ages 8–12 | 36 |
| **Total** |  | **72** |

### Speaking & Communication

| Level | Public age | Lessons |
| --- | --- | ---: |
| Public Speaking (Basic) | Ages 4–7 | 36 |
| Public Speaking (Advanced) | Ages 7–12 | 36 |
| **Total** |  | **72** |

The public brand audience remains **children aged 3–12**. Programme-level public metadata may narrow this range but must not silently widen it beyond 12.

## Canonical delivery and commercial facts

- Standard 1:1 class: **35 minutes**.
- Free demo assessment: **one free 35-minute 1:1 online demo assessment class per child before enrolment**.
- Standard 1:1 price: **₹400 per class**.
- Delivery: **live online classes**.
- Pricing remains operationally sourced from `src/config/pricing.ts`; the semantic registry references the canonical pricing values rather than creating a second monetary source.

This distinction is intentional: operational price calculations stay in `pricing.ts`; public semantic meaning and cross-surface claims are exposed through `semanticFacts.ts`.

## Canonical identity facts

### Organization profiles

All verified public organization URLs now live in `semanticFacts.ts`:

- Facebook;
- Instagram;
- YouTube;
- LinkedIn company page;
- Pinterest;
- Quora.

The registry distinguishes **official profile** from **Organization.sameAs**.

Current policy preserves existing published behavior:

- Facebook: `sameAs = true`
- Instagram: `sameAs = true`
- YouTube: `sameAs = true`
- LinkedIn: `sameAs = true`
- Pinterest: `sameAs = false`
- Quora: `sameAs = true`

This removes the previous hidden Quora-only mutation inside `Meta.tsx` without automatically expanding schema to Pinterest.

### Founder identity

Founder identity is kept separate from organization identity:

- Vannala Ravali Priya (Priya);
- founder profile: `/team/vannala-ravali-priya`;
- founder LinkedIn: `https://www.linkedin.com/in/ravali-priya-vannala/`.

A person-level profile must not be placed into the EducationalOrganization `sameAs` list merely because it belongs to the founder.

## Consumers migrated in Brick 1

The following now derive their public semantic values from the registry:

- `src/config/publicFacts.ts` — backward-compatible public-facts facade;
- `src/config/publicOffer.ts` — demo and public offer facts;
- `src/constants/publicContact.ts` — public contact contract;
- `src/content/courses.ts` — public course labels, age ranges and lesson counts;
- `src/lib/schemas.ts` — organization/entity/schema facts;
- `src/lib/officialProfiles.ts` — organization profile collection;
- `src/lib/founderProfiles.ts` — founder profile collection;
- `src/lib/pinterestProfile.ts` — compatibility export;
- `src/lib/quoraProfile.ts` — compatibility export;
- `src/components/common/Meta.tsx` — canonical Organization `sameAs` merge;
- `src/components/entity/OfficialProfilesSection.tsx` — human-visible profile list;
- `src/components/common/Footer.tsx` — profile/contact URLs.

## Why compatibility modules remain

`publicFacts.ts`, `publicOffer.ts`, `publicContact.ts`, `pinterestProfile.ts`, `quoraProfile.ts`, `founderProfiles.ts` and the `PUBLIC_FACTS` export in `schemas.ts` remain because many existing pages already import them.

Brick 1 does **not** force a noisy repository-wide import migration. Instead, these modules become projections of `semanticFacts.ts` so existing consumers receive the same values while there is only one canonical public semantic source.

## Automated guardrails

### Runtime parity

`src/tests/seo/resourcesR1SemanticFacts.spec.ts` verifies:

- canonical brand/founder/audience/delivery/pricing/contact facts;
- facade equality with the registry;
- phonics counts against the operational canonical curriculum;
- public course catalog age/count parity;
- official-profile and founder-profile URL parity;
- Organization `sameAs` parity;
- no reintroduction of profile/contact literals in compatibility modules;
- non-guaranteed programme-claim policy.

### Existing public-facts audit

`scripts/audit-public-facts.mjs` now validates registry ownership instead of requiring duplicated literals. It still preserves the existing safeguards for:

- unsupported proof claims;
- obsolete 35–40 minute public standard-1:1 claims;
- public age ranges above 12;
- expired Summer Camp offer language;
- rendered HTML parity;
- learner-reach / offer / school-pricing public parity.

## Brick 1 non-goals

Brick 1 deliberately does **not**:

- redesign or repurpose `/resources`;
- change main navigation;
- move blog URLs;
- create subject hubs;
- create programmatic SEO pages;
- create a phonics word database;
- add new commercial claims;
- change operational curriculum sequencing;
- change the standard ₹400 / 35-minute 1:1 offer.

Those remain later bricks.

## Acceptance gates

Brick 1 is ready to merge only when all of the following pass:

1. R1 focused semantic-facts tests.
2. Existing Quora/entity corroboration tests updated for registry ownership.
3. `npm run content:public-facts`.
4. TypeScript typecheck.
5. Full production build/prerender.
6. `npm run content:public-facts-rendered` against generated HTML.
7. Existing repository-wide SEO and regression checks.

## Relationship to R0 performance baseline

Brick 1 does not erase the R0 account-bound Search Console / GA4 evidence gap. The repository still treats unavailable performance evidence as missing rather than zero. This brick is semantic consolidation only; it does not make a traffic/ranking migration decision.

## Gate to Brick 2

After Brick 1 is merged and green, the semantic facts required by the new Resources gateway will have a stable source. Brick 2 can then repurpose `/resources` without copying programme, offer, identity or contact facts into another isolated page-local source.
