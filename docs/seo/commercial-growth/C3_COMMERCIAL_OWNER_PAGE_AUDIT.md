# C3 — Canonical Commercial Owner Page Audit & Intent Implementation

Revision: 2026-09-10-c3-r2
Status: implementation-complete pending exact-head CI
Depends on: C1 frozen, C2 ownership-complete

## Mission

Audit every canonical commercial owner selected in C2 and strengthen only the pages that need intervention. C3 reviews title/meta intent, visible high-intent language, H1/section structure, answer-first content, FAQs, structured data, geography, conversion paths, and cannibalisation boundaries.

C3 follows a **protect-or-strengthen** rule: a page that already has strong first-party visibility and a coherent commercial architecture is protected from unnecessary rewriting. Weak or specialist owners receive targeted improvements.

## Accounting clarification

The user-facing C2 summary contains **15 ownership boundaries**. The machine-readable C2 model contains **16 clusters** because generic `online English tutor for kids` intent is tracked separately even though it shares the same canonical owner as broad online English.

Therefore C3 audits:

- **16 machine-readable C2 clusters**
- **15 user-facing ownership boundaries**
- **14 unique canonical owner pages**

`/speaking` owns two machine clusters: public speaking and general communication.
`/online-english-classes-for-kids` owns two machine clusters: broad English and generic English-tutor intent.

## Page-by-page audit

| Canonical owner | C2 intent | C3 decision | C3 result |
| --- | --- | --- | --- |
| `/phonics` | Generic phonics classes | PROTECT | Existing high-intent title/canonical, Course schema, answer-first content and strong GSC/Bing visibility preserved. Existing Course geography already covers India + Worldwide. |
| `/best-online-phonics-classes-for-kids-in-india` | Best/comparison phonics | PROTECT | Existing comparison framework, provider scorecard, transparent evidence and distinct comparison intent preserved. |
| `/phonics-fees-india` | Phonics fees/cost | REPAIR | Price-research architecture preserved; served build now normalizes Tiny Steps standard live 1:1 duration to exactly 35 minutes instead of stale 35–40 wording. |
| `/reading-classes-for-kids` | Reading classes | PROTECT | Existing broad reading/tutor/problem structure, pathway schema and fluency boundary preserved. Weak current rank alone is not treated as evidence for a wholesale rewrite. |
| `/reading-fluency-program` | Reading fluency programme | STRENGTHEN | Added stronger `reading fluency classes for kids online` language, Course + WebPage semantics, live 1:1/35-minute facts, India + Worldwide availability, pricing path, and explicit broad-reading boundary. |
| `/grammar` | Grammar classes | PROTECT | Strong programme architecture, answer-first sections and writing boundary preserved. Course service geography normalized to India + Worldwide in the build. |
| `/writing-classes-for-kids` | Writing / creative writing | STRENGTHEN | Added creative-writing/provider language, live 1:1 facts, Course schema, India + Worldwide service, richer FAQs, and explicit grammar-vs-writing distinction. |
| `/spoken-english-classes-for-kids-online` | Spoken English | STRENGTHEN | Added 1:1/fluency/NRI/international language, 35-minute fact, international availability, and explicit spoken-English-vs-public-speaking boundary. |
| `/speaking` | Public speaking | PROTECT | Existing commercial programme, H1, speaking-confidence/storytelling/presentation architecture and GSC visibility preserved. Course geography normalized to India + Worldwide. |
| `/speaking` | General communication | PROTECT | General communication remains on the same strong owner; no duplicate communication URL created. |
| `/confidence-building-program-kids` | Confidence-building programme | STRENGTHEN | Added Course + WebPage semantics, live 1:1/35-minute/worldwide programme facts and explicit specialist boundary from general `/speaking` intent. |
| `/online-english-classes-for-kids` | Broad/global/NRI English | STRENGTHEN | Added NRI, UAE, USA, UK, Australia, Singapore and 1:1 tutor language without country pages. Corrected public age bands to ages 3–12. |
| `/online-english-classes-for-kids` | Generic online English tutor | STRENGTHEN | Natural tutor terminology incorporated into the same broad-English owner; no competing tutor landing page. |
| `/online-english-classes-hyderabad` | Hyderabad English | PROTECT | Local Service semantics, Hyderabad areaServed, online-only context and local-vs-global boundary preserved. |
| `/pricing` | General fees/value | PROTECT | Central pricing config, OfferCatalog, ₹400 standard 1:1 / ₹4,800 12-class facts and cross-programme comparison path preserved. |
| `/book-demo` | Demo/assessment/trial | PROTECT | Transactional Service/Offer price-0 semantics, free 35-minute 1:1 assessment, attribution and booking form preserved. |

## SEO / AEO / GEO policy

C3 does **not** create special “GEO markup” or AI-prompt pages. Search and generative systems receive the same factual, crawlable, well-structured page: one canonical intent owner, clear answer-first sections, explicit audience/format/location facts, descriptive structured data, and relevant internal links.

Visible FAQs are retained where they help parents understand the offer and allow concise answer extraction. C3 does not treat FAQ schema as a guaranteed Google rich-result feature.

Google ignores the `meta keywords` tag for ranking, so C3 does not use meta-keyword stuffing as an optimization strategy. Important commercial language is placed naturally in titles where appropriate, H1/body copy, answer sections, internal links and structured data.

## International handling

C1 found real international visibility and researched UAE, USA, UK, Australia, Singapore and NRI-family demand. C2 deliberately assigned those queries to existing programme owners. C3 therefore strengthens the broad/global pages rather than creating thin geographic duplicates.

- Phonics international intent → `/phonics`
- Grammar international intent → `/grammar`
- Writing international intent → `/writing-classes-for-kids`
- Spoken English international intent → `/spoken-english-classes-for-kids-online`
- Public speaking/communication international intent → `/speaking`
- Broad English / generic tutor / NRI intent → `/online-english-classes-for-kids`
- Explicit Hyderabad intent remains → `/online-english-classes-hyderabad`

Country pages created in C3: **0**.
AI-prompt pages created in C3: **0**.

## Cannibalisation boundaries retained

C3 strengthens canonical owners but does not yet execute the C2 legacy-page consolidation actions. These remain explicit downstream implementation/reconciliation tasks:

- `/public-speaking-communication-kids` → consolidate to `/speaking`
- `/english-grammar-writing-classes` → demote/reposition as a chooser/support surface rather than generic grammar/writing owner
- `/online-english-classes-for-kids-india` → preserve existing 301 to `/online-english-classes-for-kids`
- `/resources/*` → remain informational/support-only for commercial intent

## Factual corrections made

1. Standard live 1:1 class duration is consistently treated as **35 minutes**, not 35–40 minutes.
2. Broad public English audience is kept at **ages 3–12**, not 4–13.
3. Core online programme geography reflects **India and worldwide** service where appropriate.
4. Hyderabad remains a local online intent surface and does not imply a physical learning centre.

## C3 completion gate

C3 can be frozen when:

- all 16 C2 machine clusters are audited exactly once;
- all 14 unique owner pages exist, remain indexable and retain their self-canonical;
- strengthened pages contain the required commercial/AEO/international facts;
- protected winners retain their established intent boundaries;
- no country or AI-prompt pages are created;
- C2 ownership remains unchanged;
- C3 tests and structural audit pass;
- typecheck and full repository tests pass;
- production build/prerender passes;
- post-build C3 audit passes;
- SEO smoke passes on the exact C3 head.
