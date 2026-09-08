# Resources Architecture — R0 Ecosystem Safety Baseline

**Scope:** Resources / SEO / AEO / GEO architecture  
**Branch:** `seo/resources-r0-safety-baseline`  
**Baseline main SHA:** `67ea6f499ae4eea5b9470da25895102cb4ccd90b`  
**Production behaviour changed:** **No**

## Purpose

R0 freezes the current Tiny Steps public ecosystem before `/resources` is repurposed or new subject hubs/programmatic pages are created.

The governing journey is:

> Search / AI discovery → Learn → Practise → Understand the gap → Get help when relevant → Assessment / programme

R0 must make later work safer. It must not redesign `/resources`, move blog URLs, create programmatic pages, or change production redirects.

## What R0 builds

R0 consists of five connected baselines:

1. **R0A — URL Ownership Registry**
2. **R0B — Search Intent Registry**
3. **R0C — Commercial Intent / CTA Registry**
4. **R0D — Existing Performance Baseline**
5. **R0E — Search / AI Crawler Accessibility Baseline**

The machine-readable semantic source is:

- `src/lib/resourcesArchitectureRegistry.js`

The executable audit is:

- `scripts/audit-resources-r0.mjs`

## R0A — URL ownership

The registry records the current job of protected public routes and the planned relationship to the future Resources architecture.

It deliberately separates:

- current physical URL;
- current route/redirect state;
- page family;
- audience;
- subject;
- current purpose;
- protected query/problem ownership;
- future Resource-node relationship.

This does **not** replace the technical route source of truth. Existing technical policy remains in:

- `src/lib/publicRouteManifest.js`
- `src/lib/routeSeoRegistry.js`
- `firebase.json`
- blog indexing/consolidation policy

R0 audits the semantic registry against those systems so drift is visible.

### Protected ecosystem owners

The following roles must remain distinct during the Resources build:

- `/` — brand + broad commercial acquisition
- `/courses` — course selection
- `/curriculum` — academic roadmap
- `/phonics` — commercial phonics programme
- `/grammar` — commercial grammar programme
- `/speaking` — commercial speaking programme
- `/pricing` — canonical pricing
- `/parents` — parent support/problem hub
- `/for-schools` — B2B school implementation
- `/free-english-games-for-kids` — free practice ecosystem
- `/blog` — editorial library/archive
- protected `/blog/*` authorities — distinct editorial intent owners
- `/book-demo` — canonical assessment conversion

## `/resources` baseline state

R0 records `/resources` exactly as it exists before Brick 2:

- current state: **301 redirect**
- destination: `/blog`
- no independent canonical/search-intent ownership
- not an indexable route in `PUBLIC_ROUTE_MANIFEST`
- future role: primary educational-discovery gateway

Important: the redirect is currently owned outside the centralized `PUBLIC_REDIRECT_MANIFEST` as well as by application routing. This is deliberate R0 evidence of remaining route-policy drift.

Brick 2 must change all `/resources` owners atomically. A React page must never be launched while Firebase still redirects the URL.

## R0B — search intent

R0 uses these search-intent stages:

- `informational`
- `practice`
- `problem-aware`
- `progress-aware`
- `solution-aware`
- `commercial`
- `high-commercial`
- `transactional-brand`

Search intent is intentionally separate from existing authority roles such as `pillar`, `diagnostic-owner`, `skill-guide`, or `activity-guide`.

Example:

- `how-kids-learn-blending` may be a **skill guide** and **progress-aware/informational**.
- `why-child-knows-letter-sounds-but-cannot-read-words` is a **diagnostic owner** and **problem-aware**.
- `/phonics` is a **commercial programme page** and **high-commercial**.

Same topic does not imply same intent.

## R0C — CTA / commercial readiness

R0 records both commercial readiness and the appropriate CTA class.

Commercial readiness:

- `none`
- `low`
- `medium`
- `high`
- `very-high`

CTA policy:

- `none`
- `related-resource`
- `practice`
- `assessment`
- `programme`
- `pricing`
- `demo`
- `schools`

