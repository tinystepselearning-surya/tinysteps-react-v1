# TSSA-SCQ — Bing opportunity query audit of existing commercial and educational owners

**25 October 2026 | Editorial/source audit of existing Tiny Steps site | Read-only change record**

## Decision

The eight selected Bing Topics Portfolio **opportunities are queries on which other sites received AI citations but Tiny Steps did not within Bing's selected dashboard scope**. They are NOT claims that Tiny Steps is invisible to Google, unindexed, educationally incomplete, or lacking a website page. No observed defect warrants a new page, redirect, canonical change or unvalidated keyword stuffing.

**Outcomes:** five child-programme-specific/related query strings map well to a dedicated existing commercial page (three Spoken English variants and two Public Speaking variants), one query has a legitimate dual Phonics/Reading meaning, one is a very broad reading-stage term, and one is ambiguous between child phonics and general linguistic phonetics. These are **editorial intent classifications**, not independently observed provider rankings or human panels.

## Evidence and limitations

- Bing [Topics Portfolio Beta, 13 Oct 2026](https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/) states opportunities are based on queries where **other sites** receive citations and the site does not. Competitor citation volume is an approximate **range**. The user-supplied 50-row opportunities export lacks selected dashboard dates and query→page mapping.
- Review performed against current `main` source content and public result snippets for the existing Tiny Steps programme and blog URLs. Content checked includes canonical page/topic purpose, actual programme distinctions, teaching progression, real practice examples, FAQ, class/demo CTAs, transparent pricing and internal routes.
- **Sitemap membership validated** in `public/sitemap-static.xml` and `public/sitemap-blog.xml`: `/spoken-english-classes-for-kids-online`, `/speaking`, `/phonics`, `/resources/phonics`, `/reading-classes-for-kids`, `/online-english-classes-for-kids`, `/blog/what-is-phonics-for-kids`, `/blog/why-public-speaking-is-important-for-kids` all have one intended published owner.
- Google connected Search Console: exact query+page rows on domain property, **27 Sep–24 Oct 2026**. The eight target queries returned three URL rows, all for `public speaking for kids`. Lack of returned rows for the other seven strings is **not proof of zero impressions**, indexing loss, or absence from Google; long-tail queries may be anonymized/suppressed.
- Existing separate GSC result for **`online spoken english classes for kids`** is a different query (not in the eight exact Bing opportunity strings): 12 Hyderabad broad English chooser impressions, 11 dedicated Spoken English, four broad English, zero clicks. This is relevant cross-query context but not an exact-query opportunity measurement.
- Prior source-backed [query-page report](./PHASE4_GOOGLE_BING_QUERY_PAGE_EVIDENCE_2026-10-25.md) finds five high-intent Phonics buyer queries lead primarily to `/phonics`; weak CTR on that page is a separate issue #779 and must not be treated as a topic-coverage gap.

## Eight-query owner and substantive-answer review

| Bing opportunity query | Approximate citations to other sites | Existing intended owner | Content-fit assessment | Next action |
| --- | --- | --- | --- | --- |
| `spoken english classes` | 1K–5K | `/spoken-english-classes-for-kids-online` | **Covered for children**: live 1:1 teaching, sentence expansion, conversational English, age context, examples, stages, assessment and pricing. Phrase without 'kids' is **age-ambiguous**; much ecosystem demand may be adult classes. | Preserve child-specific owner; inspect Bing results and parent-intent mix. Do not create an adult-style generic page. |
| `spoken english classes online` | 101–500 | `/spoken-english-classes-for-kids-online` | **Covered for children**: online delivery, international schedules, real conversation practice, demo and examples are explicit. Ambiguous unqualified audience. | Keep existing page; examine Bing's age intent and cited competitor formats, not keyword repetition. |
| `online spoken english classes` | 101–500 | `/spoken-english-classes-for-kids-online` | **Covered for children**, with distinct assessment and everyday conversational fluency, explicitly distinguished from stage-facing Public Speaking. | Audit snippet/Google selected page and parent navigation; no canonical/redirect proposal. |
| `public speaking for kids` | 1K–5K | `/speaking` | **Covered**: relevant child skills (organising ideas, storytelling, show-and-tell, presentations, reasons, audience), live teacher-guided practice, age-appropriate progression, honest programme boundary and clear CTAs. | Monitor organic click-through and actual Bing cited-page retrieval. |
| `learning public speaking for kids` | 51–100 | `/speaking` with `/blog/why-public-speaking-is-important-for-kids` | **Covered for child education**, programme and explanatory guide complement one another. | Preserve programme/guide distinctness; no additional SEO page. |
| `phonics reading` | 1K–5K | `/phonics` for decoding instruction; `/reading-classes-for-kids` for connected reading; `/resources/phonics` for information | **Dual intent, not a confirmed gap**: main Phonics page explains sound–letter relationships, blending, decoding and distinction from reading fluency/comprehension. Reading page deliberately owns broader connected-text support. | Preserve distinct programme paths; verify the handoff labels and Bing cited pages, avoid redirecting one to the other. |
| `learn to read` | 1K–5K | `/reading-classes-for-kids` plus `/phonics`, parent learning guides | **Broad/partially aligned intent**: user may seek early decoding, independent home practice, literacy instruction, adults' learning or a commercial tutor; existing children-specific learning-stage choices support relevant subset. | Clarify age/starting skill and consider whether existing hub prompts route parents correctly; do not chase universal generic query. |
| `phonetic sounds` | 500–1K | `/blog/what-is-phonics-for-kids` | **Educationally covered for English children's letter–sound links**: grapheme–phoneme correspondences and distinction between phonemic awareness and phonics. Ambiguous against general phonetics, speech sounds or IPA. | Retain clear definitions; no speculative phonetics/IPA course pages or irrelevant query targeting. |

