# AI Search E1/E2 — Production HTML, structured data and governed publication baseline

**Date:** 2026-10-19 (Asia/Kolkata)  
**Stage:** E1 live accessibility / E2 schema and machine-index consistency  
**Status:** **TECHNICAL BASELINE VERIFIED for the specified 168 index-intended editorial and programmatic URLs**, within test limitations. **NOT** a Google indexing or native AI citation verdict.  
**Execution:** [PR #750](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/750) read-only audit script and PR CI workflow, no website code changes.  
**Final clean run:** [GitHub Actions #39204076223](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39204076223), completed successfully 19 Oct 2026. Per-URL JSON/CSV artifacts attached to the run (30-day retention).  
**Tracking:** [#748](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748), inherited GSC outcomes [#747](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/747).

## 1. What was tested
The audit reads **production origin HTTP responses**, including returned headers, initial HTML and JSON-LD, with an ordinary read-only HTTP client. It does not run authenticated Google Index Inspection, authenticate as a verified crawler by IP, invoke a native ChatGPT/Gemini interface, fill a form, submit indexing requests or deploy.

The source-of-truth corpus reconciles `public/sitemap-blog.xml`, `phonicsPublicationRegistry.js`, `grammarProgrammaticSeoManifest.js`, `grammarReferenceExtensionSeoManifest.js` and `vocabularyAuthoritySeoManifest.js`. Reused source owners, no new pages created.

| Content family | Unique published URLs | Production HTTP 200 HTML | JSON-LD present and parsed | Flags / unknowns |
|---|---:|---:|---:|---:|
| Editorial blogs (includes 14 Speaking article owners) | 83 | 83 | 83 | 0 / 0 |
| Governed Phonics guides (16 Wave 1 + 15 Wave 2) | 31 | 31 | 31 | 0 / 0 |
| Grammar programme guides + reference extensions | 38 (32 + 6) | 38 | 38 | 0 / 0 |
| Vocabulary authority guides | 16 | 16 | 16 | 0 / 0 |
| **Distinct pages audited** | **168** | **168** | **168** | **0 / 0** |

Every URL had the expected single self-canonical, no detectable robots/X-Robots `noindex`, a visible H1 and meaningful initial-main text, a parsable JSON-LD script and the expected page-family schema relationship. All samples returned `Cache-Control: no-cache, max-age=0, must-revalidate`; full individual cache values remain in JSON/CSV rather than generalized as identical without checking each row.

### 2. Machine-readable schema verified
- **Blog:** `BlogPosting` with canonical URL, matching H1 headline, nonempty author and `datePublished`. Publisher/WebPage/Blog/BreadcrumbList/FAQPage observed in sample and among the full schema type lists, subject to individual field-level validation. `dateModified` is **optional**: it must not be fabricated where the article has no recorded substantive modification date.
- **Phonics:** `WebPage`, `DefinedTerm`, `BreadcrumbList`, org/site identity and visible question/answer teaching patterns.
- **Grammar:** `WebPage`, `BreadcrumbList`, `FAQPage` as backed by displayed FAQ/clarification content.
- **Vocabulary:** `Article`, `WebPage`, `BreadcrumbList`, `FAQPage` and visible contextual examples.
- Parsable JSON-LD and expected node types do **not** prove Google's Rich Results eligibility, truth of every claim, authorship credentials or any AI engine's citation preferences.

### 3. Public crawler policy observed
Production `/robots.txt` returned **HTTP 200**. For `Googlebot`, `OAI-SearchBot`, `ChatGPT-User` and `PerplexityBot`, its own user-agent groups had public Allow and the tested private-route Disallow entries. This is a **robots policy inspection**, not proof that bot IP ranges or edge/WAF rules allow visits, that agents have visited or that their ranking systems select Tiny Steps.

### 4. AI-answer directory and live sitemap parity
All six discovery files were fetched directly from production successfully:

| Live URL | Result | Evidence |
|---|---|---|
| `/ai-resource-index.json` | 200; valid JSON | GV6 version `2026-09-27-gv6`; 83 + 31 + 38 + 16 content owners matched the source registries with **zero missing/extra URLs** |
| `/ai-resource-index.txt` | 200 text | Parent question/canonical owner directory present |
| `/llms.txt` | 200 text | Links to AI answer index present |
| `/llms-full.txt` | 200 text | Links to AI answer index present |
| `/sitemap-blog.xml` | 200 application/xml | **83 locs**, all 83 published editorial paths present |
| `/sitemap-static.xml` | 200 application/xml | **159 locs**, all 85 phonics/grammar/vocabulary governed paths present |

Live `ai-resource-index.json` describes **279 connected public-content entries**: 83 blogs, 31 phonics, 38 grammar, 16 vocabulary and 111 other public routes. **Only the first 168 are covered by this complete per-URL audit.** Some other-route entries may have a different discovery/answer-eligibility role; do not assume all 279 must index.

**Interpretation:** the site already has an extensive three-layer parent problem → canonical explanation → practice/source graph, created by `src/lib/aiAnswerLayerRegistry.js` and `scripts/generate-rss.mjs`. Machine directories are optional support for retrieval. Neither Google nor OpenAI requires `llms.txt` or `ai-resource-index.json` for placement in AI answers.

### 5. Diagnostic false positives investigated and corrected
1. First 18-page sample: four Grammar/Vocabulary templates showed `parent-answer-pattern-needs-human-review` because the test looked for a blog-specific exact “quick answer” phrase. Independent retrieved-page checks confirmed visible introductory answers, “What this skill means” and worked examples. The final script recognizes the actual template wording; the final run recorded no such unknowns.
2. First 168-page scan: nine blogs had a `blogposting-missing-date-or-author` flag because the test required `dateModified`. The existing `BlogPostPage.tsx` deliberately emits `dateModified` only when `metaSource.modifiedDate` exists. The nine articles have nonempty author and publication date. Requiring an invented update date would have broken metadata truthfulness. The final test requires publication date and author and treats modified date as optional. Final outcome: **zero flags**.
3. One intermediate workflow revision had a regex syntax typo for XML loc extraction; the test runner exited before any production test. The corrected [final CI #39204076223](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39204076223) passed. This was an audit-script error, not site failure.

### 6. Work still open
**E1 edge proof:** validate actual major bot-IP requests/WAF/CDN patterns, where log-level evidence is available. HTTP headers/robots from a normal agent cannot certify bot reach.

**E2 deep structural truth:** review representative schema node-reference resolution, dates and visible-author alignment, FAQ answer parity, external claims and schema.org validation; script currently checks canonical+types+BlogPosting core fields, not every field in every graph.

**E3 educational answer and trust:** start with 12 problem-owner blogs, check pedagogy and original explanations, external references and real author/review claim substantiation. For 85 governed guides check topic uniqueness, right age/skill boundary, working exercises and editorial-quality issues, prioritizing any genuine weakness over length or keyword stuffing.

**E4 native search tests:** conduct dated, reproducible parent prompts in real **ChatGPT Search, Gemini app, Google AI Mode/AI Overviews and Perplexity** sessions. Capture actual generated answer, citations, exact linked Tiny Steps URL, accuracy, competing sources, geography, language and session mode. To date, **no native platform citations are proven by this CI.** Do not substitute public web SERP snippets for native AI answers.

**E5 performance:** use GSC Google index and Search Generative AI reports where available, Bing Webmaster, AI-origin referrals and demo/enquiry attribution. Continue #747 for still-unconfirmed indexing decisions, including old Soft 404 exclusions despite E1/E2 eligibility.

### 7. Release decision
**No app-level P0/P1 remediation is indicated by these 168 E1/E2 checks.** Keep approved canonical/topic owners and content stable; resist broad rewrites, new phonics word pages or arbitrary programmatic Wave 3. The additions in PR #750 are **test and CI evidence only**. This document reports the completed validation, not a production deployment. Recheck when new publication waves or significant SEO code changes occur.

**Primary artifacts:** Run #39204076223 `ai-answer-e1e2-live-evidence` contains four JSON/CSV files for the 18-page priority sample and full 168-page crawl. They are saved for 30 days. The script and workflow remain version controlled if the PR is merged.
