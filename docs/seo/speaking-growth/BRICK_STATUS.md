# Tiny Steps Speaking Search Growth — Brick Status

Project branch: feature/speaking-seo-geo-growth  
Base branch: main  
Brick 1 original base commit: e2946a436f1c9dd9694b034ebfd166947c01700a  
Latest main synchronized before Brick 2: 3b11fee88ff21e928d2ed8af555afcb64695c815  
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
| 03 | Cannibalization & technical SEO cleanup | COMPLETE — STRUCTURALLY VERIFIED | NO |
| 04 | Flagship /speaking money page | PENDING | NO |
| 05 | Spoken English territory | PENDING | NO |
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
- Explicit Hyderabad Spoken-English intent preserved on `/online-english-classes-hyderabad` without granting it global ownership.
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
