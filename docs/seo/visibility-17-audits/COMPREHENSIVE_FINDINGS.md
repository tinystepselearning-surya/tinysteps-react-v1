# Tiny Steps Learning — Comprehensive SEO, AEO & GEO Findings Register

**Programme:** 17 independent audits / one consolidated evidence register / one eventual prioritised remediation plan  
**Status:** 5/17 REPORTS INTEGRATED — A01 EVIDENCE COLLECTED, A02–A05 COMPLETE WITH LIMITATIONS; NO FULL-PLATFORM ASSURANCE  
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
| Workstreams with source reports on main | **5/17** — A01, A02, A03, A04, A05 | Directly read reports on 2026-10-17 |
| Integrated workstreams | **5/17** | This GitHub revision |
| Complete verified | **0/17** | No unqualified pass |
| Complete with limitations | **4/17** — A02, A03, A04, A05 | Audit source states respected |
| Evidence collected, still open | **1/17** — A01 | Live technical/AI/search verification unfinished |
| Reproduced P0 / P1 failures | **0 in 5 reports** | Not evidence of no sitewide failures |
| High-priority *unverified* risks | A01-F003, A01-F005, A03-U001, A04-U001, A05-U001/U002 (possible owner competition and initial HTML; overlap A17) | **Not confirmed P1 failures** |
| Verified source/content observations | **11** — A02-F002, A03-F001–F004, A04-F001–F003, A05-F001–F003 | Scoped source/content/link evidence; live status caveated |
| Additional unverified candidates / evidence gaps | **15** | See §3; overlapping technical risks are cross-referenced, not separate confirmed defects |
| Google/Bing indexed count | **UNKNOWN** | No first-party inspections |
| Native AI-engine results | **0 tested**, **60 prompts queued** | 240 platform–prompt runs planned, none executed; no citation denominator |
| Lead conversion results | **UNTESTED** | No production lead submitted |
| SEO/AEO/GEO composite | **NOT SCORABLE** | All 5 source audits withheld scores |
| Next work | A06–A17; collect first-party platform and production evidence | No website implementation |

### Definitions

**PLANNED** means no source report. **EVIDENCE COLLECTED** means a published partial audit with documented gaps. **COMPLETE WITH LIMITATIONS** means the author finished its report but key first-party/native tests are unavailable. **COMPLETE VERIFIED** requires all mandatory proof. **INTEGRATED** means this register includes the source report's current evidence, even if its audit state is not complete. Reporting and remediation are distinct.

## 2. Workstream status register — 17 fixed IDs

Report paths A01–A05 have been verified on main (source blob SHAs logged in §11). A06–A17 were absent at this snapshot; their paths remain planned.

