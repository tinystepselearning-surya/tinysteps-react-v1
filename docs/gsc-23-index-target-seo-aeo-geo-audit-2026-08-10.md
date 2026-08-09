# Tiny Steps — 23 GSC Index Targets: SEO / AEO / GEO Audit

Date: 2026-08-10  
Branch: `seo/crawled-not-indexed-audit-2026-08-09`  
Source snapshot: the 52 URLs reported in Google Search Console as **Crawled — currently not indexed**.

## Scope and indexing rule

This document covers only the 23 URLs from the 52-URL remediation set that Tiny Steps intentionally wants Google to index.

- **23 index targets:** eligible for this remediation submission list.
- **11 redirects:** aliases/legacy URLs; never submit as independent index targets.
- **12 weekly archives:** accessible only as support/archive content; `noindex` and excluded from canonical sitemaps.
- **6 XML/RSS resources:** discovery/feed resources; never submit as landing pages.

Important: the normal site sitemaps can and should still contain other healthy canonical Tiny Steps pages that were not part of this 52-URL GSC issue set. The 23-item list is the remediation submission list, not the complete site index.

## What “SEO / AEO / GEO” means in this branch

We are not adding special “AI ranking” markup or keyword stuffing. The implementation standard is:

### SEO
- one preferred canonical URL;
- indexable route, no accidental `noindex`;
- present in the correct canonical sitemap;
- unique search intent, title, meta description and H1;
- useful internal links to relevant canonical pages;
- semantic page structure and structured data only where it matches visible content.

### AEO
- answer-first summary for the main question when appropriate;
- scannable questions, checklists, comparisons, examples and troubleshooting;
- visible FAQs where they genuinely help the user;
- concise language that can be extracted without losing the page’s context.

### GEO / AI discoverability
- clear entity/context: Tiny Steps, parent/child audience, programme or skill being discussed;
- useful, original explanations rather than thin paraphrases;
- author/provider context where supported by the existing site framework;
- specific examples and observable progress signals;
- conservative claims: remove or soften universal lesson-count promises, outcome percentages and pseudo-clinical statements that are not supported on-page;
- strong internal topic relationships so search and AI systems can understand which page is the canonical answer for each intent.

## One-by-one audit

