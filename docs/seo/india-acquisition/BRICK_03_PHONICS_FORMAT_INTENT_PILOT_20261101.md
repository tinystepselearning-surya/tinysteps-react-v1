# Brick 3/10 — Phonics commercial recovery: first isolated pilot

**Prepared:** 2026-11-01 IST. **Tracks:** #838.  
**Owner constraint:** Google Search Console manual URL Inspection and Google-selected canonical checks are **deferred until after Brick 10**. Do not infer live index/crawl state from this source-only pilot.

## Evidence / hypothesis
The existing Phonics owner at `/phonics` already targets the main online-class intent and offers 1:1 demonstration, course progression, specialist fees and comparison links, class samples and parent progress information. Broad content/metadata rewriting risks unnecessary disruption.

Prior reviewed GSC query evidence measured commercial Phonics impressions 1,735 in September vs 1,215 in October; a distinct later India-only 2×14-day page series showed `/phonics` impressions 481 vs 1,115, with 10 clicks in each period. These are different time windows and grains; neither alone explains conversion or ranking. Third-party KWE India reported ~880/mo for `phonics classes online` and ~720/mo for `online phonics classes`; ambiguous broad/offline `near me` volume is not paid-online demand.

A source-verified parent information mismatch was found: the main programme FAQ said only “Are Tiny Steps phonics classes 1:1?” / “Yes”, while `/group-phonics-classes-for-kids` separately describes a real conditional small-group format (up to four children/teacher; 50 minutes, per-child fee; new groups dependent on compatible levels and schedules). Parents comparing formats could be misled into thinking there was no group option.

## Focused code change

- Change **one existing FAQ question and answer** in `src/pages/phonics.tsx` to accurately describe both formats: live 1:1 as the individual offering and level-matched small groups by expressed interest, with up to 4 per teacher and no implied immediate group availability.
- Preserve all current canonical H1, metadata, programme and specialist URLs, the `/phonics-fees-india` and comparison owners, class CTA, form handling, pricing constants, JSON-LD FAQ data source, route manifest and search indexing directives.
- Keep small-group routing to the existing `/group-phonics-classes-for-kids` page (no duplicate Phonics landing page).
- Add a static source consistency regression guard and a dedicated PR-head 22.x/Ubuntu24 Playwright full-build SEO gate.

## Decision gates

- [ ] Source tests pass on PR head
- [ ] TypeScript passes
- [ ] Full Vite build with prerender and SEO/route/indexation checks passes
- [ ] Reviewer confirms conditional group wording and original owner/CTA retained
- [ ] Owner approval / merge
- [ ] Live deployment source and mobile review when accessible
- [ ] After Brick 10: Google URL Inspection and comparable India-only GSC page-query observations

**Expected benefit:** clearer buyer decision; **not** a demonstrated increase in traffic or enquiries. No Firestore changes, ads spend, conversion event modifications, or metadata/robots/canonical edits.
