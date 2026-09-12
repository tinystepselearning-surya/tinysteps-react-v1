# Tiny Steps SEO Recovery — Brick 11 Technical Consolidation

**Date:** 2026-09-12  
**Status:** CLOSED — technical ownership and generated-discovery controls consolidated  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

## Objective

Make the ownership decisions completed in Bricks 1–10 technically consistent across canonicals, redirects, sitemaps, internal links, RSS/feed output, LLM discovery files, robots/indexability and the production build pipeline.

Brick 11 does **not** create new SEO pages, change authority ownership, or use canonical tags as a substitute for real duplicate consolidation.

## Master technical checklist

| Requirement | Brick 11 result |
|---|---|
| Primary URL is the intended indexable owner | Protected by route SEO registry + Brick 11 audit |
| Retired duplicate resolves to the primary | Existing direct 301 mappings preserved and audited |
| Primary is self-canonical | Recovery static primaries checked in the route registry |
| Sitemap contains intended primary, not retired source | Sitemap generator hardened + generated-output audit |
| Internal links point directly to final URL | Existing Vite canonical rewrite retained; topic-cluster rendering now normalizes incoming links directly |
| Breadcrumb/schema/OG use canonical page identity | Existing page/schema architecture preserved; no competing owner introduced |
| Primary remains indexable | `noindex` on recovery primary routes is treated as a Brick 11 failure |
| Redirect chains | Retired-blog and legacy-week maps are checked for chain destinations |
| Broken/internal stale link protection | Existing route-integrity/rendered consolidation checks retained; Brick 11 adds recovery-specific generated-output checks |
| Canonical used instead of merge | Not allowed; Brick 4 physical retirement remains the consolidation mechanism |

## Audit finding: committed generated snapshots were stale

The source-level recovery decisions were already largely correct, but several committed generated artifacts still reflected an older build snapshot. In particular, the old provider-selection URL could still appear in generated sitemap/feed/LLM files even though its source post had been retired and the production build pipeline was intended to regenerate those artifacts.

Brick 11 therefore fixes this at the **generator and build-gate level**, rather than treating a manually edited generated file as the source of truth.

## Implementation

### 1. Canonical internal links in topic clusters

`src/components/programs/TopicClusterLinks.tsx`

Incoming links are normalized through `normalizeSeoRecoveryInternalHref` before rendering. This gives programme/resource clusters a direct final-owner URL even if an older source literal survives elsewhere in the repository.

The existing Vite `canonicalInternalBlogLinks()` transform remains as the broader build-time safety net for retired blog paths across `/src/`.

### 2. Sitemap generation hardened

`scripts/generate-sitemaps.js`

The generator now imports the central `RETIRED_BLOG_PATH_REDIRECTS` map and derives `RETIRED_BLOG_SLUGS` from it. Any retired blog slug is excluded defensively from `sitemap-blog.xml` even if it is accidentally reintroduced into source inventory.

The existing blog-route utility still converts historical weekly source slugs into their current public slugs before sitemap publication.

### 3. RSS and LLM discovery normalization hardened

`scripts/generate-rss.mjs`

Generated RSS/feed URLs continue to pass through retired-path and legacy-week normalization. Brick 11 expands the LLM discovery cleanup so the contents of `llms.txt` and `llms-full.txt` are also canonicalized with both:

- `rewriteRetiredBlogPaths`
- `rewriteLegacyWeekBlogPaths`

Retired commercial article lines are removed rather than left as duplicate labels pointing at the comparison page.

### 4. Dedicated Brick 11 technical audit

`scripts/audit-seo-recovery-brick11.mjs`

The audit verifies the recovery-critical technical layer after the generated files have been rebuilt. It checks:

- static primary self-canonical/indexability state;
- required primary sitemap presence;
- retired blog URLs absent from sitemap/RSS/feed/LLM discovery output;
- historical weekly source URLs absent from generated discovery output;
- public renamed weekly URLs present in the blog sitemap;
- direct server mappings for retired blog intents;
- no redirect chains inside the retired-blog or legacy-week maps;
- direct 301s for the main historical commercial aliases;
- Vite canonical-link normalization remains enabled;
- the sitemap generator retains retired-slug protection;
- RSS/LLM generation retains legacy + retired normalization;
- correct prebuild/build ordering.

### 5. Production build gate

`package.json`

The production sequence is now:

```text
prebuild
  → generate RSS/feed + normalize LLM discovery files

build
  → generate sitemaps
  → existing blog-consolidation audit
  → Brick 11 technical audit
  → Vite build
  → rendered SEO checks
  → rendered blog-consolidation audit
  → route/indexation/indexability checks
```

This is important because a stale generated artifact can no longer silently ship simply because the source-level redirect is correct: the build should fail before deployment if the regenerated technical outputs still contain a retired recovery URL.

### 6. Vitest regression protection

`src/tests/seo/recoveryBrick11TechnicalConsolidation.spec.ts`

This source-level guard deliberately does **not** depend on committed generated snapshots. It protects the generator/build architecture itself, including self-canonical recovery primaries, direct retired-intent destinations, topic-cluster normalization, sitemap exclusion, RSS/LLM normalization and the production Brick 11 build gate.

## Existing technical controls preserved

Brick 11 builds on rather than replaces the existing controls:

- `scripts/blog-consolidation-map.mjs` — central retired-blog ownership map;
- `functions/src/notFoundRoute.ts` — server-side canonical redirects for retired blog routes;
- `vite.config.js` — build-time canonical internal-blog-link rewriting;
- `scripts/audit-blog-consolidation.mjs` — source/sitemap/RSS/redirect and rendered-output consolidation audit;
- `src/lib/routeSeoRegistry.js` — canonical/indexability metadata for static public routes;
- Firebase Hosting direct 301s for older static aliases;
- route-integrity and indexation checks later in the build.

## Important generated-file note

This GitHub editing session cannot execute the repository's Node/Vite build, so Brick 11 does not claim that the already-committed generated XML/RSS/LLM snapshots were regenerated inside this session. Instead, the generators were corrected and the production build now regenerates **and then audits** those outputs before deployment.

Therefore the source/build implementation is closed, while live-output verification remains part of the deployment and stabilization checks in Brick 15.

## Implementation commits

- `4ae98158de7a82206b55f2a72750eab821f2c0b8` — canonical topic-cluster link normalization
- `10c3ff590339bbf034e399b76e6982dc51013fe3` — retired-slug sitemap hardening
- `3ec31df080b2c9bbbb4f5624ade2a3067941696b` — canonical RSS/LLM discovery normalization
- `a61215dd6d658b60e4a08a3ff363722e85904882` — Brick 11 generated-artifact audit
- `879147373d2ba421befe57d395ee75aedf0c2b11` — final package/build wiring with original dependency versions preserved
- `9c67b75297aaf40ba3b9189b29cbfc729af86274` — Brick 11 Vitest regression guard

## Definition of done

Brick 11 is closed at the implementation layer because the recovery architecture now has one consistent technical path from source ownership → canonical internal links → regenerated discovery artifacts → pre-deployment audit → rendered-output checks.

No new SEO page was created. No recovery owner changed. No intentional ranking-page content was rewritten.

**Brick 11: CLOSED.**

Next recovery stage: **Brick 12 — Re-establish Authority Signals.**
