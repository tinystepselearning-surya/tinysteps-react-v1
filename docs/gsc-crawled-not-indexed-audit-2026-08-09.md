# Google Search Console — Crawled, Currently Not Indexed Audit

**Audit snapshot:** 2026-08-09  
**Branch:** `seo/crawled-not-indexed-audit-2026-08-09`  
**Scope:** all 52 example URLs shown in Search Console under **Crawled – currently not indexed**.

## Executive decision

The 52 URLs should **not** all be forced into Google's index. They represent four different URL types:

- **23 canonical index targets** — real pages we want Google to index and rank.
- **11 permanent/normalization redirects** — legacy or duplicate URLs whose signals must consolidate into canonical pages.
- **12 noindex archive posts** — older weekly campaign/support articles intentionally kept accessible without competing with stronger evergreen pages.
- **6 machine-readable resources** — sitemap/RSS XML files that should remain crawlable resources, not search-result landing pages.

The repository now has a machine-readable manifest plus `scripts/audit-gsc-crawled-not-indexed.mjs` so these 52 decisions can be regression-tested instead of handled manually.

## Important interpretation

A Search Console row under “Crawled – currently not indexed” is not automatically a content failure. Several examples in this set are XML feeds, old aliases, trailing-slash duplicates, or legacy course URLs. The right remediation is canonical consolidation or intentional noindex, not adding more copy to those URLs.

Many Search Console “last crawled” dates in the supplied screenshots predate the repository's July/August SEO fixes. For canonical pages that are already substantial today, the priority is to preserve clean canonical/sitemap/indexability signals, deploy, and then let Google recrawl the newer version rather than rewriting pages blindly.

## 52-URL decision table

