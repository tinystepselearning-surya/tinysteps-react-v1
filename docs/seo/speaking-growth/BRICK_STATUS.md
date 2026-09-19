# Tiny Steps Speaking Search Growth — Brick Status

Project branch: feature/speaking-seo-geo-growth  
Base branch: main  
Brick 1 original base commit: e2946a436f1c9dd9694b034ebfd166947c01700a  
Latest main synchronized through Brick 8: d0b46a251f33c0b15015d3b516993a0a0f44cb65  
Production merge policy: no merge to main until Bricks 1–13 and final integration audit are complete.

## Governing safety rules

1. All Speaking SEO/AEO/GEO/AVO work stays on this dedicated branch.
2. Existing public facts, attendance, payments, scheduling, dashboards, games, authentication and unrelated SEO systems are out of scope unless a later brick explicitly requires a shared-component change.
3. Latest main must be synchronized into this branch periodically; main must never be overwritten from this branch.
4. Every redirect/canonical/indexability change requires evidence and a rollback path.
5. Existing commercial-owner contracts are preserved unless a later brick deliberately changes them with supporting evidence.
6. Production deployment is prohibited until the final 13-brick audit gate passes.

## Brick ledger

| Brick | Scope | Status | Merge to main |
|---|---|---|---|
| 01 | Speaking search baseline & safety lock | COMPLETE — RE-AUDITED | NO |
| 02 | Search intent & keyword ownership map | COMPLETE — RE-AUDITED | NO |
| 03 | Cannibalization & technical SEO cleanup | COMPLETE — RE-AUDITED | NO |
| 04 | Flagship /speaking money page | COMPLETE — RE-AUDITED | NO |
| 05 | Spoken English territory | COMPLETE — RE-AUDITED | NO |
| 06 | Programme architecture | COMPLETE — RE-AUDITED | NO |
| 07 | Tiny Steps Speaking Progress Framework | COMPLETE — RE-AUDITED | NO |
| 08 | Speaking knowledge cluster | COMPLETE — RE-AUDITED | NO |
| 09 | Evidence layer | COMPLETE — RE-AUDITED | NO |
| 10 | Video/class demonstration engine | PENDING | NO |
| 11 | Entity & external authority | PENDING | NO |
| 12 | GEO/AEO/AI visibility layer | PENDING | NO |
| 13 | Search-to-lead-to-admission attribution | PENDING | NO |

## Brick 1 completion gate

- Dedicated branch created from the then-current main.
- Existing SEO ownership framework inventoried.
- Speaking-related public URL families inventoried.
- Existing redirects and course canonicalization recorded.
- Exact current and prior 90-day GSC baselines frozen.
- Main commercial query opportunities frozen.
- Google URL Inspection state captured for primary and legacy Speaking URLs.
- Existing AI/discovery surfaces inventoried.
- Known conflicts and future-brick actions recorded without changing runtime behavior.
- Latest parallel-development main synchronized into this branch before Brick 2.
- No production page, route, redirect, schema, sitemap or application logic changed by Brick 1.

## 2026-09-19 re-audit notes

The original Brick 1 baseline was rechecked before Brick 2.

Corrections and additions:
- corrected the current GSC window from a 91-day range to the exact 90-day range 2026-06-19 through 2026-09-16;
- corrected the prior comparison to the immediately preceding exact 90-day range 2026-03-21 through 2026-06-18;
- replaced the site-wide average-position figure with the reproducible direct Search Analytics aggregate;
- added fresh Google URL Inspection evidence;
- recorded the repository-intent versus Google-index-state mismatch for /confidence-building-program-kids;
- recorded the public-fact inconsistency in src/components/Home/PopularPrograms.tsx where Super Speakers is labelled Ages 4-15 while the protected brand/programme facts stop at age 12;
- recorded existing llms.txt/RSS/feed/LLM-discovery infrastructure so later GEO work extends rather than duplicates it;
- synchronized main commit 3b11fee88ff21e928d2ed8af555afcb64695c815 into this branch. Those incoming changes are AV5 attendance-validation work and are not part of the Speaking project.

Brick 2 must not modify the protected owner contracts until its query-ownership evidence is complete.


