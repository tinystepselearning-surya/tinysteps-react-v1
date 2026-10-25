# Homepage 2.0 — Machine Readability, Search and AI Visibility Review

**Date:** 2026-10-26 (Asia/Kolkata)  
**Branch:** `feature/homepage-premium-gateway-20261025`  
**Scope:** New homepage and its first-party discovery infrastructure only; not an audit of every public URL or proof of search engine rank.  
**Production:** No merge or deployment was performed.

## Executive assessment

**Technical readiness is good, but indexation and AI citation are not established by a build.**

- User-reported local validation before the current SEO guard changes: TypeScript `tsc --noEmit` passed; 41/41 Vitest, 22/22 Playwright, 266/266 prerender routes, 299/299 route-indexability report and the rendered-HTML SEO checks passed.
- Independent source verification found canonical homepage SEO metadata, search indexing directives, crawlable React Router anchor destinations, Organization/WebSite/WebPage JSON-LD, canonical sitemap ownership and no blanket home route `noindex` header.
- The live web extraction service retrieved the **older production homepage** as text with headings and links. This demonstrates one crawler could read content but does **not** prove all search and AI bots can retrieve it. The new design remains in an unmerged branch.
- The configured `public/robots.txt` allows crawling public content for Googlebot, Bingbot, OAI-SearchBot, PerplexityBot, Claude-SearchBot and other listed agents while repeating private-route disallows. Live bot-specific fetches and firewall/IP-range access were **not** verified.
- The existing `llms.txt` lists commercial owners and links to Pricing and Class Samples, but originally lacked a Parent FAQ link. `scripts/generate-rss.mjs` now maintains an explicit homepage and Parent FAQ link in the compact generated LLM directory, leaving the full editorial directory unchanged.
- A dedicated source regression suite `src/tests/seo/homeMachineReadability.spec.ts` checks URL/canonical ownership, content, markup, JSON-LD wiring, sitemap, robots configuration, private-route rules, Hosting response-header config and LLM discovery generation.

## Source and live distinctions

| Dimension | New branch | Publicly observed production |
| --- | --- | --- |
| Homepage content | New photo-led Homepage 2.0 with four pathways and Before You Book links | Earlier homepage structure was still extracted |
| Canonical/index meta | Configured for `https://tinystepslearning.com/` | Older public URL was accessible to the extraction tool |
| JSON-LD | Organization, WebSite, WebPage | Current public JSON-LD was not independently extracted |
| Public robots configuration | Explicit search and AI agent allowances; private routes restricted | Live robots.txt could not be retrieved through the available web extraction tool |
| Sitemaps | Root in static sitemap, referenced by sitemap index | Live XML status/headers not independently established |
| AI citations | Technically eligible to be discovered after deployment | No answer-engine query-level citation claims made |

## Real visibility requirements after deployment

1. Confirm external 200 responses and readable text for `/`, `/phonics`, `/reading-classes-for-kids`, `/grammar`, `/spoken-english-classes-for-kids-online`, `/speaking`, `/class-samples`, `/pricing`, `/faq`.
2. Fetch `/robots.txt`, `/sitemap.xml`, `/llms.txt` (note: `llms.txt` is optional discovery material) as both a browser and known crawler user agents. Do not assume a browser 200 means crawler IP ranges are allowed.
3. Verify `Content-Type`, status, canonical tags, robots meta and `X-Robots-Tag` response headers. A `noindex` on the LLM discovery text file is not a homepage `noindex`.
4. Use Google Search Console URL Inspection for the homepage and subject owners: inspect the **indexed** canonical, crawler-observed HTML, crawl dates and any soft-404/noindex failures. Request recrawl only as needed.
5. Verify Bing Webmaster Tools indexing and discovered URLs. Check actual brand and relevant parent-question retrieval from ChatGPT Search, Google AI Mode and other answer engines with query/date evidence before claiming visibility gains.
6. Compare dated query impressions, clicks, AI citations and brand mentions before and after deployment. Avoid attributing algorithm changes to a local build.
7. Continue to protect privacy: never open parent/teacher/admin dashboards to bots or publish parent or student information in discovery files.

## Local working tree safety

The owner's checkout has modified generated public RSS, sitemap and LLM files plus several **untracked operational scripts**, including attendance and financial exports. These are unrelated to the homepage visibility audit. Do not use `git restore .`, `git clean -fd`, `git add -A` or broad staging. The current changes were committed to source-only files (`scripts/generate-rss.mjs` and a new SEO test), avoiding overwrite of local generated discovery files.

## Next commands

```bash
git switch feature/homepage-premium-gateway-20261025
git pull --ff-only
npx vitest run src/tests/seo/homeMachineReadability.spec.ts src/tests/seo/homeAiEntityVisibility.spec.ts src/tests/seo/blogQuality51LlmDiscovery.spec.js
npm run typecheck
npm run build
git status --short
```

**Go/no-go:** Do not merge until the new test and production build pass, the branch is reconciled with the current `main`, and the owner approves deployment. Search/AI visibility is an evidence-based follow-up, not a guarantee.
