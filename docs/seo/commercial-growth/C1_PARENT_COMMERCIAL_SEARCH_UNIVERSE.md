# C1 — Parent Commercial Search Universe

Revision: 2026-09-10-c1-r4  
Status: research-complete, observed-search evidence complete  
Depends on: C0 frozen, KB-FINAL frozen

## Mission

Build one classified commercial-search universe for parents considering Tiny Steps across phonics, reading, grammar, writing, spoken English, public speaking, communication, broad online English and 1:1 tutoring.

C1 is research only. It does not change public copy, titles, H1s, URLs, canonicals or keyword ownership. C2 owns canonical commercial keyword ownership.

## Parent decision journey

Every researched query is classified against the parent journey:

Problem → Solution → Provider research → Comparison → Price → Trial/demo → Enrolment

## Required accounting fields

The base machine-readable registry at `src/lib/commercialC1SearchUniverse.ts` records:

- query
- subject
- intent
- parent stage
- demand signal
- commercial strength
- existing observed Tiny Steps surface
- current rank placeholder
- impressions placeholder
- CTR placeholder
- conversion relevance
- recommended research action
- evidence
- notes

Allowed research actions are KEEP, OPTIMISE, CONSOLIDATE, BUILD and HOLD. These are recommendations for C2 review, not implementation authorization.

The original seed registry intentionally left numeric GSC metrics null when the connector lacked permission. Those historical placeholders are now superseded for observed analysis by `src/lib/commercialC1ObservedSearchEvidence.ts`, which stores the normalized commercial evidence extracted from the user-provided GSC and Bing exports.

## Evidence now available to C1

1. Current Tiny Steps public commercial surfaces and frozen knowledge journeys.
2. Fresh commercial SERP observations on 10 September 2026 for phonics, reading, grammar, creative writing, spoken English, public speaking, communication, broad English, 1:1/tutor, fees and free-demo modifiers.
3. Five user-provided Google Search Generative AI Features exports covering May through 9 September 2026.
4. Full Google Search Console Web Search export for the last three months, with 1,000 query rows plus page, country, device and daily data.
5. Bing Webmaster keyword and page-traffic exports.
6. Bing AI grounding-query and cited-page exports.
7. The six-market international research matrix plus conversational/AI-style parent prompts.
8. C0 commercial facts, attribution and qualified-lead measurement contract.
9. Declared operating priors supplied by the business owner: approximately 1 enrolment per 3 completed demos and approximately 1 budget-related drop-off per 5 leads at ₹400/class. These are planning heuristics, not audited CRM conversion rates.

## Google Search Console observed evidence

The supplied GSC export is Web Search, Last 3 months. Its daily chart covers **9 June 2026 through 8 September 2026** and records:

- **6,612 clicks**
- **107,515 impressions**
- **6.15% calculated CTR**
- approximately **7.55 impression-weighted average position**
- **1,000 exported query rows**

The strongest commercial family is clearly phonics. A conservative commercial classifier identifies **103 phonics-class/course/tutor/fee/demo/near-me rows**, representing **7,604 impressions and 124 clicks** within the top-1,000 query export.

Key observed examples include:

- `phonics classes` — 1,056 impressions / 6 clicks / position 4.88
- `phonics classes online` — 764 / 18 / position 4.86
- `best phonics classes online` — 600 / 16 / position 2.42
- `online phonics classes for kids` — 443 / 11 / position 6.98
- `best online phonics classes in india with fees` — **117 / 11 / 9.40% CTR / position 2.72**

This changes C1's diagnosis: Tiny Steps already has meaningful phonics commercial discoverability. The next problem is primarily commercial click capture, owner clarity and intent alignment rather than creating more thin phonics URLs.

Detailed observed metrics are documented in `C1_OBSERVED_GSC_BING_EVIDENCE_2026-09-10.md`.

## International Google evidence

Whole-site GSC country data validates international visibility independently of synthetic keyword research:

- India — 1,909 clicks / 33,025 impressions
- United States — **1,587 / 26,641**
- United Kingdom — 264 / 5,254
- Australia — 280 / 3,873
- United Arab Emirates — 104 / 1,700
- Singapore — 73 / 1,041

