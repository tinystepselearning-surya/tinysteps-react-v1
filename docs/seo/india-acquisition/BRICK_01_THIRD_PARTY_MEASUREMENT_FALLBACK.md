# Brick 1 — Third-party India keyword intelligence fallback (1 November 2026)

**Decision:** Owner elected to proceed with third-party keyword-volume data and existing GSC evidence rather than activate a Google Ads campaign solely to reach Keyword Planner. This is a **methodology and evidence update**, not a claim that all market volumes have now been measured. No production page/Firestore change and no external paid account activation.

## Available evidence kept separate

1. **Tiny Steps owner-exported GSC**: 31 July–30 October 2026, all-country Search type Web. See [the uploaded GSC export review](./BRICK_01_GSC_EXPORT_REVIEW_20261101.md). GSC figures represent exposure of the property, not India's total search activity. Country rows cannot be directly joined to the separately exported query/page dimensions.
2. **Public secondary India historical phonics sample**: Phonics Guide, *Phonics in India: search demand grew 7×*, May 2026, https://learnphonics.co/phonics-india-trends . The publisher attributes its numbers to DataForSEO's historical_search_volume, but underlying API output/export is **not available for independent verification**. It reports the singular query **`phonics class`** with **9,900 India searches in July 2025**, and 9,900 in July 2024; these are **individual July observations, not 12-month average or 2026 volumes**, and not proof that the searcher intended a paid online class. The same study reports dramatically larger informational terms such as `phonics sounds`, which **must not** be counted in paid-class demand. Treat this as a low-assurance directional sample only; do not combine its figures with another provider or sum its head terms into a national commercial market total.
3. **Semrush**: official help describes estimated monthly country volume and intent, keyword difficulty and export/optional bulk capabilities (https://www.semrush.com/kb/257-keyword-overview). This is a suitable alternative provider for all five programmes if India-specific numeric exports are actually obtained. A free single-keyword checker exists at https://www.semrush.com/free-tools/keyword-search-volume-checker/ . None of its India keyword volumes has been imported or independently verified in this PR.
4. **Keywords Everywhere bulk checker**: https://keywordseverywhere.com/tools/search-volume-checker/ documents a no-signup, daily-limit-dependent free query interface supporting **up to 100 keywords/submission** and an export CSV command. Provider says reported search volumes come through its Google Keyword Planner API and are rolling 12-month averages (not a 24-month month-by-month export). It must be labelled as *Keywords Everywhere mediated data*, not a direct owner-generated Google Ads report. No numerical results have been imported in this PR.
5. **Google Trends**: supporting relative trends only, not absolute keyword demand: https://developers.google.com/search/docs/monitor-debug/trends-start .

## Current owner-prepared analysis inputs (private/off-repo)

- Owner uploaded a 79-row, **provisional commercial-candidate** CSV derived from disclosed GSC queries; it includes categories with uncertain intent (near-me/offline, mixed offerings, competitive brand). Its measured impressions are worldwide for this period, not Indian keyword search volumes. In the uploaded disclosed-query set, **zero explicit paid Grammar-class queries** surfaced; this is *not evidence of zero Grammar demand*.
- A fresh, **121-row deduplicated research queue** was prepared from those 79 observations plus **42 analyst-proposed class-intent seeds**, preserving source origin and C2 canonical owner. Breakdown: Phonics 45, Reading 15, Grammar 16, Public Speaking 19, Broad English 20, spoken-English specialist 6. The specialist category must remain separate from public speaking/broad English.
- Two copy-ready free-checker batches contain **100 and 21** distinct queries respectively. The queue leaves all current third-party India volume cells **blank** rather than writing false zeroes. These private/user export files are not committed to the repository.

## Connected Ahrefs access check (1 November 2026)

The owner connected Ahrefs in ChatGPT. An API subscription/usage read and a minimal India (`IN`) Keyword Explorer overview request for `online phonics classes for kids` both failed with **`UNAVAILABLE: Insufficient plan`**. No keyword-volume rows were returned. **Do not present Ahrefs as a measured source or infer that any zero-volume keywords were found.** Provider connection alone is not proof of sufficient API subscription access. Fallback remains a permitted third-party CSV export with full provenance; avoid purchasing or changing plans without owner approval.

## Measurement protocol

1. Prefer **one primary third-party provider** for a consistently dated India country dataset across five programmes. Use an Indian Google database with documented historical period and per-keyword volume, including units (12-month average vs observed monthly). Record plan/account limitations honestly.
2. Preserve source URL, extract date, geographic scope, measurement window, reported average/monthly data, currency for bids, competition source and whether a figure is a rounded bin or estimate.
3. Review keyword intent and exclude worksheets, jobs, broad games, adult tuition and clinical speech therapy from paid-online market totals. Treat class/tutor terms without an online modifier as potentially offline.
4. Resolve close-variant duplication, market overlap and specialist C2 owners (fees, comparisons, reading fluency, spoken English, demo) before aggregate totals. Never add both a provider's rounded variant groups and their constituent terms.
5. Keep GSC worldwide observations separate from national India volume; do not infer geographic share, user identity, click→enquiry rate, or AI recommendation changes.
6. Report five-market totals/seasonality **only once sufficient compatible verified third-party records exist**. Historical individual July samples or source-provided “category traffic” are not a substitute.
7. Carry the prior Firebase first-touch and genuine new-parent cohort security/completeness gates independently. No new live admin dashboard is implemented here.

## Next acceptance gate

- [x] Owner authorized third-party route; no paid Google Ads campaign needed.
- [x] Public provider capabilities and one historical secondary phonics datapoint sourced with caveats.
- [x] Prepared classification-aware 121-query measurement queue; all unmeasured values are missing, not zero.
- [ ] Obtain India numeric search-volume export for the five programmes from one selected provider.
- [ ] Confirm number of returned rows, scope, period, close variants and intent exclusions; calculate market totals **only when supported**.
- [ ] Confirm live parent-identity reporting access/design separately.
- [ ] PR review/merge authorization; remain draft until reviewed.

**Status:** Brick 1 third-party research under way; this document does not establish an accurate numeric national paid-parent search market size.
