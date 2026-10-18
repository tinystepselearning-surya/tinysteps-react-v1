# Issue #735 — Phase 1: crawled/not-indexed commercial + parent Phonics priority review
**Started:** 18 October 2026. **Source:** `MASTER_58_URL_RECONCILIATION.md` on `main`; four entries originally marked "Crawled – currently not indexed" in owner GSC export. **Status:** investigation underway, *no indexing status resolution asserted*.

## Executive conclusion
All four pages have substantial readable public content through independent text retrieval, distinct search intent, and their intended URL in the checked-in correct sitemap. Source public routing is present; `robots.txt` allows these public paths, and `/courses` source declares self-canonical. The owner has now confirmed **`/courses` is indexed**; the letter-sounds guide is also now owner-confirmed indexed; the final blog page (C04, online-vs-school) still has an unverified current Google Index classification; GSC exclusion examples may be stale compared with performance and fresh production. Three of the four had recorded Search Analytics impressions during Sep 15–Oct 17. Do **not** rewrite or redirect traffic-bearing pages merely to clean GSC's historical chart.

**Important gap:** #739's React prerender-preservation mechanism is deliberately restricted to `/resources/(phonics|grammar|vocabulary)`. It **does not protect** `/courses` or `/blog/*` against the analogous failed-lazy-import/error-fallback event. This is a potential failure mode, **not a demonstrated live GSC Soft 404 on these four pages**. Extensionless resource cache safeguard #738 also does not apply here; read-only CI probe records actual four-page headers before any caching proposal.

## Four-page evidence ledger

| Master ID | Canonical target | Owner GSC historical crawl | Distinct intent/content observed in public text reader | Search Analytics (Sep 15–Oct 17) | Current Google Index view | Priority next evidence |
|---|---|---|---|---|---|---|
| C01 | `/courses` | 2026-10-13 | Commercial overview comparing Phonics, Grammar, Public Speaking with Reading within Phonics-to-reading journey; assessment/demo CTA and programme levels; do not confuse with specific /phonics or /grammar programme buyers | **2,286 impressions / 12 clicks** | **Indexed — owner-reported, Oct 18 (no screenshot provided in this message)** | Preserve canonical and course content; monitor index stability and search performance; no indexing request |
| C02 | `/blog/sight-words-or-phonics-first` | 2026-10-13 | Word-recognition vs high-frequency/tricky-word terminology, decode-first guidance and parent examples; distinct from blending difficulty | **40 impressions / 0 clicks** | **Indexed — owner-reported Oct 18, 2026; screenshot not supplied in this turn** | Preserve article/canonical; monitor, no indexing request |
| C03 | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | 2026-10-13 | Specific decoding/blending transfer difficulty, staged observation, appropriate phonics handoff; not synonymous with sight-word memorisation | **1,777 impressions / 19 clicks** | **Indexed — owner-reported Oct 18 (no screenshot supplied in this message)** | Protect original article/canonical and monitor performance; no indexing request |
| C04 | `/blog/online-phonics-classes-vs-school` | 2026-10-11 | Fair comparison based on specific learner needs and actual instructional support, not blanket online superiority; reviewed/improved in #736 | No exact page-level rows in queried period (not proof of unindexed state) | **Not indexed — owner GSC Google Index screenshot, Oct 18**; live tests 4:41–4:42 Soft 404 and 4:43 eligible | Failed BlogPostPage lazy chunk in red test; target a guarded prerender recovery and no-cache for blog HTML; verify after release; index inclusion still unconfirmed |

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
2. **Owner Google Index evidence, remaining priority:** C04 online-vs-school guide. C01 `/courses`, C03 letter-sounds guide, and C02 sight-words guide were all reported indexed by the owner on Oct 18; retain the separate screenshot-versus-owner-report evidence distinction.  Capture the current indexed verdict, Google-selected canonical, crawl reason and last crawl. Historical exclusion examples are not current verdicts.
3. **If already indexed:** mark indexed with timestamp and leave content/canonical unchanged. If excluded yet live eligible, classify Google selection/duplicate/crawl report and check whether a prior indexing request exists; do not repeatedly request.
4. **If LIVE TEST fails:** capture **View Tested Page → Screenshot → More info** including failed resources/JS console and HTTP response. Only then propose a scoped runtime or delivery correction for /courses and /blog routes with production-style mobile failure injection and admin/real-404 safety.
5. **If Google crawled valid content but declined indexing:** independently assess intent uniqueness, accuracy/credibility, internal links and canonical selection. No content inflation or bulk redirects. Preserve proven parent query URLs.
6. **Post-release / Google monitoring:** record owner GSC outcome for each path in the master tracker and issue #735. A healthy CI cannot guarantee indexing.

