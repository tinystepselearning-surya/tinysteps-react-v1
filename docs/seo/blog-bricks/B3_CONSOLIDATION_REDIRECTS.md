# Blog SEO Program — B3 Consolidation & Redirect Safety

**Brick:** B3 — Merge / redirect / archive cleanup  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b03-consolidation-redirects`

## Final B3 scope

B2 now has final URL ownership decisions, so B3 does not re-decide search intent. It implements the remaining consolidation mechanics while preserving existing search equity.

The final B3 changes are:

1. merge the useful Tiny Steps-specific material from the duplicate reading-confidence article into the canonical generic guide;
2. retire the duplicate source only after that merge;
3. add the retired reading-confidence URL to the central consolidation map and server 301 fallback;
4. let sitemap/RSS generation and the Vite internal-link canonicalizer remove the retired URL from discovery outputs;
5. preserve the existing Firebase Hosting 301 for the English-speaking hesitation duplicate;
6. remove the earlier B3 attempt to add a redundant page-level `noindex` for that already-redirected speaking URL;
7. keep Week-series noindex policy limited to the supporting weekly pages already governed by `blogIndexingPolicy.js`.

## Reading-confidence consolidation

### Canonical owner

`/blog/how-phonics-builds-reading-confidence`

### Retired source

`/blog/how-tiny-steps-builds-reading-confidence`

The canonical owner now preserves the branded article’s genuinely useful material, including:

- aligning parent correction language with the teacher;
- mirroring a class-to-home sound → blend → decodable line → spelling-transfer sequence;
- using weekly teacher/parent progress notes to set one micro-goal;
- explicit stage placement and stage-matched decoding;
- parent updates tied to observable reading behaviour;
- a confidence-reset / temporary level-adjustment and focused-revision approach when the child stalls.

Only after those signals were merged was the duplicate source removed.

The central consolidation map now contains:

`/blog/how-tiny-steps-builds-reading-confidence`
→ **301** →
`/blog/how-phonics-builds-reading-confidence`

The same mapping is present in `functions/src/notFoundRoute.ts`, matching the repository’s existing 11 retired-blog redirect mechanism. The Vite build-time canonicalizer consumes the central map, so internal source links to the retired path are rewritten to the owner during build.

## English-speaking hesitation

The earlier B3 implementation treated `spoken-english-classes-for-kids-confidence` as a noindex overlap. The final B2 research showed that this is unnecessary and potentially confusing because Firebase Hosting already has a permanent redirect:

`/blog/spoken-english-classes-for-kids-confidence`
→ **301** →
`/blog/child-understands-english-but-does-not-speak`

B3 therefore restores `src/lib/blogIndexingPolicy.js` to its weekly-support responsibility and does **not** model this redirect source as a page-level noindex URL.

## Weekly supporting pages

B3 preserves the current policy:

- Week 1 phonics, Week 7 grammar and Week 12 speaking remain the reviewed indexable weekly authority pages;
- other Week-series pages remain public but noindex/sitemap-excluded;
- this includes Week 4 long vowels and Week 5 R-controlled vowels, whose evergreen concept owners remain indexable.

No Week 4/5 deletion or redirect is introduced.

## Generated discovery cleanup

The repository’s existing build sequence already provides the correct cleanup path:

- `generate-rss.mjs` reads current blog sources and rewrites retired paths through `blog-consolidation-map.mjs`;
- `generate-sitemaps.js` generates the current sitemap;
- `audit-blog-consolidation.mjs` then rejects retired URLs in sitemap/RSS;
- Vite rewrites retired internal blog paths through the same consolidation map;
- the rendered consolidation audit rejects retired paths in built HTML/JS.

B3 extends that existing mechanism instead of introducing a second redirect architecture.

## Validation guards

### Unit-level source guard

`src/tests/seo/blogConsolidationSource.spec.ts` validates before build that:

- the branded reading-confidence source is gone;
- its redirect points to the generic owner;
- the unique Tiny Steps method signals survived the merge;
- the server fallback contains the new 301 mapping;
- the existing speaking Firebase Hosting redirect remains a 301;
- the speaking redirect source is not duplicated in page-level noindex policy.

### Indexing policy test

`src/tests/seo/blogIndexingPolicy.spec.ts` validates that:

- the 3 approved weekly authority pages remain indexable;
- Week 4, Week 5 and other supporting weekly pages remain noindex/sitemap-excluded;
- a real redirect source is not represented as a noindex page;
- evergreen owners remain indexable.

### Build/rendered consolidation guard

`scripts/audit-blog-consolidation.mjs` now additionally validates:

- all central retired sources are absent as current posts;
- every destination exists;
- every central retirement has a server 301 mapping;
- retired paths do not leak into generated sitemap/RSS;
- the reading-confidence owner contains the required merged material;
- the speaking Firebase Hosting redirect remains correct and permanent;
- the speaking redirect source does not leak back into noindex policy;
- rendered HTML/JS contains no retired internal blog paths.

## Completion gate

- [x] B2 ownership decisions are implemented rather than re-decided.
- [x] Reading-confidence unique content is merged before retirement.
- [x] Reading-confidence duplicate source is removed.
- [x] Reading-confidence permanent redirect is added to the existing consolidation architecture.
- [x] Internal-link/sitemap/RSS cleanup is enforced by the build pipeline.
- [x] Existing English-speaking Hosting 301 is preserved.
- [x] Redundant speaking noindex logic is removed.
- [x] Week 4/5 supporting pages remain public noindex pages; no destructive redirect is introduced.
- [x] Source-level and rendered consolidation regression guards are in place.
- [ ] Exact-head full CI must pass before B3 is marked merge-ready and kept aside.

## Handoff

After exact-head CI is green, B3 can be frozen as merge-ready. B4 may then proceed with editorial sanitation/retitling without reopening B2/B3 URL ownership decisions.
