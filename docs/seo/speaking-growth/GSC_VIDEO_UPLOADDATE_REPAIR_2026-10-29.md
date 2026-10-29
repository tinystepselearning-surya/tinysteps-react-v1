# Search Console VideoObject uploadDate warnings — 29 October 2026

## Reproduced from owner screenshots

- URL: https://tinystepslearning.com/speaking
- Video: **Instant Storytelling Activity** (YouTube `H-xTpL6tKWU`)
- GSC: **Invalid datetime value for "uploadDate"** and **Datetime property "uploadDate" is missing a timezone**.
- Both observations refer to the **same video**; GSC shows one valid video item, zero invalid video items, and two non-critical warnings.
- Last reported crawl: 28 October 2026.

## Root cause and source integrity

`src/lib/publicSpeakingVideoEvidence.ts` stores the verified **publication day** `2026-04-09`, based on the owner's 26 October YouTube Studio screenshot showing "Premiered 9 April 2026".

The day does **not** disclose the actual hour, minute, second or UTC offset. Google's VideoObject guidance requires an ISO 8601 **DateTime** for `uploadDate` and recommends a timezone. Adding `T00:00:00Z` (or an arbitrary local time) would invent an unsupported first-publication instant and is prohibited.

Official requirements: https://developers.google.com/search/docs/appearance/structured-data/video

## Prepared code change

- `PUBLIC_SPEAKING_VIDEO_EVIDENCE` accepts optional `publicationDateTime` **only when separately source-verified**.
- `normalizeVerifiedVideoPublicationDateTime` rejects date-only, missing timezone, bad calendar date, invalid time or invalid offset.
- `createPublicSpeakingVideoObject` uses the verified DateTime if supplied and otherwise retains the established date-only source. This preserves the **currently valid** VideoObject and avoids degrading site discoverability.
- Tests cover success, invalid inputs, and no fabricated fallback. The prerender verifier prints a warning while date-only metadata remains.

**Current state: PREPARED, NOT RESOLVED.** No verified exact publication time was found in the repository or accessible public sources. This branch intentionally does not pretend that the two GSC warnings are solved.

## Required evidence to complete this issue

1. Look up the **exact publishedAt timestamp** for `https://www.youtube.com/watch?v=H-xTpL6tKWU`, preferably from YouTube Data API `videos.list(part=snippet,id=H-xTpL6tKWU)` for a public video. Record the returned `snippet.publishedAt` (UTC ISO 8601) and confirm it belongs to the correct video. A reputable viewer of the YouTube Data API may also display this public field. If a premiere, reconcile against any actual public premiere time.
2. Check it against the known Studio premiere date; if it seems inconsistent, investigate timezone and visibility history before publishing metadata.
3. Record the authoritative source and exact observed timestamp in this document.
4. Add `publicationDateTime: 'VERIFIED_TIMESTAMP'` immediately after `publicationDate` in the single-video manifest. Replace the placeholder with the real evidence-based value.
5. Update the expected `uploadDate` values in `src/tests/seo/publicSpeakingStaticVideoEvidence.spec.ts` and the expected timestamp in `scripts/verify-speaking-video-prerender.mjs` (which must then require the exact value). No other metadata, video ID, thumbnail, canonical URL or gallery logic should change.
6. Run targeted unit tests, TypeScript, a production build, and prerender validation. Check the built `dist/speaking/index.html` contains exactly one correct `VideoObject`.
7. After merging and deployment, test the live page in Google's Rich Results Test, then click **Validate Fix** for each GSC warning. Allow time for recrawl.

## Separate gallery consideration

`src/lib/classSamples.ts` also currently emits date-only `VideoObject.uploadDate` for eligible gallery entries. These warnings currently identify only the Speaking URL. If Google later flags `/class-samples`, apply the same source-verified timestamp principle to the corresponding video(s), without guessing timestamps, suppressing playable videos, or changing Firestore access rules.

## Release guardrails

- No new route, new video, fabricated date/time, change to `/speaking` canonical, video title or text.
- No destructive update to class-sample admin data.
- Do not merge an incomplete “warning resolved” claim. Preserve the existing indexable markup until the exact time is verifiable.