## Stop conditions
No unverified indexing claim. Do not merge a website change automatically. Do not assume no Search Analytics rows means deindexed. No editorial changes solely to manufacture freshness. Keep Phase 2 separate until Phase 1 is classified.


## Phase 1 no-deploy CI outcome — 18 October 2026

**Run:** https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39120404914 — final head `270d0804e171710b27b7ef2dc0a71cda4fe2100b` (before this reporting-only documentation update). Full CI **SUCCESS**, including TypeScript, production-style prerendered build, 23-resource regression suite and newly added four-page P1 guard.

**Generated production HTML (4/4 passed):**
- `/courses`: unique self-canonical, sitemap-static.xml inclusion; **7,335 characters** of main text.
- `/blog/why-child-knows-letter-sounds-but-cannot-read-words`: unique self-canonical, sitemap-blog.xml; **20,767 characters** of main text.
- `/blog/sight-words-or-phonics-first`: unique self-canonical, sitemap-blog.xml; **17,802 characters** of main text.
- `/blog/online-phonics-classes-vs-school`: unique self-canonical, sitemap-blog.xml; **17,985 characters** of main text.
- All four also passed index-permitting robots metadata, title, description, H1, no generic page-error text and programme-path navigation checks. These are **build artefact checks**.

**Read-only production HTTP GET observations at 2026-10-18 10:47:46 UTC (from GitHub runner):**
- Ordinary Chrome and **simulated Googlebot smartphone User-Agent** each fetched all four URLs: **8/8 HTTP 200**, `text/html; charset=utf-8`, unredirected self-canonical, expected H1, no `X-Robots-Tag` and no generic `ErrorFallback` text in returned HTML.
- All eight returned `Cache-Control: max-age=3600` despite the checked-in `**/*.html` no-cache declaration. Firebase cleaner requested URLs evidently do not use that path-matched HTML rule for these cases; the more-specific public-resource rule `/resources{,/**}` does not cover these `/courses` and `/blog` URLs.
- **Risk hypothesis:** stale clean-URL HTML referencing previous-build JS chunks could contribute to intermittent module-loading errors during future deployments, as historically seen on a different resource cohort. It is **not a confirmed root cause** for these four URLs, and generic HTTP GET probes do not verify Googlebot's JavaScript rendering or actual Google Index selection.
- The read-only probe ran successfully and published no content.

**Result:** P1 production HTML/sitemap/canonical/source indexability infrastructure appears sound. Current Google Index verdicts for C01 and C03 are **owner-reported indexed**; C02 and C04 remain **unknown**. Next indispensable evidence: owner Google Index (not Live Test) for C02 and C04; if current index exclusion persists, Live Test screenshot and More Info. Scope any future code PR to a reproduced fault; do not rewrite or redirect pages based only on this historical report.

## Indexing update — 18 October 2026

The owner reports that `https://tinystepslearning.com/courses` **is indexed in Google**. Record this as **owner-confirmed indexed**, not a separately provided Google Index screenshot. This newer observation supersedes its historical `Crawled – currently not indexed` example (last crawl Oct 13). No website change, fresh indexing request, redirect or canonical modification is warranted for `/courses`. Remaining P1 work is obtaining the current Google Index decision for the one still-unverified blog URL (C04); do not infer their statuses from impressions alone.