## Brick 2 completion gate

- Exact 90-day GSC query/page evidence grouped into Speaking admission intent families.
- Generic Public Speaking and Communication ownership frozen to `/speaking`.
- Generic Spoken English ownership frozen to `/spoken-english-classes-for-kids-online`.
- Broad Hyderabad English remains on `/online-english-classes-hyderabad`; subject-qualified Hyderabad Spoken-English intent belongs to `/spoken-english-classes-for-kids-online`.
- Confidence Building kept as a narrow specialist intent.
- Course-detail pages restricted to named programme/detail intent.
- Price and demo intent kept on existing cross-programme owners.
- AI-style questions inherit the underlying human intent owner; no AI-prompt pages authorized.
- Weak-evidence duplicate pages explicitly rejected.
- Brick 2 runtime changes: ZERO.


## 2026-09-19 Brick 2 re-audit notes

Brick 2 was re-audited before Brick 3.

Corrections and additions:
- corrected the local-intent boundary: `/online-english-classes-hyderabad` owns broad Hyderabad English intent only; subject-qualified Hyderabad Spoken-English intent belongs to `/spoken-english-classes-for-kids-online`;
- reclassified the observed 10 explicit Hyderabad Spoken-English impressions as subject-intent leakage rather than healthy local ownership;
- separated Speaking-project execution priority from the repository's existing Commercial C2 priority so Brick 2 does not silently rewrite C2 priorities;
- recorded that exact confidence-building commercial queries returned no GSC rows in the current 90-day window; Confidence Building remains a specialist owner because of the existing C2/C3 contract, pending Brick 3 indexability repair and later demand validation;
- enumerated the known legacy Public-Speaking technical surfaces Brick 3 must reconcile, including route manifest, SEO registry, subject-landing registry, sitemap, RSS/feed, smoke/tests and analytics classification;
- confirmed no new city, near-me, comparison, AI-prompt, Spoken-English or Public-Speaking fee page is authorized.

Brick 2 status after re-audit: COMPLETE — RE-AUDITED.


## Brick 3 completion gate

- Legacy `/public-speaking-communication-kids` converted from an indexable duplicate page into a direct 301 alias to `/speaking`.
- Legacy route removed from static sitemap, RSS and feed discovery.
- Legacy SEO alias canonicalizes to `/speaking` and is `noindex, follow`.
- Obsolete legacy page component retired.
- Client router includes a safe local/development fallback redirect.
- SEO smoke and infrastructure test expectations updated to prevent accidental resurrection.
- Confidence-programme noindex mismatch traced to a Google crawl dated 2026-08-27 that predates the current 2026-09-10 indexable implementation; no redundant robots patch added.
- Hyderabad page verified as broad-local chooser with programme-owner handoffs; no new local subject page created.
- Home "Super Speakers" age label corrected from 4-15 to 4-12.
- Structural invariants all passed.
- Executable npm/Vitest/build run remains required at the final integration gate because this environment could not clone GitHub and no branch CI run was available.
- Brick 3 production deployment: ZERO.


## 2026-09-19 Brick 3 re-audit notes

Brick 3 was re-audited before Brick 4.

Additional fixes:
- added explicit `/public-speaking-communication-kids/` → `/speaking` 301 alongside the bare-path 301, with regression assertions for both variants;
- corrected the generic homepage "Super Speakers" card to link to the canonical `/speaking` programme owner rather than the ages 4-7 Foundations detail page;
- re-ran the expanded structural invariant matrix after both fixes;
- verified sitemap generation is manifest-driven and RSS/feed generation excludes the noindex legacy alias, so future regeneration preserves the cleanup;
- confirmed main remains fully synchronized into the feature branch at the re-audit gate.

Brick 3 status after re-audit: COMPLETE — RE-AUDITED.


## Brick 4 completion gate

