# C1 — Observed Google + Bing Search Evidence

Date reviewed: 10 September 2026
Status: evidence-complete
Scope: research only; canonical ownership remains C2

## Source files reviewed

### Google Search Console

`tinystepslearning.com-Performance-on-Search-2026-09-10.zip`

The export contains `Chart.csv`, `Queries.csv`, `Pages.csv`, `Countries.csv`, `Devices.csv`, `Search appearance.csv` and `Filters.csv`.

Filter: Web Search, Last 3 months.
Observed daily range in `Chart.csv`: **9 June 2026 through 8 September 2026**.

Whole-property totals from the daily chart:

- **6,612 clicks**
- **107,515 impressions**
- **6.15% calculated CTR**
- approximately **7.55 impression-weighted average position**
- **1,000 query rows** in the exported query table
- **181 page rows**
- **212 country rows**

### Bing Webmaster / Bing AI exports

Reviewed:

- `tinystepslearning.com_KeywordReport_9_10_2026.csv`
- `tinystepslearning.com_PageTrafficReport_9_10_2026.csv`
- `tinystepslearning.com_AISearchQueriesReport_9_10_2026.csv`
- `tinystepslearning.com_AIPageStatsReport_9_10_2026.csv`

The supplied Bing CSVs do **not** encode the selected reporting period. Their totals are therefore retained as observed evidence but are **not time-normalized or directly compared with Google's 92-day totals**.

Bing export dimensions contain:

- 830 keyword rows
- 426 clicks / 3,167 impressions represented in the keyword dimension
- 59 page rows
- 514 clicks / 9,509 impressions represented in the page dimension
- 31 AI grounding-query rows / 1,405 citations
- 71 AI page rows / 2,962 citations

## Google: phonics is already a mature commercial search family

Using a conservative C1 classifier that requires a programme term plus a commercial token such as class/course/tutor/tuition/programme/fee/cost/price/demo/trial/near-me, while excluding obvious games, tracing, worksheets and practice queries, the top-1,000 GSC query export contains:

| Commercial family | Matching rows | Impressions | Clicks |
| --- | ---: | ---: | ---: |
| Phonics | **103** | **7,604** | **124** |
| Broad English | 86 | 1,216 | 21 |
| Public speaking | 22 | 502 | 3 |
| Spoken English | 31 | 465 | 2 |
| Reading | 30 | 465 | 8 |
| Grammar | 5 | 29 | 0 |
| Writing classes | 6 | 30 | 2 |
| Communication | 2 | 12 | 1 |

These families can overlap, so they must not be summed into a site total.

The strategic conclusion is strong: **Tiny Steps does not have a basic phonics discoverability problem. It has a commercial click-capture and intent-alignment opportunity.**

### Highest-value Google phonics evidence

| Query | Clicks | Impressions | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| phonics classes | 6 | 1,056 | 0.57% | 4.88 |
| phonics classes online | 18 | 764 | 2.36% | 4.86 |
| best phonics classes online | 16 | 600 | 2.67% | 2.42 |
| phonics classes for kids | 3 | 511 | 0.59% | 4.71 |
| online phonics classes for kids | 11 | 443 | 2.48% | 6.98 |
| online phonics classes | 3 | 359 | 0.84% | 9.19 |
| phonics online classes for kids | 4 | 315 | 1.27% | 1.81 |
| phonics classes for kids near me | 0 | 315 | 0% | 10.37 |
| best online phonics classes for kids in india | 6 | 172 | 3.49% | 10.59 |
| best online phonics classes in india | 6 | 166 | 3.61% | 2.14 |
| **best online phonics classes in india with fees** | **11** | **117** | **9.40%** | **2.72** |

The last query is particularly important because it combines comparison, geography and price intent and already converts impressions into clicks efficiently.

By contrast, very broad terms such as `phonics classes` and `phonics classes for kids` already receive large impression volume with weak CTR. C2 should investigate snippet/page intent alignment and owner consolidation before authorizing any additional phonics commercial pages.

## Google: commercial page evidence

Selected current commercial surfaces:

| Page | Clicks | Impressions | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| `/phonics` | **371** | **11,306** | 3.28% | 4.86 |
| `/best-online-phonics-classes-for-kids-in-india` | 101 | 3,835 | 2.63% | 8.69 |
| `/online-english-classes-hyderabad` | 86 | 3,556 | 2.42% | 7.94 |
| `/speaking` | 62 | 2,602 | 2.38% | 9.10 |
| `/pricing` | 16 | 1,551 | 1.03% | 5.09 |
| `/grammar` | 12 | 811 | 1.48% | 7.08 |
| `/online-english-classes-for-kids` | 8 | 359 | 2.23% | 9.86 |
| `/phonics-fees-india` | 6 | 308 | 1.95% | 7.78 |
| `/spoken-english-classes-for-kids-online` | 2 | 233 | 0.86% | 11.41 |
| `/reading-classes-for-kids` | 2 | 71 | 2.82% | 17.15 |
| `/book-demo` | 0 | 39 | 0% | 3.72 |
| `/writing-classes-for-kids` | 0 | 4 | 0% | 7.25 |

This strongly supports keeping phonics as the first commercial optimization priority, while grammar/writing/reading/speaking require different treatment rather than copying the phonics strategy mechanically.

## Google: international evidence is real even when country-modified queries are sparse

Whole-site GSC country performance:

