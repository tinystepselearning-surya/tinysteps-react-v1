# Blog SEO Program — B4 Editorial Cleanup

**Brick:** B4 — Editorial quality + template cleanup  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b04-editorial-cleanup`

## Changes

B4 adds a centralized normalization layer before posts reach the blog index/article UI.

### Week-series titles

Primary titles now remove the non-search-useful `Week N:` prefix at runtime.

Example:

- before: `Week 10: Subject-Verb Agreement Rescue Plan`
- after: `Subject-Verb Agreement Rescue Plan`

The slug is unchanged, so this does not create URL churn.

### Exposed template copy

Known internal/editorial artifacts are normalized into reader-facing text, including:

- `FAQ section with 5 parent questions` → `Frequently Asked Questions`
- raw route copy such as `Explore grammar support: /grammar`
- raw booking query copy such as `/?book=1`

This protects all current posts through one editorial layer instead of fixing only the two examples discovered during the audit.

## Scope boundary

B4 does not rewrite article bodies for style or factual depth. It removes obvious template leakage and improves primary title language. Article-specific upgrades belong to B6–B9.

## Validation

`src/tests/seo/blogEditorialCleanup.spec.ts` locks title cleanup, template-heading cleanup, raw-route cleanup, and non-mutation of source post objects.

## Completion gate

- [x] Week number is no longer the leading primary title text.
- [x] Known raw editorial/template instructions are not exposed verbatim.
- [x] URL slugs remain unchanged.
- [x] Cleanup is centralized and testable.
- [x] No factual article claims are altered by the normalization layer.
