# Blog SEO Program — B4 Editorial Cleanup

**Brick:** B4 — Editorial quality + template cleanup  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b04-editorial-cleanup`

## Changes

B4 adds a centralized normalization layer before posts reach the blog index/article UI.

### Week-series titles

Primary titles remove the non-search-useful leading `Week N:` / `Week N —` prefix while preserving the useful topic wording.

Example:

- before: `Week 10: Subject-Verb Agreement Rescue Plan`
- after: `Subject-Verb Agreement Rescue Plan`

The slug is unchanged, so this does not create URL churn. The normalized post also retains `seriesLabel` such as `Week 10 Roadmap`, allowing B5/UI work to display the series context separately rather than forcing it into the SEO/H1-leading title.

This is important because Search Console already shows real visibility for Week-series URLs: B4 improves title clarity without destroying the editorial series identity.

### Exposed template copy

Known internal/editorial artifacts are normalized into reader-facing text, including:

- `FAQ section with 5 parent questions` and numbered variants such as `11. FAQ section with 5 parent questions` → `Frequently Asked Questions`;
- raw internal route text such as `Explore grammar support: /grammar` → a readable internal markdown link;
- paragraphs containing several routes are cleaned globally rather than only when the whole block is one route;
- legacy bare `/?book=1` copy becomes a readable link to `/book-demo`.

B4 deliberately preserves the destination instead of simply deleting the raw path. `BlogPostPage` already renders markdown-style internal links, so the cleaned copy remains useful and navigable.

## Second-pass defects fixed

The initial B4 implementation was not sufficient:

1. it did not match numbered FAQ headings such as `7. FAQ section with 5 parent questions`;
2. it only cleaned a raw route when the entire block matched one narrow pattern, so real multi-route paragraphs escaped unchanged;
3. stripping `Week N:` removed all Week identity from the normalized post.

The hardened implementation fixes all three without rewriting factual article content.

## Scope boundary

B4 does not rewrite article bodies for style, evidence, factual depth or search-intent ownership. Those article-specific upgrades belong to B6–B9. B4 also does not change URLs, redirects, canonical policy or indexing policy.

## Validation

`src/tests/seo/blogEditorialCleanup.spec.ts` now checks both unit examples and the actual normalized 77-article registry. The registry gate verifies:

- no primary title still exposes a leading Week-series prefix;
- every Week-series slug retains secondary `Week N Roadmap` metadata;
- no known `FAQ section with N parent questions` template heading survives normalization;
- no known action-style raw internal route survives normalization;
- multiple raw routes in one paragraph are converted while preserving destinations;
- cleanup does not mutate source post objects.

## Completion gate

- [x] Week number is no longer the leading primary title text.
- [x] Week identity is retained as secondary series metadata.
- [x] Numbered and unnumbered FAQ template headings are removed.
- [x] Multi-route paragraphs are cleaned, not just single-route blocks.
- [x] Internal destinations are preserved as links rather than deleted.
- [x] URL slugs remain unchanged.
- [x] Cleanup is centralized and registry-tested.
- [x] No factual article claims are altered by the normalization layer.
