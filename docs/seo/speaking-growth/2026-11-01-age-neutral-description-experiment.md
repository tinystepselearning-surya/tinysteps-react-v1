# Speaking meta description — approved age-neutral experiment

**Authorization:** 2026-11-01, Tiny Steps product owner
**Owner:** `/speaking` only
**State:** Approved editorial change, proposed as PR; merge/deployment require green release gates.
**Phonics:** Unchanged control.

## Frozen control before implementation

Title (unchanged):
`Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps`

Meta description (historical baseline, stored in `SPEAKING_META_DESCRIPTION_EXPERIMENT.controlDescription`):
`Live 1:1 online public speaking & communication classes for kids ages 4–12. Structured answers, storytelling and presentations. ₹400/class; free assessment.`

## Approved candidate

`Live 1:1 public speaking classes for kids. Practise clear answers, storytelling and presentations with teacher feedback. ₹400/class; free 35-min assessment.`

**Reason:** Do not imply four-year-olds are expected to participate in formal public speaking. The page's separate existing programme levels remain Foundations ages 4–7 and Excellence ages 7–12 and must not be silently changed by a metadata experiment. A dedicated curriculum/positioning review for younger learners is separate.

**Scope:** The build-time `src/lib/routeSeoRegistry.js` and runtime `src/pages/speaking.tsx` both read the same immutable, explicitly approved candidate in `src/lib/speakingMetaDescriptionExperiment.js`. The historical C4 control remains unchanged in `src/lib/commercialC4CtrOptimization.ts`. The C4 audit handles only this exact approved exception, checks title/canonical protection, and holds other owners frozen.

## Data limitations and measurement

- In India GSC, `/speaking` reported branded impressions 213 → 47, non-branded impressions 117 → 131, and non-branded clicks 3 → 2 (Oct 2–15 vs Oct 16–29). Extremely small click counts, so no reliable historical CTR-change conclusion.
- Google can generate its snippet from page text and may not display the changed meta description for any given query. Actual India mobile/desktop Google SERP result was not independently captured before implementation.
- GA4 landing-session conversion is not yet connected here; first-party Firestore lead data are aggregated, not joined to organic sessions and results-page appearances. Do not claim traffic or revenue impact without measurement.
- After verified production release, record deployment time and monitor indexing, snippet uptake where possible, query/device positions, qualified clicks and unique organic enquiries over complete 14- and 28-day windows; extend where samples remain small. Treat Phonics as unchanged positive control. Do not edit titles/canonicals/age eligibility/fees/booking flow in this PR.

Google Search Central references:
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/appearance/title-link

**No separate age eligibility or programme-copy decisions are authorized by this experiment.**
