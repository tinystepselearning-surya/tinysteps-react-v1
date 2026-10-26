# Issue #804: existing YouTube video metadata integration (26 October 2026)

## Purpose and verified limitation

Tiny Steps already stores YouTube links, approved display titles, descriptions, categories, active flags, thumbnails derived from YouTube IDs, and Firestore creation dates. `/class-samples` renders these from public-active Firestore records on the client.

The original YouTube *upload/publication* date was **not** an admin data field and was **not** emitted in the existing `VideoObject`. Firestore `createdAt` is the date of the website database record, **not** evidence of a video's YouTube upload date. Do not backfill it or guess dates.

This small change adds an optional `youtubeUploadDate` field in YYYY-MM-DD format, read from the **existing YouTube video's original Studio date** by an authorized owner. It does not fetch YouTube metadata through an unauthenticated API. It preserves existing video IDs, URLs, active status, click-to-play embeds, title, summary, featured flag, category and thumbnails.

## Rendered/metadata behavior

- The displayed thumbnail remains YouTube `hqdefault.jpg` associated with the canonical video ID.
- The video's canonical watch URL takes precedence over a conflicting legacy stored video ID to prevent linking to a different video than the embedded player.
- The gallery schema draws from all active clips, independently of the visitor's filter choice.
- A complete `VideoObject` is emitted in the client only when that clip has a valid recorded YouTube upload date and usable title, description and ID. Legacy clips still render and play even if no date has been reviewed; no fictitious `uploadDate` or incomplete VideoObject is published.
- The gallery **continues** to fetch on mount. Its initial prerendered HTML does **not** contain per-clip video markup or full metadata. Do not claim that dynamic SEO markup solves initial-HTML crawlability. A separate approval-gated static publication manifest could be considered for independently consent-cleared *public* videos after verification.
- No new video links or IDs were hardcoded, and no unlisted link, private child recording or parent data was copied to source.

## Owner verification needed

For each existing active Communication/Public Speaking video, open the record in admin and check its YouTube Studio original publication date. Enter the exact YYYY-MM-DD date **only after verifying it**. Check that it is playable in the website's embed. Independently confirm guardian consent for public website/YouTube distribution before leaving active or using for SEO. A shared Unlisted link must not be assumed approved for public search/schema inclusion.

These steps cannot be inferred by CI. There is no production Firestore write or public-visibility change in this PR.

## Test and release

- Run `npx vitest run src/tests/lib/classSamplesVideoMetadata.spec.ts`.
- Run `npm run typecheck`, existing class-samples and Speaking SEO test suites, and production build/rendered-page checks on final head.
- Verify legacy samples still play and render thumbnails even with missing optional date.
- Verify the database admin edit preserves all existing fields and does not activate unpublished or unauthorized clips.
- Validate real eligible video structured data with Google's Rich Results Test after owner-supplied verified dates and approval. Do not promise AI citation/ranking improvement.

Ref: https://developers.google.com/search/docs/appearance/structured-data/video