## Indexing update — second page confirmed, 18 October 2026

Owner separately reports that `https://tinystepslearning.com/blog/why-child-knows-letter-sounds-but-cannot-read-words` **is indexed in Google**. This is a user-reported status, not an independently captured indexed-view screenshot in this turn. Preserve its URL/canonical and high-performing decoding explanation (historical Sep 15–Oct 17 Search Analytics **1,777 impressions / 19 clicks**); no reindexing request, rewrite, or new technical fix is justified. **Historical note at time of update: Phase 1 then had 2/4 owner-reported indexed; the later C02 confirmation appears below.**

## Third owner indexing confirmation — 18 October 2026

The owner confirms `https://tinystepslearning.com/blog/sight-words-or-phonics-first` **is indexed by Google**. Record as **owner-reported indexed**, without inferring a screenshot or Google crawl date; this newer report supersedes the historical `Crawled – currently not indexed` example for action prioritization. The page had 40 Search Analytics impressions, zero clicks, Sep 15–Oct 17, but performance was not used to infer status. No mass rewrite, redirect or repeated indexing request warranted. **Phase 1: 3/4 owner-reported indexed, with only C04 `/blog/online-phonics-classes-vs-school` requiring a current Google Index verdict.**

## C04 Google live diagnosis — 18 October 2026, 4:41–4:44 PM IST

**Owner screenshots and connected GSC inspection diagnostics**, for `/blog/online-phonics-classes-vs-school`:
- **GOOGLE INDEX**: "URL is not on Google"; "Page is not indexed: Crawled – currently not indexed"; last Googlebot smartphone crawl **2026-10-11 11:10:12 AM**; sitemap-blog.xml and sitemap.xml discovered. This is the historical indexed result, not just Live Test.
- **Google Live Test at ~4:41–4:42 PM**: "URL is not available to Google", "**Soft 404**"; crawl allowed, fetch successful, indexing allowed, user-declared canonical self. Tested-page More Info: **HTTP 200**, **5/37 resources couldn't load**, `Cache-Control: max-age=3600`, CDN HIT. Console exception: `TypeError: Failed to fetch dynamically imported module: https://tinystepslearning.com/assets/BlogPostPage-Dj5Zpwig.js`, caught by React Router; another failed lazy NotFoundPage module appeared in a later failed test.
- **Repeated Google Live Test at ~4:43 PM**: "**URL is available to Google**", "**Page can be indexed**", **1 valid breadcrumb**. More Info: HTTP 200, **1/7 page resources failed** (including a main index JS in the diagnostic), **no JS console errors**; still `Cache-Control: max-age=3600`, CDN HIT. Green Live Test does **not** mean Google actually indexed the URL or that every crawl will render properly.
- **Diagnosis:** intermittent JavaScript chunk-loading and React route-error cascade is **verified**, rather than inferred solely from a GSC exclusion category. The presence of one-hour caching on clean /blog HTML is also **verified**; it raises risk of stale HTML/chunk mismatch but has not been causally proven to trigger every failure.
- **Action:** a separate narrow implementation PR should preserve **only substantive, self-canonical, index-permitted prerendered blog articles** upon matching lazy import errors, preventing ordinary 404/noindex/wrong-page rescue; ensure /blog clean HTML revalidates; test on actual production-style mobile browser with forced BlogPostPage + NotFoundPage module failure. Keep Phase 1 audit PR #742 separate and unmerged until review.
- **Status:** Phase 1 evidence classified for all four URLs: C01/C02/C03 owner-reported indexed; **C04 NOT indexed (owner screenshot) with intermittently failing live renderer**. No site fix deployed at the time of this note, and no confirmed Google indexing for C04.
