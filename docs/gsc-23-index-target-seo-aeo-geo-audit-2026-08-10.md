# Tiny Steps — 23 GSC Index Targets: SEO / AEO / GEO Audit

Date: 2026-08-10  
Branch: `seo/crawled-not-indexed-audit-2026-08-09`  
Source snapshot: 52 URLs shown in Google Search Console as **Crawled — currently not indexed**.

## Remediation boundary

This branch intentionally separates the 52 URLs into four groups:

- **23 index targets** — genuine canonical pages we want Google to evaluate for indexing.
- **11 redirects** — legacy/duplicate aliases; preserve the 301 where useful, exclude the alias from canonical sitemaps and never submit the alias for indexing.
- **12 noindex weekly archives** — accessible as archive/support content but excluded from canonical sitemaps and not submitted.
- **6 XML/RSS resources** — discovery/feed infrastructure, not search-result landing pages; not submitted.

The 23-item list is only the remediation submission list for this GSC issue. It is **not** the complete Tiny Steps site index. Other healthy canonical pages remain in the normal site sitemaps.

## SEO / AEO / GEO implementation standard

### SEO
- one preferred canonical URL;
- no accidental `noindex` on target pages;
- correct canonical sitemap inclusion;
- unique search intent, title, meta description and H1;
- semantic headings and useful internal links;
- structured data only when it matches visible page content;
- no duplicate/legacy URL competing with the canonical page.

### AEO
- answer-first summary where the intent is a question or decision;
- scannable comparisons, examples, checklists, troubleshooting and FAQs;
- direct language that still preserves context;
- questions answered on-page rather than hidden only in metadata or schema.

### GEO / AI discoverability
- clear entity and audience context;
- original, practical explanations rather than thin paraphrases;
- author/provider context where the site already supports it;
- observable progress signals and concrete examples;
- conservative claims: no fabricated evidence, guaranteed outcomes, unsupported percentages, universal lesson counts or pseudo-clinical statements;
- strong internal topic relationships so each search intent has one clear canonical answer.

No special “AI ranking” markup is being invented. The work is built on strong crawl/index controls, useful content, clear answers, structured data that reflects visible content, and coherent internal linking.

## One-by-one audit of the 23 genuine pages

