# Tiny Steps Learning — 17-Workstream SEO, AEO & GEO Audit Charter

**Status:** FINAL AUDIT PROTOCOL v1.0 — ready for execution; NOT an assertion that any audit has passed  
**Approved scope baseline:** 17 October 2026 (Asia/Kolkata)  
**Website:** https://tinystepslearning.com  
**GitHub source:** tinystepselearning-surya/tinysteps-react-v1, default branch main  
**Canonical charter:** docs/seo/visibility-17-audits/MASTER_AUDIT_CHARTER.md  
**Consolidated evidence register:** [COMPREHENSIVE_FINDINGS.md](./COMPREHENSIVE_FINDINGS.md)  
**Standard individual output:** [AUDIT_REPORT_TEMPLATE.md](./AUDIT_REPORT_TEMPLATE.md)  
**Audit reports directory:** docs/seo/visibility-17-audits/reports/A01.md through A17.md, created as each audit finishes

> This charter controls scope, evidence, task ownership and reporting across 17 separate ChatGPT conversations. Each conversation runs ONE audit and publishes ONE workstream report. The comprehensive findings document is the human-readable, cumulative aggregation; it must not replace source evidence. Audits may run in parallel. Implementation/remediation is a separate subsequent phase, after evidence-based prioritisation.

## 1. Outcomes and proof standards

Goal: evaluate whether each public page can be (1) reached by intended crawlers, (2) indexed by Google/Bing, (3) surfaced for matching user intent, (4) understood and accurately used as an answer source by AI-powered search, (5) supported by sound educational and commercial evidence, and (6) converted into appropriate parent or institutional enquiries.

**Never collapse these states:**

1. Crawl permission: robots policy or server rules permit a crawler. This is not proof it fetched the page.
2. Retrievability: the page returns usable live HTML, without blocked/challenged requests, redirect loops or client-only content loss.
3. Indexability: live canonical, HTTP and directives permit indexing. This is not proof of actual index inclusion.
4. Indexed: first-party Google Search Console / Bing Webmaster Tools or an explicitly identified limited public observation supports an index claim.
5. Search visibility: a dated and location-/query-specific SERP observation or first-party performance data shows actual appearances.
6. AI visibility: a named engine actually names, links, cites or recommends the site in recorded responses; bot allowlisting alone proves none of this.

**Source precedence:** live production evidence (with capture date/time, status and fetch details) for deployed behaviour; first-party GSC/Bing data for indexing and impressions; platform-specific answer observations for AI visibility; GitHub main code/CI for possible root causes and intent; historical audits as context only. Search caches/snippets may reflect older deployments; do not confuse their content with current production. If a tool cannot retrieve robots.txt, XML or a target URL, record TOOL ERROR / UNVERIFIED and seek independent checks before calling it a site failure.

## 2. Exact workstream ownership: 17 distinct audits

One report per ID. URLs listed are starting owners, not an exhaustive inventory; discover child URLs and record final inventory in the corresponding report. Respect canonical intent boundaries.

| ID | Workstream | Primary starting pages | Primary ownership |
|---|---|---|---|
| A01 | Homepage | / | Brand entity, identity, trust signals, root-page search and parent funnel |
| A02 | Curriculum | /curriculum | Educational roadmap, progression, teaching claims, programme fit |
| A03 | Phonics commercial | /phonics; /best-online-phonics-classes-for-kids-in-india; /phonics-fees-india | Phonics programme + comparison + pricing intent, other linked phonics landing pages |
| A04 | Reading commercial | /reading-classes-for-kids; /reading-fluency-program | Connected-text reading, fluency and comprehension (NOT nonexistent /reading) |
| A05 | Grammar commercial | /grammar; /writing-classes-for-kids | Grammar/sentence intent vs longer writing ownership |
| A06 | Speaking commercial | /speaking; /spoken-english-classes-for-kids-online | Speaking, conversation, confidence and public-speaking intent |
| A07 | Resources gateway | /resources | All seven pathways, hub hierarchy, navigation, crawlable links and taxonomy |
| A08 | Phonics & Reading resource pathway | /resources/phonics | Hub + all published child phonics knowledge guides; phonics/reading informational cluster |
| A09 | Grammar & Writing resource pathway | /resources/grammar | Hub + all published child grammar guides, writing resource cluster |
| A10 | Vocabulary resource pathway | /resources/vocabulary | Hub + all published vocabulary knowledge guides and utility pages |
| A11 | Speaking & Communication resource pathway | /resources/speaking | Hub + communication, explanation, storytelling and speaking knowledge cluster |
| A12 | Parent Help resource pathway | /parents | Parent concern/diagnosis-boundary hubs and child-parent help pages |
| A13 | Free Learning Activities resource pathway | /free-english-games-for-kids | Games hub, listed free learning games and search-accessible activity instructions |
| A14 | Schools & Educators resource pathway | /for-schools | School implementation, research, teacher resources and partnership claims |
| A15 | Entire blog/editorial article library | /blog and every published /blog/... URL | Complete article-level inventory, quality, canonical intent, editorial evidence and internal links |
| A16 | Cross-programme commercial/conversion pages | /courses; /pricing; /book-demo; /contact; /class-samples; /testimonials and relevant enrolment/decision pages | Cross-programme buying journey, transparency, lead capture and conversion |
| A17 | Sitewide technical / search / reconciliation | /robots.txt; /sitemap.xml and child sitemaps; /llms.txt; route and SEO registries | Whole-site inventory, sitemap/canonical/noindex/redirect consistency, crawl budgets, bot groups, cross-audit closure |

