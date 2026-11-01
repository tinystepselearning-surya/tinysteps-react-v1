# Brick 1/10 — Keyword research freeze and handoff to technical bricks

**Decision date:** 2026-11-01 IST. **Owner direction:** stop further public keyword-tool sampling and return to the agreed ten-brick India acquisition build. This is a **freeze of the research pass**, **not** a claim that a complete India national market-size estimate is available or that all Brick 1 approvals have passed.

## Evidence inventory at freeze

| Input | Coverage | Material limitation |
|---|---|---|
| Keywords Everywhere owner-uploaded India/INR CSV exports | 200 distinct exact-phrase estimates; 57 positive-reported average volumes | Third-party mediated Google estimates; rounded zeros, some inconsistent or missing month histories; not complete universe |
| Semrush Keyword Magic India screenshots | 12 additional distinct positive-volume phrases; 17 positive phrases transcribed from visible screenshots | Selected visible result rows only; paid/child suitability must be filtered, broad totals may be informational |
| Combined measured exact-phrase universe | 212 distinct phrases; 51 non-local paid-class candidates; 20 positive local/city terms in separate watchlist | Not a unique-searcher count, not valid to sum across overlapping variants or vendor methods |
| CalmSEO DataForSEO India/English screenshots, 1 Nov 14:48–14:49 IST | 5 exact phrases checked, detailed below | n/a represents no provider data, not zero searches; screenshots only |
| KeywordTool.io | Site opened with Google/India/English settings | **No returned suggestions/export supplied**; do not claim it contributed terms |
| Tiny Steps July–October Firebase/GSC historical aggregate and GSC exports | Internal acquired-parent and site-specific search evidence, documented in earlier Brick 1 files | Not national India demand nor proof of channel causality |

### Final CalmSEO observations

| Exact phrase | India monthly search estimate | CPC USD | Ads competition | Treatment |
|---|---:|---:|---|---|
| `online english grammar classes` | **720** | **0.56** | **Medium 0.36** | Consistent on volume with Semrush screenshot (720); Semrush tags this generic audience term **Informational**, so it is not all child-class buyer demand |
| `english speaking classes for kids` | **n/a** | n/a | n/a | No CalmSEO/DataForSEO data; Semrush reported 390, preserved separately |
| `spoken english classes for kids` | **n/a** | n/a | n/a | No CalmSEO data; KWE earlier small positive estimate remains separate |
| `online english tuition for kids` | **n/a** | n/a | n/a | No CalmSEO data; do not equate n/a with no tuition demand |
| `english communication classes for kids` | **n/a** | n/a | n/a | No CalmSEO data; no unsupported volume asserted |

All screenshots show Location=India and note Google searches in English. Only the first CalmSEO query reported numeric CPC/competition. Vendor method: DataForSEO via CalmSEO free checker; retrieved 1 Nov 2026. Trend sparkline without raw monthly numbers cannot support numeric seasonality calculations.

## Decision-ready keyword signals, not estimated TAM

- Broad online English for kids: `online english classes for kids` ~1,000/month in KWE and Semrush.
- Grammar: `online english grammar classes` ~720 in Semrush and CalmSEO, `english grammar classes online` ~720 in KWE; word-order and audience overlap remain.
- Speaking: `english speaking classes for kids` ~390 in Semrush, while CalmSEO n/a; `public speaking classes for kids` ~92 KWE vs 210 Semrush (do not average).
- Phonics: `phonics classes online` ~880 and `online phonics classes` ~720 from KWE; many larger general or `near me` queries indicate offline/local intent.
- Reading: fewer directly measured online-child buyer terms and minimal Tiny Steps India GSC page exposure; this is a **coverage gap**, not proof of no market demand.

The commercial-page owner mapping remains unchanged: `/phonics`, `/reading-classes-for-kids`, `/grammar`, `/speaking`, and `/online-english-classes-for-kids`; retain the distinct specialist price/comparison/spoken-English/local owners under C2. No new landing pages, sitemap changes or redirects based only on the estimates.

## Frozen scope vs unfinished Brick 1

**Closed by owner decision:** additional free-site keyword collection, more unmeasured 21/100-keyword batches, paid Google Ads signup and keyword-tool plan upgrades.

**Documented as unresolved:** genuine India 5-market national commercial-search totals, full variant deduplication, and 24-month comparable seasonality. Do not silently turn the shortlist into a TAM estimate.

**Still open, independent of keyword sampling:** safe historical first-observed-parent cohort reporting requires authorised production schema and field-completeness checks and security/owner review; the existing admin dashboard counts lead documents, not guaranteed distinct new parents. No live Firestore modification.

**Brick 1 release gate:** review draft PR #835 and latest CI, preserve private underlying exports, obtain owner merge authorization. Until then PR #835 stays unmerged, and **Brick 2 implementation** must not be deployed or used to bypass Brick 1 acceptance.

## Next approved plan: Brick 2/10 — Search & AI Discoverability Audit

Carry the frozen C2 owners and current search priority forward. Brick 2 read-only preflight should inspect five owner routes for route/indexability manifest, build/prerender output, correct self-canonical metadata, meaningful initial HTML, structured data, safe internal links, public robots policy, Google URL Inspection and real Google/OAI search bot fetchability where evidence is accessible. Separate static source configurations from actual deployed HTTP/crawl/index status. Avoid modifying any page, meta title, canonical, robots or sitemap without a reproducible defect and focused reviewable PR.

Recommended sequence in agreed 10-brick plan: **1** Acquisition Baseline & Keyword Intelligence → **2** Search & AI Discoverability Audit → **3** Phonics Commercial Recovery → **4** Homepage & Online English Gateway → **5** Teacher/Class/Progress Evidence → **6** Reading Market Expansion → **7** Grammar & Sentence Formation Expansion → **8** Public Speaking Growth → **9** Gemini/ChatGPT & Brand Authority → **10** Validation, Measurement & Scaling.
