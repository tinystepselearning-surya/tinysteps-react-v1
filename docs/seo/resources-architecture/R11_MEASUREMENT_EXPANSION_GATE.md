# Resources Brick 11 — Measurement & Expansion Control System

Revision: `2026-09-09-r11`

## Goal

Brick 11 turns the Resources programme into **continuous measurement, not a publishing waiting room**.

It does not ask Tiny Steps to publish 16 URLs and wait for every URL to rank before building further. It measures individual resource pages and semantic clusters while allowing unrelated healthy areas to continue expanding.

## Non-negotiable policy

- **No global 16-page waiting gate.**
- One broken page blocks that page, not the entire library.
- Confirmed cannibalisation can block the affected cluster, not unrelated clusters.
- Low early impressions are not treated as failure.
- New content with little evidence is `insufficient-evidence`, not `repair`.
- Search data must come from finalized Search Console evidence; the repository does not contain fabricated current GSC metrics.
- Existing commercial-intent owners such as `/phonics` remain protected from informational cannibalisation.
- R11 measures and classifies existing published pages and clusters. R12's first explicitly approved Wave 2 is admitted by curriculum eligibility plus a human-controlled publication registry; R11 evidence governs repair and scale beyond that approved wave.

## Runtime measurement contract

R11 extends the existing public GA4/event pipeline rather than creating a second analytics stack.

### `resource_page_view`

Emitted for:

- `/resources/phonics`
- every published Brick 9 phonics guide

Dimensions include:

- resource subject
- resource surface (`phonics_hub` or `phonics_guide`)
- discovery cluster
- concept ID
- publication revision
- page path

### `resource_navigation_click`

Emitted when a resource moves to another phonics resource. The relationship comes from the Brick 10 discovery graph:

- `hub-child`
- `parent-hub`
- `cluster-sibling`
- `adjacent-pattern`
- `other-resource`

This measures whether the resource graph is actually being used by visitors.

### `resource_assist_click`

Emitted when a resource assists another meaningful destination:

- `commercial`: `/phonics`, `/book-demo`, `/contact`, `/pricing`
- `practice`: games, tracing and practice destinations
- `supporting-content`: blog or other Resources content

A resource-to-resource click is recorded as navigation only and is not double-counted as an assist.

## Search Console evidence

Search Console remains the authority for finalized search-performance evidence. R11 expects evidence such as:

- indexed / not indexed status when available
- impressions
- clicks
- CTR
- average position
- query-family breadth
- query ↔ page relationships
- competing pages for the same query family

The connected Search Console integration currently requires additional read scope before automated ingestion can be relied on. Therefore R11 deliberately contains a pure evidence contract and **no invented live GSC values**. A finalized GSC export/review can be supplied to the evaluator without changing its decision semantics.

## On-site evidence

GA4/resource events provide:

- resource page views
- related-resource navigation
- practice/game assists
- commercial assists
- downstream demo/lead actions where attribution is available through the existing funnel stack

Clarity remains useful for qualitative UX investigation but is not a hard publishing gate.

## Decision states

### `promote`

Use when search discovery plus real on-site engagement support further expansion in the evaluated page/cluster.

Typical action: create deeper child topics, related patterns, exercises, word families or reviewed word pages.

### `observe`

Evidence is mature enough to monitor but not strong enough to justify either repair or aggressive expansion.

Typical action: keep live, continue measuring, and allow unrelated clusters to expand.

### `repair`

There is sufficient evidence of a correctable weakness, for example:

- an indexable page remains reported not indexed after the minimum observation window
- meaningful search exposure has both weak CTR and weak average position

Typical action: inspect title/intent match, content utility, internal links, examples, SERP fit and crawl/index evidence.

### `insufficient-evidence`

The page/cluster is too new or has too little finalized search evidence.

Typical action: keep measuring. This is explicitly **not a failure state** and does not pause the rest of the programme.

### `blocked`

Reserved for hard issues such as:

- not indexable
- wrong canonical
- missing Resources sitemap membership
- orphaned from the resource discovery graph
- confirmed intent cannibalisation

The block applies only to the evaluated page or cluster. `blocksOtherClusters` is always false.

## Initial decision thresholds

Thresholds live in `src/lib/resourceExpansionGate.ts` so they are versioned, tested and can evolve with real Tiny Steps data.

Current conservative defaults:

- minimum observation window: 14 days
- minimum search sample: 100 impressions
- meaningful search exposure for repair evaluation: 250 impressions
- weak-search repair requires both CTR below 1% and average position worse than 35
- promotion search signal: average position 20 or better **or** CTR 2% or better
- promotion also requires at least 25 measured resource views and at least one navigation/practice/commercial/conversion action

These are operational defaults, not universal SEO laws. They should be tuned after Tiny Steps accumulates enough real resource evidence.

## Cannibalisation policy

Informational pSEO must not steal the commercial job of `/phonics`.

A cannibalisation block requires **confirmed query-intent evidence**, not merely keyword overlap. Record:

- query family
- expected canonical owner
- competing page
- relative impressions/clicks/positions
- whether the two URLs satisfy materially different intents

If a guide ranks for an informational query and `/phonics` ranks for a commercial query, that is healthy coexistence, not cannibalisation.

## R12 and later-wave handoff

An unpublished URL cannot have historical Google performance, so R11 is not a fabricated pre-publication evidence requirement for the first explicitly approved Wave 2. Initial admission and later scale are separate decisions:

- **Initial Wave 2 admission:** Brick 8 curriculum eligibility + an explicit current-wave publication approval + canonical/editorial governance. A `future-wave-2` label alone cannot publish anything.
- **Expansion beyond the approved wave:** a finalized R11 decision for the existing page or cluster + curriculum eligibility + a new explicit publication approval. This path must use `evaluateFurtherResourceScale` and cannot substitute missing evidence with a positive decision.

For further scale, consume R11 decisions at page and cluster level:

- `promote` → prioritize adjacent/deeper expansion
- `observe` → maintain while other opportunities proceed
- `repair` → repair the affected asset before duplicating its pattern
- `insufficient-evidence` → do not punish the existing page; it does not itself authorize more pages, while a separately evaluated unrelated cluster may still expand
- `blocked` → stop only the affected scope until the hard issue is resolved

R11 therefore supports a growing library of hundreds or thousands of governed resources without turning measurement into a site-wide brake.
