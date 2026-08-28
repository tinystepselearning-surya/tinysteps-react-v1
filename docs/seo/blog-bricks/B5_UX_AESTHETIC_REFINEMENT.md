# Blog SEO Program — B5 UX / Aesthetic Refinement

**Brick:** B5 — Blog UX / aesthetic refinement  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b05-ux-aesthetic-refinement`  
**URL/indexing changes performed by B5:** None

## Purpose

B5 turns `/blog` from a visually polished but over-layered landing page into a clearer help-library experience. The brick changes the index experience only. Article URLs, article bodies, canonical ownership, redirect policy, sitemap/indexing policy, and article templates remain outside B5.

## Problems found in the baseline

The previous index stacked too many discovery layers before and around the actual library:

1. hero search-intent routes;
2. a separate “Start here” block;
3. quick topic cards;
4. filter/search controls;
5. lead article;
6. another topic-lane panel;
7. a self-referential “why this page is easier to use” panel;
8. spotlight cards;
9. article library;
10. FAQ;
11. archive directory;
12. author block;
13. newsletter.

Additional UX issues:

- hero proof copy said `56+ curated parent articles` even though the isolated baseline registry contains 77 normalized posts;
- `Most Popular` and `Most Read` were exposed even though most posts do not have trustworthy popularity/read metrics;
- the default featured experience leaned on recency rather than the strongest known search-authority routes;
- article images were rendered as very thin `2.8:1` strips;
- topic controls wrapped into a large block rather than behaving like a compact mobile filter rail;
- several sections repeated the same navigation job.

## B5 design

### 1. Problem-first entry

The index now opens with five distinct parent jobs-to-be-done aligned with the finalized B2 ownership model:

- knows ABC but cannot read;
- knows letter sounds but cannot blend;
- right age to start phonics;
- grammar/sentence formation;
- understands English but does not speak.

Schools are offered a separate `/for-schools` route rather than being presented as another parent problem card.

### 2. GSC-backed authority shelf

The default featured shelf is curated in this order:

1. `satpin-phonics-guide`;
2. `phonics-for-parents-guide`;
3. `why-child-knows-letter-sounds-but-cannot-read-words`;
4. `child-gives-one-word-answers`.

These choices use the real Search Console evidence reviewed during B2 rather than pretending that “newest” or unpopulated popularity counters are a proxy for authority.

### 3. Search and filtering immediately before the library

The library has one search input and a horizontally scrollable topic rail. The filter buttons expose result counts and use `aria-pressed`. Search results are announced through an `aria-live` count.

Only incremental “Load more” expansion is used. The page does not force the full archive into the initial render.

### 4. Honest article count

The hero and author/trust section use the actual published registry count. No hard-coded `56+` proof claim remains.

### 5. Cleaner article cards

Cards use a readable `16:9` media ratio, consistent metadata, three-line excerpt cap, visible category/read-time/date/author information, keyboard focus states, and reduced-motion-safe hover behavior.

### 6. Reduced section duplication

B5 removes the old redundant quick-topic, lead-article, “top topic lanes,” “why this page is easier,” spotlight/archive duplication from the active index experience. The final structure is:

- hero;
- problem-first routes;
- authority guides;
- search/filter + library;
- parent FAQs + useful next routes;
- author/trust;
- newsletter.

## Compatibility strategy

The original public route module `src/pages/BlogPage.tsx` remains present and simply delegates to the new typed `src/pages/blog/BlogIndexPage.tsx`. This keeps the route import stable while avoiding a risky in-place rewrite of the legacy ~1,000-line component.

The new index continues to support:

- TypeScript blog posts;
- MDX discovery posts;
- search query persistence in the URL;
- blog/collection/FAQ/breadcrumb schema;
- existing article routes;
- existing parent hub, demo, games, schools, author, and newsletter routes.

## Validation gates

`src/tests/seo/blogIndexUx.spec.ts` verifies:

- the isolated registry still contains 77 posts;
- the published-count label is derived from the registry rather than stale copy;
- all four GSC authority slugs exist and remain evergreen;
- all five B2 parent-goal routes exist and remain distinct evergreen URLs;
- search includes body/FAQ text rather than title-only matching;
- topic + query filtering compose correctly;
- newest-first ordering is deterministic;
- unsupported `Most Popular` / `Most Read` labels are absent;
- the stable `BlogPage` module delegates to the B5 index.

## Scope exclusions

B5 does **not**:

- change a blog slug;
- add or remove a redirect;
- change canonical ownership;
- change robots/noindex behavior;
- change sitemap generation;
- rewrite article bodies;
- implement B1 audience metadata on this isolated branch;
- implement analytics attribution or popularity scoring.

Those remain separate bricks or integration concerns.