- `/speaking` retained as the sole generic Public Speaking + Communication owner.
- Frozen SEO title/meta description and canonical retained unchanged.
- Parent diagnostic rebuilt around six observable child needs with canonical handoffs.
- Speaking progression separated from optional Grammar/Spoken-English foundations.
- Real class-experience section added using existing `/class-samples` evidence surface.
- Existing responsive-teaching model retained and repositioned later in the parent journey.
- Academic/teacher-quality evidence links added through `/team` and `/why-tiny-steps`.
- Source-supported parent feedback moved into a dedicated evidence section before FAQ.
- Class-sample FAQ added.
- New regression guard: `src/tests/seo/speakingGrowthBrick4.spec.ts`.
- New commercial URLs: ZERO.
- Metadata/canonical/redirect/sitemap changes in Brick 4: ZERO.
- Production deployment: ZERO.

## 2026-09-19 Brick 4 re-audit notes

Brick 4 was re-audited before Brick 5.

Additional fixes and findings:
- tightened the Quick Answer so Public Speaking no longer claims generic one-word/short-answer or sentence-formation problems that may belong to Spoken English or Grammar;
- changed `Sentence expansion practice` to `Idea organisation practice` and `Reading aloud expression` to `Voice clarity and expression`;
- corrected testimonial wording from `Approved parent feedback` to `Parent feedback` because the rendered TestimonialSnippets path uses the static `Tiny Steps parent feedback` catalogue rather than the Firestore approval-state query;
- added named links from the Basic and Advanced level cards to the existing Foundations and Excellence detail pages while preserving `/speaking` as generic owner;
- added an accessible caption and column scopes to the comparison table;
- verified all 14 internal destinations resolve;
- verified responsive/mobile layout guards and minimum CTA touch sizes;
- re-ran the expanded source-level invariant matrix: all checks passed;
- recorded Brick 6 schema handoff: do not invent a third Speaking course merely to satisfy Google Course-list rich-result eligibility;
- recorded Brick 12 markup handoff: visible FAQ/schema can support semantics, but no Google FAQ rich-result expectation is assumed;
- confirmed Brick 4 still changes only the flagship page, its dedicated regression test, and Speaking-growth documentation;
- confirmed feature branch remains 0 commits behind main;
- confirmed no attached GitHub Actions run exists for the latest Brick 4 commit, so executable build/test remains a final-integration requirement.

Brick 4 status after re-audit: COMPLETE — RE-AUDITED.


## Brick 5 completion gate

- Canonical Spoken-English owner remains `/spoken-english-classes-for-kids-online`.
- SEO title, description and canonical preserved unchanged.
- Exact 90-day GSC leakage baseline frozen in `brick-05-spoken-english-evidence.json`.
- Everyday conversation, fuller responses and conversational fluency strengthened as the primary territory.
- Five-step Spoken-English practice flow added without inventing formal course levels.
- Live correction/retry explained using existing Tiny Steps responsive-teaching principles.
- Class-samples and free-assessment handoffs added.
- Public Speaking, Grammar and Confidence boundaries kept explicit.
- Hyderabad subject-qualified Spoken-English intent points to the canonical owner; broad Hyderabad English remains the local chooser.
- Commercial C6 internal-link map now codifies Hyderabad → Spoken English programme-fit handoff.
- C6 audit now requires that handoff.
- Near-me leakage explicitly held as local discovery; no thin location pages created.
- Observable parent progress signals added as a preview; formal framework deferred to Brick 7.
- Learner-reach claims now come from central semantic facts.
- New regression guard: `src/tests/seo/speakingGrowthBrick5.spec.ts`.
- New commercial URLs: ZERO.
- Metadata/canonical/sitemap changes in Brick 5: ZERO; re-audit added one explicit trailing-slash legacy redirect to the existing canonical owner.
- Production deployment: ZERO.


## 2026-09-19 Brick 5 re-audit notes

Brick 5 was re-audited before Brick 6.

Additional fixes and findings:
- changed `Book a Free Speaking Assessment` to `Book a Free English Assessment` so the CTA matches the cross-programme `/book-demo` assessment owner rather than sounding like Public Speaking;
- changed the Spoken-English hero trust chip from `Free speaking assessment` to `Free English assessment`;
- reframed two FAQ questions that closely echoed the protected diagnostic owners for `child understands English but does not speak` and `child gives one-word answers`;
- added explicit links from the commercial Spoken-English page to both protected diagnostic articles;
- added explicit `/spoken-english-classes-for-kids/` → `/spoken-english-classes-for-kids-online` 301 alongside the existing bare-path 301;
- added matching SPA fallback for the trailing-slash legacy path;
- added both retired Spoken-English URL variants to sitemap-absence smoke protection;
- added central SEO infrastructure assertions for both Spoken-English 301 variants;
- verified the Hyderabad → Spoken-English programme-fit edge remains inside the frozen 14-owner C6 architecture and does not alter the 13 direct-assessment edges;
- confirmed no exact total C6 edge-count assertion is violated;
- confirmed the formal Course-list/schema decision remains a Brick 6 handoff; no artificial Spoken-English levels were added;
- production deployment remains ZERO.

