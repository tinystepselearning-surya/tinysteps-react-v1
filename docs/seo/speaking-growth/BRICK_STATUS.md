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
| 02 | Search intent & keyword ownership map | PENDING | NO |
| 03 | Cannibalization & technical SEO cleanup | PENDING | NO |
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