**IMPORTANT route correction:** The seven resource pathways do not all live at /resources/{name}. The current website source maps four to /resources/phonics, /resources/grammar, /resources/vocabulary and /resources/speaking, and three to /parents, /free-english-games-for-kids and /for-schools. Source: src/pages/ResourcesPage.tsx, validated 2026-10-17. Reading programme owner: /reading-classes-for-kids (not /reading).

**Overlap rule:** A03–A06 own commercial URL content. A08–A14 own their hubs, specialist resource pages, and the link/topic relationships to relevant blogs. A15 alone owns full article-by-article editorial QA for the whole published blog inventory. A16 owns shared commercial steps and end-to-end enquiry journeys. A17 owns sitewide technical reconciliation. Every page can be referenced from multiple audits, but the same finding gets ONE canonical finding ID and cross-references rather than inflated duplicates.

## 3. Universal test protocol — perform on every workstream

### G0. Discovery and inventory (mandatory prerequisite)
- List all in-scope canonical URLs, their purpose, parent hub, page template, primary query/intent, authored/reviewed dates, source file, deployment status, and whether the URL is sitemap-listed.
- Reconcile routes, generated sitemap index + child sitemaps, internal HTML links, live pages, blog registry and any existing route ownership maps.
- Distinguish published, redirect, canonicalized, intentionally excluded, gated/private, draft and orphaned pages. Do not penalise intended exclusions.
- Record current production evidence and repository HEAD SHA; warn if source/deployed revision cannot be matched.

### G1. Production technical and Google/Bing indexability
- Resolve HTTPS, status, redirects, canonical chains, robots.txt user-agent matching, noindex via meta and X-Robots-Tag, and no contradictory canonical/index directives.
- Compare initial server HTML, rendered DOM when accessible, important text and links, crawlable navigation, page title, meta description, H1–H3, semantic markup, mobile access, Open Graph and locale.
- Verify sitemap membership, status freshness, accurate lastmod where represented, no blocked/noncanonical submitted URLs, child sitemap coverage and accidental exclusion.
- Inspect Search Console URL Inspection, indexing reasons, performance trend and Bing equivalents when access is available. Otherwise label these NOT VERIFIED.
- Check relevant Googlebot/Bingbot and AI bot policies independently: OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User, and any other documented agents. Differentiate search discovery vs user-triggered fetching vs training controls. Do not infer actual crawl from robots allow rules.
- Treat llms.txt / llms-full.txt as optional discovery aids, not a proven search-ranking or inclusion requirement.
- Check Core Web Vitals using field data when present, otherwise explicitly label lab/synthetic scores.

### G2. Search visibility (measured)
- Use a reproducible query set: branded, non-branded informational, transactional, comparison, child-problem, location-qualified and voice/question-form queries where applicable.
- Log engine (Google, Bing), date/time, locale, device, personalization controls if any, query, result URL, rank/placement only when verified, observed snippet, competing URLs and cited evidence. Distinguish generic web lookup from a direct native engine SERP.
- Use GSC/Bing first-party impressions, clicks, CTR and query/URL changes if available; name timeframe (7/28/90 days) and limitations. Never infer ranking movement from a one-off public search.

