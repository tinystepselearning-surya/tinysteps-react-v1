# PH0 — Current-State & Gap Audit

**Frozen against:** `main@eb97f3777039ea754b2c6e778cdebb9f3b5f4d22`  
**Session branch:** `session-a-phonics-reading-ph0-ph7`

## Executive conclusion

Tiny Steps already has a substantial Phonics & Reading authority system. Session A is therefore a consolidation/completion programme, not a new programmatic-SEO expansion.

The current system already contains:

- differentiated commercial, diagnostic and informational entry points;
- an established canonical topic ownership registry;
- a machine-readable phonics knowledge dataset aligned to the 101-lesson phonics curriculum;
- two generations of audio/word infrastructure, including the R13 semantic sound registry;
- governed phonics pattern resource pages from prior resource waves;
- a substantial games/practice estate;
- letter tracing and tracing-with-sounds experiences;
- a reading semantic journey layer through fluency and comprehension;
- sitemap, canonical, AEO/GEO and indexability audits from the Resources programme.

The primary gaps are architectural: one canonical taxonomy, one canonical sound/word data contract, explicit parent-problem diagnosis mappings, a reusable practice capability registry, and a full phonics-to-reading semantic graph. Public URL expansion is secondary and must remain evidence-gated.

## Protected route roles

| Route | Current role | PH0 decision | Reason |
| --- | --- | --- | --- |
| `/resources/phonics` | Phonics & Reading subject hub | **KEEP + IMPROVE** | Correct informational/practice orchestration owner. Extend pathways; do not turn it into a commercial landing page. |
| `/phonics` | Live phonics programme | **KEEP** | Correct high-commercial owner for online phonics classes. |
| `/reading-classes-for-kids` | Broader reading-support route | **KEEP** | Useful when the need is not purely phonics and may involve decoding, fluency or comprehension. |
| `/blog` phonics authority articles | Informational/problem owners | **KEEP + IMPROVE selectively** | Existing intent ownership and Search Console history should be preserved. |
| `/free-english-games-for-kids` and phonics practice categories | Practice hubs | **KEEP + IMPROVE DATA USE** | Existing practice estate is large enough; the gap is skill/data orchestration rather than quantity. |
| `/letter-tracing-with-sounds-game` and tracing game routes | Early print/sound practice | **KEEP** | Existing implementation is mature and should be connected to the skill graph rather than rebuilt. |

## KEEP / IMPROVE / BUILD / HOLD / MERGE matrix