Brick 5 status after re-audit: COMPLETE — RE-AUDITED.


## Brick 6 completion gate

- `/speaking` remains the generic Public Speaking + Communication architecture root.
- Existing internal course IDs `basic-public-speaking` and `advanced-public-speaking` preserved.
- Semantic facts now distinguish compatibility/internal slugs from canonical public course slugs and paths.
- Exactly two published Public Speaking levels retained:
  - Public Speaking Foundations — Ages 4–7 — 36 lessons;
  - Public Speaking Excellence — Ages 7–12 — 36 lessons.
- Foundations and Excellence now have explicit prerequisite/entry signals, skills built, readiness-to-progress, and previous/next architecture.
- Spoken English and Confidence Building remain adjacent specialist owners rather than Public Speaking levels.
- Course detail renderer now supports Speaking-specific level architecture while preserving the existing Phonics stage contract.
- Public Speaking detail pages expose provider/teacher-system and teaching-method evidence, with links to team and class samples.
- Canonical public course names are used in Course schema; Tiny Steps remains the EducationalOrganization provider through the shared schema helper.
- `/speaking` no longer emits an umbrella Course entity; it uses WebPage plus an ordered two-level Public Speaking ItemList and a separate unordered specialist-pathway ItemList.
- Google Course-list enhancement is not targeted because Tiny Steps currently publishes two Public Speaking courses and current guidance requires at least three.
- No third or Intermediate Public Speaking level invented.
- No course-specific VideoObject invented; generic class samples remain linked evidence only.
- Curriculum roadmap, Courses page, parent chooser, RSS/feed, and internal-link registry aligned to the same architecture.
- Generic Speaking fit now routes through `/speaking`; named course pages remain detail owners.
- Initial build matrix: 41/41 passed; final pre-Brick-7 re-audit matrix: 53/53 passed.
- New regression guard: `src/tests/seo/speakingGrowthBrick6.spec.ts`.
- New commercial URLs: ZERO.
- Canonical destination and sitemap URL-set changes in Brick 6: ZERO; re-audit hardened four legacy course alias redirect variants and refreshed Speaking sitemap lastmod values.
- Production deployment: ZERO.


## 2026-09-19 Brick 6 re-audit notes

Brick 6 was fully re-audited before Brick 7.

Additional fixes and findings:
- synchronized latest main `162e9060de3c6164a2301b253f37294cdc1123ac` into the Speaking branch through PR #390; the incoming diff was only three AV5.3 attendance-validation files with no Speaking overlap;
- split the hub schema so Foundations and Excellence are the only ordered Public Speaking levels while Spoken English and Confidence are separate unordered specialist alternatives;
- corrected shared detail-page wording from “stage” to “level” for Speaking while retaining the existing Phonics stage contract;
- added direct bare and trailing-slash 301 coverage for both legacy Basic and Advanced Public Speaking course aliases;
- classified those course aliases as redirects in the central route manifest and as `noindex, follow` canonical aliases in the route SEO registry;
- extended sitemap smoke and central SEO infrastructure tests to protect those aliases;
- verified the route-indexability reporter classifies explicit redirects before applying the generic `/courses/**` dynamic route rule;
- corrected Speaking-course sitemap freshness so `lastmod` reflects course-registry/detail-renderer changes, not only `courses.ts`;
- refreshed both canonical Speaking course sitemap dates and the course sitemap index date to 2026-09-19;
- corrected a contradictory SEO-smoke contract that had retired Public-Speaking/Spoken-English aliases in both “legacy absent” and “required core” sets;
- added Public Speaking Excellence to required canonical core sitemap coverage;
- rechecked current Google Course-list guidance and retained the no-fake-third-course decision;
- final source-level matrix: 53/53 passed;
- current branch behind main: 0;
- no feature-branch CI run attached; full build/Vitest/browser execution remains a final integration gate;
- production merge/deployment remains ZERO.