### G3. AI/answer-engine visibility (measured)
- For each audited cluster prepare >=10 meaningful questions distributed across five intents (brand, problem, concept, provider/comparison and choosing-next-step), with proportional applicability.
- Test ChatGPT Search, Perplexity, Copilot, Google AI results and other accessible engines individually; do not represent results from generic web search as a test of their native product.
- Log exact prompt, engine/mode, timestamp, location/session context if exposed, answer excerpt, source links, exact Tiny Steps URL, whether Tiny Steps was absent / merely listed / linked / cited / explicitly recommended, competitor citations and factual errors.
- Repeat a representative subset across sessions/dates where feasible; AI results are probabilistic and personalized. If direct engine interaction is not available, output a MANUAL TEST QUEUE, not a fake verdict.
- Inspect answer extraction quality: concise faithful definitions, attribution, named expertise, self-contained answer blocks, reading levels, comparisons, examples and appropriate links.
- Do not promote content stuffing, fabricated third-party authority, unsupported product ranking claims or schema merely to manipulate AI citations.

### G4. Structured data and entity integrity
- Inventory actual JSON-LD types and IDs; confirm URLs, canonical @id relationships, Organization, WebSite, WebPage, BreadcrumbList, Course, Article, Person or other valid types only as relevant.
- Validate syntax and appropriate property use, visible-content consistency, schema constraints, and supported author/reviewer/business claims.
- Evaluate FAQ markup truthfully; do not promise Google FAQ rich-result eligibility for commercial pages. llms.txt and special AI files are not substitutes for public HTML and credible citations.
- Verify NAP/business/brand name, academic-lead identity, social profiles where available, independent mentions, license/affiliation claims, country/age/curriculum methodology claims, and noncontradictory programme facts.

### G5. Educational quality, credibility and safety
- Assess accuracy and nuance of phonics, decoding, reading, grammar, writing, vocabulary, speaking and school-implementation advice; identify evidence-backed, anecdotal and unverified claims.
- Inspect identifiable qualified author/reviewer, transparency, factual citations, actual first-party teaching examples, updated dates, evidence for 5000+ students/15+ countries or other statistics, and consent-backed testimonials.
- Avoid implied diagnosis, guaranteed improvement windows, fabricated outcomes, and unsupported educational-framework accreditation or alignment statements.
- Demand originality, concrete practical application and distinguishing intent, rather than repetitive templated AI-friendly prose.

### G6. Navigation, UX and commercial conversion
- Check HTML-link paths between homepage, curricula, relevant programmes, resource hubs, articles, practice activities, price/demo/contact and school enquiries, including breadcrumbs and dead ends.
- Check mobile keyboard/focus/a11y, readability, visible CTA, form errors, consent/privacy messaging, WhatsApp handoff and any tracking consent boundaries.
- Test conversion flows only with non-destructive methods and synthetic data where safe. Do not generate real parent leads, bookings, payments or outbound messages as audit side effects.

### G7. Comparison and prioritized outputs
- Record at least three relevant competitor or third-party sources when genuinely useful, noting locale and evidence; never fabricate competitor metrics.
- Identify content gaps, duplicated intent owners, missing answer nodes, trust gaps, historical vs new regressions, and root-cause hypotheses.
- Produce the standardized report and tests required by Section 7, including concrete actions and verification criteria. Observation and repair are separate.

## 4. Universal scorecard and confidence gates

| Dimension | Default weight |
|---|---:|
| Technical crawl/indexability | 20 |
| Google/Bing search visibility | 15 |
| AEO / GEO / AI answer readiness and observed presence | 20 |
| Content and search intent quality | 15 |
| Educational/organisation evidence and trust | 15 |
| Navigation, accessibility and UX | 10 |
| Commercial conversion relevance | 5 |
| **TOTAL** | **100** |