| Area | Evidence/current state | Decision | Session A action |
| --- | --- | --- | --- |
| Commercial vs informational ownership | `/phonics`, `/reading-classes-for-kids`, and `/resources/phonics` have distinct jobs. | **KEEP** | Protect current intent separation in all audits. |
| Canonical ownership | Brick/R12/R15/R16 registries already govern resource, pattern, reading and comprehension owners. | **KEEP** | Compose Session A ownership on top; do not create parallel owner systems. |
| Phonics knowledge dataset | R8 dataset covers curriculum lessons and many core/advanced concepts, but its stage vocabulary stops at `advanced-patterns` and does not model the complete requested progression as first-class taxonomy nodes. | **IMPROVE** | Add an authoritative PH1 taxonomy/progression layer and explicit teaching-stage metadata without invalidating established concept IDs. |
| Knowledge relation fields | Concepts already carry prerequisites, next IDs, graphemes, examples, confusions and curriculum refs. | **KEEP + IMPROVE** | Add normalized skill family, pronunciation convention, encoding/decoding role and transition metadata through additive registries/adapters. |
| R10.1 sound foundation vs R13 semantic sound registry | Two overlapping sound registries exist. R13 contains 56 semantic identities and supplied recording filenames; R10.1 still defines a separate sound type/manifest. | **MERGE** | Make the R13 semantic registry the canonical PH2 sound source; retain compatibility adapters where older game code needs them. |
| Audio asset state | R13 marks every primary new recording as `expected-upload`; fallback letter audio exists for many basic sounds. | **IMPROVE** | Replace the single implicit state with `approved` / `pending` / `not-required`, separating semantic identity from physical asset readiness. |
| Word sound data | R13 already has 70+ explicit starter word maps with no automatic segmentation; an older small framework-example file also exists. | **MERGE + IMPROVE** | Treat the R13 utility registry as canonical; retire duplication through compatibility re-exports/adapters and add approval state plus skill-family indexing. |
| Individual word URLs | R13 explicitly avoids word-page publication. | **HOLD** | No word-page generator. Word records are reusable learning data only. |
| Pattern resource pages | R9/R12 already publish governed skill guides, while R8 contains additional dataset-only concepts. | **KEEP + IMPROVE** | Build a PH3 coverage registry mapping each meaningful skill family to one canonical owner, supporting owner, or held/no-URL state. |
| Microscopic pattern pages | Candidate slugs exist for some concepts and prior waves already expanded a controlled set. | **HOLD** | No automatic new route for every grapheme/pattern. New owners require distinct intent and useful depth. |
| Parent problem: letter sounds known but cannot blend | Dedicated diagnostic owner exists. | **KEEP** | Connect it to diagnosis → skill → practice → assessment in PH4. |
| Parent problem: guesses words | Covered inside broader reading-problem routes but not represented as a machine-readable diagnostic journey. | **IMPROVE** | Keep broad owner; add explicit problem mapping. Do not create a duplicate thin page. |
| Parent problem: slow decoding | Fluency guide and slow-reader route exist. | **KEEP + IMPROVE** | Clarify decoding-accuracy vs fluency diagnosis in PH4. |
| Parent problem: vowel confusion | Pattern content exists, but parent-problem ownership is diffuse. | **IMPROVE** | Map the problem to short-vowel discrimination / vowel-system owners and practice. A new URL is evidence-gated. |
| Parent problem: unfamiliar words | Covered across programme/assessment guidance, but not a dedicated machine-readable problem pathway. | **IMPROVE** | Treat as transfer/decoding diagnosis and connect to fresh-word practice; avoid duplicate landing page unless evidence warrants it. |
| Parent problem: decodes but lacks fluency | Fluency owner exists. | **KEEP** | Connect decoding → automatic recognition → connected-text fluency. |
| Parent problem: reads without comprehension | Existing comprehension diagnostic and decoding-to-comprehension semantic owners exist. | **KEEP** | Bring them into the unified Session A graph. |
| Parent problem: spelling/segmenting difficulty | Segmenting exists in teaching/assessment context but lacks a single explicit Session A diagnostic contract. | **BUILD DATA; HOLD URL** | Add problem, diagnosis and practice mappings; no public owner until ownership audit justifies one. |
| Parent problem: memorises rather than reads | Addressed inside CVC/blending/automatic-word-recognition guidance but not as a first-class problem node. | **BUILD DATA; HOLD URL** | Add transfer/fresh-word diagnosis and route to existing owners. |
| Games/practice | Existing catalog includes sound identification, tracing, CVC building, blending, word reading, sentence/story and comprehension activities. | **KEEP + IMPROVE** | Build a reusable PH5 practice capability registry so learning pathways consume shared skills/data instead of duplicating word lists. |
| Tracing | Production component is newer than the historical uploaded snapshot and includes substantial mobile/progress work. | **KEEP** | No tracing rewrite in Session A. Add taxonomy/practice linkage only where needed. |
| Semantic journeys | Existing R16 graph is strong from reading concepts into fluency/comprehension but is additive to earlier graphs and does not expose the full requested phonics progression in one model. | **IMPROVE** | Build PH6 unified graph: prerequisite → skill → pattern → practice → problem → reading transition. |
| Sitemap/canonicals/indexability | Resources programme already has route, sitemap, ownership and indexability audits. | **KEEP** | Extend closure tests; avoid changing public routes unless PH3/PH4 explicitly approves them. |
| Commercial bridges | Existing hubs and articles already link toward programme/assessment routes. | **KEEP + AUDIT** | Keep bridges contextual; never let commercial CTAs become alternate informational owners. |

## PH0 frozen gaps

Only the following are authorized for Session A implementation:

1. **PH1 — Unified taxonomy/progression contract.** Add first-class nodes for phonemic awareness → letter sounds → blending → segmenting → CVC → digraphs → blends → long vowels → vowel teams → spelling rules → R-controlled → advanced patterns → multisyllabic decoding → fluency → comprehension transition.
2. **PH2 — Canonical sound/word data contract.** Consolidate around the R13 semantic sound and word registries, add explicit `approved` / `pending` / `not-required` states, preserve fallbacks, and index words by learning skill without automatic segmentation or publication.
3. **PH3 — Coverage registry.** Represent every Tier-1 pattern family with exactly one of: canonical owner, supporting owner, dataset/practice-only, or evidence-gated hold.
4. **PH4 — Parent problem registry.** Implement problem → explanation → diagnosis → skill → practice → next step → assessment mappings for the nine defined reading problems, reusing existing canonical owners where possible.
5. **PH5 — Practice capability registry/adapters.** Map real games/resources to skills and reusable datasets. Do not create games merely to fill a taxonomy cell when an existing experience already serves the skill.
6. **PH6 — Unified semantic graph.** Compose existing canonical ownership and reading journeys into a complete structured-literacy journey graph and audit orphan/redundant edges.
7. **PH7 — Closure gate.** Add Session A audits/tests for taxonomy coverage, problem ownership, sound/word states, practice linkage, semantic reachability, canonical uniqueness, route/indexability safety, and full CI/build/render health.

## Explicitly not authorized by PH0

- bulk word pages;
- a route per phoneme;
- a route per grapheme spelling;
- a route per every curriculum lesson;
- duplication of existing blending, CVC, fluency or comprehension owners;
- conversion-focused rewrites of `/resources/phonics`;
- tracing-engine redesign;
- automatic pronunciation inference from spelling;
- claiming a teacher recording is approved merely because a filename is expected;
- changing Grammar/Writing or Speaking/Communication architecture.

## PH0 freeze decision

**PH0 = FROZEN.**

Session A may now build PH1–PH7 only within the authorization above. Any proposed public URL outside this matrix must return to an ownership/cannibalisation review before implementation.