Brick 6 status after re-audit: COMPLETE — RE-AUDITED.


## Brick 7 completion gate

- One central framework source now defines the Tiny Steps Speaking Progress Framework.
- Framework revision: `2026-09-19-b7-v2`.
- Canonical informational owner: `/speaking-progress-framework`.
- Exactly 10 observable speaking dimensions are defined and kept separate rather than averaged into one score.
- Exactly 4 support-to-independence observation bands are defined:
  - Modelled / supported;
  - Guided attempt;
  - Independent use;
  - Fresh-task transfer.
- Review loop is frozen as baseline → one current target → teach/retry/fade support → fresh-task check → next learning priority.
- Parent progress summary fields are frozen around current target, band, independent evidence, useful support, fresh-task evidence and next priority.
- Every Brick 7 dimension maps to at least one established Speaking & Communication knowledge domain; the existing nine-domain knowledge architecture is preserved.
- Framework guardrails explicitly reject developmental-age, IQ-style, clinical/diagnostic, accent-conformity, extroversion/loudness and one-total-score interpretations.
- The public framework page publishes all dimensions, bands, assessment-use boundaries, parent-summary fields and FAQs.
- `/speaking` remains the high-commercial Public Speaking owner.
- `/resources/speaking` remains the Speaking resource-discovery owner.
- `/speaking-progress-framework` owns only the progress-measurement informational intent.
- Framework handoffs are present from `/speaking`, `/book-demo`, `/parents/tracking-progress` and `/resources/speaking`.
- Internal-link and HTML-sitemap discovery are present.
- Static sitemap contains the framework exactly once.
- Brick 7 changed-page sitemap freshness is protected for `/speaking`, `/book-demo`, `/resources/speaking`, `/speaking-progress-framework` and `/parents/tracking-progress`.
- Existing operational Speaking progress fallback remains `Confidence / Pronunciation / Fluency / Idea expression / Audience engagement`.
- Firestore schema, historical progress records, teacher progress-save workflow and parent dashboard rating/calculation logic are untouched.
- New dedicated regression guard: `src/tests/seo/speakingGrowthBrick7.spec.ts`.
- Initial source-level structural matrix: 77/77 passed; independent re-audit matrix: 132/132 passed; post-main-sync critical matrix: 59/59 passed.
- Branch is 0 commits behind main after re-audit synchronization through PR #392.
- Full executable build/Vitest/browser run is not claimed and remains a final integration requirement.
- Production merge: ZERO.
- Production deployment: ZERO.


## 2026-09-19 Brick 7 re-audit notes

Brick 7 was fully re-audited before Brick 8.

Additional fixes and findings:
- mapped the previously uncovered `discussion-reasoning` knowledge domain into `Idea organisation`, preserving exactly ten framework dimensions while representing all nine established Speaking knowledge domains;
- upgraded the framework from shallow array freezing to immutable dimension/band/review records with frozen nested knowledge-domain ID lists;
- advanced the framework revision to `2026-09-19-b7-v2`;
- removed two unnecessary `@ts-expect-error` suppressions from the regression spec;
- clarified public, Speaking-page and parent-guide wording so the framework does not falsely imply that existing legacy subject-level `speakingMastery` summaries have already been migrated;
- corrected four source-based regression assertions that would otherwise fail despite correct runtime rendering;
- mechanically verified all 21 literal source assertions in the Brick 7 regression spec against their actual source files;
- independent re-audit matrix: **132/132 passed**;
- during the re-audit, main advanced by nine commits to `eeeae461053483f1ede3718e5113eaad34eb3d90`;
- reviewed the incoming seven-file AV6 diff; only `src/app/routes.tsx` overlapped and both route changes were additive;
- synchronized latest main into the Speaking branch through PR #392, merge commit `1915a691d4fa2805360d46a11b35c8e81c2b77bc`;
- verified both AV6 admin attendance-validation routes and the Brick 7 public framework route coexist after the merge;
- reran post-sync critical matrices: **59/59 passed**;
- current branch behind main: **0**;
- no feature-branch CI/workflow run attached; full build/Vitest/browser execution remains a final integration gate;
- production merge/deployment remains ZERO.