| # | URL | Primary intent | Audit decision / work in this branch | Readiness |
|---|---|---|---|---|
| 1 | `/blog/june-school-reopening-english-readiness-plan` | Parent school-reopening readiness plan | **KEEP.** Already substantial: answer-first framing, 14-day plan, skill checklist, parent actions and internal paths. Retain as the durable readiness URL rather than creating another overlapping seasonal page. | Ready for rendered validation |
| 2 | `/faq` | Broad parent pre-enrolment questions | **KEEP.** Strong question-led intent and internal navigation. Final Codex audit must remove/soften any unsupported hard outcome numbers and replace any links that point to noindex weekly archives with evergreen canonical pages before merge. | Requires final claim/link sweep |
| 3 | `/parents/choosing-course` | Which English course should my child start? | **KEEP.** Strong decision ladder, course comparisons, FAQs, breadcrumbs, HowTo/FAQ schema, author context and assessment-first guidance. | Ready for rendered validation |
| 4 | `/parents/speech-confidence` | Help a shy/hesitant child speak | **STRENGTHENED.** Rewritten as a low-pressure parent guide with observable confidence markers, daily routine, scripts, confidence ladder, troubleshooting, safety boundary, FAQ + HowTo + Breadcrumb data and internal pathways. | Ready for rendered validation |
| 5 | `/blog/online-phonics-classes-vs-school` | School phonics vs additional online support | **STRENGTHENED.** Reframed around use cases rather than “which is better”; added decision criteria, observable progress, assessment guidance, FAQs and canonical related links; removed fixed lesson-count framing. | Ready for rendered validation |
| 6 | `/parents/common-mistakes` | Parent mistakes that slow English learning | **STRENGTHENED.** Expanded from a thin list into 7 mistakes + replacements, reset plan, parent scripts, escalation signals, FAQ schema, breadcrumbs and clear internal next steps. | Ready for rendered validation |
| 7 | `/blog/long-vowel-sounds-for-kids` | Teach/practise long-vowel patterns | **STRENGTHENED.** Clear teaching order, contrast examples, reading + spelling transfer, FAQs and related links; replaced unsupported fixed progress windows with observable skill markers. | Ready for rendered validation |
| 8 | `/careers` | Tiny Steps remote roles/applications | **KEEP.** Distinct hiring intent with roles, responsibilities, qualifications, process, FAQs and application routes. Do **not** add JobPosting markup to this role-list page unless separate leaf job pages are created. | Ready; verify live role claims |
| 9 | `/blog/r-controlled-vowels-explained` | Explain/practise r-controlled vowel patterns | **STRENGTHENED.** Pattern grouping, listening/reading/spelling sequence, clear er/ir/ur explanation, troubleshooting, FAQs and evergreen internal links; fixed-time outcome claims removed. | Ready for rendered validation |
| 10 | `/blog/cvc-words-explained-for-parents` | Explain CVC decoding to parents | **STRENGTHENED.** Focused on the decoding milestone, transfer to unfamiliar words, short-vowel contrasts, support diagnostics and FAQs; removed arbitrary “number of words/weeks” milestones. | Ready for rendered validation |
| 11 | `/blog/online-english-classes-for-kids-india` | How Indian parents choose online English classes | **MAJOR REWRITE.** Expanded from a thin article into a parent decision guide covering skill-gap diagnosis, 1:1 vs group trade-offs, phonics/reading/grammar/writing/speaking quality, trial-class evaluation, progress evidence, enrolment questions, red flags, FAQs and Tiny Steps next steps. | Ready for rendered validation |
| 12 | `/book-demo` | Book/understand the free assessment | **KEEP.** Strong service intent: exact offer, duration, what is assessed, outcomes, form, FAQs and matching Service schema. Final audit should confirm schema and visible claims remain identical. | Ready for rendered validation |
| 13 | `/parents/reading-at-home` | Home reading routine | **KEEP + METADATA ALIGNED.** Strong routine, stage plan, troubleshooting, parent scripts, progress checklist and HowTo/Breadcrumb data. Metadata now describes the actual 10-minute routine instead of over-claiming research authority. | Ready for rendered validation |
| 14 | `/blog/how-phonics-classes-help-kids-read` | How phonics instruction supports reading | **STRENGTHENED.** Rebuilt around diagnosing the missing reading step, class-to-home transfer, unfamiliar-word evidence, class-quality checklist, FAQs and realistic progress signals instead of fixed timelines. | Ready for rendered validation |
| 15 | `/writing-classes-for-kids` | Live writing support for children | **MAJOR REWRITE (earlier in this branch).** Distinct from the grammar hub: writing stages, bottleneck diagnosis, lesson loop, parent sample checklist, before/after evidence, editing, school-task transfer, FAQs, breadcrumbs and useful internal links. | Ready for rendered validation |
| 16 | `/phonics-games-for-preschoolers` | No-print phonics games ages 3–6 | **KEEP.** Seven concrete games, answer-first summary, daily routine, common mistakes, FAQs, Breadcrumb + HowTo + FAQ data and links to the phonics path. Final audit should soften any universal “best age / best duration” wording if it reads as a guarantee. | Ready; minor wording sweep |
| 17 | `/blog/child-reads-in-class-but-forgets-at-home` | Parent sees class/home transfer gap | **KEEP.** Specific pain-point intent with diagnostic value, home routine, troubleshooting and FAQ structure. Final audit should ensure claims stay observational rather than neurological/clinical unless a source is shown. | Ready; claim sweep |
| 18 | `/blog/digraphs-and-tricky-words` | Digraphs vs tricky/high-frequency words | **STRENGTHENED.** Clarifies what should be decoded versus what needs extra memory, includes pattern sequencing, read-spell-transfer loop, FAQs, troubleshooting and canonical related reads; fixed progress windows removed. | Ready for rendered validation |
| 19 | `/blog/week-12-speaking-confidence-seeds` | Durable speaking-confidence roadmap | **MAJOR REWRITE.** This is intentionally the one weekly speaking guide kept indexable because its intent is evergreen. Added answer-first guidance, observable progress markers, 7-day plan, games, scripts, confidence ladder, troubleshooting, professional-support boundary, FAQs and canonical next steps; removed pseudo-clinical/generalised claims. | Ready for rendered validation |
| 20 | `/parents/getting-started` | Tiny Steps onboarding and assessment process | **KEEP + METADATA FIXED.** Strong step flow, assessment checks, preparation list, first-week plan and author context. Metadata/HowTo now match the actual Tiny Steps onboarding page rather than incorrectly framing it as only “phonics at home.” | Ready; verify current operational promises |
| 21 | `/courses/phonics-advanced` | Advanced phonics course | **KEEP.** Canonical course framework provides unique title/description/H1, Course + FAQ + Breadcrumb structured data, curriculum detail, outcomes, reviews and course-specific internal links. | Ready for rendered validation |
| 22 | `/parents/tracking-progress` | How parents measure real English progress | **MAJOR REWRITE (earlier in this branch) + METADATA ALIGNED.** Baseline framework, skill evidence table, parent tracker, teacher questions, transfer checks, troubleshooting, FAQ + HowTo + Breadcrumb data and measurable next-step logic. | Ready for rendered validation |
| 23 | `/courses/grammar-mastery` | Advanced grammar/writing course | **KEEP.** Canonical course framework provides unique intent, Course + FAQ + Breadcrumb data, curriculum, outcomes, reviews, writing/editing focus and relevant internal links. | Ready for rendered validation |

