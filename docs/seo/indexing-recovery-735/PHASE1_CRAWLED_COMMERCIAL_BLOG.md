# Issue #735 — Phase 1: crawled/not-indexed commercial + parent Phonics priority review
**Started:** 18 October 2026. **Source:** `MASTER_58_URL_RECONCILIATION.md` on `main`; four entries originally marked "Crawled – currently not indexed" in owner GSC export. **Status:** investigation underway, *no indexing status resolution asserted*.

## Executive conclusion
All four pages have substantial readable public content through independent text retrieval, distinct search intent, and their intended URL in the checked-in correct sitemap. Source public routing is present; `robots.txt` allows these public paths, and `/courses` source declares self-canonical. Their **latest Google Index** (not Live Test) classifications are **still unverified**; GSC exclusion examples may be stale compared with performance and fresh production. Three of the four had recorded Search Analytics impressions during Sep 15–Oct 17. Do **not** rewrite or redirect traffic-bearing pages merely to clean GSC's historical chart.

**Important gap:** #739's React prerender-preservation mechanism is deliberately restricted to `/resources/(phonics|grammar|vocabulary)`. It **does not protect** `/courses` or `/blog/*` against the analogous failed-lazy-import/error-fallback event. This is a potential failure mode, **not a demonstrated live GSC Soft 404 on these four pages**. Extensionless resource cache safeguard #738 also does not apply here; read-only CI probe records actual four-page headers before any caching proposal.

## Four-page evidence ledger

| Master ID | Canonical target | Owner GSC historical crawl | Distinct intent/content observed in public text reader | Search Analytics (Sep 15–Oct 17) | Current Google Index view | Priority next evidence |
|---|---|---|---|---|---|---|
| C01 | `/courses` | 2026-10-13 | Commercial overview comparing Phonics, Grammar, Public Speaking with Reading within Phonics-to-reading journey; assessment/demo CTA and programme levels; do not confuse with specific /phonics or /grammar programme buyers | **2,286 impressions / 12 clicks** | **UNKNOWN** | Owner Google Index screenshot + Live Test smartphone screenshot if excluded; confirm no error fallback |
| C02 | `/blog/sight-words-or-phonics-first` | 2026-10-13 | Word-recognition vs high-frequency/tricky-word terminology, decode-first guidance and parent examples; distinct from blending difficulty | **40 impressions / 0 clicks** | **UNKNOWN** | Owner Google Index + selected canonical; Live Test if excluded |
| C03 | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | 2026-10-13 | Specific decoding/blending transfer difficulty, staged observation, appropriate phonics handoff; not synonymous with sight-word memorisation | **1,777 impressions / 19 clicks** | **UNKNOWN** | Owner Google Index + live rendering; **protect content and URL** |
| C04 | `/blog/online-phonics-classes-vs-school` | 2026-10-11 | Fair comparison based on specific learner needs and actual instructional support, not blanket online superiority; reviewed/improved in #736 | No exact page-level rows in queried period (not proof of unindexed state) | **UNKNOWN** | Owner Google Index + live test; inspect Google-selected canonical / rendering if excluded |

All four direct public text reads succeeded 18 Oct. External crawler text extraction does not establish HTTP headers, Google indexing selection, JS network reliability, or a working lead submission. Do not submit any form during audit.

## Source architecture checks
- `src/app/routes.tsx`: `/courses` lazy `CoursesPage`; `/blog/:slug` lazy `BlogPostPage`; shared `PublicRouteErrorElement` on public Layout.
- `src/lib/routeSeoRegistry.js`: `/courses` canonical `/courses`; `src/pages/CoursesPage.tsx` uses `applySeo`, programme/course schemas and substantive H1.
- `src/pages/BlogPostPage.tsx`: articles normally self-canonical; blog indexing policy permits non-legacy source article slugs. Unknown slug produces noindex; verify generated artefacts rather than assuming metadata is correct on deployed origin.
- `public/sitemap-static.xml` includes exactly the canonical `/courses` route; `public/sitemap-blog.xml` includes each of the three specified blog canonical URLs. These were verified in checked-in source; generated build checks run in the P1 PR.
- `public/robots.txt` explicitly allows general public routes; no /blog or /courses disallow.
- React lazy chunk loading has previously failed intermittently in Google's renderer on some **other** resource pages. Preserve the distinction between confirmed incident on resources vs unproven risk here.
- CI-only P1 build guard checks each of the four generated files: exact URL in correct sitemap, one self-canonical, no noindex, meaningful main content, title, H1, description and navigation. Separate CI origin probe gathers 200/content type/cache/HTML snapshot for ordinary Chrome and Googlebot-*user-agent simulation*. Neither is real Google URL Inspection.

## Action and release gates
1. **Baseline code/test:** run current draft audit PR CI and resolve any proof gap without removing failing pages or lowering coverage. P1 PR has no changes to production-facing site code. Record actual probe results.
2. **Owner Google Index evidence, priority order:** C01 `/courses`, C03 letter-sounds guide, C02 sight-words guide, C04 online-vs-school guide. Capture the current indexed verdict, Google-selected canonical, crawl reason and last crawl. Historical exclusion examples are not current verdicts.
3. **If already indexed:** mark indexed with timestamp and leave content/canonical unchanged. If excluded yet live eligible, classify Google selection/duplicate/crawl report and check whether a prior indexing request exists; do not repeatedly request.
4. **If LIVE TEST fails:** capture **View Tested Page → Screenshot → More info** including failed resources/JS console and HTTP response. Only then propose a scoped runtime or delivery correction for /courses and /blog routes with production-style mobile failure injection and admin/real-404 safety.
5. **If Google crawled valid content but declined indexing:** independently assess intent uniqueness, accuracy/credibility, internal links and canonical selection. No content inflation or bulk redirects. Preserve proven parent query URLs.
6. **Post-release / Google monitoring:** record owner GSC outcome for each path in the master tracker and issue #735. A healthy CI cannot guarantee indexing.

## Stop conditions
No unverified indexing claim. Do not merge a website change automatically. Do not assume no Search Analytics rows means deindexed. No editorial changes solely to manufacture freshness. Keep Phase 2 separate until Phase 1 is classified.
