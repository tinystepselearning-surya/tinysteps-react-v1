# Tiny Steps IndexNow production setup

Tiny Steps uses IndexNow to notify participating search engines after a successful Firebase Hosting production deployment.

## Required GitHub Actions secret

Create one repository Actions secret:

- `INDEXNOW_KEY`

Use an IndexNow-compatible key containing 8-128 letters, numbers, or dashes. Do not commit the key to the repository.

The production build writes the required root ownership file to `dist/<key>.txt`. Firebase Hosting publishes that file at the root of `https://tinystepslearning.com/`.

## Production sequence

On a push to `main`, after the existing CI and Firebase production deployment succeed:

1. `npm run build` writes the IndexNow ownership file when `INDEXNOW_KEY` is available.
2. Firebase Hosting publishes the ownership file with the rest of `dist`.
3. `npm run indexnow:verify` checks the live ownership file and requires its contents to match the configured key.
4. `npm run indexnow:submit` reads the canonical URLs from `dist/sitemap.xml` and its child sitemaps.
5. URLs are deduplicated, restricted to `tinystepslearning.com`, and submitted to `https://api.indexnow.org/indexnow` in batches of at most 10,000 URLs.
6. The IndexNow request includes the explicit root `keyLocation` and retries transient HTTP 429/5xx failures.

The workflow never submits private `/parent`, `/teacher`, `/kids`, `/surya`, or other noindex application routes because the URL source is the canonical public sitemap set.

## Verification

After the first production deployment with `INDEXNOW_KEY` configured:

- Open Bing Webmaster Tools.
- Select `tinystepslearning.com`.
- Open **IndexNow**.
- Confirm that submitted URLs begin appearing.

IndexNow confirms discovery of changed URLs; it does not guarantee crawling, indexing, ranking, or Copilot citation selection.

## Key rotation

To rotate the key:

1. Replace the `INDEXNOW_KEY` GitHub Actions secret with a newly generated compatible key.
2. Deploy `main` again.
3. The build publishes the new ownership file, the verification step confirms it, and subsequent submissions use the new key.