## First-party Google validation of exact opportunity terms

| Exact Google query, 27 Sep–24 Oct | Reported page | Impressions | Clicks | Average position |
| --- | --- | ---: | ---: | ---: |
| `public speaking for kids` | `/speaking` | 66 | 1 | 8.79 |
| `public speaking for kids` | `/blog/why-public-speaking-is-important-for-kids` | 11 | 0 | 20.27 |
| `public speaking for kids` | `/public-speaking-communication-kids` | 3 | 0 | 12.33 |

These are Google (traditional Search) observations, **not Bing AI citations**. Search Console can suppress individual queries; no returned row for the other seven phrases means no **reported row in this exact extraction**, not confirmed zero exposures. Average positions are not a deterministic screenshot or controlled rank measurement.

## Specific quality / content observations

1. **Spoken English:** already includes a live class description, actual illustrated response expansion examples, confidence vs language distinction, international suitability, 35-minute standard class, transparent fee and assessment. Broader Google `/online-english-classes-hyderabad` chooser also appears for *online spoken english classes for kids*; review page-selection/snippet fit before any metadata changes. **No proven on-page factual or educational defect.**
2. **Public Speaking & Communication:** detailed staged curriculum, child-speaking practice, 1:1/35-minute format, programme vs Spoken English distinction, school speech vs meaningful communication, independent speaking and class samples. Supporting article has a different informational purpose. **No proven on-page factual or educational defect**; monitor Google CTR.
3. **Phonics/Reading:** sources accurately distinguish decoding from fluency and comprehension and have published paths to hand off a parent between learning stages. Phase 3A [PR #783](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/783) already proposes narrow parent-problem handoff links and remains **open/unmerged**. Avoid duplicate link changes before review.
4. **Phonetic sounds:** avoid treating all broad phonetics searches as opportunities for children's phonics services. The existing conceptual article explains the essential relationship, including graphemes/phonemes, enough to support age-relevant interpretation. **No evidence-based reason for an IPA glossary or new page.**

## Decision register

| Gate | Decision |
| --- | --- |
| Source coverage / canonical owners | **Pass, scoped to existing children-focused intents**; eight opportunity phrases map to existing URLs with some broad intent ambiguity. |
| Core pedagogical explanation and parent action | **No critical defect demonstrated** in source audit. Do not inflate this to a verified top search ranking or universal quality pass. |
| Bing AI uncited opportunities | **Open external result.** Confirm with the exact selected date period and Grounding Query→Pages mapping before claiming a URL-specific AI citation gap. |
| Google commercial search improvement | **Separate from educational content coverage.** Validate mobile SERPs/snippets and source/medium organic enquiries before page copy tests. |
| Release action | **Documentation-only; no website changes authorized**. Keep production PRs #782 and #783 separate and subject to their release review. |

## Next measurable actions

- P0: retrieve selected-period Bing AI query→pages and **full cited pages** exports for relevant Spoken English, Public Speaking and Phonics/Reading opportunities; distinguish actual Tiny Steps citing pages from other sites' results.
- P0: inspect India-mobile Google result presentation for `/phonics`, `/speaking` and child Spoken English owner; compare organic competitors and paid/AI panels without making algorithm-causality claims.
- P0: validate GA4 **completed enquiry** event name, source/medium and landing-page attribution instead of using all `key events` as leads.
- P1: If a genuine within-owner answer omission or unclear handoff is reproducible, prepare a **separate tiny content PR**, rerun generated HTML, article/route SEO tests and monitor a matched post-merge period. Do not generate new programme URLs.

**Status:** Existing-content opportunity triage completed. Bing-native URL citation verification and actual conversion attribution remain external dependencies; Phase 4 remains partially open.

