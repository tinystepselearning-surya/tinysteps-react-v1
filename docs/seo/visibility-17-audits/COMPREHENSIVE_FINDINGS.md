# Tiny Steps Learning — Comprehensive SEO, AEO & GEO Findings Register

**Programme:** 17 independent audits / one consolidated evidence register / one eventual prioritised remediation plan  
**Status:** 8/17 REPORTS INTEGRATED — A01 EVIDENCE COLLECTED, A02–A08 COMPLETE WITH LIMITATIONS; A09/A10 REPORTS AWAITING INTEGRATION; NO FULL-PLATFORM ASSURANCE  
**Created:** 2026-10-17 (IST)  
**Canonical scope and operating rules:** [MASTER_AUDIT_CHARTER.md](./MASTER_AUDIT_CHARTER.md)  
**Individual report format:** [AUDIT_REPORT_TEMPLATE.md](./AUDIT_REPORT_TEMPLATE.md)  
**Source of truth:** This register summarises; each reports/AXX.md and its dated evidence ledger are the detailed evidence source.  
**Website:** https://tinystepslearning.com  
**Repository:** tinystepselearning-surya/tinysteps-react-v1, branch main

> IMPORTANT: This is a preparation baseline, NOT a website audit verdict. No green score, indexable verdict, AI citation rate, Google/Bing status or problem closure may be asserted until dated evidence from an actual audit supports it. This document is updated after each independently completed or evidence-collected report, BY ONE INTEGRATION CHAT AT A TIME.

## 1. Executive programme dashboard
| Indicator | Current state | Rule |
|---|---|---|
| Planned audit workstreams | 17 | Fixed A01–A17 |
| Workstreams with source reports on main | **10/17** — A01–A10 | Directory verified 2026-10-17; A09/A10 remain unintegrated |
| Integrated workstreams | **8/17** — A01–A08 | A09/A10 remain unintegrated |
| Complete verified | **0/17** | No unqualified pass |
| Complete with limitations | **7 integrated/17** — A02–A08 | A09/A10 published but not evidence-integrated; no full-platform assurance |
| Evidence collected, still open | **1/17** — A01 | Live technical/AI/search verification unfinished |
| Reproduced P0 / P1 failures | **0 confirmed live P0/P1 outages in 8 integrated reports**; **1 P1 source-only governance gap** (A08-F001) | A07-F003 is verification-only, not proved live sitemap omission or indexing failure |
| High-priority *unverified* risks | A01-F003/F005, A03-U001, A04-U001, A05-U001/U002, A06-E032 historical, **A07-F003 Vocabulary served sitemap**, A08-H001/H003; separate source P1 A08-F001 | No confirmed live indexing outages; raw origin/GSC checks A17 |
| Qualified source/content/link finding rows | **26** — previous 23 plus A07-F001/F002/F004 | A07-F001 adds gateway referral clarity but reuses A06/A13 underlying unplayable speaking game state; **not** 26 independent root causes |
| Additional unverified candidates / evidence gaps | **Prior 16 + A08-H001–H006 + A07-F003** | These are named pending checks with overlaps (especially A17); not independently confirmed production defects |
| Google/Bing indexed count | **UNKNOWN** | No first-party inspections |
| Native AI-engine results | **0 tested**, **98 prompts queued** in integrated A01–A08 | 392 possible platform–prompt runs across four engines, none executed; A09/A10 prompts not yet counted |
| Lead conversion results | **UNTESTED** | No production lead submitted |
| SEO/AEO/GEO composite | **NOT SCORABLE** | All 8 integrated reports have substantial unverified platform/technical evidence |
| Next work | Integrate A09/A10; run A11–A17; gather first-party and origin HTTP evidence | No website implementation |

### Definitions

**PLANNED** means no source report. **EVIDENCE COLLECTED** means a published partial audit with documented gaps. **COMPLETE WITH LIMITATIONS** means the author finished its report but key first-party/native tests are unavailable. **COMPLETE VERIFIED** requires all mandatory proof. **INTEGRATED** means this register includes the source report's current evidence, even if its audit state is not complete. Reporting and remediation are distinct.

## 2. Workstream status register — 17 fixed IDs

Current directory check (2026-10-17 IST) confirms A01–A10 report files on main; **A01–A08 are integrated**. **A09 and A10 are COMPLETE WITH LIMITATIONS in their own reports but NOT YET INTEGRATED**. A11–A17 are not present in the inspected report directory. Source blob SHAs for received reports are shown in this table; only integrated evidence is counted in §§3–9.

