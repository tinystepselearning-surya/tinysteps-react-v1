# Tiny Steps — sitewide Search Console URL Inspection (read-only)

**Status:** First-phase engineering. This adds no website route, dashboard, cron job, indexing requests, hosting change or Google credentials. Do not merge until tests and production source comparisons are reviewed.

## Purpose and source of truth

Generate a complete *repository-known URL registry* by reconciling:
- `PUBLIC_ROUTE_MANIFEST` (including governed phonics, grammar and vocabulary pages);
- the four checked-in child sitemaps (static, blog, courses, parents);
- published blog source slugs and approved/noindex blog policy;
- Firebase Hosting redirects, explicit public redirects and retired blog aliases;
- concrete application `noindex` paths.

The registry records intended **index**, **redirect**, **noindex**, or **unclassified** state. Wildcard private routes are governed by the application manifest and are intentionally *not* enumerated as public pages. Sitemap-only URLs and sources missing from sitemaps are flagged for review; the registry is **not** proof of live Google indexing or origin health.

```bash
npm run gen:sitemaps
npm run seo:gsc-registry
npm run test:gsc-inspection
```

Outputs: `docs/seo/gsc-inspection/URL_REGISTRY.csv` and `URL_REGISTRY.json`. After inspecting, run `npm run seo:gsc-reconcile` to generate `artifacts/gsc-indexing-reconciliation.{csv,md}` with each URL's intended state, Google observation, mismatch and investigation action. The JSON also includes exact source references and any source/sitemap mismatches. Refresh these files on the target branch after site content changes. Check the production sitemaps separately: checked-in or locally generated sitemaps are not proof of deployed sitemaps.

## Google Cloud setup (the account owner performs this)

1. Open https://console.cloud.google.com/apis/library and choose/create a Google Cloud project. Enable **Google Search Console API** (not Google's separate Indexing API).
2. In OAuth consent configuration, register a desktop application/test user as required by Google's console. Use the Google account that is already authorized in Search Console for **`sc-domain:tinystepslearning.com`**. Authorization must include only `https://www.googleapis.com/auth/webmasters.readonly`. A service account can also work **only after** its identity is granted suitable Search Console property access.
3. Obtain a **short-lived OAuth access token using a trusted OAuth flow or Google Cloud CLI** on your computer. Never paste tokens, refresh tokens, private keys or service-account JSON into chats, GitHub, app code, public Firestore or browser variables. An API key alone does not authorize this private API.
4. Locally, set `GSC_ACCESS_TOKEN` in your private shell, then run the read-only inspection. For the optional Cloud CLI route, download your **Desktop OAuth client JSON to a location outside the repository** (for example `~/gsc-oauth-client.json`), then run `gcloud auth application-default login --client-id-file=$HOME/gsc-oauth-client.json --scopes=https://www.googleapis.com/auth/webmasters.readonly`. Google documents that non-Cloud OAuth scopes require a custom client ID. Once authorized, use `gcloud auth application-default print-access-token` to obtain the temporary access token. Keep the client JSON and token private.

```bash
npm run seo:gsc-inspect -- --dry-run --limit=10
# After private OAuth setup in your shell:
GSC_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)" npm run seo:gsc-inspect -- --limit=40
# Resume the same local output with:
GSC_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)" npm run seo:gsc-inspect -- --offset=40 --limit=40
```

The inspection client defaults to 40 new URLs per run and spaces requests by 1100 ms. Use `--all` only when Google quota allows; daily URL Inspection quotas are shared per property. The tool stops upon 401/403/429; no retry storm. Results and errors are saved to the ignored local file `artifacts/gsc-url-inspection-results.json` after each URL and are never automatically pushed or published.

## Interpretation, verification and next work

- The API reports **stored Google-index data**, not a live URL Test or a request to index.
- `indexed` means Google's API returned PASS; zero impressions are **not** equivalent to non-indexing.
- `crawl_error`, `crawled_not_indexed`, `discovered_not_indexed`, `excluded_other` remain separate categories.
- `indexable_missing_from_sitemap`, `nonindex_url_in_sitemap`, unexpected noindex, robots blocks and canonical disagreements require targeted verification.
- If a URL is genuinely unindexed, use GSC live test/manual inspection and local/rendered HTML checks; do **not** rewrite or change sitewide SEO based on stored API data alone.
- Preserve existing `seo:rendered-check`, `seo:route-integrity`, `seo:indexation-check`, `seo:indexability-report`, and the separate 202-URL ChatGPT hourly tracker. This is an additional GSC **index-decision** source, not a replacement for those systems.
- **Phase 2 (not enabled):** Once verified and approved, build an internal-only admin UI, an operator-reviewed mismatch report, and an optional scheduled read-only ingestion with protected server-side credentials. Keep these out of public client code and private dashboards until explicitly authorized.

Official docs:
- https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
- https://developers.google.com/webmaster-tools/v1/urlInspection.index/UrlInspectionResult
- https://developers.google.com/webmaster-tools/limits