Brick 7 status after re-audit: **COMPLETE — RE-AUDITED**.


## Brick 8 completion gate

- Existing Speaking & Communication corpus reused; no duplicate content wave created.
- Five parent-facing knowledge groups added to the existing `/resources/speaking` hub.
- All 15 established SP6 Tier-1 cluster records represented exactly once.
- Those records resolve to 14 unique existing knowledge URLs.
- All 10 Brick 7 Speaking Progress dimensions represented across the five groups.
- New central source: `src/lib/speakingKnowledgeCluster.ts`, revision `2026-09-19-b8-v1`.
- Existing SP6 semantic journey engine remains authoritative for blog-to-blog pathways.
- `/resources/speaking` remains the informational hub.
- `/speaking` remains the high-commercial Public Speaking owner.
- `/spoken-english-classes-for-kids-online` remains the Spoken English commercial owner.
- `/speaking-progress-framework` remains the progress-measurement informational owner.
- New public/canonical URLs in Brick 8: ZERO.
- Sitemap freshness for `/resources/speaking` now tracks the Brick 8 cluster source.
- Dedicated regression guard: `src/tests/seo/speakingGrowthBrick8.spec.ts`.
- Main advanced during the build with AV8 + future-scheduling backend work; synchronized one-way through PR #397.
- PR #397 merge commit: `7a8eeaf83f919acb71b4fffdbd033fbffac34a97`.
- Synchronized main SHA: `d0b46a251f33c0b15015d3b516993a0a0f44cb65`.
- Branch behind main after sync: **0**.
- No Speaking/Brick-8 overlap in the incoming main changes.
- Full executable build/Vitest/browser run is not claimed and remains a final integration requirement.
- Production merge: ZERO.
- Production deployment: ZERO.

Brick 8 status after initial build: **COMPLETE — STRUCTURALLY VERIFIED**.


## 2026-09-19 Brick 8 re-audit notes

Brick 8 was fully re-audited before Brick 9.

Additional fixes and findings:
- advanced the Brick 8 knowledge-cluster revision from `2026-09-19-b8-v1` to `2026-09-19-b8-v2`;
- found that the Speaking hub structured `ItemList` had 23 raw candidate entries but only 18 unique destinations because useful visible parent pathways repeat some resources;
- deduplicated structured-data destinations while preserving visible cross-links;
- added an explicit runtime guard that all nine established Speaking & Communication knowledge domains remain represented;
- added an explicit runtime guard that all fifteen Tier-1 records continue to resolve to exactly fourteen established knowledge URLs;
- added a blog-only runtime boundary for the knowledge corpus, preventing future commercial/programme routes from silently entering Brick 8;
- rechecked all fourteen knowledge destinations for canonical ownership, indexability and blog-sitemap inclusion;
- traced the three R21 dynamic owners through the full `R20 proposedPath → R21 published execution → R21 canonical owner` chain;
- renamed the stale sitemap source map from `brick7LastmodSources` to `speakingGrowthLastmodSources`;
- expanded `speakingGrowthBrick8.spec.ts` to protect nine-domain coverage, canonical uniqueness, indexability, sitemap discovery and structured-data deduplication;
- source-level re-audit matrix: **70/70 passed**;
- protected-surface SHA comparison against the pre-Brick-8 checkpoint: **15/15 unchanged**;
- protected unchanged surfaces include Brick 7 framework/page, `/speaking`, `/book-demo`, parent tracking, canonical ownership, app routes, SP6 semantic engine/architecture, operational progress skills, parent dashboard, teacher progress editor/save backend and Brick 7 regression test;
- Brick 8 re-audit runtime/test delta was limited to four intended files: `speakingKnowledgeCluster.ts`, `SubjectResourcesPage.tsx`, `generate-sitemaps.js`, and `speakingGrowthBrick8.spec.ts`;
- machine-readable evidence: `docs/seo/speaking-growth/brick-08-speaking-knowledge-cluster.json`;
- no production merge/deployment performed;
- full executable Vitest/build/prerender/browser QA is still not claimed and remains mandatory at the final Bricks 1–13 integration gate.

