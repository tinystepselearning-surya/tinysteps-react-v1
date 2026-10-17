# Tiny Steps Learning — Standard Audit Report Template (Axx)

> Duplicate this template into reports/A01.md ... reports/A17.md. Replace ALL placeholders and remove examples. Do not fill unanswered fields with guessed data. Read MASTER_AUDIT_CHARTER.md first. This document is a TEMPLATE, not an audit result.

## 0. Workstream identity

| Field | Value |
|---|---|
| Audit ID/title | AXX — [title] |
| State | IN PROGRESS / EVIDENCE COLLECTED / COMPLETE WITH LIMITATIONS / COMPLETE VERIFIED |
| Started / evidence cut-off / completed (IST) | [times with timezone] |
| Auditor/chat | [identifier if known] |
| GitHub repository and inspected main SHA | [repo, SHA] |
| Production website and observed revision | https://tinystepslearning.com / [verified, unknown or mismatch] |
| Charter version | v1.0 |
| Integration state | NOT YET INTEGRATED / INTEGRATED [date, comprehensive revision] |
| Evidence scope completed | [number tested / number discovered, by category] |
| Platform access restrictions | [explicit] |

## 1. Executive summary and verdict

**Verdict:** [factual 3–6 sentence conclusion, no unsupported confidence claims]

**Confirmed:** [facts directly reproduced]

**Unverified / not tested:** [GSC/BWT/native engine coverage, connectivity gaps, unclear pages]

**Primary risks:** [P0/P1 etc with exact evidence IDs]

**Dependencies:** [other AXX audit IDs and unknowns]

## 2. Full in-scope page inventory

Define scope discovery method: [sitemap, internal link crawl, source routes, content registries, user-supplied data].

| URL | Purpose and intent owner | Live status | Canonical | Robots/noindex | Sitemap | Index evidence | Structured data | Primary link parent | Finding IDs |
|---|---|---|---|---|---|---|---|---|---|
| https://tinystepslearning.com/[...] | [...] | VERIFIED / UNKNOWN | [...] | [...] | [...] | GSC / Bing / UNKNOWN | [...] | [...] | AXX-F... |

For knowledge/article inventories this table must enumerate EVERY published URL in scope. Separate intentionally excluded/private/redirect URLs so they are not miscounted as search failures.

## 3. Reproducible production evidence ledger

| Evidence ID | Captured IST | URL or exact query | Engine/tool + mode | Observed result and proof | Confidence / limitation |
|---|---|---|---|---|---|
| AXX-E001 | [...] | [...] | Live HTTP / GSC / Bing / Search / browser / code | [status, canonical, title, response excerpt, console export, link or command] | High / Medium / Low / Unverified |

**Production-vs-source comparison:** [observations only; GitHub SHA and paths].  
**Prior incident or previous audit comparison:** [links with dates; explicitly historical].

## 4. Google and Bing visibility

| Query and intent | Engine | Date/time IST | Country/device | Tiny Steps URL shown? | Rank/placement if VERIFIED | GSC/BWT evidence | Competitors | Confidence |
|---|---|---|---|---|---|---|---|---|
| [...] | Google/Bing | [...] | [...] | [...] | [...] | [...] | [...] | [...] |

**Index coverage:** Confirmed in GSC [n], confirmed in Bing [n], unverified [n], intentionally excluded [n]. Do not imply GSC access if unavailable.

**Trends:** impressions/clicks/CTR over [7/28/90-day periods] with source/export time and caveats.

## 5. Native AI / answer-engine test matrix

No generic web-search proxy is acceptable as proof of native ChatGPT/Perplexity/Copilot/Google AI results. If unavailable, generate a manual queue.

| Prompt ID | Exact prompt | Platform/mode | IST & locale | Tiny Steps: absent/listed/linked/cited/recommended | Cited URL(s) and competitors | Factual correctness | Repeatability/limitations |
|---|---|---|---|---|---|---|---|
| AXX-Q001 | [...] | [...] | [...] | UNTESTED / [...] | [...] | [...] | [...] |

**At least 10 thoughtfully chosen prompts in the queue**, across brand/definition, educational problem, concept, provider comparison and next-step decision, where relevant.

**Metrics (only with measured denominators):** tests attempted [n], verified engine answers [n], explicit Tiny Steps citations [n], source links [n], recommendations [n]; platforms fully untested [list].

## 6. Structured data, educational quality, trust and content coverage

