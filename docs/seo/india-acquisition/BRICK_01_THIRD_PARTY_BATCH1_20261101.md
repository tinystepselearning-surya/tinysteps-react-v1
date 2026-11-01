# Brick 1 — Keywords Everywhere first India batch (1 November 2026)

**Input:** Owner-uploaded `search-volume_2026-11-01_141124.csv`. **Provenance:** Keywords Everywhere Search Volume Checker, selected India (`Country=in`), Indian rupees (`Currency=inr`), file data-source tag `cli` (interface selected “Google Keyword Planner + Clickstream”). The provider explains its volume as a trailing 12-month average at https://keywordseverywhere.com/tools/search-volume-checker/ . It is **third-party mediated**, not a directly downloaded authenticated Google Ads export.

**Period fields:** November 2025–October 2026 (12 monthly columns). **Dataset completeness:** first 100 of 121 queued unique keywords, all 100 matched exactly to the separate 121-keyword C2 ownership queue. 21 queries remain outstanding. **No raw user export or personally identifiable information committed.** Original export remains with owner.

## Data-quality findings

- All 100 records: India (`in`) and INR (`inr`); unique keywords: 100; reported average-volume **positive**: 26; reported **zero**: 74.
- Month history: **25** records have 12 monthly data cells, **75** have no monthly values. Of the 26 positive-average rows, **6** show zero in all 12 monthly cells and **1** has no monthly history at all. These seven are inconsistent/incomplete and should **not** drive seasonality claims.
- The provider explains that rounded low-volume “0” is not proof of zero searches. Do not classify the 74 zero-volume rows as zero parent demand.
- Its `Competition` score is Google Ads advertiser competition, **not organic SEO difficulty**.
- Reported row average volumes across all 100 sum arithmetically to **29,626**, but this is a **raw, not-deduplicated, cross-intent row sum**; it is **not national commercial market size** or a valid five-programme demand estimate. Close-variant overlap and online/offline ambiguity preclude market total claims.

## Selected observed India keyword metrics (reported average searches/month)

| Keyword | Reported searches/month | Commercial / source caution |
|---|---:|---|
| `phonics classes near me` | 18,100 | Local/offline ambiguous; cannot be claimed as online-class demand |
| `phonics classes` | 6,600 | Generic classes; online/offline mixed |
| `online english classes for kids` | 1,000 | Direct online commercial intent, strong relevance |
| `phonics classes online` | 880 | Direct online commercial intent |
| `online phonics classes` | 720 | Direct online commercial intent; possible variant overlap |
| `phonics classes fees` | 480 | Fee research; specialist C2 owner `/phonics-fees-india` |
| `reading classes near me` | 320 | Local/offline ambiguous |
| `public speaking course for kids` | 210 | Classes/course commercial, online/offline ambiguous |
| `best phonics classes online` | 140 | Comparison; specialist C2 owner |
| `online phonics classes fees` | 110 | Fee intent; specialist C2 owner |

The high-volume two Phonics terms (`phonics classes near me` and `phonics classes`) contribute **24,700 / 29,626 ≈ 83.4%** of raw volume, illustrating how using the raw sum would overstate a paid-online child programme opportunity.

## By pre-existing market owner (first 100 keywords only)

| Programme | Checked rows | Positive rows | Raw sum (not TAM) |
|---|---:|---:|---:|
| Phonics | 24 | 11 | 27,480 |
| Reading | 15 | 4 | 509 |
| Grammar | 16 | 0 | 0 |
| Public Speaking | 19 | 5 | 335 |
| Broad Online English | 20 | 5 | 1,296 |
| Spoken English specialist | 6 | 1 | 6 |

**Interpretation:** Use the individual high-intent positive rows as priority clues; **never rank the market itself from the raw sums**. The missing 21 queries, source coverage gaps, zero buckets, C2 specialist ownership, near-me locality and provider close variants prevent such ranking. “Grammar 0” here means *no positive estimate across these 16 tested wordings in this export*, not absence of the Grammar market.

## Completion gates

- [x] Owner's first 100 keyword rows received, matched to the planned 121-query queue, filtered to India/INR.
- [x] Data anomalies and local/offline-intent caveats documented.
- [ ] Receive **batch 2 of 21** keywords and reconcile across the full list.
- [ ] Deduplicate/combine commercial clusters only with documented provider variant treatment; avoid national market totals that cannot be supported.
- [ ] Verify intent/competition opportunities against India-only page-query GSC where possible. Existing all-country query and page tables are not joined.
- [ ] Keep the separate new-parent Firebase reporting acceptance gates open; no admin changes authorized here.
- [ ] Remain draft PR and await owner review for any merge.

**No SEO title, canonical, content, Firestore, hosting, ads or live website action performed.**