- Scores must be based on rubric-level observable evidence, not guessed ranking scores. Where evidence is incomplete, report coverage percentage and mark total as PROVISIONAL or NOT SCORABLE; never count missing tests as passed or as failed.
- Mark individual checks VERIFIED PASS, VERIFIED FAIL, NEEDS IMPROVEMENT, UNVERIFIED/TOOL LIMITED or NOT APPLICABLE.
- For a noncommercial educational hub, mark irrelevant conversion checks N/A and normalize against applicable weight. Preserve raw category results for cross-audit comparisons.
- Never label an audit COMPLETE unless live production and route inventory are reviewed, all P0/P1 candidates are reproduced or explicitly flagged unverified, all primary deliverables exist, and evidence coverage / outstanding manual tests are visible.
- Treat GSC, Bing Webmaster and AI native-platform observations not accessible to the auditor as outstanding evidence; this may make a report COMPLETE WITH LIMITATIONS rather than a verified full-platform pass.

**Severity**: P0 production-critical blocking/indexing/security or nonfunctional primary lead path; P1 material search discoverability/major trust or high-value conversion regression; P2 significant topical, UX or content deficiency; P3 marginal optimisation. Prioritize by impact x confidence x affected pages x feasibility, and never conflate detection with a shipped fix.

## 5. Shared audit prompt

Use this exact instruction in EACH independent chat, replacing only the audit ID:

> Read docs/seo/visibility-17-audits/MASTER_AUDIT_CHARTER.md and docs/seo/visibility-17-audits/AUDIT_REPORT_TEMPLATE.md from GitHub repo tinystepselearning-surya/tinysteps-react-v1, main. Run ONLY audit AXX as defined in the charter against production https://tinystepslearning.com. Discover and inspect all in-scope published pages and related paths. Use direct live evidence first, GSC/Bing and native AI engines only when genuinely accessible, and GitHub code/history for root causes. Produce an evidence-backed report at docs/seo/visibility-17-audits/reports/AXX.md with exact findings IDs, URL inventory, platform observations, evidence links, gaps, actions and tests. Do not modify website/app code or merge implementation PRs. Avoid collisions with other audit chats: own only your AXX report. After posting that report, ask the designated integration chat to reconcile the new results into COMPREHENSIVE_FINDINGS.md. Explicitly mark untested tools/platforms and block unsupported claims.

## 6. Per-workstream additional prompt (append for its ID)

**A01 — Homepage:** Does / establish a verifiable Tiny Steps brand/entity, founder/academic identity, ages 3–12, geography, actual programmes, teacher-led format, policies, course navigation, credibility and accurate lead CTA? Test online English classes for kids, Tiny Steps Learning branded queries, and “What does Tiny Steps teach?” Verify the demo and WhatsApp promises match real behaviour.

**A02 — Curriculum:** Can a parent and AI system reconstruct skills, prerequisites, assessment-first placement, programme progression, lesson outcomes, and what is/is not age-based? Audit child curricula and programme ownership links. Review every named alignment/affiliation (Cambridge, IB, Jolly Phonics, etc.) for precise support and consistency; don't assume endorsement or accreditation.

**A03 — Phonics:** Audit /phonics, the canonical buyer-comparison page /best-online-phonics-classes-for-kids-in-india, phonics fee owner and related commercial landing pages. Test exact “best online phonics classes” query intent, phonics vs reading boundaries, blending/decoding explanations, levels, claims, backlinks, internal intent handoffs and price truth. Recheck the October 2026 suspected nonindexing incident and legacy /best-online-phonics-classes-india redirect, not merely whether a page appears in a search snippet.

**A04 — Reading:** Start at /reading-classes-for-kids and /reading-fluency-program; test reading accuracy, connected-text fluency, phrasing, vocabulary, comprehension and retelling vs phonics/decoding; parent queries about guessing, slow reading and weak comprehension. Check canonical boundaries, stage criteria, outcomes and cross-links. /reading is not the presumptive owner.

**A05 — Grammar:** Start at /grammar and writing owner /writing-classes-for-kids; verify sentence mechanics vs paragraph/composition differentiation; parts of speech, tense application, punctuation, errors, contextual use, originality, age-fit and referrals to appropriate writing support.

**A06 — Speaking:** Start at /speaking and /spoken-english-classes-for-kids-online; test conversation, fuller answers, vocabulary retrieval, critical thinking, storytelling, presentation delivery, speaking progress metrics and public-speaking relevance. Differentiate confidence and fluency from public-speaking performance without promising diagnoses.

**A07 — Resources hub:** Validate the seven cards and their TRUE destinations (/resources/phonics, /resources/grammar, /resources/vocabulary, /resources/speaking, /parents, /free-english-games-for-kids, /for-schools). Crawl every route, category/discovery path, topic index, breadcrumb, hub CTA, indexing/intent, shared resource directory and JS accessibility. Confirm coherent routes to articles and courses.

