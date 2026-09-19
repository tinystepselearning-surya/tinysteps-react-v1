# Tiny Steps Speaking Search Growth — Brick Status

Project branch: feature/speaking-seo-geo-growth  
Base branch: main  
Brick 1 original base commit: e2946a436f1c9dd9694b034ebfd166947c01700a  
Latest main synchronized after Brick 3: e42d1cd07ba9b919c0948261b6705f91b80b27c5  
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
| 06 | Programme architecture | PENDING | NO |
| 07 | Tiny Steps Speaking Progress Framework | PENDING | NO |
| 08 | Speaking knowledge cluster | PENDING | NO |
| 09 | Evidence layer | PENDING | NO |
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