This layer does not replace the existing blog conversion-family implementation. It generalizes the same principle across the wider Resources ecosystem:

> answer/help first; use stronger commercial next steps only where search intent supports them.

## R0D — performance evidence

Performance must never be invented.

The R0 audit accepts optional page-level exports:

```bash
node scripts/audit-resources-r0.mjs --write \
  --gsc path/to/gsc-pages.csv \
  --ga4 path/to/ga4-landing-pages.csv
```

Supported GSC fields include common Search Console page-export headings:

- Page / Top pages / URL
- Clicks
- Impressions
- CTR
- Position / Average position

Supported GA4 fields include common landing-page exports:

- Landing page / Landing page + query string / pagePath
- Sessions
- Users / Total users / Active users
- Conversions / Key events / Leads

The audit normalizes full URLs to canonical pathnames and attaches metrics only to exact paths.

### R0 performance priority paths

At minimum the snapshot should cover:

- `/resources`
- `/blog`
- `/phonics`
- `/grammar`
- `/speaking`
- `/parents`
- `/for-schools`
- `/free-english-games-for-kids`
- `/book-demo`
- `/best-online-phonics-classes-for-kids-in-india`
- `/phonics-fees-india`
- strongest protected Phonics articles
- strongest protected Grammar articles
- strongest protected Speaking articles

Missing performance is reported as `missing`; it is never silently replaced with zero.

## R0E — crawler accessibility

The audit checks the current crawler contract without changing it.

It verifies:

- public wildcard crawling is allowed;
- private application prefixes remain disallowed;
- public protected URLs do not fall under private prefixes;
- explicit AI/search crawler groups are present where currently intended;
- planned Resource subject hubs are not prematurely in sitemaps/manifests;
- `/resources` remains a redirect during R0.

Current explicit bot groups include OpenAI, ChatGPT user retrieval, Perplexity and Claude search/crawl agents. Google and Bing discovery inherit the public wildcard policy.

## Running the audit

Structural baseline only:

```bash
node scripts/audit-resources-r0.mjs --write
```

With performance evidence:

```bash
node scripts/audit-resources-r0.mjs --write \
  --gsc path/to/gsc-pages.csv \
  --ga4 path/to/ga4-landing-pages.csv
```

Strict freeze gate:

```bash
node scripts/audit-resources-r0.mjs --write --strict \
  --gsc path/to/gsc-pages.csv \
  --ga4 path/to/ga4-landing-pages.csv
```

`--strict` fails when any required performance-priority path has no GSC/GA4 evidence. Normal mode only warns so structural CI can run without account-bound analytics exports.

Generated artifacts:

- `artifacts/seo/resources-r0/resources-r0-baseline.json`
- `artifacts/seo/resources-r0/resources-r0-baseline.csv`

## R0 acceptance gates

R0 structural build is complete when:

- [x] Current ecosystem ownership is machine-readable.
- [x] Search intent is explicitly separate from topical authority role.
- [x] Commercial readiness and CTA policy are explicit.
- [x] `/resources` current redirect state is documented and machine-checked.
- [x] Future subject hubs are recorded as planned, not live.
- [x] Protected programme, parent, school, game and editorial owners are recorded.
- [x] Current route manifest / SEO registry / Firebase / robots relationships are audited.
- [x] Search/AI crawler access is audited without weakening private-route protection.
- [x] Performance import accepts real GSC/GA4 page exports.
- [x] Missing metrics are visible, never guessed.
- [ ] Current pre-change GSC page-performance export is attached/imported.
- [ ] Current pre-change GA4 landing-page export is attached/imported where available.

## Brick 1 gate

Brick 1 may start only after:

1. R0 structural audit has **0 errors**;
2. the generated R0 baseline artifact is reviewed;
3. the current GSC performance snapshot is frozen for protected/priority pages;
4. any unavailable analytics field is explicitly marked unavailable rather than inferred.

No R0 change should alter public navigation, canonicals, redirects, schema, content, indexability, or rendered user experience.