Country-level visibility is therefore real. However, explicit country-modified commercial queries remain sparse in the top-1,000 query extract, so C1 still does **not** authorize country landing pages. C2 must determine whether international modifiers belong to existing global programme owners or genuinely require distinct ownership.

## Bing Web + Bing AI evidence

The supplied Bing CSVs do not encode their selected reporting period, so their totals must not be directly time-normalized against Google's 92-day export.

Bing Web nevertheless independently corroborates high-value commercial modifiers such as:

- online phonics classes
- best phonics class for kids
- cost of phonics classes in India
- phonics demo questions parents should ask
- 1:1 English classes for kids in India
- reviews of Tiny Steps online English courses

Bing AI adds an especially important evidence layer. Tiny Steps is already cited for commercial-adjacent grounding queries including:

- `phonics classes for kids` — 25 citations / 16.23% citation share
- `online phonics classes` — 24 citations / 20.34% citation share
- `beginner phonics program age range` — 26 citations / 43.33% citation share

The `/phonics` page has **120 Bing AI citations** in the supplied page report. `/online-english-classes-for-kids` has 34, `/speaking` 15 and `/reading-classes-for-kids` 3. No supplied Bing AI page row was observed for `/book-demo`, `/writing-classes-for-kids` or `/spoken-english-classes-for-kids-online`.

This means AI commercial visibility is now **observed evidence**, not merely a hypothetical AI-style query layer.

## Google generative-search baseline

The earlier Google Generative AI exports show:

| Period | Impressions | Observed days | Avg/day |
| --- | ---: | ---: | ---: |
| 18–31 May 2026 | 1,037 | 14 | 74.1 |
| June 2026 | 3,037 | 30 | 101.2 |
| July 2026 | 7,207 | 31 | 232.5 |
| August 2026 | 9,756 | 31 | 314.7 |
| 1–9 September 2026 | 2,722 | 9 | 302.4 |

September's largest visible surfaces include `/free-letter-tracing-game-for-kids`, `/phonics`, `/blog/satpin-phonics-guide`, the homepage and `/letter-tracing-with-sounds-game`. This reinforces that informational/utility visibility is strong, but C0-qualified organic leads remain the business KPI.

## International + AI-style research layer

C1 also contains a systematic six-audience international matrix for UAE, USA, UK, Australia, Singapore and NRI families. The complete matrix contains **66 researched international commercial queries** across English, phonics, reading, grammar, creative writing, spoken English, public speaking, communication, 1:1 tutor, fees and trial/demo intent.

A separate conversational layer models parent questions likely to appear in ChatGPT, Gemini, Copilot, Perplexity and natural-language search. The actual GSC export now supplies supporting real-world evidence that conversational queries occur: one observed Google query asks which online course can help a six-year-old in Jeddah move from memorizing English words to speaking complete sentences.

## Current commercial maturity signal

The evidence now supports this hierarchy:

**Phonics — mature commercial visibility; optimize capture and ownership.**

**Broad English — emerging commercial visibility.**

**Reading — early but observed commercial visibility.**

**Public speaking / spoken English — visible but weak relative to phonics.**

**Grammar / writing / communication — thin current commercial query evidence; require selective expansion rather than cloned page architecture.**

## C1 completion gate

C1 is complete when:

- all planned subjects are represented;
- the full parent decision journey through enrolment is represented;
- the six-market international matrix is complete;
- conversational/AI-style parent research is represented;
- every researched query is classified;
- Google Web query/page/country evidence is available and normalized;
- Bing Web keyword/page evidence is available and normalized;
- Bing AI grounding/page evidence is available and normalized;
- reporting-period uncertainty is preserved rather than guessed;
- operating conversion priors remain labelled as heuristics rather than audited rates;
- AI visibility is not substituted for qualified-lead measurement;
- C0 and KB-FINAL remain frozen;
- no canonical owner is assigned in C1;
- no public-page/title/H1/URL implementation occurs in C1;
- exact-head tests, audits, typecheck, repository tests, build/prerender and SEO smoke are green.

Canonical ownership and cannibalisation decisions begin in **C2**.