| ID | Subject | Primary owner(s) | Source report (expected) | Audit state | Integration state | Evidence coverage | Latest report/update |
|---|---|---|---|---|---|---|---|
| A01 | Homepage | / | [A01](./reports/A01.md) | **EVIDENCE COLLECTED** | **INTEGRATED 2026-10-17 IST** | 1/1 root source/search text; live raw HTTP unverified; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `ca7bf5393c77` |
| A02 | Curriculum | /curriculum | [A02](./reports/A02.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | Hub source + public text reviewed; dependent course URLs partial; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `96354f656969` |
| A03 | Phonics commercial | /phonics + comparison/fees | [A03](./reports/A03.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 3/3 owned + 4/4 adjacent web text; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `0e9b6031841e` |
| A04 | Reading commercial | /reading-classes-for-kids + /reading-fluency-program | [A04](./reports/A04.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 2/2 owned + 2/2 linked parent help; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `8d48cc47e1b6` |
| A05 | Grammar commercial | /grammar + /writing-classes-for-kids + Beginner/Advanced/chooser | [A05](./reports/A05.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 5/5 canonicals publicly retrievable; source sitemap/intent; GSC/BWT 0/5, native AI 0/4 | 2026-10-17; blob `d43047ddd4e0` |
| A06 | Speaking commercial | /speaking + /spoken-english-classes-for-kids-online + specialist confidence + two levels | [A06](./reports/A06.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 2/2 primary and 8/8 commercial/support owner texts retrieved by A06 web reader; source index intent, GSC/Bing 0/6 core, native AI 0/4 | 2026-10-17; blob `0dc87fb7ca40` |
| A07 | Resources gateway | /resources + 7 pathways | [A07](./reports/A07.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 8/8 starting pages, 7/7 cards, 18/18 answer-layer links publicly retrievable; 22/53 checks evidenced (41.5%); 0 GSC/Bing/native AI | 2026-10-17 11:18 IST; blob `6c6bf01c4f06` |
| A08 | Phonics & Reading knowledge | /resources/phonics | [A08](./reports/A08.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 32/32 hub+31 guides reported tool-readable; 32/32 source sitemap; raw HTTP 0/32, GSC/Bing 0/32, native AI 0/4 | 2026-10-17; blob `70d9c36c216e` |
| A09 | Grammar & Writing knowledge | /resources/grammar | [A09](./reports/A09.md) | **COMPLETE WITH LIMITATIONS (report received)** | **NOT INTEGRATED** | Hub + 38 children described in received report; detailed findings await integration | 2026-10-17; blob `2d8266742172` |
| A10 | Vocabulary knowledge | /resources/vocabulary | [A10](./reports/A10.md) | **COMPLETE WITH LIMITATIONS (report received)** | **NOT INTEGRATED** | Hub+16 child guides+practice shell described in received report; detailed findings await integration | 2026-10-17; blob `677f38d02502` |
| A11 | Speaking & Communication knowledge | /resources/speaking | reports/A11.md | PLANNED | NOT INTEGRATED | — | — |
| A12 | Parent Help | /parents | reports/A12.md | PLANNED | NOT INTEGRATED | — | — |
| A13 | Free Learning Activities | /free-english-games-for-kids | reports/A13.md | PLANNED | NOT INTEGRATED | — | — |
| A14 | Schools & Educators | /for-schools | reports/A14.md | PLANNED | NOT INTEGRATED | — | — |
| A15 | Every published blog article | /blog + all /blog/... | reports/A15.md | PLANNED | NOT INTEGRATED | — | — |
| A16 | Commercial and lead pages | /courses /pricing /book-demo /contact + more | reports/A16.md | PLANNED | NOT INTEGRATED | — | — |
| A17 | Sitewide technical and reconciliation | robots / sitemaps / rendered routes | reports/A17.md | PLANNED | NOT INTEGRATED | — | — |

### Pre-audit route and inventory notes (NOT defect findings)

- GitHub source src/pages/ResourcesPage.tsx maps four knowledge hubs and three external-to-resources-hub sections: /resources/phonics, /resources/grammar, /resources/vocabulary, /resources/speaking, /parents, /free-english-games-for-kids and /for-schools.
- A04 source and public web reading evidence supports /reading-classes-for-kids as the broad connected-reading owner and /reading-fluency-program as the specialist fluency owner; /reading is not presumed canonical. Wire-level canonicals and actual Google/Bing indexing remain **unverified**.
- The website blog UI has described 83 articles; older docs/seo/blog-quality/AUTHORITATIVE_76_SEQUENCE.md governs a historical 76-post quality sequence, and public/llms.txt references a curated 51-article reviewed set. These are not interchangeable publication inventories. A15 must determine today's full count.
- A03 must specifically investigate prior October 2026 concerns over indexability of the best-online-phonics comparison URL. There is no assumed resolution or proven active outage in this baseline.
- Historic docs/ai-geo-implementation-status.md and other SEO plans document earlier code work; they do not replace a current-production indexability or native-answer-engine test.
- Public web/search retrieval snapshots may lag deployments. Record cached vs live disagreement rather than silently choosing one.

## 3. Qualified findings and unverified hypotheses

**Evidence rule:** The qualified table contains findings supported by sampled page text and/or repository source, each with explicit limits on production deployment. **No live P0/P1 availability or indexing outage has been reproduced in integrated A01–A08.** A08-F001 is **P1 source-governance evidence**, not a confirmed live crawl failure or proof every teaching example is wrong. These observations do not independently establish Google/Bing exclusion, faulty live HTTP or false marketing statements.

| Canonical ID | Owner/priority | Affected URL(s) | Reproduced scope and explicit limitation | Evidence source | Hypothesized cause / proposed action (not approved) | Acceptance test and state |
|---|---|---|---|---|---|---|
| A02-F002 | A02 / P2 improvement | `/curriculum` | Roadmap explains skill stages, but specific parent-facing operational cutoffs/sample mastery rubrics were not identified in the reviewed material | [A02](./reports/A02.md) A02-E001/E004 | Consider academically approved illustrative milestone/rubric examples | Parent can understand indicative progression; **OPEN IMPROVEMENT**, not broken assessment |
| A03-F001 | A03 / P2 | `/phonics-fees-india` | **Source** sitemap lastmod is 2026-09-11, while the page describes research reviewed 2026-09-24; real material-edit date and live XML are **unverified** | [A03](./reports/A03.md) A03-E003/E009/E012/E013 | A17 validate genuine edit date and deployed sitemap; correct only if inaccurate | Deployed lastmod reflects meaningful page modification; **SOURCE VERIFIED / LIVE UNVERIFIED** |
| A03-F002 | A03 / P2 | `/phonics`, `/best-online-phonics-classes-for-kids-in-india` | Sampled promotional 5000+/15+ and parent quote text lacks directly inspectable methodology/permission records; **not proof of false claims** | [A03](./reports/A03.md) A03-E001/E002/E015 | Compile dated, consent-safe evidence pack and appropriate public disclosures; relate A01-F001 | Sound aggregate figures and permissions underpin on-page claims; **OPEN CONTENT REVIEW** |
| A03-F003 | A03 / P2 | `/phonics-apps-for-preschoolers-india` | Retrieved copy invokes shared CBSE/ICSE/IB sound order and expectations without precise official basis | [A03](./reports/A03.md) A03-E006 | Academic review; qualify broad claim or provide authoritative reference | No unsupported cross-board common sound-order implication; **OPEN VERIFIED WORDING CONCERN** |
| A03-F004 | A03 / P3 | `/online-phonics-reading-classes` | Source retains JSX route despite Firebase/source redirect intent to `/phonics`; **no live duplicate detected** | [A03](./reports/A03.md) A03-E005/E011/E019 | Only after HTTP 301 regression check, reconcile legacy code | Single correct live redirect; **OPEN SOURCE MAINTENANCE ONLY** |
| A04-F001 | A04 / P2 improvement | `/reading-classes-for-kids`, `/reading-fluency-program` | Public reading landing copy explains progress/assessment but gives no concrete sample passage, reading-specific scoring or illustrative baseline-to-progress evidence; **does not imply assessments are missing** | [A04](./reports/A04.md) A04-E001/E002/E006/E007/E014 | Academically approve clearly illustrative/non-diagnostic reading accuracy, phrasing, vocabulary and comprehension/retell worked sample; A02-F002 covers broader curriculum rubric | Parent can see safe example of progress measurement, not an invented outcome; **OPEN CONTENT IMPROVEMENT** |
| A04-F002 | A04 / P2 link-intent improvement | `/reading-classes-for-kids` | “Reads the words but cannot explain the story” card links general `/blog/phonics-comprehension`, although topic-owner registry assigns diagnostic intent to `/blog/why-child-reads-words-but-does-not-understand-story`, already linked elsewhere on page | [A04](./reports/A04.md) A04-E001/E006/E012 | Fix only specific parent problem card; keep generic bridge for phonics-to-meaning context; A15 owns article QA | Parent problem card targets matching canonical article; **OPEN LINK IMPROVEMENT** |
| A04-F003 | A04 / P3 contextual link opportunity | `/reading-fluency-program` | Specialist fluency page does not link directly to existing `/blog/how-to-improve-reading-fluency-in-children` instruction guide, though broad reading page links it; **not an indexing defect** | [A04](./reports/A04.md) A04-E002/E007/E013 | Add contextual existing-article link without weakening demo CTA or changing A15 article ownership | Live specialist page has relevant crawlable guide link; **OPEN OPTIMISATION** |
| A05-F001 | A05 / P2 source link clarity | `/grammar` | Separately labelled Beginner and Advanced curriculum CTAs point to the same `/curriculum?tab=grammar` despite dedicated `/courses/grammar` and `/courses/grammar-mastery` level pages; existing URL is not broken | [A05](./reports/A05.md) A05-E001/E003/E004/E007/E010 | Proposed distinct destinations for two level cards, retaining general curriculum link; not an index failure | Beginner targets Beginner course and Advanced targets Mastery course, tested on live mobile/desktop after approved change; **OPEN CONTENT/NAVIGATION IMPROVEMENT** |
| A05-F002 | A05 / P2 buyer guidance | `/writing-classes-for-kids` | Programme page shows writing activity stages but no writing-specific age/readiness range, lesson-length programme sequence or level counts; not proof internal curriculum is absent | [A05](./reports/A05.md) A05-E002/E009 | Academic team confirm actual Writing age/level/supply and disclose validated fit, avoid guessed lesson totals | Accurate decision details supported by curriculum owner; **OPEN CONTENT IMPROVEMENT** |
| A05-F003 | A05 / P2 pedagogic evidence | `/grammar` | Programme copy says teachers correct grammar and show progress but lacks a worked error-to-correction-to-fresh-sentence transfer sample or example grammar progress checkpoint; Writing owner contains examples | [A05](./reports/A05.md) A05-E001/E002/E008 | Academically approve an illustrative accessible grammar correction+independent application example; A02-F002 owns broader curriculum rubrics | Parent can see a non-diagnostic applied example without fabricated outcomes; **OPEN CONTENT IMPROVEMENT** |
| A06-F001 | A06 / P2 source structured-data vocabulary | `/speaking` | Three source ItemLists use non-existent Schema.org `https://schema.org/ItemListOrderUnordered`; correct unordered value is `https://schema.org/ItemListUnordered`, already used by specialist pathways. **Live emitted JSON-LD and search impact unverified** | [A06](./reports/A06.md) A06-E017 and §8 F001 | On approved remediation only, change three erroneous enum URIs, preserve correct one, validate deployed graph; A17 covers live deployment | No invalid enum in emitted schema, no broken graph/canonical; **OPEN SOURCE DEFECT, LIVE UNVERIFIED** |
| A06-F002 | A06 / P2 observed parent wording; **A12 edit owner** | `/shy-child-speaking-confidence` | Parent support page says shyness is “usually not just personality” and references eye avoidance/anxiety signs without nuanced context compared with programme clinical guardrails; **not a diagnosis or proof of harm** | [A06](./reports/A06.md) A06-E003/E009, §8 F002 | A12 independently assess softer individual/multilingual/context-based language and qualified referral; retain canonical A06 ID until A12 determines root finding, do not clone | Appropriate child-safe non-diagnostic copy approved by educational reviewer; **OPEN OBSERVED WORDING** |
| A06-F003 | A06 / P2 instructional example | `/spoken-english-classes-for-kids-online` | Source/retrieved offer describes response expansion, retry and fresh conversation but lacks a worked age-appropriate dialogue illustrating an initial answer, guided follow-up and independent transfer | [A06](./reports/A06.md) A06-E002/E018, §8 F003 | Academic-approved, clearly illustrative 2–3 genuine conversational exchanges; do not invent learner outcomes or move general public-speaking intent | Child-led speaking example and follow-up visible on live page, reviewer approved; **OPEN CONTENT IMPROVEMENT** |
| A06-F006 | A06 / P2 observed commercial tier naming; **A16 shared pricing owner** | `/courses/public-speaking-foundations`, `/courses/public-speaking-excellence`, reference `/pricing` | Speaking level pages call ₹400 1:1 “Premium”; main pricing page calls **₹400 Standard 1:1** and distinguishes separate **Ultra Premium** teachers; monetary fee amounts match. This is **label confusion**, not proven checkout error | [A06](./reports/A06.md) A06-E025, §8 F006 (distinct from §13 E030 games) | Coordinate with A16 to harmonize teacher-tier wording across course pages/pricing; no rate or billing edits without source approval | Parent sees consistent names for Standard versus Ultra Premium 1:1 without fee regression; **OPEN LIVE TEXT MISMATCH** |

| A08-F001 | **A08 / P1 source governance** | All 31 published `/resources/phonics/:slug` pages | Current `phonicsEditorialReviewRegistry.js` has empty Pilot and Wave 2 decision maps; **31/31 published guide records default to pending**, reviewedAt/revision null. This **does not prove no offline review occurred** or the pages are technically unindexable. | [A08](./reports/A08.md) E004/E005/E007 and §8 | Obtain genuine qualified academic review of exact content/revision and record dated decisions; no fabricated signoffs | Each published guide has an evidence-backed review entry tied to the exact revision; **OPEN P1 SOURCE GOVERNANCE**, live reviewer history unverified |
| A08-F002 | A08 / P2 phoneme notation | `/resources/phonics/j-sound-spellings-phonics`, `soft-g-hard-g-phonics` | Slash `/j/` is used for English 'j' in *jam/giant*; standard IPA `/dʒ/` is that sound whereas `/j/` is initial 'y' in *yes*. Could be informal classroom notation; no confirmed IPA convention. | [A08](./reports/A08.md) E008/E026/E027 | Publish an explicit phonics-to-IPA notation key or correct IPA symbol after expert review | Checked symbols consistent across guides; no confusing unlabelled slash convention; **OPEN WORDING/NOTATION** |
| A08-F003 | A08 / P2 educational provenance | 31 `/resources/phonics/:slug` templates | Guide template lacks a clearly shown actual byline/review timestamp and topic-specific educational references; source registry also reports pending signoffs. Distinct page-display issue from A08-F001 record governance. | [A08](./reports/A08.md) E007/E010 | Surface true reviewer/date and genuinely used sources after verification; cross-reference broader founder credentials A01-F002, don't duplicate that entity claim | Visible names/dates/sources backed by records, and crawler-visible; **OPEN IMPROVEMENT** |
| A08-F004 | A08 / P2 applied instruction | Phonics child-guide template / 31 informational guides | Current pattern explanations and word lists are concise but provide limited worked grapheme–phoneme mapping, spelling transfer and connected-text application. This is a depth opportunity, not proof of wrong teaching. | [A08](./reports/A08.md) E004/E010; individual E016–E046 | Add expert-approved rule-specific modelling, carefully sequenced contrast/reading/encoding exercises | Reviewer verifies examples, accessible sound-box models and transfer tasks without unsupported promises; **OPEN IMPROVEMENT** |
| A08-F005 | A08 / P2 navigation intent | `/resources/phonics` | “Browse all phonics guides” hero CTA points to `/blog?topic=Phonics` rather than the 31-guide list within its own hub. The blog destination exists; this is label/target mismatch, not a dead link. | [A08](./reports/A08.md) E001/E009 | Distinguish blog articles versus 31 published focus guides, relabel or target the appropriate hub anchor | Live link text and destination agree and are keyboard-accessible; **OPEN LINK CLARITY** |
| A08-F006 | A08 / P2 reading handoff | `/resources/phonics`, slow-reading parent pathway | Hub’s promoted commercial CTA goes to `/phonics`; limited direct next-step to `/reading-classes-for-kids` / `/reading-fluency-program` when decoding is secure but connected-text fluency weak. **Distinct from A04-F003 specialist-blog link**. | [A08](./reports/A08.md) E001/E011 | Add accurately labelled parent journey to A04-owned Reading programmes with assessment option, without rewriting A04 landing content | Slow-reading user can reach relevant reading owner in 1–2 clear steps; **OPEN HANDOFF OPPORTUNITY** |
| A08-F007 | A08 / P3 review/utility QA | Hub word–sound utility; 74 declared starter mappings | Utility publicly indicates pending human review and describes isolated sound cues; playback, pronunciation quality, audio assets and mobile focus **not verified**. | [A08](./reports/A08.md) E001/E012 | Audit 74 cues with trained teacher and accessible-device playback; do not label untested sound buttons broken | Signoff of actual word–sound pairs plus safe keyboard/audio test; **OPEN QUALITY CHECK (FUNCTION UNVERIFIED)** |
| A08-F008 | A08 / P3 terminology consistency | `oo-sounds-phonics`, `ch-tch-spelling-phonics` | Some upstream categories call OO 'diphthong' and group CH/TCH as 'digraphs' while instructional explanation distinguishes monophthongs and TCH as a trigraph. Nuanced taxonomic mismatch, **not proof a child was mis-taught**. | [A08](./reports/A08.md) E004/E006 | Qualified educational terminology cleanup across source categories and parent explanations | Accurate, age-appropriate consistent terminology confirmed by reviewer; **OPEN TERMINOLOGY REVIEW** |

| A07-F001 | A07 / P2 **gateway link expectation** (A13 owns games) | `/resources`, `/resources/speaking`, `/free-speaking-games-for-kids`, `/free-speaking-practice-game-for-kids` | Gateway practice invitation points to a **0/4 playable** speaking-games category and **Coming Soon** game. **Same underlying availability observation as A06 §13 E030/E031**; A07 uniquely owns gateway expectation disclosure, not a second game outage | [A07](./reports/A07.md) A07-E002/E006/E008/E009; A06 §13 E030/E031 | Clearly label forthcoming practice at entry or link genuinely playable activity; A13 owns game readiness | Correct availability visible before clicking or destination playable on desktop/mobile; **OPEN P2 gateway wording** |
| A07-F002 | A07 / P2 source SEO copy | `/resources` | Source route meta description omits **Vocabulary**, even though four topical resource hubs and three other pathways appear in the gateway; actual deployed initial HTML metadata unverified | [A07](./reports/A07.md) A07-E001/E002/E014 | Include accurate Vocabulary topic in gateway description without creating buyer-intent duplicate | Real initial/rendered meta covers actual seven destinations, canonical unchanged; **OPEN source-only copy gap** |
| A07-F004 | A07 / P2 taxonomy consistency | `src/lib/centralResourceSystem.js`, `/resources` | `CENTRAL_RESOURCE_SUBJECT_HUBS` lists only phonics, grammar and speaking; Vocabulary hub exists and is gateway-linked. Runtime consumer defect **not proven** | [A07](./reports/A07.md) A07-E001/E005/E015 | Examine consumers, reconcile intended four-hub taxonomy, preserve routes/cards | Four subject hubs represented consistently without duplicate cards or canonical shifts; **OPEN source-only drift** |

### Unverified candidate ledger — **not confirmed defects**
| ID | Report evidence | What remains unknown | Priority / owner |
|---|---|---|---|
| A01-F001 | [A01](./reports/A01.md) E001/E010 | Independent reach totals and dated definition; overlaps A03-F002 claim, but homepage surface remains distinct | P2 / A01, A16 |
| A01-F002 | [A01](./reports/A01.md) E002/E010 | Independently supported founder/academic qualification and reviewer records | P2 / A01 |
| A01-F003 | [A01](./reports/A01.md) E005/E006/E013 | Source metadata applied in React effect; check **live initial HTML**, canonical, noindex, JSON-LD before alleging crawler defect | **P1 validation priority**, A01/A17 |
| A01-F004 | [A01](./reports/A01.md) E001/E009 | Whether homepage overlaps broad `/online-english-classes-for-kids` in actual GSC queries | P2 / A01/A16 |
| A01-F005 | [A01](./reports/A01.md) E001/E008/E011 | True safe demo/WhatsApp form outcome, consent and promised follow-up untested | **P1 validation priority**, A16 |
| A01-F006 | [A01](./reports/A01.md) E001/E002/E013 | Older/newer web-crawl snapshots; real current deployment discrepancy unproven | P2 / A01/A17 |
| A02-F001 | [A02](./reports/A02.md) E001–E005 | Old Cambridge-aligned/3-pathway snippets vs newer 4-pathway source, live simultaneous contradiction unproven | P2 / A02/A17 |
| A02-F003 | [A02](./reports/A02.md) E004/E009 | Historic 30 vs current 31 Phonics Foundations lessons; need current course registry/deployed comparison | P2 / A02→A03 |
| A02-F004 | [A02](./reports/A02.md) E001/E004 | Curriculum reviewer qualifications were not independently verified | P2 / A02 |
| A02-F005 | [A02](./reports/A02.md) E006–E008/E012 | Real HTTP, sitemap, bot response and deployed schema **tool-limited**, not failed | P2 / A02/A17 |
| A02-F006 | [A02](./reports/A02.md) §4–5 | Google/Bing index and native AI citation exposure not measured | P2 / A02 |
| A03-U001 | [A03](./reports/A03.md) suspected-nonindex section | October 2026 long phonics comparison page suspected exclusion: **no live noindex or GSC record reproduced**; distinguish old intentionally redirected aliases | **P1 investigation only**, A03/A17 |
| A04-U001 | [A04](./reports/A04.md) A04-E006–E010/E016, §8 | Both Reading pages' live HTTP response, initial HTML, canonical, noindex, deployed JSON-LD and GSC/Bing-selected canonical remain unknown; source indexability intent is not proof, and tool error is not production error. **Overlaps A01-F003 and A17** | **P1 verification only**, A04/A17 |
| A05-U001 | [A05](./reports/A05.md) A05-E005/E010/E013 | Legacy-named `/english-grammar-writing-classes` is intentionally an **indexable supporting level chooser**; no measured Google/Bing queries show whether it competes with the separate `/grammar`/Writing commercial owners | **P1 verification priority**, A05/A17; **NOT** a confirmed cannibalisation defect |
| A05-U002 | [A05](./reports/A05.md) A05-E010–E012/E017 | Actual raw HTML initial canonical, robots/header, JSON-LD and sitemap response for five A05 URLs not accessed. Component `applySeo` and build prerender are source intent, not proof of a deployed failure; overlap A01-F003/A17 | **P1 verification priority**, A05/A17; **NOT** a reproduced indexing defect |
| A06-F004 (cross-ref; no new root counted) | [A06](./reports/A06.md) A06-E001–E005/E021; §8 F004 | Speaking/Confidence/Spoken English first-party 5000+/15+ and testimonials need consent and methodology review. **Same reach/claims root as A01-F001 and A03-F002; no evidence of falsehood** | P2 validation; A01/A03/A16 evidence owner, do not double-count |
| A06-F005 (cross-ref; no new root counted) | [A06](./reports/A06.md) A06-E007, §8 F005 | Book-demo reader did not show **immediately adjacent** child/WhatsApp data-use notice; not proof policy absent or compliance failed. Same enquiry/consent validation as A01-F005 | P2 validation; A16 flow owner; no live form submission |
| A06-E032 (historical check, not defect) | [A06](./reports/A06.md) §13 A06-E032; historical speaking-growth/BRICK_03_TECHNICAL_CLEANUP.md | Prior GSC record: `/confidence-building-program-kids` last crawled **2026-08-27**, excluded by meta noindex then; **current source** index,follow. Neither current exclusion nor recovery verified. Needs **fresh** GSC URL Inspection, deployed rendered robots and raw header | **P1 verification only**, A06/A17; distinct new historical follow-up, NOT verified production P1 |

| A08-H001 | [A08](./reports/A08.md) §8 and E002–E006 | Actual HTTP 200/redirect/head/canonical/robots/JSON-LD and SSR/JS content for 32 in-scope URLs not independently captured; code does not prove deployment | **P1 verification** A08/A17; NOT demonstrated index blocking |
| A08-H002 | [A08](./reports/A08.md) E003, §8 | Source 2026-09-11 `lastmod` for 32 URLs may or may not reflect material changes; live XML could differ | P2 verification A17; no stale live sitemap verdict |
| A08-H003 | [A08](./reports/A08.md) §§4/8 | GSC/BWT URL Inspection, chosen canonical, indexed/excluded status and actual impressions not obtained for any 32 pages | P1 validation priority A08/A17; **not confirmed deindexing** |
| A08-H004 | [A08](./reports/A08.md) E012/§8 | 74-word sound utility audio, iOS/Android keyboard focus and playback not directly exercised | P2 QA; A08/A13 usability boundary |
| A08-H005 | [A08](./reports/A08.md) §8 | Mobile LCP/INP/CLS and interaction burden from hub/guide cards not measured | P2 A08/A17; not a performance failure |
| A08-H006 | [A08](./reports/A08.md) E013/§8 | Older generic web cache displayed fewer word-structure items than current A08 text report; source cache freshness unknown | Historical/cache only; DO NOT treat as live regressions |

| A07-F003 (**unverified P1 candidate**) | [A07](./reports/A07.md) A07-E005/E011/E012/E017 | Checked-in static sitemap lacks `/resources/vocabulary` and sixteen child guides, **but** current route manifest and sitemap generator include them. Deployed XML and indexation could already be correct; no current live sitemap/GSC proof | **P1 verification only**, A07 gateway/A10 inventory/A17 sitewide sitemap; **NOT a reproduced production error** |

### P0 / P1 escalation

**0 confirmed live P0/P1 availability/indexing outages in 8 integrated reports.** A08-F001 is a **P1 source-only editorial governance gap**, reproduced as 31 pending records in the current main code and reported against 31 guide URLs; it does not establish lack of any offline review or search suppression. A01-F003/F005, A03-U001, A04-U001, A05-U001/U002, A06-E032 and A07-F003 and A08-H001/H003 remain *P1 investigation priorities*, not reproduced production blocking. Two available reports (A09/A10) await integration and cannot be represented as having passed.

### Proposed P2/P3 backlog

Only evidence-based source/content improvements A02-F002, A03-F001–F004, A04-F001–F003, A05-F001–F003, A06-F001/F002/F003/F006 and **A08-F001–F008 (with source/live qualifiers)** and **A07-F001/F002/F004 (with source/link qualifiers)** are eligible for planning at this stage. No change is approved or deployed.

## 4. Search visibility summary (Google and Bing)

**First-party indexed counts and controlled native Google/Bing rankings remain UNKNOWN, not zero.** Generic web discovery and recent/old crawler extracts in reports cannot establish indexing, ranking or traffic movements.

| Workstream | Google indexing / native SERPs | Bing indexing / native SERPs | Source and date |
|---|---|---|---|
| A01 | GSC unavailable; public retrieval only; rankings NOT measured | BWT unavailable, native SERP UNTESTED | [A01](./reports/A01.md) §§3–4; 2026-10-17 IST |
| A02 | GSC unavailable; older/newer curriculum snapshots; rankings NOT measured | BWT unavailable, native SERP UNTESTED | [A02](./reports/A02.md) §§3–4; 2026-10-17 IST |
| A03 | 0/3 URL inspections; branded, commercial, comparison ranks UNTESTED | 0/3 inspections; native SERP UNTESTED | [A03](./reports/A03.md) §§3–4; 2026-10-17 IST |
| A04 | 0/2 current GSC URL Inspections, native Google SERP UNTESTED | 0/2 Bing inspections, native SERP UNTESTED | [A04](./reports/A04.md) §§3–4, 2026-10-17 IST |
| A05 | GSC 0/5 inspections, native SERPs UNTESTED | Bing 0/5 inspections, native SERPs UNTESTED | [A05](./reports/A05.md) §§3–4, 2026-10-17 IST |
| A06 | GSC 0/6 six core commercial/level/framework URLs; native Google SERPs UNTESTED; historical 2026-08-27 Confidence noindex, current UNKNOWN | Bing 0/6; native SERPs UNTESTED | [A06](./reports/A06.md) §§3–4 and §13 E032; 2026-10-17 IST |
| A07 | 0/8 GSC inspections, native Google rankings untested; public web retrieval only | 0/8 BWT inspections, native Bing SERPs untested | [A07](./reports/A07.md) §§2–5; checked-in vocabulary sitemap mismatch is not production index proof |
| A08 | 0/32 GSC inspections; native Google SERP UNTESTED; source static sitemap lists 32, live HTTP canonical unknown | 0/32 BWT inspections; native Bing SERP UNTESTED | [A08](./reports/A08.md) §§2–4; 2026-10-17 IST |
| A09 | Report received; evidence awaiting consolidation | Report received; evidence awaiting consolidation | [A09](./reports/A09.md), **NOT INTEGRATED** |
| A10 | Report received; evidence awaiting consolidation | Report received; evidence awaiting consolidation | [A10](./reports/A10.md), **NOT INTEGRATED** |
| A11–A17 | No report in the directory snapshot | No report | Not yet received |

**Reading-specific verification:** A04 needs independent indexed/excluded states for both owner URLs and raw live metadata; public text and GitHub source do not establish Google/Bing inclusion. A04-U001 is related to existing A01-F003/A17 technical validation, not an additional confirmed P1 failure.

**Grammar-specific outstanding evidence:** A05 must validate all five owner/chooser/course URLs in GSC and Bing, and measure whether the combined grammar-writing guide attracts generic commercial search queries. No overlap or indexing failure is established from the URL names alone.

**Speaking-specific GSC follow-up:** A06-E032 records **historical** 2026-08-27 noindex for the specialist Confidence Building URL, while October source now intends index,follow. A17/A06 must inspect **today's** Google-selected canonical, status and current live meta before calling it resolved or still excluded. A06-E025 observes a separate course-label/price-copy mismatch; actual monetary fees were not found inconsistent.

**Top priority:** A03-U001 requires GSC URL Inspection for `/best-online-phonics-classes-for-kids-in-india` with dated indexed/excluded state, Google-selected canonical, last crawl, server headers and live canonical/robots; a web excerpt cannot close the concern. No verified 7/28/90-day impressions, clicks, CTR, region/device baseline or ranking delta yet.

**A08 search visibility boundary:** Main-branch static sitemap contains the hub and 31 published phonics guides, but **0/32 GSC and Bing Webmaster index states are confirmed** and direct native engine results are untested. The current source editorial governance gap does not establish indexing failure. The 20-row manual search query matrix in A08 is not a rank report; coordinate technical origin/header checks with A17 and informational owner questions with A03/A04/A15.

## 5. Native answer-engine visibility summary

**0 native sessions tested; 98 prompts prepared in integrated A01–A08 (72 A01–A06 + 12 A07 + 14 A08)**. Running every prompt separately on ChatGPT Search, Perplexity, Copilot and Google AI Mode/Overviews would require **392** platform–prompt observations, plus repeats. **No citation or recommendation rate exists yet.** A09/A10 questions are not included until separately integrated.

| Engine | Actually tested? | Prompt results recorded | Tiny Steps cited / tested | Recommendations / tested | Evidence |
|---|---|---:|---|---|---|
| ChatGPT Search | No | 0 | N/A | N/A | A01–A06 manual queues only |
| Perplexity | No | 0 | N/A | N/A | A01–A06 manual queues only |
| Microsoft Copilot | No | 0 | N/A | N/A | A01–A06 manual queues only |
| Google AI results | No | 0 | N/A | N/A | A01–A06 manual queues only |
| Other | No | 0 | N/A | N/A | None |

Crawl permission and answer-readable content are **not** proof that an engine cites or recommends Tiny Steps. Exact answer, links, mode, time, locale and repeats are required.

## 6. Trust, academic and content coverage summary

**Integrated A01–A08:** Public web text and inspected code describe a brand serving ages 3–12, teacher-led phonics, reading, grammar/sentence building and speaking, skill-led placement and one free 35-minute assessment; these are published *claims*, not verified teaching outcomes. Main curriculum source explicitly disclaims formal CBSE/ICSE/IB/Cambridge endorsement; older web snapshots with “Cambridge-aligned” language cannot be treated as current live contradictory copy without new raw-HTML evidence (A02-F001).

A03 includes a fee comparison and cited provider references, but third-party figures, current parent testimonials, founder qualifications, learner reach totals and parent permissions are not independently fully corroborated. A03-F003 is specific wording requiring academic review. A02-F002 is a suggestion to communicate actual progression criteria, not a discovery that internal assessments are absent.

**Reading evidence:** A04 confirms two separately positioned programme pages. A04-F001 proposes examples of actual reading-specific assessment and parent reporting, complementing A02-F002 rather than reclassifying the curriculum finding. A04-F002 is a directly observed specific-link intent mismatch; A04-F003 is an optional guide handoff. The school TSERB document describes an **internal non-normed** benchmark and must not be assumed deployed in 1:1 classes. Actual Google/Bing index and AI visibility are still unknown.

**Grammar/writing (A05):** The main grammar and writing pages serve genuinely distinct sentence-accuracy versus ideas/paragraph/composition needs. A05-F001 identifies two level-labelled links to the same broad curriculum, A05-F002 identifies missing public Writing eligibility/scope details, and A05-F003 identifies missing applied-grammar example. Neither means the curriculum or teaching is absent. Shared learner counts/testimonial validation remains A01-F001/A03-F002/A16, not a second A05 claim defect. A05-U001/U002 are **unverified**, not P1 production failures.

**Speaking (A06):** The three distinct programme owners are Public Speaking for audience-aware stories/presentations, Spoken English for everyday reciprocal conversation, and specialist Confidence Building for participation without personality pressure. Foundations (4–7) and Excellence (7–12) describe age as typical and placement as readiness-led. A06-F001 is a corrected, source-verified schema-enumeration issue; A06-F002 an A12-owned cautious-parent-language issue; A06-F003 a Spoken English worked-example gap; A06-F006 a two-course **Premium** versus **Standard** copy inconsistency only, not a price amount discrepancy. A06-F004 (reach/testimonials) and A06-F005 (form privacy/WhatsApp) remain **unverified overlapping evidence** with A01/A03/A16. The ten-dimension speaking framework is educational and non-diagnostic, not evidence of deployed parent-portal score parity.

**Phonics & Reading resource pathway (A08):** Reported tool-readable hub and 31 child guides match the 16+15 main publication inventory and **32 checked-in static sitemap entries**, with unique pattern concepts for CK, Floss, TCH, digraphs, vowel teams and longer word families. Source `phonicsEditorialReviewRegistry.js` still defaults every guide to pending human signoff (A08-F001, source P1 governance), while per-guide attribution, applied grapheme/decoding models and some sound notation require editorial review (F002–F004/F008). Hub CTA semantics and direct A04 reading handoff could be clearer (F005/F006). A 74-word isolated sound utility advertises pending review but has not undergone functional/audio/mobile testing (F007). **None of these establishes current Google/Bing deindexing or an AI citation rate.** A15 owns complete related-blog article QA, A03/A04 own commercial texts.

**Resources gateway (A07):** All seven card destinations match source routes (four subject resource hubs plus Parent Help, Free Activities and Schools/Educators); public inspection retrieved all eight required gateway/destination pages and 18 linked question/concept/practice targets. This supports discovery of links and text, **not native SERP ranking, selected canonicals, initial HTTP responses or AI citations**. A07-F001 documents the gateway entry expectation for speaking practice (the actual 0/4 game readiness was *already* noted by A06 and belongs to A13). A07-F002/F004 are source completeness/taxonomy findings. A07-F003 is a **P1 verification priority only**, because source/generated/deployed sitemap evidence differs. A08–A14 own pathway child quality; A15 articles; A16 shared demo/school leads; A17 served sitemaps and robots.

**Cross-audit collision guard:** A01-F001 ↔ A03-F002 share the learner reach claim; consolidate any future confirmed root cause, but keep page-specific disclosure evidence. A02-F003 is a current-course check for A03; A01-F003/A02-F005/A04-U001 feed A17 technical checks; A01-F005 belongs to A16 conversion; A03-U001 is a suspected indexing investigation, not already-resolved or already-failed. Independent academic and public reputation validation remains outstanding.

**Lead/UX:** Home, curriculum and phonics pages expose relevant enquiry links, but no production submissions, mobile keyboard checks, consent processing, CWV field metrics or successful WhatsApp journey were tested. A16/A17 own cross-site resolution.

**Scorecard:** All 8 integrated reports explicitly withhold a fully supported composite score. A07 documents **22/53 (41.5%) test evidence coverage**, not 41.5/100 SEO performance. Do not numerically average unmeasured platforms.

## 7. Cross-audit dependency and collision matrix

| Scope overlap | Single canonical owner for primary finding | Other reporters reference it |
|---|---|---|
| Phonics programme vs phonics blog and resource pages | A03 commercial, A08 resources, A15 blog | A07/A17 link to finding IDs |
| Reading vs phonics intent split | A04 for reading, A03 for phonics | A08/A15/A17 cross-reference |
| Grammar vs writing vs blog content | A05 programmes, A09 resources, A15 blog | A07/A17 |
| Speaking vs speaking resource answers | A06 programme, A11 resources, A15 blog | A07/A17 |
| Parent problem/comparison path | A12 parent help, A03–A06 programmes, A16 conversion | A01/A07/A15 |
| Every published blog | A15 owns full article-level QA | A08–A14 own hub relationships and specialist child guide pages |
| SEO infra, canonical, sitemap, robots | A17 owns systemic root cause | All other workstreams may flag affected URL and cross-reference |
| Shared demo, price, trust and contact | A16 owns end-to-end funnel | A01–A08/A12/A14 link to primary defect |
| A07 gateway taxonomy / metadata versus topical resource content | A07 owns gateway labels, outbound pointers and SEO description; A08–A14 own in-depth pathways | A07-F002/F004 are gateway source concerns, not per-guide findings |
| Speaking games and gateway practice promise | A13 game readiness; A07-F001 gateway expectation | A06 §13 E030/E031 already found the same 0/4 playable status; no duplicated outage |
| Vocabulary sitemap source vs production | A17 sitewide served sitemap; A10 vocabulary URL roster | A07-F003 remains unverified until production XML/GSC evidence |

A01–A06 documented overlaps: A01-F001↔A03-F002 (reach), A02-F003↔A03 course facts, A01-F003/A02-F005↔A17, A01-F005↔A16, A03-U001↔A17. These are cross-links, **not multiple confirmed failures**.

**A04 cross-references:** A04-F001 ↔ A02-F002 (programme sample vs curriculum framework); A04-F002/F003 ↔ A15 (commercial source-link vs editorial content); A04-U001 ↔ A01-F003/A17 (raw head/canonical checks). Do not create separate editorial or sitewide technical root-cause defects for these overlaps.
**A05 collision notes:** A05-F003 ↔ A02-F002 (programme-specific example vs curriculum rubric); A05-F002 ↔ A02/A16 actual age and programme details; A05 trust references A01-F001/A03-F002/A16; A05-U001 ↔ A16 commercial ownership and A17 query/canonical checks; A05-U002 ↔ A01-F003/A17 deployed head checks. Do not double-count a single underlying failure.

**A06 cross-audit dependencies:** A06-F002 ↔ A12 parent help (original source observation kept, editing owner A12); A06-F004 ↔ A01-F001/A03-F002/A16 (do not recalculate unique trust counts); A06-F005 ↔ A01-F005/A16; A06-F006 ↔ A16 canonical pricing; A06-F001 ↔ A17 live JSON-LD validation; A06-E032 ↔ A17 historical-to-current GSC reinspection; §13 A06-E030/E031 speaking games → A13, A06-E033 ended camps → A16/A17. All unresolved cross-audit handoffs remain verification, not independently fixed bugs.

**A08 collision notes:** A08-F001 pertains specifically to the 31 child-guide editorial review records, not the broader founder-credential validation A01-F002; A08-F003 is per-guide visible author/reviewer provenance. A08-F005 is the phonics hub's blog-versus-guide CTA, whereas A07 owns the resource gateway's seven-card mapping. A08-F006 (hub-to-reading-programme handoff) is different from A04-F003 (fluency programme-to-article link). A08-F002/F008 are phonics educational terminology, not A03 commercial root defects. A08-H001/H002/H003/H005 feed A17 technical and platform validation; A08 blog links feed A15. No root cause is duplicated or marked repaired.

**A07 overlaps:** A07-F001 ↔ A06 §13 E030/E031 ↔ A13 (single game availability root, distinct gateway invitation); A07-F003 ↔ A10 vocabulary guides ↔ A17 deployed sitemap (not deindexing proof); generic schools reach figures ↔ existing A01/A03 trust validation and A14, with no extra claim-defect ID. The resource gateway itself remains A07, not A08–A14.

If findings conflict, integration must preserve both evidence trails as DISPUTED until a dated live reproduction settles the issue. Never pick the newer finding purely by author preference.

## 8. Proposed remediation action plan — GATED, not approved

**NO WEBSITE CHANGES AUTHORIZED.** The full ranked plan is gated on integration of all 17 reports and reproduction of P0/P1. Investigations below are not fixes.

| Action ID | Linked candidates/findings | Priority / confidence | Scope | Proposed action | Verification gate | State |
|---|---|---|---|---|---|---|
| IA-001 | A01-F003, A02-F005, A03-U001, A04-U001, A05-U002, A06-E032 (historical) | P1 test priority; failure UNVERIFIED | Home/curriculum/phonics comparison | Raw deployed HTTP/meta/canonical, Google & Bing inspection, bot rules and sitemap check | Reproduce actual deployed defect before code action | NOT APPROVED |
| IA-002 | A01-F005 | P1 test priority; failure UNVERIFIED | Home and /book-demo | Controlled harmless/staging WhatsApp consent and enquiry flow test | Correct confirmation without generating real parent lead | NOT APPROVED |
| IA-003 | A03-F003 | P2 wording observed | Preschool phonics app guidance | Academic board-specific claim review and qualify unsupported wording | Primary authoritative support or accurate limited statement | NOT APPROVED |
| IA-004 | A03-F001 | P2 source-only discrepancy | Fee page/sitemap | Verify legitimate last material update vs deployed XML; coordinate A17 | Truthful per-page lastmod or omission | NOT APPROVED |
| IA-005 | A01-F001/F002, A02-F004, A03-F002 | P2 evidence gaps | Homepage/curriculum/phonics | Compile consent-safe dated reach, academic and review proof; correct claims only if needed | Owner-approved source records match public wording | NOT APPROVED |
| IA-006 | A02-F002 | P2 content improvement | Curriculum | Consider real parent-facing examples of mastery/assessment progression | Academic reviewer-approved accuracy | NOT APPROVED |
| IA-007 | A03-F004 | P3 source maintenance | Redirected alias | Reconcile retained JSX only after HTTP redirect verification | No redirect/regression harm | NOT APPROVED |
| IA-008 | A04-F001, A02-F002 (related) | P2 observed content gap | Both reading commercial pages | Academic-approved example passage and reading-fluency/comprehension progress rubric, explicitly illustrative and non-diagnostic | Academic reviewer verifies no invented progress/outcome promise | NOT APPROVED |
| IA-009 | A04-F002 | P2 verified link-intent issue | Broad Reading diagnostic card | Point story-understanding card to intended diagnostic article and preserve broader bridge links | Verify live link text, target and canonical; A15 editorial owner | NOT APPROVED |
| IA-010 | A04-F003 | P3 contextual education | Specialist fluency page | Add an educational link to existing fluency guide, keeping demo pathway | Live crawlable link without conversion regression | NOT APPROVED |
| IA-011 | A05-F001 | P2 precise navigation observation | /grammar level cards | Target two distinct level-specific course destinations instead of shared curriculum anchor, preserving curriculum link | Live click/keyboard test and canonical destination for each | NOT APPROVED |
| IA-012 | A05-F002 | P2 parent-fit content | Writing owner | Verify and disclose actual writing-age suitability and service/level sequence, without inventing lesson totals | Qualified academic approval and parity with operational programme | NOT APPROVED |
| IA-013 | A05-F003 (related A02-F002) | P2 pedagogic example | Grammar owner | Add academically reviewed example of correcting and transferring grammar to new context | Child-friendly, accurate, independently applicable, no fabricated outcomes | NOT APPROVED |
| IA-014 | A06-F001 | P2 source schema validation | /speaking | Correct three invalid Schema.org unordered enumeration URIs only after deployment proof and schema review | Live emitted JSON-LD valid, other correct enumeration preserved | NOT APPROVED |
| IA-015 | A06-F002 (A12 page owner) | P2 academic language | /shy-child-speaking-confidence | Review broad shyness/eye-contact assumptions and child-safe context/qualified referral | Individual/multilingual nuance and non-diagnostic wording verified by A12 | NOT APPROVED |
| IA-016 | A06-F003 | P2 instructional clarity | /spoken-english-classes-for-kids-online | Academic-approved illustrative child-led dialogue with follow-up and fresh conversation | Age-appropriate, realistic, no fabricated outcomes and no duplication of Public Speaking intent | NOT APPROVED |
| IA-017 | A06-F006 (A16 shared pricing) | P2 observed pricing tier-word mismatch | Two Public Speaking level pages | Reconcile ₹400 Standard versus separately priced Ultra Premium labels without inventing price change | Same live Standard/Ultra Premium labels on course and pricing pages | NOT APPROVED |

| IA-018 | A08-F001 (related A08-F003) | **P1 source governance**, published-guide review record gap; not a production crawl failure | 31 published phonics knowledge guides | Secure real qualified academic signoff and dated exact-revision source records; do not manufacture approval | Signed reviewer decisions genuinely backed by evidence for all 31, then verify published/record parity | NOT APPROVED |
| IA-019 | A08-F002/F008 | P2/P3 instructional clarity | J/soft G, OO, CH/TCH terminology | Consistent child-friendly IPA/phonics-symbol glossary and family labels after phonics expert review | `/j/` vs `/dʒ/` disambiguated; TCH and OO terminology accurate with exceptions | NOT APPROVED |
| IA-020 | A08-F003/F004 | P2 educational credibility | Shared phonics guide template + 31 concept datasets | Genuine byline/source metadata; age-appropriate worked sound-box and decoding/encoding transfer examples | Reviewer approves examples, only authentic bylines/dates shown and accessible text confirmed | NOT APPROVED |
| IA-021 | A08-F005/F006 | P2 navigation intent | `/resources/phonics` | Correct “all guides” versus blog destination and add intent-aware pathway to A04 reading programmes | Label/URL match and parent can reach valid reading programme quickly; A03/A04 owners retained | NOT APPROVED |
| IA-022 | A08-F007 | P3 utility QA; function unverified | 74-item word–sound utility | Audit human phonics review, audio cues, accessibility and focus; no unsupported claims that playback is broken | 74/74 mappings verified, device/keyboard/audio passed before any corrective code | NOT APPROVED |

| IA-023 | A07-F003 | **P1 verification only**, live fault unconfirmed | Vocabulary hub + 16 guides / sitemap | Collect served sitemap.xml and child XML, raw response and manifest comparison | Exactly one loc per intended published canonical, GSC/BWT inspected separately; only then consider implementation | NOT APPROVED |
| IA-024 | A07-F001, A06 §13 E030/E031, A13 | P2 observed gateway navigation expectation | Gateway-to-speaking practice | At entry, distinguish Coming Soon from playable practice or link an available exercise | Mobile and desktop links meet published available-now promise | NOT APPROVED |
| IA-025 | A07-F002/F004 | P2 source descriptive consistency | /resources metadata + centralResourceSystem taxonomy | Add accurate Vocabulary mention, review consumers of 4-subject registry; no redirects | Initial/rendered meta parity, four subject hubs + seven cards remain canonical and accessible | NOT APPROVED |
Final remediation requires user approval, scoped PRs, CI, deploy validation and post-change GSC/Bing observations.

## 9. Manual verification and access blockers

| Needed source | Current status | Why necessary | How to close / owner |
|---|---|---|---|
| GSC URL inspections and 7/28/90-day performance | Not available; 0 verified inspections for current period | Confirm Google status, selected canonical/query overlap for A03–A06, **especially A06 Confidence 2026-08-27 historical noindex**, not a current verdict | First-party current dated export/screenshot; A06/A17 |
| Bing Webmaster inspection and performance | Not available | Independent Bing index/queries | Verified URL exports; A17 |
| Native ChatGPT Search, Perplexity, Copilot, Google AI | 0 sessions; **98 integrated prompts queued** (A01–A08); A09/A10 pending | Native source citations, correct gateway navigation and teaching accuracy | **392** platform/prompt combinations plus repeats, exact mode/locale/date and links |
| Deployed raw HTML/status, redirects, headers, JSON-LD, robots/sitemap | Only source/retriever or tool errors, no reliable current wire evidence | Verify A01-F003, A03-U001, A04-U001, A05-U002, **A06-F001 deployment + E032 confidence indexing history**, **A07-F003 vocabulary served-sitemap verification**, actual sitemap lastmods | Raw network GET/headers + rendered-browser/Schema.org validation; A17 |
| Founder/academic credentials, reach counts and testimonial permissions | Claim-support records not independently reviewed | A01-F001/F002, A02-F004, A03-F002, A06-F004 same reach/consent issue | Dated records, child privacy and qualified reviewer confirmation; owner/A16 |
| Curriculum and programme-specific progression | Pages describe pathway but reviewed examples/actual Writing eligibility remain unresolved | A02-F002/F003, A04-F001, A05-F002/F003 | Academic review of approved milestones, Writing age/lesson structure and reading/grammar progress examples; A02/A04/A05 |
| Harmless demo form/WhatsApp consent, mobile/a11y/CWV | No actual lead submitted or mobile browser inspection | A01-F005 and A06-F005 overlap; child name/WhatsApp data-use copy not visually confirmed at form | Safe staged synthetic journey and privacy review; A16 |
| Three independently verified provider comparisons | A03 has sources; A01 competitive benchmark incomplete | Evidence-backed market comparisons | Same-date verified provider pages; A01/A03 |
| Reading specialist evidence and parent decision navigation | Main A04 findings available, unimplemented | A04-F001–F003 and academic reviewer/progress sample | Academic owner and A04/A15 review, no code until remediation approved |
| A06 course price-tier wording | Same-day A06 web text compares two course pages with central pricing | A06-F006: ₹400 named Premium on course pages vs Standard on pricing; amount unchanged | A16 commercial validation; fix only with approved copy/fee-source review |
| Speaking games and past seasonal camp handoffs | A06 §13 E030/E031 and A07-F001 refer to **same 0/4 playable state**, E033 ended 2026 camps | Distinguish A07 promise/entry language from A13 game readiness, plus historical campaigns | A07 gateway text; A13 games; A16/A17 camps |
| Received A09/A10 + remaining A11–A17 | A09/A10 files verified, **not yet integrated**; A11–A17 absent in checked directory | Complete consolidated evidence without overwriting A01–A08 | Integrate A09/A10 serially, then remaining audits |

| A08 editorial source signoffs, 31 concept examples and sound utility | 31/31 main-guide records pending, no reviewer signoff; audio/keyboard performance untested | Validate child's teaching source quality and avoid equating field-count gate with expert review | Tiny Steps academic reviewer for each exact revision; audit 74 word/audio mappings before any claim of full functional QA |
| A08 live technical + origin/index/measurement | Main static list includes 32 URLs, live origin headers/robots/JSON-LD unavailable; 0/32 GSC/BWT | Resolve A08-H001–H006 and avoid assuming live sitemap/Google/Bing states | A17 check deployed origin and GSC/BWT; A08 verify real native answers from its 14 prompts |

**A07 follow-up:** verify eight gateway/destination origin responses, served Vocabulary sitemap/16 guides, GSC+BWT URL Inspection, JS-off and mobile navigation, the 12 native AI questions × four engines, A13 speaking practice labels, and A14 school WhatsApp only via safe non-submitting checks.

**Unknown is not failed.** A fetch tool error or historical cached snippet does not prove a deployed SEO failure.

## 10. Integration operating procedure — single writer

1. Receive the ID of a newly committed report at reports/AXX.md. Confirm actual file existence and report revision on main.
2. Read THIS current COMPREHENSIVE_FINDINGS.md and its content SHA immediately before editing. Read that audit source report and any overlapping already-integrated reports.
3. Update the corresponding AXX row, use VERIFIED or COMPLETE WITH LIMITATIONS exactly as recorded, and include evidence coverage and latest updated IST.
4. Add ONLY independently verified findings to Section 3 with unique canonical finding IDs; link them to AXX report and evidence IDs. Keep suspected problems in a clearly labelled hypotheses/manual-verification queue rather than silently upgrading them.
5. Reconcile and deduplicate cross-audit overlap, updating Sections 4–9 where supported. Preserve other audits' current status and all historical findings; don't regenerate the entire document from one partial chat's context.
6. Append dated entry to Section 11 with report SHA, relevant change summary, change count and outstanding evidence; update integrated count. Commit to main with a narrowly scoped documentation-only change.
7. If write conflict/content SHA mismatch occurs, fetch the newest main document, merge both changes and retry with the new SHA. Never force overwrite or drop another report's contributions.
8. Once all 17 sources have adequate closure, perform full audit review; freeze a dedicated action-plan revision for explicit approval. A17 can collect sitewide evidence in parallel, but its FINAL reconciliation phase happens after the other report files exist.

**Recommended prompt for the designated integration conversation:**

> Read the latest main versions of docs/seo/visibility-17-audits/MASTER_AUDIT_CHARTER.md, COMPREHENSIVE_FINDINGS.md and all existing reports/A01.md–A17.md in repo tinystepselearning-surya/tinysteps-react-v1. Reconcile ALL newly completed/evidence-collected workstream reports into COMPREHENSIVE_FINDINGS.md, merging with existing content without overwriting other findings. Verify exact source report revisions, unique finding IDs, evidence confidence, 17-row progress, Google/Bing native evidence, AI tests and gaps. Follow the single-writer/current-SHA conflict rule, label unverified checks, update integration log and commit ONLY the consolidated Markdown file. Do not modify production code or implement actions.

## 11. Audit integration change log

| Date IST | Integrated reports | New/changed finding IDs | Aggregate state changes | GitHub source revision | Integration notes |
|---|---|---|---|---|---|
| 2026-10-17 | None | None | Created 0/17 baseline | Charter v1.0 | Initial register only; no completed audits |
| 2026-10-17 IST | **A01–A03** | **5 source/content rows:** A02-F002, A03-F001–F004. **12 pending/unverified:** A01-F001–F006, A02-F001/F003–F006, A03-U001 | **3/17 integrated; A01 EVIDENCE COLLECTED; A02/A03 COMPLETE WITH LIMITATIONS; 0 reproduced P0/P1** | A01 blob `ca7bf5393c7774495151b66613443eb1e7a2e1b6`; A02 blob `96354f65696909bbd9a32735f8f6e1d887ad3ddf`; A03 blob `0e9b6031841e85631c9d1f442a678e6af0adb88a` | No verified platform index or AI presence, no numerical score, no code edits; related IDs deduplicated by ownership |
| 2026-10-17 IST | **A04** | **3 new source/content/link rows:** A04-F001–F003; **1 pending** A04-U001, overlapping existing A01/A17 technical verification | **4/17 integrated; A04 COMPLETE WITH LIMITATIONS; 0 reproduced P0/P1** | A04 blob `8d48cc47e1b6b5a889c69491f6a487806a678959` | 8 source/content observations in total, 13 unverified candidates; 48 native AI prompts queued with 0 platform sessions; no website changes |
| 2026-10-17 IST | **A05** | **3 source/visible-content findings:** A05-F001–F003; **2 unverified** A05-U001/U002, with A17/A01 overlap | **5/17 integrated; A05 COMPLETE WITH LIMITATIONS, 0 reproduced P0/P1** | A05 blob `d43047ddd4e00c2bf0aab737a1a193564de75eba` | 11 total qualified source/content observations, 15 pending verification candidates; 60 AI prompts prepared/0 native sessions, no deployed technical/index assurances and no website changes |
| 2026-10-17 IST | **A06** | **4 qualified source/content/copy observations:** A06-F001/F002/F003/F006; **2 overlapping proof/consent validations** A06-F004/F005, not counted as separate root; **1 new historical GSC recheck** A06-E032 | **6/17 integrated; A06 COMPLETE WITH LIMITATIONS; 0 reproduced P0/P1** | A06 blob `0dc87fb7ca4068ed48d83316bfe820279e6af722` | 15 total qualified observations; 16 unique pending check categories (incl. historical Confidence noindex), 72 manual native AI prompts with 0 sessions; §13 E030/E031 → A13, E033 → A16/A17. No website code changes. |

| 2026-10-17 IST | **A08** (A07/A09/A10 now received but not yet integrated) | **8 qualified source/content/UX findings:** A08-F001–F008, including **1 P1 source-governance** (not a live indexing failure); **6 pending queues** A08-H001–H006 | **7/17 integrated**; A01 EVIDENCE COLLECTED, A02–A06 and A08 COMPLETE WITH LIMITATIONS; **10/17 source files present**; 0 verified live P0/P1 outages | A08 blob `70d9c36c216ec4ae4d3f3dd0791cd0c32e4a3ef4`; initial integration register blob `a6b465007ba5b7b8f652a5c8e8b190bd834380c4` | 31-guide inventory and 32-source-URL sitemap noted; 0/32 first-party index inspections; 14 more AI questions (86 total integrated), 0 native tests. No code edits; A07/A09/A10 integration remains open. |

| 2026-10-17 IST | **A07** (A08 evidence already integrated) | **3 qualified A07 gateway rows** F001/F002/F004; **1 unverified P1 candidate** F003, not live failure; F001 links A06 game status instead of duplicating that root | **8/17 integrated**, A07 COMPLETE WITH LIMITATIONS; **0 verified live P0/P1 outages** (A08 retains one P1 source-governance finding); A09/A10 awaiting integration | A07 blob `6c6bf01c4f06dd114a97fb9abdc021daac19c055`; previous register version independently reread at merge | Gateway 8/8 pages + 7/7 cards + 18/18 targeted links, 22/53 evidence checks, A07 12 manual AI prompts → **98** cumulative queued/0 sessions. Qualified finding *rows* 26; no website code or actual indexing work. |

## 12. Reporting finish line

A final comprehensive report will be READY FOR ACTION PLAN only when:
- all 17 audit reports are present and integrated, with any incomplete verification explicitly visible;
- all published in-scope pages are inventoried and discrepancies assigned;
- P0/P1 items have precise reproduction or are retained as unverified;
- Google/Bing and native AI platform test coverage is quantified with explicit gaps;
- owner conflicts and duplicate defects are resolved;
- every proposed action maps to finding IDs, acceptance criteria and expected observed outcome;
- the user has reviewed the ranked remediation programme before any production changes.

Until then this remains an incrementally updated evidence register, not a certification of search visibility.