| # | URL | Decision | Canonical / rationale |
|---:|---|---|---|
| 1 | `/sitemap-blog.xml` | RESOURCE | Keep as sitemap resource; not a search landing page. |
| 2 | `/sitemap.xml` | RESOURCE | Keep as sitemap index; not a search landing page. |
| 3 | `/sitemap-static.xml` | RESOURCE | Keep as sitemap resource; not a search landing page. |
| 4 | `/blog/june-school-reopening-english-readiness-plan` | INDEX | Keep. Substantial 14-day parent readiness plan with multiple skill sections and FAQ. |
| 5 | `/sitemap-courses.xml` | RESOURCE | Keep as sitemap resource; not a search landing page. |
| 6 | `/faq` | INDEX | Keep. Distinct parent-question hub and strong internal navigation surface. |
| 7 | `/blog/week-27-prevent-summer-slide-reading` | NOINDEX ARCHIVE | Keep accessible; weekly/seasonal article should not compete as a primary canonical acquisition page. |
| 8 | `/courses/basic-public-speaking` | REDIRECT | 301 → `/courses/public-speaking-foundations`. |
| 9 | `/blog/week-4-phonics-long-vowels` | NOINDEX ARCHIVE | Strong overlap with evergreen `/blog/long-vowel-sounds-for-kids`; evergreen page is canonical acquisition target. |
| 10 | `/parents/choosing-course` | INDEX | Keep. High-intent decision ladder, comparisons, FAQ, schema, and internal links. |
| 11 | `/parents/speech-confidence` | INDEX | Keep and strengthen in this branch. Unique parent intent around shy/hesitant speaking. |
| 12 | `/blog/week-18-speaking-video-feedback` | NOINDEX ARCHIVE | Keep accessible; supporting weekly content only. |
| 13 | `/blog/online-phonics-classes-vs-school` | INDEX | Keep. Clear comparison intent with practical examples and supporting links. |
| 14 | `/parents/common-mistakes` | INDEX | Keep. Distinct practical parent-help page with replacements, warning signs, and reset plan. |
| 15 | `/blog/long-vowel-sounds-for-kids` | INDEX | Keep as the evergreen long-vowel canonical. |
| 16 | `/blog/week-10-grammar-subject-verb` | NOINDEX ARCHIVE | Keep accessible; weekly framing is weaker than evergreen grammar pages. |
| 17 | `/careers` | INDEX | Keep. Real role descriptions, requirements, hiring process, FAQs, and application routes. |
| 18 | `/blog/r-controlled-vowels-explained` | INDEX | Keep. Evergreen phonics rule guide with pattern groups, examples, FAQ, and related reads. |
| 19 | `/blog/cvc-words-explained-for-parents` | INDEX | Keep. Evergreen CVC decoding guide with home routine, examples, FAQ, and cluster links. |
| 20 | `/blog/online-english-classes-for-kids-india` | INDEX | Keep. India-specific search intent supporting course discovery. |
| 21 | `/book-demo` | INDEX | Keep. Lead-critical assessment page with Service/FAQ structured data, clear outcomes, and form. |
| 22 | `/parents/reading-at-home` | INDEX | Keep. Substantial stage plan, troubleshooting, scripts, progress checks, and HowTo data. |
| 23 | `/blog/rss.xml` | RESOURCE | Keep as RSS resource with `X-Robots-Tag: noindex`. |
| 24 | `/blog/how-phonics-classes-help-kids-read` | INDEX | Keep. Evergreen reading/phonics search intent and commercial bridge. |
| 25 | `/writing-classes-for-kids` | INDEX | Keep and strengthen in this branch. Distinct writing intent; should not be a thin grammar duplicate. |
| 26 | `/phonics-games-for-preschoolers` | INDEX | Keep. Seven games + daily routine + FAQ + HowTo structured data. |
| 27 | `/rss.xml` | RESOURCE | Keep as RSS resource with `X-Robots-Tag: noindex`. |
| 28 | `/blog/child-reads-in-class-but-forgets-at-home` | INDEX | Keep. Specific parent pain-point intent with useful diagnostic/support angle. |
| 29 | `/blog/week-22-phonics-diagnostics` | NOINDEX ARCHIVE | Keep accessible; evergreen parent/phonics pages should own diagnostic acquisition intent. |
| 30 | `/blog/digraphs-and-tricky-words` | INDEX | Keep. Evergreen phonics topic with examples, FAQ, and related reading. |
| 31 | `/courses/advanced-grammar` | REDIRECT | 301 → `/courses/grammar-mastery`. |
| 32 | `/blog/week-12-speaking-confidence-seeds` | INDEX | Keep. This weekly guide maps to durable speaking-confidence intent and is intentionally allow-listed. |
| 33 | `/blog/week-16-phonics-summer-plan` | NOINDEX ARCHIVE | Keep accessible; seasonal weekly page is not a primary canonical. |
| 34 | `/parents/getting-started` | INDEX | Keep. Substantial onboarding, assessment, preparation, first-week and HowTo content. |
| 35 | `/blog/week-8-grammar-tenses` | NOINDEX ARCHIVE | Keep accessible; weekly-calendar framing is weaker than evergreen grammar resources. |
| 36 | `/blog/week-21-speaking-competition-prep` | NOINDEX ARCHIVE | Keep accessible; narrow campaign intent. |
| 37 | `/blog/week-19-phonics-multisyllabic` | NOINDEX ARCHIVE | Keep accessible; supporting article, not a primary canonical acquisition page. |
| 38 | `/blog/week-9-grammar-conjunctions` | NOINDEX ARCHIVE | Keep accessible; weekly-calendar framing is weaker than evergreen grammar resources. |
| 39 | `/main/courses/phonics/` | REDIRECT | 301 → `/courses/phonics-foundation`. |
| 40 | `/blog/week-24-speaking-family-showcase` | NOINDEX ARCHIVE | Keep accessible; event-like weekly content. |
| 41 | `/blog/week-15-speaking-debate-starters` | NOINDEX ARCHIVE | Keep accessible; weekly campaign content. |
| 42 | `/courses/phonics-advanced` | INDEX | Keep. Canonical lead page with specific metadata, outcomes, curriculum, testimonials, FAQ, and Course schema. |
| 43 | `/courses/` | REDIRECT/NORMALIZE | Normalize trailing slash → `/courses` via Firebase `trailingSlash:false`. |
| 44 | `/parents/tracking-progress` | INDEX | Keep and strengthen in this branch. Unique parent intent around measuring real progress. |
| 45 | `/blog/week1` | REDIRECT | 301 → `/blog/week-1-phonics-satpin-launch`. |
| 46 | `/courses/grammar-mastery` | INDEX | Keep. Canonical lead page with specific metadata, outcomes, curriculum, testimonials, FAQ, and Course schema. |
| 47 | `/courses/phonics` | REDIRECT | 301 → `/courses/phonics-foundation`. |
| 48 | `/blog/` | REDIRECT/NORMALIZE | Normalize trailing slash → `/blog` via Firebase `trailingSlash:false`. |
| 49 | `/main/book-demo` | REDIRECT | 301 → `/book-demo`. |
| 50 | `/privacy` | REDIRECT | 301 → `/privacy-policy`. |
| 51 | `/terms` | REDIRECT | 301 → `/terms-and-conditions`. |
| 52 | `/resources/` | REDIRECT | 301 → `/blog`. |

## Canonical pages: content-quality audit

### Strong now — preserve and recrawl

These pages already have enough differentiated information in the current repository. More words are not the immediate fix; clean delivery, prerendered HTML, self-canonical metadata, internal links and recrawl are more important.

