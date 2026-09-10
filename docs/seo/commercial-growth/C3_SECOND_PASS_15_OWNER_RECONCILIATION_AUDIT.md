# C3 — Second-Pass 15-Owner Reconciliation Audit

Date: 2026-09-10  
Branch: `seo/c1-parent-commercial-search-universe`  
Scope: 15 user-facing commercial ownership boundaries / 16 machine-readable C2 clusters / 14 unique canonical URLs.

## Why this second pass exists

The first C3 gate proved that expected owner-page signals were present and that the repository built cleanly. This second pass is stricter: it compares each owner against C2 ownership, runtime SEO metadata, prerender SEO metadata, source-level commercial facts, structured data, answer-first content, international coverage, internal links, and conversion paths.

Result: the architecture is sound, but C3 should be treated as **reopened for reconciliation** before moving to C4. The findings below are mostly alignment/cleanup issues rather than architecture changes.

## Audit matrix

| Commercial boundary | Canonical owner | Second-pass status | Finding |
| --- | --- | --- | --- |
| Generic phonics classes | `/phonics` | RECONCILE | Strong page, but generic owner still explicitly targets several `best`/comparison phrases in metadata/keywords and answer content even though C2 assigns comparison intent to the dedicated comparison owner. Source also retains fixed-progress wording that is corrected only by a Vite transform. |
| Best/comparison phonics | `/best-online-phonics-classes-for-kids-in-india` | PASS WITH META ALIGNMENT | Strong differentiated comparison guide with WebPage/FAQ/decision/scorecard semantics and no unsupported #1 claim. Runtime description is more specific than prerender registry description; align them. |
| Phonics fees/cost | `/phonics-fees-india` | RECONCILE | Strong price-research page, but source still says 35–40 minutes in three places and depends on Vite to serve 35 minutes. Runtime title/description differ from prerender registry. Add WebPage semantics and clean source directly. Precise market medians/averages have methodology but no visible provider/source list; preserve only if underlying research evidence is retained. |
| Reading classes | `/reading-classes-for-kids` | RECONCILE | Strong broad reading owner and conversion path. It lacks Course schema, remains India-only in title/body/schema despite C2 assigning international reading variants here, and its keyword list explicitly targets `reading fluency classes`, which is a narrower C2 owner. Add worldwide Course semantics and reduce exact specialist-keyword ownership bleed. |
| Reading fluency programme | `/reading-fluency-program` | PASS WITH META ALIGNMENT | Strong specialist boundary, Course + WebPage + FAQ, India + worldwide, 35-minute facts, demo/pricing links. Runtime metadata is stronger than registry metadata; align prerender registry. |
| Grammar classes | `/grammar` | RECONCILE | Strong content/FAQ/conversion architecture. Source structured data remains India-only and relies on a Vite replacement. The replacement uses a single `.replace`, so it may normalize only the first `areaServed` occurrence while leaving another India-only. Source should directly use India + worldwide and visible copy should confirm worldwide online availability. |
| Writing / creative writing | `/writing-classes-for-kids` | PASS WITH META ALIGNMENT | Strong after C3: creative-writing/provider intent, Course schema, India + worldwide, 1:1/35-minute facts, grammar boundary. Runtime title/description differ from prerender registry; align them. |
| Spoken English | `/spoken-english-classes-for-kids-online` | PASS WITH META ALIGNMENT | Strong 1:1, fluency, NRI/international and spoken-vs-public-speaking separation. Registry description is older and weaker than runtime description; align it. |
| Public speaking | `/speaking` | RECONCILE | Strong public-speaking owner. Same source-level geography issue as grammar: source schema remains India-only and depends on a single build transform. Add direct India + worldwide semantics while retaining proven India title if desired. |
| General communication skills | `/speaking` | RECONCILE | H1/body already cover communication well and C2 ownership is clear. Reconciliation is the same source-level international/schema cleanup as public speaking; do not create a second communication URL. |
| Confidence-building programme | `/confidence-building-program-kids` | PASS WITH META ALIGNMENT | Strong specialist boundary to `/speaking`, Course + WebPage + FAQ, live 1:1/35-minute, worldwide. Runtime title/description differ from registry; align. |
| Broad/global/NRI English | `/online-english-classes-for-kids` | RECONCILE | Strong global/NRI/tutor page, but the programme chooser combines `Grammar & writing` to `/grammar` and `Spoken English & public speaking` to `/speaking`. Split into six owner-aware links so Writing and Spoken English receive their canonical internal signals. Registry description should match runtime international/tutor description. |
| Hyderabad English | `/online-english-classes-hyderabad` | PASS WITH MINOR LINK IMPROVEMENT | Strong local Service semantics, online-only clarification, local-vs-global boundary and pricing/demo path. Programme chooser currently omits Writing and Spoken English; add those owner links. Review the page-specific EducationalOrganization node so it cannot be interpreted as a physical Hyderabad branch; Service area targeting is sufficient if no local branch exists. |
| General fees/value | `/pricing` | RECONCILE | Strong central pricing config, OfferCatalog, FAQ and free-demo path. Programme links omit Reading, Writing and Spoken English. Package feature bullets such as recorded class access, monthly Q&A, AI coach prompts, capstone video, priority reschedules and Saturday masterclass appear only on this page and are not supported by the canonical commercial-facts/pricing registries; verify or replace before freeze. |
| Demo / assessment / trial | `/book-demo` | RECONCILE | Strong conversion owner with price-0 Service Offer, WebPage/FAQ/decision schema and attribution. Assessment scope names phonics/reading/grammar/sentence formation/pronunciation/speaking but omits Writing as a canonical programme need. Service schema should also state India + worldwide and ages 3–12 audience. |