**A08 — Phonics & Reading resources:** Audit hub /resources/phonics and EVERY currently published /resources/phonics/:slug child page, including the historically described 31 governed phonics guides if still live. Cover CK, Floss, digraphs, vowel teams, blending, CVC, decoding, exceptions, illustrations and academic accuracy. Map associated phonics/reading blogs; A15 owns complete editorial page checks.

**A09 — Grammar & Writing resources:** Audit /resources/grammar and ALL published /resources/grammar/:slug child pages, the grammar/writing practice and educational explanation structure. Assess rule correctness, sentence transfers, paragraphs, supporting examples, age-fit, schema and course separation. Link associated blog owners to A15.

**A10 — Vocabulary resources:** Audit /resources/vocabulary and every published vocabulary child/knowledge URL, contextual word learning vs lists, vocabulary themes and word morphology, example usefulness, links to comprehension, grammar and speaking, JSON-LD and accessibility.

**A11 — Speaking & Communication resources:** Audit /resources/speaking, all published communication knowledge pages, questions, one-word answers, storytelling, discussion, reasoning, speaking performance, publisher accuracy, and coherence with /speaking /spoken-english-classes-for-kids-online.

**A12 — Parent Help:** Audit /parents plus directly connected /parents/... and public parent problem/decision landing pages, diagnostic-boundary language, safe advice, accessibility, judgement-free next steps, self-service FAQs and honest referral to an assessment. Avoid unsupported medical/learning-disorder diagnoses.

**A13 — Free Learning Activities:** Audit /free-english-games-for-kids and each published learning-game landing page and crawlable activity shell. Verify purpose, instructions, working gameplay, indexability, accessible alternatives, any entitlement/trial messaging, child privacy and parent-friendly links; distinguish live class demo from digital games trial.

**A14 — Schools & Educators:** Audit /for-schools and every school/teacher/research resource surfaced there. Review implementation and trainer claims, curriculum evidence, methodology, school partnership conversion, contact handoff, original materials, qualified authorship and institutional trust evidence.

**A15 — Blog/editorial catalogue:** Inventory EVERY currently published /blog/... article, dedupe slugs and canonical duplicates, reconcile /blog UI, article content registry, all sitemap-blog entries and published status. The blog UI currently reports 83 articles while an earlier frozen blog-quality sequence has 76 and llms.txt curates 51 reviewed pieces: these are different historical/curated counts, NOT an authoritative present count. Audit EACH published article with quality, facts, author/reviewer, unique query owner, title/canonical/schema, useful examples, factual references, links, answer extraction and content freshness. Cross-reference all 7 hubs; include an article-level appendix and defects by article.

**A16 — Cross-programme commercial and leads:** Audit /courses, /pricing, /book-demo, /contact, /class-samples, /testimonials, /why-tiny-steps, age/location/fee/format decision pages and special offers where live. Verify current pricing and duration, real 1:1 vs groups, testimonials/consent, currencies, seasonal expiration, conversion accessibility, safe test steps and attribution instrumentation. Do not submit real test enquiries.

**A17 — Sitewide reconciliation:** Crawl/index compare all public sitemap sections and actual public routes; audit main domain/www/http/https, robots.txt specific bot group semantics, llms.txt, sitemap.xml/children, redirects, canonical/noindex consistency, hreflang (where actually used), 404/soft-404, live HTML vs CSR, orphaned nodes, schema @id consistency, stale seasonal pages, duplicate owner intents and indexation regression history. Join and dedupe all A01–A16 results and identify dependencies, but don't mark other audits complete by assumption.

## 7. Required standardized report per audit

The separate AUDIT_REPORT_TEMPLATE.md is mandatory. At minimum each report includes:

