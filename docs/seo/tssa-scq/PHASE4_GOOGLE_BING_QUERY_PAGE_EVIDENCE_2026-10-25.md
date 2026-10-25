# TSSA-SCQ Phase 4 — Google query→page evidence aligned with Bing AI grounding phrases

**25 October 2026 | Read-only source evidence; no public-page change**

## Source scope and metric interpretation

- Live connected Google Search Console domain property `sc-domain:tinystepslearning.com`; **2026-09-27 through 2026-10-24 inclusive**; exact selected query+page rows.
- First-party user-uploaded Bing Webmaster Tools `tinystepslearning.com_AISearchQueriesReport_10_25_2026.csv`: **168 grounding-query rows** with query-level citation counts and share, **no reporting period in that CSV**.
- Google page rows can differ slightly from the GA4-linked query-only CSV totals due to how the connectors/dimensions aggregate or suppress queries; do not mix their denominators.
- **Google page impressions mean appearances, not enrolment. Bing citation counts are query-level and MUST NOT be attributed to a URL** until the Bing Grounding Query→Pages mapping is retrieved.
- No ChatGPT/Gemini/Google-AI-Overview citations or causal ranking claims established.

## Verified commercial Phonics ownership

- For five selected commercial Phonics phrases, **620/672 (~92.3%) GSC query+page impressions** resolved to `/phonics` in the retrieved page rows.
- Secondary results include the comparison guide, homepage and one local English page. Their presence at much lower positions is **not** by itself cannibalisation.
- The uploaded Google query-only export reported **5 clicks / 596 impressions** across four headline commercial phrases. Do not combine those numbers with the five-query, page-dimensioned GSC denominator above.
- India/mobile account for much of the commercial phrase exposure. Mobile `phonics classes` had **285 impressions, two clicks, average position 5.33**; `phonics classes for kids` had **75 impressions, zero clicks, average position 4.28**; `online phonics classes` had **22 impressions, zero clicks, average position 4.64**. These are small, descriptive cohorts, not an experiment.
- The existing commercial owner title is **'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps'**, description identifies ages 3–12, assessment-led placement, blending, decoding and spelling. Textual programme fit exists; missing keyword is not proven.
- **Decision P0:** preserve canonical and content. Investigate actual mobile SERP presentation, paid placements and competing offers; assess title/description **only** after controlled comparable snapshots and parent-intent checks. Do not assume snippet is the cause.

## Verified Speaking/Spoken English ownership split

- For exact `online spoken english classes for kids`, the domain GSC query+page impressions were:
  - `/online-english-classes-hyderabad`: **12** impressions
  - `/spoken-english-classes-for-kids-online`: **11** impressions
  - `/online-english-classes-for-kids`: **4** impressions
- All rows have zero clicks; the Hyderabad page is an English programme chooser, not a separate Spoken English curriculum. The dedicated programme page exists and has self canonical and explicit Spoken English programme metadata.
- **Decision P1:** inspect user location/device, Google result presentation and on-page choice cues. Do not redirect the Hyderabad page or invent a separate city spoken-English course. Search selection ≠ proven intent cannibalisation.

## Educational pages to protect
- `satpin phonics` primarily resolves to `/blog/satpin-phonics-guide`, with `/blog/phonics-satpin-launch` occasionally also visible. Secondary impressions are not grounds for deletion or canonical rewrites.
- `conjunctions for kids`, `free phonics games for kids`, `balloon phonics` and `letter tracing online` resolve to their expected specialist resources in this query sample.
- Bing's known SATPIN, games and grammar citation activity warrants preserving helpful factual guidance, but the Bing cited-URL identity remains unverified.

## Priority tasks / evidence dependencies

1. **Bing:** Export the AI Performance **Grounding Query → Pages Mapping** filtered for `online phonics classes`, `satpin phonics`, `conjunctions for kids`, `public speaking for families`, plus the **Pages** citation export. Match its selected date period to a documented 28-day window. Bing says each grounding phrase can cite many pages and sampling can differ by filter. Reference: https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c
2. **Google:** Evaluate the high-impression, low-click mobile query cohorts with screenshots or dated SERP captures (in India, especially mobile). Compare snippet and competing organic results **without assuming every searcher seeks paid lessons**.
3. **Existing canonical owners:** keep `/phonics`, `/speaking`, and `/spoken-english-classes-for-kids-online` distinct; monitor Hyderabad broad chooser overlap without redirects.
4. **Link discovery:** interpret draft PR #783's parent-to-Phonics handoffs as navigation improvements, not treatment for a commercial CTR decline. Draft PR #782 is a separate editorial heading fix. Neither is merged or deployed at this checkpoint.
5. **Evidence tracking:** log matched query→page rows against project #778 and Phonics CTR issue #779. Reassess after an equal future period; do not claim ranking or citation uplift from a PR alone.

**GSC owner sample:** 28 query+page records for 15 exact queries; citation file enrichment is query-only and partial.

## Verification outcome

**Google primary owner is correct for core Phonics buyer queries**, so the immediate investment is in click-through diagnosis rather than canonical remediation. **Spoken English shows broader Google page selection** and merits a separate page-intent review. **Bing cited-page attribution remains pending** until the mapping export is available.