| # | Canonical target | Primary user intent | Work / decision | Content status |
|---|---|---|---|---|
| 1 | `/blog/june-school-reopening-english-readiness-plan` | Prepare a child’s English for school reopening | **KEEP.** Substantial answer-first parent guide with a 14-day plan, readiness checklist, practical actions, FAQs and internal next steps. Preserve as the durable school-readiness answer rather than creating another overlapping page. | Content-ready; render/claim validation required |
| 2 | `/faq` | Get direct answers before choosing English support | **MAJOR REBUILD.** Replaced dated/noisy FAQ inventory with 24 durable parent questions across phonics, reading, grammar/writing, speaking, online learning, progress, pricing/demo and timings. Removed unsupported hard outcome claims and old Summer Camp clutter. Replaced links to noindex weekly posts with stronger canonical guides. Added answer-first routing and visible FAQ-aligned structured data. | Content-ready; rendered schema/link validation required |
| 3 | `/parents/choosing-course` | Decide whether phonics, reading, grammar/writing or speaking should come first | **KEEP.** Strong decision ladder, comparisons, assessment-first logic, FAQs, HowTo/Breadcrumb data, author context and internal paths. | Content-ready |
| 4 | `/parents/speech-confidence` | Help a shy/hesitant child speak with less pressure | **MAJOR REWRITE earlier in branch.** Observable confidence markers, low-pressure routine, parent scripts, confidence ladder, troubleshooting, safety boundary, FAQ + HowTo + Breadcrumb data and next-step links. | Content-ready |
| 5 | `/blog/online-phonics-classes-vs-school` | Decide whether school literacy teaching is enough or extra phonics is useful | **STRENGTHENED.** Reframed from “which is better” to use cases; added decision criteria, class-quality checks, transfer evidence, FAQs and evergreen links; removed fixed lesson-count framing. | Content-ready |
| 6 | `/parents/common-mistakes` | Avoid home-learning habits that hide or slow progress | **MAJOR REWRITE.** Seven mistakes with practical replacements, reset plan, parent scripts, escalation signals, FAQs, Breadcrumb/FAQ data and relevant next steps. | Content-ready |
| 7 | `/blog/long-vowel-sounds-for-kids` | Teach and practise long-vowel spelling patterns | **STRENGTHENED.** Clear teaching order, short/long contrasts, reading + spelling transfer, troubleshooting, FAQs and evergreen related reads. Unsupported fixed progress windows removed. | Content-ready |
| 8 | `/careers` | Understand Tiny Steps roles and how to apply | **KEEP.** Distinct hiring intent with role details, responsibilities, requirements, process, FAQs and application routes. Do not add `JobPosting` structured data to the role-list page unless separate current job-detail pages exist. | Content-ready; live role/application claims must be verified before merge |
| 9 | `/blog/r-controlled-vowels-explained` | Understand and practise ar/or/er/ir/ur | **STRENGTHENED.** Pattern grouping, listening/reading/spelling sequence, er/ir/ur explanation, troubleshooting, FAQs and evergreen links. Fixed-time outcome claims removed. | Content-ready |
| 10 | `/blog/cvc-words-explained-for-parents` | Understand the first real decoding milestone | **STRENGTHENED.** Focused on sound-to-print decoding, unfamiliar-word transfer, short-vowel contrasts, troubleshooting and FAQs. Arbitrary word/week milestones removed. | Content-ready |
| 11 | `/blog/online-english-classes-for-kids-india` | Compare online English class options in India | **MAJOR REWRITE.** Added learning-gap diagnosis, 1:1 vs group trade-offs, phonics/reading/grammar/writing/speaking quality criteria, trial-class checks, progress evidence, enrolment questions, red flags, FAQs and Tiny Steps next steps. | Content-ready |
| 12 | `/book-demo` | Understand and book the free 35-minute 1:1 assessment | **KEEP.** Lead-critical page with a clear offer, assessment purpose, form, FAQs and Service data. | Content-ready; verify visible offer and schema use the same current business facts |
| 13 | `/parents/reading-at-home` | Build a useful home-reading routine | **MAJOR REWRITE.** Removed unsupported “science-backed/research consistently shows” framing, replaced hard age/time claims with flexible guidance, added answer-first summary, reading-level framework, 10-minute routine, transfer evidence, troubleshooting, parent scripts, progress checklist, FAQs, HowTo/FAQ/Breadcrumb data, and canonical demo link. | Content-ready |
| 14 | `/blog/how-phonics-classes-help-kids-read` | Understand how phonics instruction supports reading | **STRENGTHENED.** Rebuilt around diagnosing the missing reading step, class-to-home transfer, unfamiliar-word evidence, class-quality checks, FAQs and observable progress rather than fixed timelines. | Content-ready |
| 15 | `/writing-classes-for-kids` | Decide whether guided writing support fits a child | **MAJOR REWRITE earlier in branch.** Distinct from the grammar hub: writing bottlenecks, stages, lesson loop, parent sample checklist, before/after evidence, editing, school-task transfer, FAQs and Breadcrumb data. | Content-ready |
| 16 | `/phonics-games-for-preschoolers` | Find useful no-print phonics games for young children | **MAJOR IMPROVEMENT.** Seven concrete games, answer-first summary, readiness-based wording, flexible practice duration, daily routine, progress signals, mistakes, FAQs, Breadcrumb + HowTo + FAQ data and canonical phonics links. | Content-ready |
| 17 | `/blog/child-reads-in-class-but-forgets-at-home` | Understand why reading looks stronger in class than at home | **MAJOR REWRITE.** Reframed from “forgetting is normal” to class-to-home transfer diagnosis. Added prompt comparison, level matching, fresh-example checks, decoding/fluency/comprehension breakpoints, home routine, teacher questions, professional-support boundary, FAQs and canonical next steps. Removed brain-path/pseudo-neurological wording. | Content-ready |
| 18 | `/blog/digraphs-and-tricky-words` | Understand what should be decoded vs remembered | **STRENGTHENED.** Clear digraph/tricky-word distinction, teaching sequence, read-spell-transfer loop, troubleshooting, FAQs and evergreen related reads. Fixed progress windows removed. | Content-ready |
| 19 | `/blog/week-12-speaking-confidence-seeds` | Follow a durable speaking-confidence roadmap | **MAJOR REWRITE.** Kept indexable because the intent is evergreen despite the weekly slug. Added answer-first guidance, progress markers, 7-day plan, games, scripts, confidence ladder, troubleshooting, professional-support boundary, FAQs and canonical next steps. | Content-ready |
| 20 | `/parents/getting-started` | Understand Tiny Steps assessment and onboarding | **MAJOR IMPROVEMENT.** Metadata/HowTo now match the actual onboarding intent. Replaced legacy `/?book=1` CTAs with `/book-demo`, removed “within 12 hours” promise, broadened assessment wording to match the child’s actual concern, clarified what parents should receive, and removed outcome-speed claims. | Content-ready; verify current 35-minute/1:1/free offer operationally |
| 21 | `/courses/phonics-advanced` | Evaluate the advanced phonics course | **KEEP.** Canonical course framework already provides unique metadata/H1, Course + FAQ + Breadcrumb data, curriculum, outcomes, reviews and course-specific links. | Content-ready; verify business claims/pricing/reviews against current configuration |
| 22 | `/parents/tracking-progress` | Measure whether English skills are really improving | **MAJOR REWRITE earlier in branch.** Baseline framework, independent evidence, transfer checks, skill tracker, teacher questions, troubleshooting, FAQs, HowTo/Breadcrumb data and measurable next-step logic. | Content-ready |
| 23 | `/courses/grammar-mastery` | Evaluate advanced grammar/writing support | **KEEP.** Canonical course framework already provides unique intent, Course + FAQ + Breadcrumb data, curriculum, writing/editing outcomes, reviews and internal links. | Content-ready; verify business claims/pricing/reviews against current configuration |