Brick 8 status after re-audit: **COMPLETE — RE-AUDITED**.


## Brick 9 completion gate

- Evidence work reuses the frozen Commercial C8 trust/evidence system; no second trust architecture was created.
- New central source: `src/lib/speakingEvidenceLayer.ts`, revision `2026-09-19-b9-v1`.
- Six bounded evidence categories are defined: observable classroom, programme delivery, progress method, academic ownership, programme architecture and parent feedback.
- Every evidence source states both what it supports and what it does not prove.
- Existing sources remain authoritative: `/class-samples`, `/speaking`, `/speaking-progress-framework`, `/team`, `/curriculum`, and `/testimonials`.
- Brick 7 remains the Speaking progress-evidence method; Commercial C8 remains the trust-governance layer.
- Parent feedback remains first-party individual experience, not universal outcome evidence.
- Generated fallback testimonials, unsupported satisfaction percentages, fabricated reviews and universal guaranteed timelines remain prohibited.
- `/speaking` now contains one compact evidence section titled **What you can verify — and what each source does not prove**.
- Evidence-source structured data is an `ItemList`; no `Review` or `AggregateRating` schema was added.
- New public URLs: ZERO.
- New canonical owners: ZERO.
- `/speaking` remains the high-commercial Public Speaking & Communication owner.
- Sitemap freshness for `/speaking` now tracks `speakingEvidenceLayer.ts`.
- Dedicated regression guard: `src/tests/seo/speakingGrowthBrick9.spec.ts` with 11 test cases.
- Corrected source-level structural matrix: **53/53 passed**.
- Protected upstream/operational SHA checks: **18/18 unchanged**.
- Machine-readable evidence: `docs/seo/speaking-growth/brick-09-evidence-layer.json`.
- Branch was **0 commits behind main** at the initial Brick 9 structural checkpoint.
- Full executable build/Vitest/prerender/browser QA is not claimed and remains a final integration requirement.
- Production merge: ZERO.
- Production deployment: ZERO.

Brick 9 status after initial build: **COMPLETE — STRUCTURALLY VERIFIED**.


## 2026-09-19 Brick 9 re-audit notes

Brick 9 was fully re-audited before Brick 10.

Additional fixes and findings:
- advanced the Brick 9 evidence-layer revision from `2026-09-19-b9-v1` to `2026-09-19-b9-v2`;
- closed a provenance-drift gap by deriving required C8 paths from the evidence records themselves;
- every non-progress evidence record is now runtime-bound to a verified frozen Commercial C8 trust surface;
- the progress-method evidence record is runtime-bound to the Brick 7 Speaking Progress Framework;
- evidence navigation targets must remain on their canonical source or a fragment of that source;
- canonical evidence source paths must remain unique;
- evidence structured data now uses canonical `sourcePath` values while visible links can still use section fragments;
- all six canonical evidence sources were rechecked as present in the SEO registry, self-canonical, indexable and included in `sitemap-static.xml`;
- added an adjacent no-guarantee boundary directly below Speaking parent testimonials, rather than relying only on the earlier evidence-layer disclaimer;
- removed a strict-TypeScript regression-test risk by auditing the JS SEO registry as source text instead of dynamically indexing it from TypeScript;
- source-level re-audit matrix: **82/82 passed**;
- protected upstream/operational SHA checks: **18/18 unchanged**;
- re-audit implementation delta before documentation: exactly three files — `speakingEvidenceLayer.ts`, `speaking.tsx`, and `speakingGrowthBrick9.spec.ts`;
- no new public URL, canonical owner, review schema or aggregate-rating schema was introduced;
- machine-readable evidence updated at `docs/seo/speaking-growth/brick-09-evidence-layer.json`;
- no production merge/deployment performed;
- full executable Vitest/build/prerender/browser QA is still not claimed and remains mandatory at the final Bricks 1–13 integration gate.

Brick 9 status after re-audit: **COMPLETE — RE-AUDITED**.
