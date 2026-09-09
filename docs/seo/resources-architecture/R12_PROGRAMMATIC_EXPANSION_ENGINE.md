# R12 — Controlled Programmatic Expansion Engine

Revision: `2026-09-09-r12`

## Purpose

R12 turns the governed phonics knowledge system into an expandable publication system without converting the Brick 8 curriculum dataset into an automatic SEO page generator.

The architecture remains layered:

- Brick 8 owns educational knowledge and curriculum alignment.
- Brick 9 owns the frozen 16-page seed publication set.
- R9.1 owns real human review state for that historical seed.
- Brick 10 owns discovery graph behaviour.
- Brick 11 owns measurement, repair and evidence-based decisions about scale beyond an approved wave.
- Brick 12 owns the first explicit Wave 2 publication approvals and the contract future waves must use.

## Publication scope

R12 publishes exactly **31** phonics resource pages:

- **16** frozen `pilot-wave-1` pages from R9.
- **15** explicit `expansion-wave-2` pages selected from Brick 8 concepts already classified `future-wave-2`.

R12 does not publish `supporting-only` concepts and cannot steal a concept with an existing canonical owner.

The 15 Wave 2 concepts are:

`digraph-kn`, `digraph-tch`, `soft-g-hard-g`, `r-controlled-ar`, `r-controlled-or`, `r-controlled-er-ir-ur`, `y-secret-vowel`, `diphthong-oo`, `diphthong-oi-oy`, `diphthong-au-aw`, `diphthong-ou-ow`, `j-sounds`, `shun-family`, `schwa-lazy-vowel`, and `vowel-team-ui`.

## Publication registry

`src/lib/phonicsWave2Publication.js` is the explicit Wave 2 approval source. Every published Wave 2 record must have both Brick 8 `future-wave-2` eligibility and an `approved-for-current-wave` record at the current approval revision. Adding or changing a curriculum candidate alone does not publish it.

`src/lib/resourceExpansionGovernance.js` formalizes the boundary:

- `assertCurrentWavePublicationEligibility` guards this initially approved wave without pretending an unpublished URL has search history.
- `evaluateFurtherResourceScale` requires a finalized R11 `promote` decision, curriculum eligibility and a new explicit publication approval before any later wave can scale the affected page/cluster.
- Missing evidence, `observe`, `insufficient-evidence`, `repair` and `blocked` never become positive scale authorization.
- A repair or block remains local and cannot freeze unrelated clusters.

`src/lib/phonicsPublicationRegistry.js` composes the frozen R9 seed with Wave 2. It rejects duplicate paths, slugs, concept IDs and topic IDs.

The public route manifest, SEO registry, phonics discovery graph, hub grid and detail-page resolver consume the governed publication layer rather than enumerating new URLs manually. The historical R9 SEO export remains scoped to the frozen pilot.

## Human review

R12 does **not** manufacture editorial approval.

- `PHONICS_EDITORIAL_REVIEW_RECORDS` remains the historical 16-record R9.1 ledger.
- `PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS` adds 15 records.
- Every Wave 2 record starts `pending` with `reviewedAt = null` and `reviewedRevision = null`.
- Pending pages render no visible reviewer claim and no `reviewedBy` schema.

A future approval must represent an actual review of that exact publication revision.

## Canonical ownership

R12 keeps the historical R5/R9 ownership registry unchanged and adds `PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP`. The combined `R12_CANONICAL_TOPIC_OWNERSHIP` view is checked for duplicate topic IDs and duplicate query intents.

Each Wave 2 page owns one granular informational `skill-guide` intent under `/resources/phonics`; the commercial `/phonics` owner and existing SATPIN, blending, CVC, long-vowel and other established owners remain protected.

## Discovery and measurement

All 31 pages:

- are reachable from `/resources/phonics`;
- belong to one of the four existing in-page clusters;
- have parent-hub and related-page graph edges;
- are indexable, self-canonical, prerendered and sitemap eligible;
- receive the R11 GA4 resource measurement context, including `publication_wave`.

R11 remains a scoped evidence system. A poor or broken page/cluster can be repaired or blocked without freezing unrelated clusters. R11 is deliberately not impossible pre-publication Google evidence for this first explicit Wave 2; it is mandatory for scale beyond the already approved wave.

## CI acceptance

R12 is complete only when CI proves:

1. 16 seed + 15 Wave 2 = 31 governed publications.
2. No `supporting-only` concept is published.
3. Every page has route, SEO, sitemap, prerender and discovery coverage.
4. The original R9 and R9.1 historical contracts remain intact.
5. All Wave 2 human review records remain truthful.
6. R11 measurement resolves all published pages, and the later-scale API cannot bypass finalized R11 decisions.
7. Wave 2 intent ownership has no collision with historical ownership.
8. Production rendered HTML contains unique educational value and no false review metadata.
9. Full Resources regression, typecheck, production build and SEO smoke pass.

R12 is an expansion mechanism, not permission to mass-publish arbitrary keyword pages. Future waves must be explicitly admitted through curriculum and publication governance and, after this approved wave, a finalized R11 scale decision. No GSC, GA4, teacher, reviewer or editorial evidence is manufactured by this contract.