1. Audit metadata: ID, owner chat (optional), start/completion timestamps IST, source HEAD SHA, production evidence timestamps, scope and status.
2. Executive verdict with evidence completeness and clear VERIFIED vs UNVERIFIED separation.
3. Exhaustive in-scope URL table: intent, canonical, robots/indexing evidence, structured data, discoverability, status, final page ownership.
4. Evidence ledger: observation ID, URL/query, platform/tool, actual response, captured timestamp, link or reproducible command, confidence.
5. Google/Bing matrix and distinct native AI-platform prompt/answer matrix.
6. Educational/content credibility and trust review; cross-hub/link and commercial path audit.
7. Weighted scorecard with N/A/unverified coverage flags.
8. Finding ledger IDs in format AXX-F001..., severity, impact, exact evidence, root-cause hypothesis, recommendation, acceptance test and affected page(s).
9. Manual verification queue, limitations, next-phase fixes, and unresolved cross-audit dependencies.
10. Completion verdict: IN PROGRESS / EVIDENCE COLLECTED / COMPLETE WITH LIMITATIONS / COMPLETE VERIFIED. Implementation fixes never count as completed merely because recommendations were written.

## 8. Parallel-chat coordination, collisions and safe GitHub writes

**Parallel evidence collection; serial integration.**

- Each of the 17 audit chats reads this immutable-in-scope charter from main and works independently. Workstream owns ONLY docs/seo/visibility-17-audits/reports/AXX.md. Do not use the same report path for two simultaneous chats.
- Reports may be drafted/committed concurrently in distinct paths; synchronize with updated main before a write. Preserve audit snapshots and source URLs. A new chat should FETCH existing AXX.md first before editing.
- Only ONE designated integration chat at a time may update COMPREHENSIVE_FINDINGS.md. It must reread the current file/HEAD and latest 17 report files before each reconciliation; use current content SHA / optimistic locking, retry conflicts by reread and merge, and preserve existing findings and status rows.
- Integration may happen immediately after ANY individual report lands. An audit is “integrated” only when its evidence-backed summary, findings, links and open questions appear in the comprehensive register with a dated integration entry.
- Do not use one chat's apparent progress as proof another chat completed. No cross-chat shared execution is automatic; the user starts separate conversations and explicitly invokes integration. GitHub documents supply persistent cross-chat state.
- Prefer separate documentation-only pull requests if protected branch/review policy requires them. No production code edits, indexing submissions, PR merges or deployments occur in the audit-only phase.
- If a URL is owned by two workstreams, point to the canonical finding ID rather than duplicating a defect with conflicting fixes.
- Freeze the 17-ID taxonomy during this audit cycle. New unanticipated landing pages must be assigned to the most relevant existing owner, rather than silently becoming an 18th audit. Charter edits require explicit versioning and change log.

## 9. Comprehensive register and action plan gate

The consolidated document must contain:
- 17-row status register, report links, evidence coverage and last integration timestamp;
- cross-cutting P0/P1 alerts (only reproduced issues);
- canonical deduplicated findings register with per-URL evidence and owners;
- Google/Bing search and AI visibility summary with explicit platform test coverage;
- metrics baseline (indexed URLs, impressions/clicks, branded/unbranded appearances, citations and enquiries), when truly measured;
- dependencies/collisions, unknowns, manual test requests and change history;
- a separate PROPOSED ACTION BACKLOG, not an execution log.

**Final remediation planning gate:** Review findings from all 17 workstreams, reconcile overlap, rank P0/P1/P2/P3 with measurable outcomes, define non-disruptive release batches and rollback gates, then seek user approval for website changes. Genuine P0 safety/availability emergencies may be escalated immediately without treating the audit programme as complete.

## 10. Prior references to inspect, NOT blindly reuse as current truth

- docs/ai-geo-implementation-status.md
- docs/phonics-landing-seo-aeo-geo-audit.md
- docs/seo/blog-quality/BLOG_QUALITY_AUDIT_PROGRESS.md
- docs/seo/blog-quality/AUTHORITATIVE_76_SEQUENCE.md
- docs/gsc-index-recovery-final-qa.md
- docs/gsc-non-indexed-url-action-plan.md
- docs/seo/commercial-growth/
- docs/seo/resources-architecture/
- docs/seo/speaking-growth/
- src/lib/commercialC2KeywordOwnership.ts
- src/lib/canonicalTopicOwnershipRegistry.js
- src/pages/ResourcesPage.tsx
- public/robots.txt, public/llms.txt, public/llms-full.txt
- scripts and tests for sitemap generation, prerendering, indexing and audit gates

## 11. Charter revision history

- **v1.0 — 2026-10-17:** Defines 17 fixed workstreams, verified resource pathway URL ownership, corrected reading URL, full blog audit, production-first evidence hierarchy, answer-engine visibility testing, individual report isolation, serialized comprehensive integration, and implementation-after-audits governance.
