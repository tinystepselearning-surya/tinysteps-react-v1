# TSSA-7 / B3 — Parent-intent owner and curriculum coverage audit

**25 October 2026 · Repository engineering and first-party GSC evidence · Safe incremental change**

## Scope and invariants

B3 is not a new SEO landing-page project. Preserve the existing 279 canonical source owners, 83 blogs, 31 Phonics guides, 38 Grammar guides, 16 Vocabulary guides, current redirects/robots/sitemap, and seven public programme levels. **A search query can be shown for multiple pages in GSC; that alone does not establish cannibalization.** Age is a guide; placement depends on ability and assessment. No misleading promise that each published article guarantees a lesson outcome.

## First-party GSC query–page evidence (1–22 October 2026)

Connected **Search Console domain property** returned **4,464 query × page rows**, with clicks and impressions; this is a privacy-filtered query export, not exhaustive site impressions or ranking evidence. Date through 22 Oct is what the connector returned at this assessment. We inspected non-branded query families and recurring collisions:

| Actual query | Observed primary URL | Other observed URL | Interpretation |
|---|---|---|---|
| `online phonics classes` | `/phonics` (38 impressions) | `/best-online-phonics-classes-for-kids-in-india` (8) | Programme vs buying comparison; **keep distinct** |
| `online phonics classes for kids` | `/phonics` (33) | Comparison page (9) | Distinct service-vs-comparison intents; no forced canonical change |
| `best online phonics classes for kids in india` | Comparison page (15) | `/phonics` (9) | Evidence favours existing comparison owner |
| `online phonics classes fees` | `/phonics-fees-india` (18) | `/phonics` (2) | Keep fee-research owner distinct |
| `public speaking classes for kids` | `/speaking` (99) | — | Existing commercial owner credible |
| `satpin` | `/blog/satpin-phonics-guide` (1,430) | — | Preserve existing educational owner |
| `verbs for kids` | `/resources/grammar/verbs-for-kids` (654) | — | Preserve governed Grammar owner |
| `synonym definition for kids` | `/resources/vocabulary/synonyms-antonyms-for-kids` (122) | — | Preserve Vocabulary owner |

The samples are **not** complete query-volume totals or national market demand estimates. Similar queries often appear on more than one URL because search results can show alternatives; don't redirect one simply to force an apparent single result.

## Concrete repository discrepancy — repaired in B3

`src/pages/CoursesPage.tsx` hardcoded **Phonics Foundations age 3–5** and **Early Phonics age 4–7**, despite central `SEMANTIC_FACTS.programmes.phonics.levels` publishing **Ages 3–7** and **Ages 4–8**. These labels could mislead parents comparing programmes, particularly at ages 6–8. Other five labels were hardcoded too, even when they currently matched.

**Fix:** All seven age labels on `/courses` now read directly from the `SEMANTIC_FACTS` canonical curriculum. Stage-entry requirements, course names, H1/title, canonical, redirects, sitemap and CTA remain unchanged. Phonics readiness/decoding, Grammar independent sentence skill and Speaking expression—not birth year alone—determine level placement. A false implication that "Age 3–12" means every course starts at age 3 is avoided.

## Source-derived ownership audit

`scripts/tssa7-b3-parent-intent-coverage.mjs` reconciles:
- **28** preexisting Layer-1 parent problems from `AI_ANSWER_LAYER_1_PARENT_PROBLEMS` against B1 canonical-owner ledger; confirms indexable owners and records potential supporting/practice-path registration gaps for editorial review, without creating URLs.
- **12** already-governed native-AI benchmark questions to their original canonical owners. This source match is **not** evidence of AI citations.
- **9** representative commercial/stage intents with explicit programme versus comparison versus fees ownership. Protects current URLs such as `/phonics`, `/phonics-fees-india`, `/speaking`, `/grammar`.
- **7 age-stage levels / 245 curriculum lessons** from published semantic facts, verifies all public `/courses` age labels now derive from that source, and stores skill-led subject-level placement principles.
- Emits CSVs and JSON review artifacts to CI; does not write public HTML or modify source files.

## Release and evidence gates

1. Build source corpus and B1 ledger; run B3 audit and tests; accept only a valid 28+12+9+7 inventory, no duplicate primary owners **per intent**, no redirect or noindex chosen as primary answer.
2. Typecheck and fully build/prerender; the existing `/courses` self-canonical and correct Phonics age labels must appear in rendered HTML.
3. Review any `HANDOFF_REVIEW` flags before editorial modifications; do not replace informational owners with sales URLs or force arbitrary age-to-course mapping.
4. Keep lead-generation PRs #761–#764 and operational work untouched; this PR does not change submission behavior. If changed public text deploys, verify Firebase rollout and current live `/courses` HTML before calling B3 released.

**Next B3 decision:** If the source audit exposes additional actionable broken/redirected supporting links or missing age/stage explanation, resolve each in a separate narrow change. Do not bulk-publish duplicate pages just to expand keyword surface.
