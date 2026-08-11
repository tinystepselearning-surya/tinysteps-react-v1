# Sitemap Canonical Consolidation — 2026-08-11

## Objective

Reduce genuine search-intent duplication without weakening existing Tiny Steps SEO, AEO, GEO, conversion pages, public games, parent resources, course pages, or the new CBSE/school authority cluster.

This implementation is intentionally more conservative than a slug-only audit. Repository source, current SEO tests, page content, existing GSC remediation decisions, and deployment behavior are treated as authoritative evidence.

## Protected architecture

The following classes remain unchanged in this phase:

- core money pages: `/phonics`, `/grammar`, `/speaking`, `/courses`, `/pricing`, `/book-demo`;
- `/contact`, which has distinct WhatsApp, phone, email and admissions-support intent;
- dedicated reading, writing, spoken-English, age/location and programme long-tail pages unless a future performance audit proves cannibalisation;
- public game category and individual game pages that existing SEO tests deliberately keep independently indexable;
- `/english-grammar-writing-classes` and `/public-speaking-communication-kids`, which existing SEO tests deliberately keep self-canonical;
- parent guides currently strengthened by the 2026-08-10 GSC remediation work;
- course detail pages;
- all current CBSE/school phonics authority articles and the `/for-schools` pathway;
- the existing weekly-blog archive policy: only the three approved evergreen weekly articles are sitemap-eligible; other weekly archives remain noindex.

No current canonical page is hard-deleted in this change.

## High-confidence canonical consolidations

Only four duplicate article intents are consolidated because the destination is materially stronger or the preferred canonical was already established by the recent GSC remediation work.

| Redirect source | Canonical destination | Reason |
|---|---|---|
| `/blog/child-reads-words-but-does-not-understand-story` | `/blog/why-child-reads-words-but-does-not-understand-story` | Same comprehension problem; destination is the substantially deeper canonical guide. |
| `/blog/how-long-does-phonics-take` | `/blog/how-long-does-it-take-child-to-learn-phonics` | Same duration question; destination is the more complete parent-facing answer. |
| `/blog/june-school-readiness-english-revision-plan` | `/blog/june-school-reopening-english-readiness-plan` | Recent GSC remediation explicitly selected the reopening guide as the durable school-readiness answer. |
| `/blog/why-child-answers-only-in-one-word` | `/blog/child-gives-one-word-answers` | Same one-word-answer problem; destination is the stronger canonical parent guide. |

Other apparent overlaps are deliberately **not** redirected yet when the source article contains more substantial material, has a distinct angle, or the repository already treats it as an intentional search lane. Those pairs require content-level merging and performance evidence before any future consolidation.

## Implementation contract

For every redirect source:

1. Source content remains in Git history/source control; no useful material is destroyed.
2. `/blog` does not advertise the retired source in cards, collection schema or blog schema.
3. Sitemap generation excludes the retired source.
4. Prerender source discovery excludes the retired source so no static HTML can shadow the server redirect.
5. RSS/feed generation excludes the retired source.
6. Production fall-through returns a real HTTP 301 to the absolute canonical Tiny Steps URL.
7. Canonical destination remains unchanged, self-canonical, indexable and eligible for sitemap/prerender.

## SEO / AEO / GEO protection

This change does **not** rewrite titles, descriptions, H1s, answer-first content, FAQs, schema, author/entity context or internal topic architecture on surviving canonical pages. It therefore consolidates duplicate discovery signals without replacing the content that currently carries authority.

The new CBSE/school authority cluster is explicitly protected by tests so it cannot accidentally enter the redirect policy or disappear from the public blog collection.

## Success criteria

The change is acceptable only when all of the following pass:

- root lint and TypeScript checks;
- root unit tests, including canonical-consolidation guard tests;
- Cloud Functions TypeScript build and unit tests;
- sitemap generation;
- prerender/build;
- route-integrity and indexability checks;
- GSC crawled-not-indexed regression audit;
- GSC archive-rendering audit;
- GSC index-target generation;
- SEO smoke tests;
- existing explicit self-canonical game/long-tail tests remain green;
- canonical redirect sources are absent from generated sitemap/blog collection/prerender discovery;
- canonical targets and CBSE authority slugs remain present and index-eligible.

## Deployment safety

Production deployment already deploys Cloud Functions before Hosting. This is important for this migration: the canonical redirect resolver becomes available before the new Hosting build removes prerendered copies of the four retired article URLs. The subsequent Hosting deploy then allows those paths to fall through to the redirect-aware function.

## Post-deploy verification

Verify each of the four old URLs returns HTTP 301 with the expected `Location`, then verify each destination returns 200 with its existing self-canonical, indexable robots directive and structured data. Confirm the regenerated sitemap does not contain redirect sources and that the CBSE/school authority articles remain discoverable.