## Non-index carve-out rules

The other **29 URLs from this GSC set must never enter the remediation submission artifact**:

1. **11 redirects/legacy aliases** — keep a 301 where old crawl history or inbound links can benefit from consolidation; exclude the alias from canonical sitemaps and internal canonical linking.
2. **12 noindex weekly archives** — remain accessible only if useful as archive/support content; `noindex`, excluded from canonical sitemaps, and never manually submitted.
3. **6 XML/RSS resources** — keep them functional as discovery/feed infrastructure; do not treat them as landing pages. RSS retains `X-Robots-Tag: noindex`.
4. `scripts/audit-gsc-crawled-not-indexed.mjs` must fail if a non-index target leaks into canonical sitemaps, an index target becomes noindex, the 52-row classification changes unexpectedly, or the target count is no longer exactly 23.
5. `scripts/write-gsc-index-submission-targets.mjs` generates `artifacts/gsc-index-submission-targets.txt` from the manifest and must contain exactly the 23 canonical remediation URLs.

## Final engineering gates

Do **not** merge this branch until the built/prerendered output passes all of these checks:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run gen:sitemaps`
- `npm run seo:route-integrity`
- `npm run seo:indexability-report`
- `npm run seo:gsc-crawled-audit`
- `npm run seo:gsc-index-targets`
- `npm run build`
- all 23 target URLs render normally with a self-canonical, index-eligible robots directive, unique title/meta/H1, meaningful body content, working internal links and valid JSON-LD where used;
- all 29 excluded URLs behave according to their redirect/noindex/resource policy;
- no target page contains an unsupported performance percentage, guaranteed outcome, fabricated citation, guaranteed lesson count, pseudo-clinical claim or stale business promise;
- no indexable target prominently links to a noindex archive when a stronger evergreen canonical page serves the same intent;
- no console errors, soft-404 behaviour, broken links or malformed structured data on the 23 pages;
- `artifacts/gsc-index-submission-targets.txt` contains exactly 23 unique full canonical URLs and none of the 29 excluded URLs.

## Post-deploy action

After merge, deployment and production verification, use Google Search Console URL Inspection / Request Indexing only for the 23 URLs in the generated remediation list. Do not request indexing for the redirects, noindex archives or XML/RSS resources from this issue set.
