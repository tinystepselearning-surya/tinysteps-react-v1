# Issue #804 — Prerendered Public Speaking video evidence

## Source-backed approval context — 26 October 2026

This change concerns ONE already published Public YouTube video, linked from a single existing Tiny Steps admin Firestore record:

- Site admin entry: `Instant Storytelling Activity`, `Communication`, ages 4–6, 1 minute 45 seconds, `Active`, full class-specific description.
- YouTube Studio channel screenshot supplied by owner on 26 October 2026: the matching storytelling video is `Public`, with `9 Apr 2026` shown as `Premiered`.
- The school owner confirms the child's parents were informed and agreeable to using the recording on Tiny Steps' public commercial pages.
- **Consent documentation caveat:** The owner says there is no retained digital/written consent record. This is an owner-reported approval, **not an independently verified guardian permission artifact**. Do not describe it as written consent or publish a parent identity in this repo. Retrospective minimal publication authorization notes, maintained by the school in restricted storage, would improve governance without collecting unnecessary details.
- Do not equate the YouTube first-publication/premiere date with the file's upload or Firestore record creation date.

## Technical change

- Source-of-truth: `src/lib/publicSpeakingVideoEvidence.ts` explicitly curates only this Public, owner-approved clip.
- Existing `/speaking` route receives a focused static class excerpt section with genuine admin title/description, link to the Public YouTube watch page, thumbnail, native discoverable iframe `src`, and `VideoObject` JSON-LD using the YouTube Studio premiere date, video duration and watch/embed URLs. No new route, sitemap, robots, canonical, ranking, review, or outcome claim.
- Existing `/class-samples` route gets a static explanatory link to the Speaking evidence section, retaining every existing Firestore gallery card, categories, admin controls, and parent experience. The initial HTML links to the video evidence without a duplicate gallery card.
- The URL intentionally becomes part of the **public** site source and HTML. This is additional search visibility, not merely sharing an unlisted URL. It must be disabled if the child's guardian later withdraws or narrows permission.

## Evidence / release verification

- Unit tests assert precisely which known Public YouTube video and first-publication date are used and validate schema refusal for invalid metadata.
- A separate no-JS assertion reads `dist/speaking/index.html` and `dist/class-samples/index.html` after Playwright prerender, checks an actual iframe `src`, thumbnail `src`, watch URL, visible class title/description, canonical and exactly one structured VideoObject with matching first publication date.
- Existing SEO tests, TypeScript and full production build must pass on the final PR SHA. Ensure browser-level mobile playback works after release.
- Do not claim guaranteed Google video rich results or ChatGPT/Google AI recommendation improvements. Re-run native-source Q7 separately.
- The distinct commercial owner `/spoken-english-classes-for-kids-online` remains unchanged.

## Rollback

Revert the static Speaking component and public-video manifest import. The original `/class-samples` Firestore gallery, YouTube hosted files, private class recordings and data are untouched.