| ID | Subject | Primary owner(s) | Source report (expected) | Audit state | Integration state | Evidence coverage | Latest report/update |
|---|---|---|---|---|---|---|---|
| A01 | Homepage | / | [A01](./reports/A01.md) | **EVIDENCE COLLECTED** | **INTEGRATED 2026-10-17 IST** | 1/1 root source/search text; live raw HTTP unverified; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `ca7bf5393c77` |
| A02 | Curriculum | /curriculum | [A02](./reports/A02.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | Hub source + public text reviewed; dependent course URLs partial; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `96354f656969` |
| A03 | Phonics commercial | /phonics + comparison/fees | [A03](./reports/A03.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 3/3 owned + 4/4 adjacent web text; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `0e9b6031841e` |
| A04 | Reading commercial | /reading-classes-for-kids + /reading-fluency-program | [A04](./reports/A04.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 2/2 owned + 2/2 linked parent help; GSC/BWT 0/2, AI 0/4 | 2026-10-17; blob `8d48cc47e1b6` |
| A05 | Grammar commercial | /grammar + /writing-classes-for-kids + Beginner/Advanced/chooser | [A05](./reports/A05.md) | **COMPLETE WITH LIMITATIONS** | **INTEGRATED 2026-10-17 IST** | 5/5 canonicals publicly retrievable; source sitemap/intent; GSC/BWT 0/5, native AI 0/4 | 2026-10-17; blob `d43047ddd4e0` |
| A06 | Speaking commercial | /speaking | reports/A06.md | PLANNED | NOT INTEGRATED | — | — |
| A07 | Resources gateway | /resources | reports/A07.md | PLANNED | NOT INTEGRATED | — | — |
| A08 | Phonics & Reading knowledge | /resources/phonics | reports/A08.md | PLANNED | NOT INTEGRATED | — | — |
| A09 | Grammar & Writing knowledge | /resources/grammar | reports/A09.md | PLANNED | NOT INTEGRATED | — | — |
| A10 | Vocabulary knowledge | /resources/vocabulary | reports/A10.md | PLANNED | NOT INTEGRATED | — | — |
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

**Evidence rule:** The confirmed table contains only observations supported by sampled page text and/or repository source, with qualifications about production deployment. **No A01–A05 live P0/P1 failure was reproduced.** These findings do not prove actual indexing exclusion, faulty production HTTP or false marketing statements.

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

### P0 / P1 escalation

**0 reproduced P0 and 0 reproduced P1 failures in the 5 reports.** A01-F003/F005, A03-U001, A04-U001 and A05-U001/U002 are *unverified P1 test priorities*, not production findings. No assumption is made about the unreported 12 workstreams.

### Proposed P2/P3 backlog

Only evidence-based source/content improvements A02-F002, A03-F001–F004 and A04-F001–F003 and A05-F001–F003 are eligible for planning at this stage. No change is approved or deployed.

## 4. Search visibility summary (Google and Bing)

**First-party indexed counts and controlled native Google/Bing rankings remain UNKNOWN, not zero.** Generic web discovery and recent/old crawler extracts in reports cannot establish indexing, ranking or traffic movements.

| Workstream | Google indexing / native SERPs | Bing indexing / native SERPs | Source and date |
|---|---|---|---|
| A01 | GSC unavailable; public retrieval only; rankings NOT measured | BWT unavailable, native SERP UNTESTED | [A01](./reports/A01.md) §§3–4; 2026-10-17 IST |
| A02 | GSC unavailable; older/newer curriculum snapshots; rankings NOT measured | BWT unavailable, native SERP UNTESTED | [A02](./reports/A02.md) §§3–4; 2026-10-17 IST |
| A03 | 0/3 URL inspections; branded, commercial, comparison ranks UNTESTED | 0/3 inspections; native SERP UNTESTED | [A03](./reports/A03.md) §§3–4; 2026-10-17 IST |
| A04 | 0/2 current GSC URL Inspections, native Google SERP UNTESTED | 0/2 Bing inspections, native SERP UNTESTED | [A04](./reports/A04.md) §§3–4, 2026-10-17 IST |
| A05 | GSC 0/5 inspections, native SERPs UNTESTED | Bing 0/5 inspections, native SERPs UNTESTED | [A05](./reports/A05.md) §§3–4, 2026-10-17 IST |
| A06–A17 | No source audit report in this snapshot | No source audit report | Not yet received |

**Reading-specific verification:** A04 needs independent indexed/excluded states for both owner URLs and raw live metadata; public text and GitHub source do not establish Google/Bing inclusion. A04-U001 is related to existing A01-F003/A17 technical validation, not an additional confirmed P1 failure.

**Grammar-specific outstanding evidence:** A05 must validate all five owner/chooser/course URLs in GSC and Bing, and measure whether the combined grammar-writing guide attracts generic commercial search queries. No overlap or indexing failure is established from the URL names alone.

**Top priority:** A03-U001 requires GSC URL Inspection for `/best-online-phonics-classes-for-kids-in-india` with dated indexed/excluded state, Google-selected canonical, last crawl, server headers and live canonical/robots; a web excerpt cannot close the concern. No verified 7/28/90-day impressions, clicks, CTR, region/device baseline or ranking delta yet.

## 5. Native answer-engine visibility summary

**0 native sessions tested, 60 prompts prepared in A01–A05 (§5 of each report).** Running each prompt on ChatGPT Search, Perplexity, Copilot and Google AI Mode/Overviews requires 240 distinct platform–prompt observations, plus recommended repeats. **No citation or recommendation rate exists yet.**

| Engine | Actually tested? | Prompt results recorded | Tiny Steps cited / tested | Recommendations / tested | Evidence |
|---|---|---:|---|---|---|
| ChatGPT Search | No | 0 | N/A | N/A | A01–A05 manual queues only |
| Perplexity | No | 0 | N/A | N/A | A01–A05 manual queues only |
| Microsoft Copilot | No | 0 | N/A | N/A | A01–A05 manual queues only |
| Google AI results | No | 0 | N/A | N/A | A01–A05 manual queues only |
| Other | No | 0 | N/A | N/A | None |

Crawl permission and answer-readable content are **not** proof that an engine cites or recommends Tiny Steps. Exact answer, links, mode, time, locale and repeats are required.

## 6. Trust, academic and content coverage summary

**Integrated A01–A05:** Public web text and inspected code describe a brand serving ages 3–12, teacher-led phonics, reading, grammar/sentence building and speaking, skill-led placement and one free 35-minute assessment; these are published *claims*, not verified teaching outcomes. Main curriculum source explicitly disclaims formal CBSE/ICSE/IB/Cambridge endorsement; older web snapshots with “Cambridge-aligned” language cannot be treated as current live contradictory copy without new raw-HTML evidence (A02-F001).

A03 includes a fee comparison and cited provider references, but third-party figures, current parent testimonials, founder qualifications, learner reach totals and parent permissions are not independently fully corroborated. A03-F003 is specific wording requiring academic review. A02-F002 is a suggestion to communicate actual progression criteria, not a discovery that internal assessments are absent.

**Reading evidence:** A04 confirms two separately positioned programme pages. A04-F001 proposes examples of actual reading-specific assessment and parent reporting, complementing A02-F002 rather than reclassifying the curriculum finding. A04-F002 is a directly observed specific-link intent mismatch; A04-F003 is an optional guide handoff. The school TSERB document describes an **internal non-normed** benchmark and must not be assumed deployed in 1:1 classes. Actual Google/Bing index and AI visibility are still unknown.

**Grammar/writing (A05):** The main grammar and writing pages serve genuinely distinct sentence-accuracy versus ideas/paragraph/composition needs. A05-F001 identifies two level-labelled links to the same broad curriculum, A05-F002 identifies missing public Writing eligibility/scope details, and A05-F003 identifies missing applied-grammar example. Neither means the curriculum or teaching is absent. Shared learner counts/testimonial validation remains A01-F001/A03-F002/A16, not a second A05 claim defect. A05-U001/U002 are **unverified**, not P1 production failures.

**Cross-audit collision guard:** A01-F001 ↔ A03-F002 share the learner reach claim; consolidate any future confirmed root cause, but keep page-specific disclosure evidence. A02-F003 is a current-course check for A03; A01-F003/A02-F005/A04-U001 feed A17 technical checks; A01-F005 belongs to A16 conversion; A03-U001 is a suspected indexing investigation, not already-resolved or already-failed. Independent academic and public reputation validation remains outstanding.

**Lead/UX:** Home, curriculum and phonics pages expose relevant enquiry links, but no production submissions, mobile keyboard checks, consent processing, CWV field metrics or successful WhatsApp journey were tested. A16/A17 own cross-site resolution.

**Scorecard:** All 5 reports explicitly say **NOT SCORABLE**. Do not numerically average unmeasured platforms.

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
| Shared demo, price, trust and contact | A16 owns end-to-end funnel | A01–A06/A12/A14 link to primary defect |

A01–A05 documented overlaps: A01-F001↔A03-F002 (reach), A02-F003↔A03 course facts, A01-F003/A02-F005↔A17, A01-F005↔A16, A03-U001↔A17. These are cross-links, **not multiple confirmed failures**.

**A04 cross-references:** A04-F001 ↔ A02-F002 (programme sample vs curriculum framework); A04-F002/F003 ↔ A15 (commercial source-link vs editorial content); A04-U001 ↔ A01-F003/A17 (raw head/canonical checks). Do not create separate editorial or sitewide technical root-cause defects for these overlaps.
**A05 collision notes:** A05-F003 ↔ A02-F002 (programme-specific example vs curriculum rubric); A05-F002 ↔ A02/A16 actual age and programme details; A05 trust references A01-F001/A03-F002/A16; A05-U001 ↔ A16 commercial ownership and A17 query/canonical checks; A05-U002 ↔ A01-F003/A17 deployed head checks. Do not double-count a single underlying failure.

If findings conflict, integration must preserve both evidence trails as DISPUTED until a dated live reproduction settles the issue. Never pick the newer finding purely by author preference.

## 8. Proposed remediation action plan — GATED, not approved

**NO WEBSITE CHANGES AUTHORIZED.** The full ranked plan is gated on integration of all 17 reports and reproduction of P0/P1. Investigations below are not fixes.

| Action ID | Linked candidates/findings | Priority / confidence | Scope | Proposed action | Verification gate | State |
|---|---|---|---|---|---|---|
| IA-001 | A01-F003, A02-F005, A03-U001, A04-U001, A05-U002 | P1 test priority; failure UNVERIFIED | Home/curriculum/phonics comparison | Raw deployed HTTP/meta/canonical, Google & Bing inspection, bot rules and sitemap check | Reproduce actual deployed defect before code action | NOT APPROVED |
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

Final remediation requires user approval, scoped PRs, CI, deploy validation and post-change GSC/Bing observations.

## 9. Manual verification and access blockers

| Needed source | Current status | Why necessary | How to close / owner |
|---|---|---|---|
| GSC URL inspections and 7/28/90-day performance | Not available; 0 verified inspections | Index/exclusion, query overlap/canonical for A03, A04 and 5 A05 Grammar/Writing owners | Authenticated exports/screenshots, dates; A03/A04/A05/A17 |
| Bing Webmaster inspection and performance | Not available | Independent Bing index/queries | Verified URL exports; A17 |
| Native ChatGPT Search, Perplexity, Copilot, Google AI | 0 sessions; 60 prompts queued | Actual link/citation/recommendation observations | 240 platform/prompt sessions plus repeats with exact answers, locale/mode/date |
| Deployed raw HTML/status, redirects, headers, JSON-LD, robots/sitemap | Source policy only, web tool errors or search extracts; no reliable current wire test | Check A01-F003, A02-F005, A03-U001, A04-U001, A05-U002 and actual sitemap lastmod | Network-enabled raw fetch and rendered browser vs main deploy SHA; A17 |
| Founder/academic credentials, reach counts, testimonial permissions | Claim-support records unreviewed | A01-F001/F002, A02-F004, A03-F002 | Dated records and qualified reviewer attribution; site owner |
| Curriculum and programme-specific progression | Pages describe pathway but reviewed examples/actual Writing eligibility remain unresolved | A02-F002/F003, A04-F001, A05-F002/F003 | Academic review of approved milestones, Writing age/lesson structure and reading/grammar progress examples; A02/A04/A05 |
| Harmless demo form/WhatsApp consent test, mobile/accessibility and Core Web Vitals | No actual submission or mobile browser inspection | Conversion and user safety | Test environment/approved synthetic journey; A16 |
| Three independently verified provider comparisons | A03 has sources; A01 competitive benchmark incomplete | Evidence-backed market comparisons | Same-date verified provider pages; A01/A03 |
| Reading specialist evidence and parent decision navigation | Main A04 findings available, unimplemented | A04-F001–F003 and academic reviewer/progress sample | Academic owner and A04/A15 review, no code until remediation approved |
| Remaining A06–A17 audit reports | No reports on main at integration snapshot | Complete evidence coverage | Separate audits and serial integration |

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