| Test | Finding and observed fact | Evidence ID | Status |
|---|---|---|---|
| JSON-LD syntax / @id canonical consistency | [...] | [...] | VERIFIED PASS/FAIL/UNVERIFIED/N/A |
| Appropriate schema type and visible content parity | [...] | [...] | [...] |
| Author/reviewer and organisational identity | [...] | [...] | [...] |
| Educational accuracy, references and limitations | [...] | [...] | [...] |
| Claims, testimonials, pricing and consent | [...] | [...] | [...] |
| Answer extraction and differentiated useful examples | [...] | [...] | [...] |
| Topic/keyword intent ownership and cannibalisation | [...] | [...] | [...] |
| Breadcrumbs, internal linking and orphan links | [...] | [...] | [...] |
| Mobile/UX/accessibility / lead CTA | [...] | [...] | [...] |

**Topic coverage gap map:** query/need, existing owner, missing depth, proposed new/expanded page, evidence, duplicate risk and estimated priority.

## 7. Scorecard and evidence completeness

| Dimension | Weight | Applicable? | Evidence coverage | Evidence-based score | Notes |
|---|---:|---|---|---:|---|
| Technical crawl/indexability | 20 | Y/N | [%] | [score or UNVERIFIED] | [...] |
| Google/Bing visibility | 15 | Y/N | [%] | [...] | [...] |
| AI answer readiness and visibility | 20 | Y/N | [%] | [...] | [...] |
| Content and intent | 15 | Y/N | [%] | [...] | [...] |
| Educational trust | 15 | Y/N | [%] | [...] | [...] |
| Navigation/UX | 10 | Y/N | [%] | [...] | [...] |
| Conversion | 5 | Y/N | [%] | [...] | [...] |

**Total:** [score/100, PROVISIONAL, or NOT SCORABLE]. Explain weight renormalisation for N/A. Do not assign pseudo-zero or perfect score for missing platform evidence.

## 8. Findings register (canonical finding IDs only)

| Finding ID | Severity | Affected URL(s) | Precise verified problem | Evidence ID(s) | Likely root cause (label hypothesis) | Proposed action | Acceptance test | State |
|---|---|---|---|---|---|---|---|---|
| AXX-F001 | P0/P1/P2/P3 | [...] | [...] | [...] | [...] | [...] | [...] | OPEN / PENDING VALIDATION / NOT A DEFECT |

Findings that are uncertain must be in **hypotheses / pending verification**, not in VERIFIED defects or score deductions. Where another workstream owns the same issue, cross-reference its canonical finding ID rather than create a duplicate.

### P0 and P1 reproduction details

For every P0/P1 include: exact reproduction procedure; live timestamp; expected vs actual; observed business/search impact; whether previously present; confidence; short-term containment without unapproved prod changes.

## 9. Manual follow-ups and unresolved access

| Item | Needed evidence or user access | What is blocked without it | Priority | Owner |
|---|---|---|---|---|
| [...] | [...] | [...] | [...] | [...] |

## 10. Proposed actions (not yet authorised for implementation)

List change candidates in dependency order, exact files/URLs, validation requirements and expected measurable outcomes. NEVER claim an action has been deployed unless post-deployment evidence is attached.

## 11. Audit closure checklist

- [ ] Production pages and all published in-scope URLs enumerated; excluded URLs identified
- [ ] GitHub HEAD SHA and evidence capture dates logged
- [ ] Robots, canonical, noindex, sitemap and rendered content reviewed
- [ ] Google/Bing tested where accessible; first-party tools not available explicitly flagged
- [ ] AI test queue >=10 prompts, with real platform results or clearly flagged UNTESTED
- [ ] Structured data, academic claims, E-E-A-T, internal links and UX reviewed
- [ ] P0/P1 reproducible defects or limitations clearly distinguished
- [ ] Finding IDs unique and cross-audit overlaps explicitly cross-referenced
- [ ] Scores evidence-based and limitations not hidden
- [ ] Report committed in OWN AXX path; integration requested
- [ ] Comprehensive register updated by the ONE designated integration chat (not concurrently)

**Closure state:** [IN PROGRESS / EVIDENCE COLLECTED / COMPLETE WITH LIMITATIONS / COMPLETE VERIFIED]  
**Next:** Send integration instruction: “Read reports/AXX.md on main and update COMPREHENSIVE_FINDINGS.md by merging, not overwriting, with the latest revision.”

## 12. Revision log

- [IST timestamp] [what evidence or state changed and which revision] 
