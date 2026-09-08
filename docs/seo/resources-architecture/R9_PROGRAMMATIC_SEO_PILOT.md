# Brick 9 — Controlled Programmatic SEO Pilot

Brick 9 is the first Resources brick that publishes new granular phonics URLs. It converts a deliberately small, explicitly reviewed subset of the Brick 8 dataset into useful parent-facing guides without turning the dataset into an automatic page factory.

## Pilot scope

The publication registry is `src/lib/phonicsProgrammaticPilot.js`. It explicitly approves **16** Brick 8 Wave 1 concepts. A future dataset record does not become public merely because it has a candidate slug or a new expansion state.

Published URL pattern:

`/resources/phonics/<approved-slug>`

Approved pages:

1. `/resources/phonics/ck-rule-phonics`
2. `/resources/phonics/floss-rule-phonics`
3. `/resources/phonics/qu-sound-phonics`
4. `/resources/phonics/ch-digraph-phonics`
5. `/resources/phonics/sh-digraph-phonics`
6. `/resources/phonics/th-digraph-phonics`
7. `/resources/phonics/ng-digraph-phonics`
8. `/resources/phonics/soft-c-hard-c-phonics`
9. `/resources/phonics/ai-vowel-team-phonics`
10. `/resources/phonics/ee-vowel-team-phonics`
11. `/resources/phonics/ea-vowel-team-phonics`
12. `/resources/phonics/ie-vowel-team-phonics`
13. `/resources/phonics/oa-vowel-team-phonics`
14. `/resources/phonics/magic-e-phonics`
15. `/resources/phonics/rabbit-rule-phonics`
16. `/resources/phonics/consonant-le-phonics`

The remaining **15 Brick 8 Wave 2 concepts stay unpublished**.

## Approval boundary

R8 remains a dataset and governance layer. Its records continue to say `dataset-only`, `needs-human-review` and `publicationApproved: false`. Brick 9 publication is a separate explicit decision layer. This is intentional: changing or adding a dataset concept must never publish a URL accidentally.

Every approved concept was already screened in Brick 8 against related established content. Brick 9 rechecks:

- distinct parent/search intent;
- no existing canonical owner for the same intent;
- direct curriculum alignment;
- sufficient examples, teaching notes, confusions and practice;
- a meaningful prerequisite/next-step relationship;
- safe non-colliding slug;
- no commercial, location or subject-hub intent;
- no SATPIN, blending or CVC ownership transfer.

## Page system

`src/pages/PhonicsKnowledgePage.tsx` is the single reusable renderer. It does not generate arbitrary dataset pages. It resolves only slugs present in the explicit R9 publication registry; unknown slugs render the normal not-found page.

Each page visibly includes:

- the parent question as the H1;
- a concise quick answer;
- pattern/grapheme context;
- curated examples;
- teaching notes;
- common confusions;
- actionable practice;
- prerequisite and next-learning links;
- optional contrast words;
- related existing Tiny Steps resources;
- a separated assessment CTA at the bottom.

Examples are teaching illustrations, not a promise that every word is independently decodable at first exposure. Teachers and parents should choose words whose other correspondences the child already knows.

## Internal knowledge graph

The Phonics & Reading hub exposes the 16 focused guides in four compact groups:

- Spelling rules
- Consonant patterns
- Vowel patterns
- Word structure

Prerequisite and next links prefer another approved pilot page when available. Otherwise they resolve to an existing canonical owner or established supporting resource. Existing broad guides, games, diagnostic pages and `/phonics` retain their separate jobs.

## Canonical ownership

Each approved page receives one new Brick 5-compatible granular topic owner:

- subject: `phonics-reading`
- intent: `informational`
- owner role: `skill-guide`
- hub: `/resources/phonics`
- query intent: the reviewed Brick 8 concept search intent

`/resources/phonics` continues to own subject discovery only. `/phonics` continues to own the live phonics programme. Existing SATPIN, blending and CVC pages retain their established editorial ownership.

## SEO, AEO and schema

Every approved page is:

- a direct public 200 route;
- self-canonical;
- indexable;
- included in the static public route manifest;
- prerendered;
- included in the sitemap through the route inventory;
- linked visibly from `/resources/phonics`.

Breadcrumb hierarchy:

`Home → Resources → Phonics & Reading → Focused guide`

Structured data is deliberately conservative:

- `WebPage`
- `DefinedTerm`
- `BreadcrumbList`
- existing Organization/Website entities

The visible quick answer supplies the page abstract/speakable content. Brick 9 does **not** fabricate FAQ or HowTo schema.

## R8 compatibility

Brick 8's prepublication guards remain strict by default. Brick 9 teaches the R8 audit about the exact explicit publication allow-list so approved routes no longer look like accidental leaks. Unapproved candidate slugs, future-wave concepts, unrelated runtime imports and route collisions remain failures.

The R8 git-delta rule continues to certify an R8-only branch. It is not used to forbid legitimate later-brick publication changes.

## Controlled-scale rules

Brick 9 does not:

- publish every grapheme in the dataset;
- publish Wave 2 concepts;
- create city/location variants;
- create pages for SATPIN, blending or CVC;
- move commercial intent into Resources;
- create hundreds or thousands of URLs;
- auto-index future dataset records;
- add hidden AI/GEO copy;
- create fake FAQ blocks or schema;
- rewrite existing blog authority pages.

Brick 10 may improve discovery infrastructure after this pilot is validated, but it must not bypass this explicit publication gate.

## Acceptance gate

Brick 9 is complete only when:

1. the explicit pilot registry contains 12–20 approved pages and only reviewed Wave 1 concepts;
2. the R9 source audit reports zero ownership, route, slug, SEO and content-depth violations;
3. all 16 routes have self-canonical SEO configs and correct canonical owners;
4. every page is linked from the Phonics & Reading hub;
5. every page prerenders with visible unique question/answer content;
6. every page appears in the generated sitemap;
7. all Wave 2 routes remain absent from output;
8. R0–R8 Resources regressions remain green;
9. canonical curriculum, R5 ownership, R6 links, R7 AEO/GEO and R8 dataset audits remain green;
10. TypeScript, full production build/prerender, rendered safety and SEO smoke pass;
11. repository-wide CI, dead-URL, crawl/discovery, GSC quality/revalidation and indexability workflows remain green.

Do not merge the Brick 9 pull request until all required checks are green and the user explicitly approves the merge.
