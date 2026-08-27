# Blog SEO Program — B3 Consolidation & Redirect Safety

**Brick:** B3 — Merge / redirect / archive cleanup  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b03-consolidation-redirects`

## Decision

B3 does **not** add evidence-free 301 redirects for the unresolved B2 clusters. The repository already contains 11 historical redirect consolidations; those remain untouched.

Instead, B3 fixes one concrete policy defect discovered by B0/B2:

`spoken-english-classes-for-kids-confidence` was excluded from the generated sitemap but was not covered by article-page noindex policy. That meant sitemap policy and page robots policy could disagree.

## Safe correction

`src/lib/blogIndexingPolicy.js` now contains a shared `NOINDEX_BLOG_SLUGS` set.

The overlapping speaking-confidence page is:

- still available to users;
- explicitly `noindex` at article-page level;
- excluded from sitemap through the same shared policy;
- not redirected until performance evidence confirms a merge winner.

This is reversible and avoids guessing which URL should inherit historical search equity.

## Why no new 301 yet

B2 still requires GSC/analytics validation for:

- parent letter-sounds/ABC cannot-read overlap;
- reading-confidence overlap;
- English-speaking hesitation overlap.

A 301 is a stronger/destructive SEO decision than noindex differentiation. The final integration review should approve those only after page/query performance is known.

## Validation

`src/tests/seo/blogIndexingPolicy.spec.ts` locks:

- the 3 approved weekly authority pages remain indexable;
- other Week-series pages remain noindex and sitemap-excluded;
- nonweekly overlap pages cannot be sitemap-excluded while remaining indexable;
- ordinary evergreen winners remain indexable.

## Completion gate

- [x] Existing redirect architecture is preserved.
- [x] Sitemap/page-robots split-brain state is removed for the known speaking overlap.
- [x] No evidence-free redirect is introduced.
- [x] No source article is deleted.
- [x] Reversible cleanup is preferred until GSC evidence is available.
