# B0–B7 Blog SEO Integration

## Checkpoints

- Frozen independent-development baseline: `6ba6b988c0203e0641eb149bc18b9e6962f79cd7`
- Current-main base used for integration: `9f5e4082818e4b778804d9a5e7d84af51fb75702`
- Integration branch: `seo/blog-b00-b07-integration`

## Verified source heads

| Brick | Source head |
| --- | --- |
| B0 | `98c7eea1e63422c729ff2107254f0df895b3d77d` |
| B1 | `5a18d936558e76814df8cdcc74cd3c05d64585ae` |
| B2 | `1f20008db1c8d48796942f5e1b025bb83c82b25b` |
| B3 | `2a5472e7f48d2e950d2cc2b98c45fc2e5812b25c` |
| B4 | `be380c73732d15987f662d9cac5f0a0798dc6c1d` |
| B5 | `4b655d3bea3ff9f36b38105a3097ecb20b69cb8e` |
| B6 | `419dc58a374c8bdd505e8f055006edffc82e3766` |
| B7 | `10dc68c8575131b3056050d2260b4aae2d43b897` |

All heads matched their required remote refs before integration. Each brick's commits were replayed in B0→B7 order onto the current-main base rather than merging the independently based branches.

## Reconciliation decisions

- `src/content/blog/types.ts` retains B1 `audience`/`discoveryCategory`, B4 `seriesLabel`, and B7's explicit optional `modifiedDate` contract.
- `src/content/blog/index.ts` applies weekly enrichment, B4 editorial cleanup, category/date/hero normalization, and then B1 audience/discovery enrichment. No transformation replaces another.
- `src/pages/BlogPage.tsx` delegates to the B5 typed index. Current `main` had no independent delta from the frozen baseline in this file, so no newer behavior was displaced.
- `functions/src/notFoundRoute.ts` retains the current-main implementation and adds only B3's direct retired-source redirect intent through the shared consolidation map.
- B2's `reading-confidence` cluster was advanced from `merge-planned` to `protect-existing-consolidation` after B3 merged the unique source material and retired the duplicate. This leaves zero pending merges and protects the completed lineage.
- Count-based regression assertions now distinguish the historic B0 inventory (77 sources before B3) from the integrated registry (76 live sources after B3, 12 retired redirect sources).
- Generated blog sitemap and RSS discovery outputs were refreshed after consolidation; retired sources are absent and active owners remain present.

## Final SEO contracts

- Live blog registry: 76 posts; 52 page-indexable; 51 expected in the generated sitemap, with `spoken-english-classes-for-kids-confidence` intentionally excluded.
- Retired confidence source: `/blog/how-tiny-steps-builds-reading-confidence`.
- Direct canonical owner: `/blog/how-phonics-builds-reading-confidence`.
- Redirect is permanent and direct; the retired source is absent from the post registry, sitemap and RSS feeds.
- B2 preserves the ABC/decoding versus letter-sounds diagnostic distinction, the blending explainer versus activity distinction, and SATPIN authority.
- B6 preserves exactly seven GSC-prioritised parent authority roles and creates no new URL.
- B7 maps founder content to Priya as a `Person` linked to `/team`; team/research content maps to Tiny Steps Learning as an `Organization`. Evidence counts derive from actual external URLs, zero-source pages make no research claim, corrections route to `/contact`, and `modifiedDate` is optional rather than inferred from publication.
- B5 provides crawlable category discovery, search/filtering, URL synchronization, accessible controls and a static normalized registry without runtime database reads.

## Validation

Validated locally with Node `v22.22.1` unless noted:

- B0 baseline audit: passed on the integrated 76-source state.
- B2 intent ownership audit: passed; 18 clusters, zero unresolved decisions, zero pending merges, five protected consolidation lineages.
- B3 consolidation audit, source and rendered: passed; 12 retired intents and canonical sitemap/RSS ownership.
- Targeted B0–B7 SEO suite: 9 files, 44 tests passed.
- `npm run lint`: passed with 0 errors and 12 pre-existing warnings outside this diff.
- `npm run typecheck`: passed.
- `npm test`: 236 files and 1,473 tests passed; 12 files and 95 tests skipped by their existing environment gates.
- `npm --prefix functions run build`: passed.
- `npm --prefix functions test`: 51 files and 379 tests passed; 2 files and 25 tests skipped by their existing environment gates.
- `npm run build`: passed, including 166/166 prerenders, rendered consolidation, route integrity, 165/165 indexability, GSC policy audits, bundle checks and public-fact/offer consistency.
- `npm run seo:smoke`: passed.

The first root-suite attempt under host Node 25 exposed its incompatible global `localStorage` behavior; the unchanged failing storage tests passed under the repository's installed Node 22 runtime.

## Scope boundary

B8 was not started, replayed, rebased, merged, deleted or modified as part of this integration.