| Country | Clicks | Impressions | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| India | 1,909 | 33,025 | 5.78% | 6.87 |
| United States | **1,587** | **26,641** | 5.96% | 8.39 |
| United Kingdom | 264 | 5,254 | 5.02% | 9.57 |
| Australia | 280 | 3,873 | 7.23% | 8.20 |
| United Arab Emirates | 104 | 1,700 | 6.12% | 6.46 |
| Singapore | 73 | 1,041 | 7.01% | 6.77 |

This validates the international C1 research layer: global visibility is not hypothetical. However, it does **not** automatically justify six country landing pages. C2 must distinguish whole-site informational traffic from programme-level commercial demand before assigning geography ownership.

The top-1,000 GSC query export contains only sparse explicit country-modified commercial terms outside India. Examples include `public speaking classes for kids usa` (22 impressions, position 54.73) and a highly conversational Jeddah query asking which online course can move a six-year-old from memorizing English words to speaking complete sentences (11 impressions, position 3.45). That natural-language query is direct evidence that conversational parent-style search is already appearing in Google Web data.

## Google: other programme maturity

Observed Google evidence is materially weaker outside phonics:

- `online english classes for kids` — 5 clicks / 98 impressions / position 9.41
- `english online classes for kids` — 3 / 73 / position 8.77
- `online reading classes for kids` — 1 / 38 / position 12.76
- `public speaking classes for kids` — 0 / 74 / position 23.59
- `public speaking classes for kids online india` — 1 / 16 / position 10.44
- `spoken english classes for kids online` — 0 / 10 / position 7.20
- `online grammar classes for kids` — 0 / 4 / position 7.25
- `communication classes for kids` — 1 / 9 / position 17.22

Therefore C2 should not assume every programme needs the same number or shape of commercial owners.

## Bing Web: independent corroboration

Bing's web-search exports independently corroborate important commercial themes:

- `best phonics class for kids` — 14 impressions, avg. position 2.79
- `online phonics classes` — 1 click / 8 impressions / 12.5% CTR / position 2.63
- `phonics classes online` — 9 impressions / position 5.22
- `phonics class demo questions parents should ask` — 8 impressions / position 3.00
- `cost of phonics classes in india` — 8 impressions / position 3.25
- `english classes 1-1 for kids india` — 1 click / 6 impressions / position 1.50
- `review of tiny steps online english courses` — 1 / 5 / position 5.80
- `one on one english classes for 7 years old child` — 1 / 2 / position 3.50

Selected Bing commercial pages:

- `/phonics` — 11 clicks / 236 impressions / 4.66% CTR / position 3.65
- `/best-online-phonics-classes-for-kids-in-india` — 1 / 16 / 6.25% / position 4.06
- `/phonics-fees-india` — 1 / 15 / 6.67% / position 2.60
- `/online-english-classes-for-kids` — 2 / 14 / 14.29% / position 4.07
- `/speaking` — 1 / 5 / position 7.40

The Bing data reinforces the C1 importance of **1:1, price, comparison, demo, review and age-fit modifiers**.

## Bing AI: commercial AI visibility is already observed

This is a major C1 improvement because we now have actual Bing AI grounding data, not merely synthetic AI-style prompts.

Observed grounding queries include:

| Bing AI grounding query | Citations | Citation share |
| --- | ---: | ---: |
| `tiny steps learning` | **742** | **78.44%** |
| `beginner phonics program age range` | 26 | 43.33% |
| `phonics classes for kids` | **25** | **16.23%** |
| `online phonics classes` | **24** | **20.34%** |
| `grammar games for kids` | 12 | 20.00% |

This proves that answer-engine visibility exists for Tiny Steps around **commercial phonics class intent**.

### Bing AI cited commercial surfaces

- `/courses` — 241 citations
- `/phonics` — **120 citations**
- `/online-english-classes-for-kids` — 34
- `/best-online-phonics-classes-for-kids-in-india` — 17
- `/speaking` — 15
- `/reading-classes-for-kids` — 3
- `/pricing` — 2

No observed citation row in the supplied AI page export was found for:

- `/book-demo`
- `/writing-classes-for-kids`
- `/spoken-english-classes-for-kids-online`

That absence is useful C2 evidence but is not itself permission to create new pages.

## What C1 can now say with evidence

1. **Phonics is the strongest current commercial search asset.**
2. **The biggest phonics opportunity is better capture of existing impressions, not another expansion wave of thin commercial URLs.**
3. **Price/comparison intent is proven**, especially around `best ... in india with fees`.
4. **1:1 positioning is commercially relevant** in Bing and external market research and matches Tiny Steps' service model.
5. **International visibility is substantial at site level**, especially the United States, while explicit international commercial queries are still sparse.
6. **AI commercial visibility is observed on Bing** for phonics class queries.
7. **Reading, grammar, writing, spoken English and communication need selective growth strategies**, because their present query evidence is much smaller than phonics.
8. **The operating conversion priors remain planning heuristics only**: approximately 1 enrolment per 3 completed demos and approximately 1 budget-related drop-off per 5 leads at ₹400/class. They are not audited CRM rates.

## C2 hand-off

C2 should now use three evidence layers together:

1. the classified C1 parent commercial search universe;
2. the 66-query international matrix plus AI-style parent prompts;
3. the observed Google/Bing/Bing-AI evidence in `commercialC1ObservedSearchEvidence.ts`.

C2 then assigns exactly one canonical owner/status to each commercially relevant cluster, checks cannibalisation, and decides whether existing pages are sufficient before any new URL is authorized.