- `/parents/choosing-course` — assessment-first decision ladder, course comparison, common confusion scenarios, FAQ and structured data.
- `/parents/reading-at-home` — staged reading plan, daily routine, troubleshooting, scripts, progress checklist and HowTo schema.
- `/parents/getting-started` — four-step start, assessment explanation, preparation checklist, first-week plan and HowTo schema.
- `/book-demo` — explicit free assessment proposition, skill checks, outcomes, FAQ and Service structured data.
- `/careers` — three role families, responsibilities, requirements, hiring process, FAQ and two application paths.
- `/phonics-games-for-preschoolers` — seven practical games, 10-minute routine, common mistakes, FAQ, HowTo and breadcrumb markup.
- `/courses/phonics-advanced` and `/courses/grammar-mastery` — canonical course-specific metadata plus overview, outcomes, curriculum, testimonials, FAQs, internal links and Course schema.
- Evergreen phonics blog pages in this set — built through the richer phonics parent-guide template with quick answer, home plan, class checklist, mistakes, examples, support guidance, FAQ and related reading.
- `/blog/june-school-reopening-english-readiness-plan` — substantial multi-skill 14-day plan; seasonal but reusable for annual June reopening intent.
- `/blog/online-english-classes-for-kids-india` and `/blog/child-reads-in-class-but-forgets-at-home` — distinct search intents, not aliases.
- `/blog/week-12-speaking-confidence-seeds` — intentionally retained as one of the small number of weekly posts with durable search value.
- `/blog` — substantial topic hub and internal discovery surface.

### Strengthened in this branch

- `/parents/speech-confidence` — expand from a short checklist into a complete parent guide with observable confidence markers, low-pressure routines, troubleshooting, scripts, FAQ, breadcrumb and FAQ structured data.
- `/parents/tracking-progress` — expand from a short note into a practical measurement guide covering baseline, observable skill evidence, milestone review, parent tracker, questions to ask, troubleshooting, FAQ and structured data.
- `/writing-classes-for-kids` — expand from a short commercial page into a differentiated writing-support landing page with skill stages, sample transformations, progress evidence, parent checklist, FAQ and structured data.

## Redirect and duplicate policy

Server-side permanent redirects are already present for the legacy course, `/main`, legal, resource and old blog aliases in this 52-URL set. The trailing-slash duplicates are normalized because Firebase Hosting is configured with `trailingSlash: false`.

Do **not** add more content to these aliases. Their job is to redirect and consolidate signals.

## Weekly archive policy

The repository intentionally keeps only a small set of weekly posts indexable. In this Search Console sample, `/blog/week-12-speaking-confidence-seeds` is retained. The other weekly URLs listed as NOINDEX ARCHIVE remain accessible for users and historical links but are excluded from sitemap acquisition and blocked from indexing by `blogIndexingPolicy.js`.

This avoids making multiple weak calendar-style articles compete with stronger evergreen pages on the same topics.

## XML resources

`/sitemap.xml`, `/sitemap-static.xml`, `/sitemap-blog.xml`, and `/sitemap-courses.xml` are discovery resources. Search-result indexing of those XML documents is not a success criterion.

`/rss.xml` and `/blog/rss.xml` are also machine-readable feed resources. They intentionally carry an `X-Robots-Tag: noindex` header while staying available to feed readers and crawlers.

## Regression guard

Run:

```bash
node scripts/audit-gsc-crawled-not-indexed.mjs
```

The audit fails when:

- the manifest no longer contains exactly 52 URLs;
- an intended canonical index target disappears from all canonical sitemaps;
- a legacy URL loses its permanent redirect;
- a weekly archive URL becomes sitemap-eligible or loses its noindex policy;
- an RSS feed loses its `X-Robots-Tag: noindex` header;
- Firebase trailing-slash canonicalization changes.

## Post-deploy Search Console sequence

After this branch is reviewed, merged and deployed:

1. Confirm the canonical keep pages return HTTP 200 and their rendered HTML contains the expected title, description, self-canonical and visible body content.
2. Confirm redirect URLs return one clean permanent redirect to the intended canonical URL.
3. Submit/refresh the sitemap index in Search Console only if needed; do not attempt to force XML sitemap files themselves into the index.
4. Use URL Inspection on the highest-value canonical pages first: `/book-demo`, `/courses/phonics-advanced`, `/courses/grammar-mastery`, `/parents/choosing-course`, `/writing-classes-for-kids`, and the evergreen phonics pages.
5. Request indexing for the canonical page, not its old alias.
6. Recheck the Crawled – currently not indexed cohort after Google has recrawled the deployed versions. Expect old redirect/noindex/resource examples to remain non-index targets by design.

## Success criteria

The goal is **not “52/52 indexed.”** The goal is:

- 23/23 canonical targets technically indexable, substantial, internally linked, and sitemap-visible;
- 11/11 duplicate/legacy URLs consolidating correctly;
- 12/12 weak weekly archives prevented from competing with canonicals;
- 6/6 XML resources functioning as machine-readable resources;
- Search Console increasingly reporting the canonical pages in Indexed while legacy/resource URLs resolve under the correct non-index reasons.
