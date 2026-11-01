# Brick 2/10 — Five-owner discoverability and India keyword gap preflight

**Prepared:** 2026-11-01 IST  
**Parent issue:** [#836](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/836)  
**Prior research:** Draft [Brick 1 PR #835](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/835) (freeze of extra keyword collection, not an approved national search-TAM denominator).

## Evidence tiers

- **Repository source (inspected on `main` 1 November 2026):** `src/lib/publicRouteManifest.js`, `src/lib/commercialC2KeywordOwnership.ts`, five owner React components, `public/robots.txt` and `scripts/prerender-readiness.mjs`.
- **External indexed webpage text:** web retrieval returned content for all five owners, but those extracts were crawled **approximately 2–3 months earlier**. That is proof only that a crawler had previously extracted body text. It is **not** proof of current origin HTML, 200 status, correct canonical, full JSON-LD, Google indexing, sitemap inclusion, or live OAI-SearchBot eligibility. Robots and XML sitemap fetches returned tool errors/unsupported XML content; **do not label as live faults**.
- **Keywords:** 212 exact-phrase multi-provider universe, with 51 non-local commercial candidates. Semrush / Keywords Everywhere / CalmSEO estimates are only directional. Relevant examples: `online english classes for kids` ~1,000 in KWE and Semrush; `online english grammar classes` ~720 in Semrush and CalmSEO; `english speaking classes for kids` ~390 Semrush but CalmSEO n/a; `public speaking classes for kids` KWE 92 vs Semrush 210. No simple sum across variants or providers, and age-unspecified grammar queries are not all parent buyers.

## Technical source preflight

| Check | Source evidence | Status |
|---|---|---|
| Five programme routes | `route('/path', 'static')` for /phonics, /reading-classes-for-kids, /grammar, /speaking, /online-english-classes-for-kids; helper defaults `indexable=true`, `prerender=true`, `sitemap=indexable` | **Configured**, generated `dist` verification still required |
| C2 commercial ownership | Five owner clusters and distinct /phonics-fees-india, comparison, reading-fluency, spoken-English, Hyderabad, pricing, demo support owners | **Confirmed in source**, no new URLs |
| Public crawler directives | `public/robots.txt` includes global Allow and repeated private-area Disallow for Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot and PerplexityBot | **Configured**, deployed HTTP/bot test not yet proven |
| Initial HTML content | Existing `scripts/prerender-readiness.mjs` guards content and certain article metadata; major programme components use `applySeo` | **Build not yet observed**; current HTML/canonical/JSON-LD need generated build review |
| GSC index-selection | Available history shows Grammar negligible Indian commercial-query impressions; others have more exposure | **Live per-URL Google URL Inspection not supplied**, don't claim indexed/deindexed |
| Pricing and purchase journey | Grammar fee only linked below initial hero; Broad English prices displayed already; existing assessment flow is a request awaiting confirmation | **Source-verified affordances**; no demo/form change |

## Keyword-to-page intent and candidate decisions

| Canonical owner | Research terms | Source coverage / gap | Brick 2 action |
|---|---|---|---|
| `/phonics` | online phonics classes, phonics classes online | Already covered; comparison/fee specialists linked | **No content/meta change**; protect historical visibility |
| `/reading-classes-for-kids` | reading classes for kids, reading tutor online | Already has reading, fluency, comprehension and programme FAQ; India GSC discovery very small | **No speculative rewrite**; later GSC query/index check |
| `/grammar` | online grammar classes; **online English grammar classes** | Strong sentence-formation content, but exact broader parent search wording was absent from source; initial hero does not show standard 1:1 price | **Small hero clarification** and **price sourced from canonical public facts**, retaining title/H1/canonical/schema |
| `/speaking` | public speaking classes for kids; communication skills | Strong course fit/differentiation and existing recent snippet experiment | **No change**; preserve Speaking vs Spoken English intent and await post-release query history |
| `/online-english-classes-for-kids` | online English classes for kids; online English tuition | Already broad 1:1/tutor path and pricing; **no explicit English tuition phrasing** to clarify whether it covers school homework | **One parent-helpful FAQ** defining fit and boundaries, retaining C2 specialist navigation |
| specialist `/spoken-english-classes-for-kids-online` | English speaking classes for kids, conversational fluency | Distinct owner in C2, not merged into Speaking | **No change** |

## Focused, reviewable modifications (not deployed)

1. `src/pages/grammar.tsx`: place the researched phrase **“online English grammar classes for children”** once in an existing parent-facing hero explanation; show a standard live 1:1 fee chip derived from `PUBLIC_SITE_FACTS.standardOffer.oneToOnePerClassInr`. No hardcoded duplicate price, title, H1, canonical, or CTA modification.
2. `src/pages/public/OnlineEnglishClassesForKidsPage.tsx`: add one FAQ explaining whether Tiny Steps is suitable for parents looking for **online English tuition for kids**, while transparently distinguishing targeted skill teaching from all-purpose homework tuition. Existing structured FAQ generation derives from `faqItems`; no duplicate JSON-LD override.
3. `scripts/test/india-acquisition-brick2-intent.node-test.mjs`: static source regression checks for five frozen canonical owners, the two intent changes, specialist links, existing CTAs, and Speaking boundary.

## CI and verification

**Required:** Run targeted node tests, TypeScript typecheck and complete build/prerender through PR-head CI. Build validation includes project's existing `seo:rendered-check`, indexation, route integrity and consistency steps. Tests are a **source-level guard**, not a substitute for actual generated HTML assertions or a browser/mobile visual check. Mark results with the actual PR-head SHA and conclusion; do not claim success before CI.

**Still open after CI:** current production HTTP redirect/header/source checks, current Google Search Console URL Inspection indexed state + selected canonicals, age/location/intent competitor SERPs, India only page+query/device diagnostics and UI screenshot review. If live information cannot be accessed, label that clearly; no robots/canonical edits based on inaccessible tool.

## Release gate

This work is on a **separate draft PR**, not on draft Brick 1 PR #835 or main. Do not merge/deploy without owner approval and review of CI. No new ad spend, Firestore, form, event, canonical, redirect, title, schema manipulation or programme eligibility changes.

The SEO hypothesis is **improved clarity for people and plausible keyword relevance**, **not guaranteed ranking uplift**. Measure India qualified query impressions/clicks and genuine parent enquiries in comparable complete windows, acknowledging GSC row filtering and incomplete parent attribution.
