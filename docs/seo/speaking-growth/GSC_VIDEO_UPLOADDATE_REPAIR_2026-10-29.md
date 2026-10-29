# GSC VideoObject uploadDate repair — 29 October 2026

## Owner-observed Google Search Console warning
- URL: https://tinystepslearning.com/speaking
- Video: **Instant Storytelling Activity**, public YouTube ID `H-xTpL6tKWU`
- Two non-critical warnings about the **same** `uploadDate` value: invalid datetime and missing timezone.
- Report showed one valid video item and zero invalid video items; last observed crawl: 28 October 2026.

## Root cause
The previously published JSON-LD used `"uploadDate": "2026-04-09"` because the initial editorial record contained the video **premiere day** but not its precise instant. Google documents `uploadDate` as an ISO 8601 DateTime; a timezone-qualified full timestamp is recommended.

Official guide: https://developers.google.com/search/docs/appearance/structured-data/video

## Confirmed first-publication timestamp
On 29 October 2026, the owner supplied a public YouTube metadata report:
- Published / went public: **9 April 2026 at 06:58:46 UTC**.
- Live/premiere scheduled 06:58:31 UTC, started 06:58:46 UTC and ended 07:02:03 UTC.
- Video is public, 1:45 in length, and permits embedding.

The first-public timestamp matches the recorded premiere start. Correct schema value:
```json
"uploadDate": "2026-04-09T06:58:46Z"
```
This is a verified source value; it is not an arbitrary conversion of midnight or a Firestore creation date.

## Code and regression protections
- `src/lib/publicSpeakingVideoEvidence.ts` preserves the existing ID/title/description/thumbnail/embed/watch links and now includes the source-verified `publicationDateTime`.
- `normalizeVerifiedVideoPublicationDateTime` rejects invalid calendar dates, impossible times, and date-times without timezone.
- `src/tests/seo/publicSpeakingStaticVideoEvidence.spec.ts` requires the correct exact timestamp and rejects malformed dates.
- `scripts/verify-speaking-video-prerender.mjs` verifies actual static HTML contains exactly one relevant `VideoObject` with the required exact timestamp. The original Speaking canonical and class-sample discovery remain unchanged.
- For videos that lack trustworthy exact times, do not invent `00:00:00Z`; preserve the known day and record the remaining issue pending independent metadata.

## Validation / release
1. Run targeted unit tests, TypeScript and production build with the existing Issue #804 initial HTML workflow.
2. Merge after CI passes. Verify that the production `/speaking` HTML contains exactly one matching VideoObject with `uploadDate: "2026-04-09T06:58:46Z"`.
3. Validate the published URL in Google Rich Results Test.
4. In GSC, click **Validate Fix** for each warning and allow a Google recrawl. The chart may lag; an improvement in video ranking is not guaranteed.

## Separate class-samples follow-up
The dynamic class-samples gallery also accepts date-only verified upload dates for eligible clips. Only the single Speaking page was reported in the owner’s screenshots. Future gallery warnings should be resolved per-video using genuine first-public timestamps, never approximations or disabled playback.

## Status at code authoring
**Committed to fix branch; not proof of live deploy or GSC validation.** No change to the child's video, to the title or to the existing permission scope.
