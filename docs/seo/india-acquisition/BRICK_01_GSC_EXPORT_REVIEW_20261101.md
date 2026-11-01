# Brick 1 — Uploaded Search Console export review (1 November 2026)

**Evidence:** Seven owner-uploaded Google Search Console CSV files: `Chart(1).csv`, `Countries.csv`, `Devices.csv`, `Filters.csv`, `Pages.csv`, `Queries.csv`, `Search appearance.csv`; plus owner-uploaded *India Google Keyword Planner Commercial Search Demand for Tiny Steps Learning.pdf*. Reviewed independently for this document. **No GSC or Firestore API read, production change or authenticated Google Ads extraction is claimed.** Raw uploaded CSV files are not committed.

## Scope and reconciliation

- Export filters: **Search type Web (text-based)**, **Last 3 months**; the date chart contains **92 days, 31 July–30 October 2026**, all countries.
- Daily chart totals: **15,421 clicks**, **323,061 impressions**.
- Country and device rows sum to exactly the same sitewide totals. India contributes **3,935 clicks** / **62,696 impressions**, but the country table cannot be cross-tabulated to query or page rows from these separate exports.
- Device rows (all countries): Desktop **8,982** clicks / **164,017** impressions; Mobile **5,360** / **149,564**; Tablet **1,079** / **9,480**. Do not interpret as *India-specific* device share.
- Date buckets: August **3,073** clicks / **46,957** impressions; September **5,403** / **90,954**; 1–30 October **6,902** / **183,963**. These are **worldwide** property-level observations and cannot replace or contradict the separate **India-only** historical baseline without matching scope.
- The exported top **1,000 query rows** contain **6,922 clicks** / **110,184 impressions**; not a full-query census. Do **not** interpret absent rows as zero demand.
- The 318 exported page rows sum to **15,643 clicks** / **363,914 impressions**, differing from the property-level chart. Treat page-grouped and property-grouped aggregates separately; do not sum page rows and label that the sitewide denominator. Query and page dimensions are **not joined** in the files.

## Five established commercial owners (all-country page rows)

| C2 owner | Clicks | Impressions | CTR | GSC average position |
|---|---:|---:|---:|---:|
| `/phonics` | 353 | 12,995 | 2.72% | 4.87 |
| `/reading-classes-for-kids` | 3 | 126 | 2.38% | 18.40 |
| `/grammar` | 17 | 935 | 1.82% | 9.09 |
| `/speaking` | 106 | 4,275 | 2.48% | 9.71 |
| `/online-english-classes-for-kids` | 46 | 1,628 | 2.83% | 6.18 |

Related existing surfaces: `/phonics-fees-india` 29/1,378; `/best-online-phonics-classes-for-kids-in-india` 73/3,667; `/pricing` 39/4,229; `/book-demo` 1/105. For context, the free letter-tracing game reports **7,475 clicks / 94,697 impressions**, illustrating why raw traffic does not establish commercial parent demand.

## Selected disclosed parent class-intent queries (all countries)

| Search query | Clicks | Impressions | Average position |
|---|---:|---:|---:|
| phonics classes | 8 | 1,673 | 6.0 |
| phonics classes online | 14 | 580 | 5.5 |
| phonics classes for kids | 6 | 540 | 5.6 |
| online phonics classes for kids | 7 | 405 | 9.0 |
| public speaking classes for kids | 5 | 181 | 11.5 |
| online english classes for kids | 7 | 146 | 8.8 |
| reading classes for kids | 0 | 34 | 8.8 |

These are **Google Search Console impressions for Tiny Steps**, *not* national India Keyword Planner search volumes. Some queries have geographically mixed intent; the export cannot identify their India-only values.

## Attached research PDF — exact status

The uploaded Deep Research report explicitly states that **Google Ads authentication was not available**, that no official India Keyword Planner numbers were retrieved and that the raw 24-month Keyword Planner CSV was **not created**. It describes a 109-keyword seed file and proposed empty schemas, but those are **not measured monthly keyword-volume data**. Its original sandbox download paths in the PDF are not itself an uploaded Google Ads export.

## Decisions / Brick 1 status

1. **Accept** these uploads as a separate worldwide GSC *visibility* snapshot; retain provenance/date filters. Use this to prioritise inspecting Reading/Grammar discovery and high-intent Phonics click-through after relevant India page-query cross-filters become available.
2. **Do not substitute** these figures for the pre-existing owner-reviewed India Sep/Oct series or estimate national paid-parent search demand from them.
3. **Do not change** existing SEO URLs, title tags, canonicals or enquiry forms based solely on all-country page aggregates.
4. **Blocked:** authenticate to the Tiny Steps Google Ads account; request India + English + Google Search historical keyword metrics, ideally the latest 24 complete months, including close-variant details. Obtain the real CSV to finish commercial market sizing.
5. **Still separate:** genuine-new-parent cohort design/authorized live data verification. These GSC files contain no parent identities and cannot complete Firebase deduplication.
6. The PR remains **draft / unmerged / undeployed**; no approval implied by this research note.