## Cross-page findings

### 1. Runtime vs prerender SEO metadata drift

The following C3-strengthened pages have runtime metadata that no longer exactly matches `routeSeoRegistry.js`, which is used for final build-time metadata injection:

- `/best-online-phonics-classes-for-kids-in-india` — runtime description is more specific.
- `/phonics-fees-india` — runtime title/description are the 2026 price-guide version; registry is older/generic.
- `/reading-fluency-program` — runtime uses `Reading Fluency Classes for Kids Online`; registry still uses `Reading Fluency Program for Kids Who Read Slowly`.
- `/writing-classes-for-kids` — runtime targets `Creative Writing Classes for Kids Online`; registry still says `English Writing Classes for Kids`.
- `/spoken-english-classes-for-kids-online` — title matches; description differs.
- `/confidence-building-program-kids` — runtime targets `Confidence Building Classes for Kids Online`; registry remains generic programme wording.
- `/online-english-classes-for-kids` — title matches; runtime description has ages 3–12, 1:1 tutor, NRI/worldwide detail that registry omits.

These should be made one authoritative metadata set per owner so prerendered HTML and hydrated SPA state do not disagree.

### 2. Source facts should not depend on hidden build transforms

Commercial owner sources should contain canonical facts directly. Current build-time normalization still masks stale source values, notably:

- `/phonics-fees-india`: source `35–40 min` → served `35 min`.
- `/phonics`: fixed 4–6 blending-progress claims and legacy lesson-count/duration wording are replaced during build.
- `/grammar` and `/speaking`: source `areaServed: 'India'` is transformed at build time.

C3 reconciliation should move these canonical facts into source and leave build transforms only for genuinely legacy/non-owner migrations.

### 3. Generic owner vs specialist/comparison owner boundaries

C2 boundaries remain correct, but several generic pages still contain exact specialist phrases that can dilute ownership:

- `/phonics` should own generic provider/1:1/age/international phonics intent, while `best/review/compare` belongs to `/best-online-phonics-classes-for-kids-in-india` and price/cost belongs to `/phonics-fees-india`.
- `/reading-classes-for-kids` can discuss fluency as a reading skill, but explicit `reading fluency classes` provider intent should resolve to `/reading-fluency-program`.

Contextual links to specialist owners are desirable; duplicated primary targeting is not.

### 4. Internal programme chooser completeness

Owner-aware internal links should expose all major commercial programmes rather than merging distinct C2 owners into broad cards. At minimum, chooser/navigation sections should distinguish:

- Phonics → `/phonics`
- Reading → `/reading-classes-for-kids`
- Grammar → `/grammar`
- Writing → `/writing-classes-for-kids`
- Spoken English → `/spoken-english-classes-for-kids-online`
- Public Speaking & Communication → `/speaking`

Pricing and Hyderabad pages should also expose these owners where contextually useful.

### 5. Structured-data geography

C1 evidence validates international visibility and C2 deliberately routes international searches to core owners instead of country pages. Therefore programme schemas should consistently represent Tiny Steps as India + worldwide online where true. Hyderabad remains the narrow local exception through its Service area.

## Recommended reconciliation order

1. Clean source-level canonical facts and remove dependence on Vite transformations for commercial owners.
2. Align runtime and prerender metadata for every strengthened owner.
3. Tighten `/phonics` and `/reading-classes-for-kids` specialist/comparison boundaries.
4. Add Course/worldwide semantics where missing, especially reading.
5. Split broad-English and local/pricing programme links across all canonical owners.
6. Expand `/book-demo` to Writing + global/audience semantics.
7. Verify unsupported pricing-package feature claims against real product operations; retain only confirmed claims.
8. Re-run C1/C2/C3 contracts, typecheck, full tests, production build/prerender, SEO smoke and a new second-pass reconciliation audit on the exact head.

## Freeze decision

**Do not merge and do not advance to C4 yet.**

C1 and C2 remain frozen. C3 architecture remains valid, but its freeze is reopened solely for the reconciliation items in this document. No new owner, country page, AI-prompt page or commercial architecture is proposed by this audit.