## Non-index carve-out requirements

The 29 non-target URLs from this GSC set must never be included in the remediation submission artifact:

1. Redirect/legacy URLs must remain outside canonical sitemaps and resolve permanently to their preferred target. Keep the redirect if external links or old crawl history may still point to it; deleting the redirect would discard consolidation value.
2. Weekly archive URLs classified `noindex-archive` must remain outside canonical sitemaps and must receive the blog noindex policy.
3. Sitemap XML files remain crawl/discovery infrastructure, not landing-page index targets.
4. RSS XML files remain available to readers/crawlers but must retain `X-Robots-Tag: noindex` and stay out of the landing-page sitemap set.
5. `scripts/audit-gsc-crawled-not-indexed.mjs` now fails if a non-index target leaks into canonical sitemaps or if the 23-target manifest changes unexpectedly.
6. `scripts/write-gsc-index-submission-targets.mjs` generates `artifacts/gsc-index-submission-targets.txt` containing exactly the 23 full canonical URLs for this remediation set.

## Final merge gates

Do not merge this branch until Codex verifies all of the following against the built/prerendered output:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run` (or the repository's stable non-watch equivalent)
- `npm run gen:sitemaps`
- `npm run seo:gsc-crawled-audit`
- `npm run seo:gsc-index-targets`
- `npm run build`
- all 23 targets return/render as normal 200 pages with a self-canonical, index-eligible robots directive, unique title/meta/H1, useful body content and valid JSON-LD where present;
- every redirect/noindex/resource decision from the 52-URL manifest behaves as intended;
- no unsupported performance percentage, guaranteed outcome, guaranteed lesson count, or fabricated evidence/citation was introduced;
- no indexable page links prominently to an obsolete/noindex weekly URL when a stronger evergreen canonical page serves the same intent;
- no console errors or broken internal links on the 23 target pages;
- generated submission artifact contains exactly 23 unique URLs.

## Post-deploy GSC action

After the branch is merged, deployed, and production HTML is verified, use URL Inspection / Request Indexing only for the 23 canonical URLs in the generated remediation list. Do not request indexing for the 11 redirects, 12 noindex archives, or 6 XML/RSS resources from this issue set.
