# B10 — Technical SEO, GEO, and LLM Authority

## Goal

Make the editorial authority established in B0–B9 technically explicit to search engines and answer systems without creating new content URLs, changing intent ownership, or adding unsupported claims.

## Baseline entering B10

- B9 is merged to production main.
- Live blog inventory remains 76 articles.
- B2 intent ownership, B6 parent phonics authority, B7 authorship/trust, B8 first-party teaching knowledge, and B9 Grammar/Speaking authority are already established in content.
- Existing site-wide AEO/GEO foundations already include `llms.txt`, AI/search crawler rules in `robots.txt`, Organization/WebSite/WebPage schema, Quick Answer sections, RSS feeds, sitemap generation, prerendered HTML, and indexability checks.

## Technical gaps found

1. **BlogPosting entities were not connected by stable IDs.** Individual article schema had a URL but no durable `#article` identity and its `mainEntityOfPage` did not reference the existing `#webpage` identity emitted by the shared WebPage schema.
2. **The B2/B6/B9 authority graph existed mainly in prose and internal links.** Search engines could infer it, but article schema did not explicitly expose topical `about`, `keywords`, audience, or the established authority cluster.
3. **The Blog index schema was broader than the indexable search corpus.** It described every published article in its Blog/Collection JSON-LD even when a Week/support page was intentionally `noindex`.
4. **External evidence was visible but not explicitly connected to BlogPosting schema.** B7 already guards real evidence; B10 exposes only URLs that are actually present in visible body/FAQ content.
5. **`llms.txt` documented phonics and schools strongly but did not yet encode the Grammar/Speaking authority structure established by B9 or the protected diagnostic distinctions established by B2.**

## B10 implementation

### Stable blog entity graph

- Blog: `https://tinystepslearning.com/blog#blog`
- Blog collection: `https://tinystepslearning.com/blog#collection`
- Article: `https://tinystepslearning.com/blog/<slug>#article`
- WebPage: `https://tinystepslearning.com/blog/<slug>#webpage`
- Site: existing `https://tinystepslearning.com/#website`
- Publisher: existing `https://tinystepslearning.com/#organization`

Every generic BlogPosting now connects to the Blog, its WebPage, publisher, audience, and topical `about` entities.

### Machine-readable authority registry

`src/content/blog/shared/technicalAuthority.ts` encodes only the already-established authority owners from B2/B6/B9 plus selected school authority pages. It is not a canonical or redirect registry and does not alter page ownership.

Protected distinctions include:

- ABC knowledge without reading ≠ letter sounds without word reading
- blending-stage explainer ≠ blending activities
- grammar rule transfer ≠ sentence formation
- understands English but does not speak ≠ one-word answer expansion
- editorial problem guides ≠ commercial program pages

### Indexability-aligned Blog schema

The visible blog can still present the full published library, but Blog/Collection JSON-LD now enumerates only articles that the established indexing policy allows search engines to index. This removes a mixed machine signal without changing the UI or any page's robots policy.

### Evidence connection

When a blog post visibly contains an external `https://` source URL, BlogPosting schema exposes that same URL through `citation`. No source is invented and Tiny Steps internal links are excluded.

### LLM authority map

`public/llms.txt` now names the preferred editorial owners for parent phonics, Grammar, Speaking & Communication, and school implementation questions, and explicitly explains the protected intent boundaries so answer systems do not collapse distinct articles.

## Deliberately unchanged

- live blog URLs: 76 → 76
- new blog URLs: 0
- removed blog URLs: 0
- canonical policy: unchanged
- redirects: unchanged
- sitemap generation: unchanged
- RSS generation: unchanged
- robots private-route policy: unchanged
- indexability policy: unchanged
- hero assets/families: unchanged
- B2/B6/B7/B8/B9 content ownership: unchanged
- commercial landing-page ownership: unchanged

## Validation contract

B10 guardrails verify that authority slugs remain live/indexable, retired duplicates are excluded, stable IDs are deterministic, article and collection schema use the authority graph, the machine-readable blog corpus follows the established noindex policy, `llms.txt` exposes the authority owners and intent boundaries, private crawler blocks remain protected, RSS discovery remains present, and earlier brick/SEO checks stay green.
