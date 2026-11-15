# Tiny Steps IndexNow production setup

Tiny Steps uses IndexNow to notify participating search engines about recently added, updated, or removed canonical public pages after a successful Firebase Hosting production deployment.

## Required GitHub Actions secret

Create one repository Actions secret named INDEXNOW_KEY (8–128 letters, numbers, or dashes). Do not commit the key to the repository.

The production build writes the root ownership file under dist. Firebase Hosting publishes that file at https://tinystepslearning.com/.

The deployment job already has GitHub contents: write permissions. The IndexNow step passes its scoped GITHUB_TOKEN to maintain the ci/indexnow-submitted state branch. No additional GitHub PAT or external service is needed.

## Production sequence

On a push to main, only when an existing CI impact assessment requires a Hosting deployment:

1. The production build and Firebase staging/live deployment follow the existing workflow, unchanged.
2. npm run indexnow:verify verifies the published IndexNow ownership key.
3. npm run indexnow:submit loads the canonical sitemap URLs and fingerprints the SEO metadata and visible prerendered page content. It excludes script bundles, layout classes, and styling from fingerprints.
4. The script reads the last *successfully submitted* URL-to-fingerprint baseline from indexnow-submitted-state.json on the separate ci/indexnow-submitted GitHub branch.
5. Only added, substantively modified, and removed sitemap URLs are notified, using **one HTTPS GET IndexNow request per URL**, 300 ms apart, with retries for transient 429/5xx/network failures. The existing api.indexnow.org endpoint, host and root keyLocation remain supported.
6. Only after *all* requests return HTTP 200 or 202 is the baseline updated. A failed or interrupted run does not advance the state; a workflow-job rerun or later Hosting deployment can retry.

On the first deployment after this migration, no prior baseline exists, so the script **records the current state without resubmitting historical URLs**. The previous integration already supplied those URLs. Future deployments send only changes. The original XML sitemap remains the comprehensive search-engine discovery mechanism.

A Hosting-independent Firestore or CMS content update does not trigger this deployment-only workflow. Those changes require their own publish hook if added in the future.

## Failure behaviour and noninterference

- No changes to page content, canonical URLs, sitemaps, Firebase Functions, Firestore rules, website routing, or Hosting artefacts.
- The IndexNow state is tracked on an isolated GitHub branch; it is **not** written to the public website or production branch.
- Public canonical URLs absent from local prerender output are still tracked for additions/deletions, with a warning; unchanged missing pages are not repeatedly submitted.
- If GitHub state is malformed or inaccessible, fail explicitly rather than silently submitting the entire sitemap.
- If a submission fails, Hosting stays deployed, but the post-deploy IndexNow step fails and does **not** falsely record notifications as delivered.
- No IndexNow requests are made when INDEXNOW_KEY is unset, preserving the existing opt-out.
- Individual notifications contain only canonical public URLs. Neither GITHUB_TOKEN nor any GitHub state data is sent to IndexNow.

## Testing

Run: node --test scripts/test/indexnow-change-detection.node-test.mjs

Tests cover new/changed/deleted/unchanged pages, fingerprint stability under cosmetic changes, sitemap deduplication/host restrictions and invalid state rejection.

## Verification

After approval and merge:

1. Confirm the existing Hosting deployment and live key verification succeed.
2. Confirm the first run creates ci/indexnow-submitted and logs baseline creation without an all-URL submission.
3. Make one controlled, visible content edit to an indexable page on a later deployment; confirm exactly that canonical URL is notified, assuming no other public content changed.
4. Run another Hosting deployment with no meaningful public-page changes; confirm zero requests.
5. Verify IndexNow activity in Bing Webmaster Tools over the following days.

An HTTP 200/202 confirms receipt, not crawling, indexing, ranking, or Copilot citations.

## Key rotation

1. Update the INDEXNOW_KEY GitHub Actions secret with a new compatible key.
2. Deploy main again. The build publishes and verifies the new ownership file.
3. If the deployment contains no page changes, the existing state prevents duplicate URL notifications. Send a new legitimate page update if you need to verify the new key via IndexNow.

Avoid deleting or resetting ci/indexnow-submitted without reviewing its baseline: deleting it creates a one-time fresh baseline and intentionally skips old URLs.
