# Brick 01 — Speaking Search Baseline & Safety Lock

Baseline date: 2026-09-19 IST  
GSC settled through: 2026-09-16  
Exact current comparison window: 2026-06-19 through 2026-09-16 (90 inclusive days)  
Exact prior comparison window: 2026-03-21 through 2026-06-18 (90 inclusive days)  
Original branch base commit: e2946a436f1c9dd9694b034ebfd166947c01700a  
Main synchronized before Brick 2: 3b11fee88ff21e928d2ed8af555afcb64695c815

## 1. Purpose and audit correction

Brick 1 is intentionally non-destructive. It records the exact Speaking search architecture, public-fact contracts, Google index state and organic-performance baseline that later bricks must protect.

The initial Brick 1 draft used 2026-06-18 through 2026-09-16 for the current window. That range is 91 inclusive calendar days. The re-audit corrected the baseline to two exact adjacent 90-day windows: 2026-06-19 through 2026-09-16 and 2026-03-21 through 2026-06-18. All metrics below use those corrected windows.

No production-facing source, route, redirect, sitemap, schema, pricing, curriculum, dashboard, attendance, scheduling, payment, lead or game behavior is changed by Brick 1.

## 2. Existing commercial ownership contract found in main

The repository already contains a commercial keyword-ownership system. The Speaking growth project must extend it rather than create a second conflicting system.

| Intent | Existing owner | Repository decision |
|---|---|---|
| Public speaking | /speaking | KEEP_OWNER / STRENGTHEN |
| General communication skills | /speaking | same canonical owner as public speaking |
| Spoken English / conversational fluency | /spoken-english-classes-for-kids-online | KEEP_OWNER / STRENGTHEN |
| Confidence-building programme | /confidence-building-program-kids | KEEP_SPECIALIST / STRENGTHEN |
| Shy-child informational help | /shy-child-speaking-confidence | informational support, not general commercial owner |
| Broad online English | /online-english-classes-for-kids | broader English owner, supports speaking |
| Hyderabad/local English | /online-english-classes-hyderabad | local specialist, not the global Speaking owner |

Protected repository sources include:
- src/lib/commercialC2KeywordOwnership.ts
- src/lib/commercialC3OwnerPageAudit.ts
- src/lib/publicRouteManifest.js
- src/lib/routeSeoRegistry.js
- src/config/semanticFacts.ts
- src/lib/publicCoursePages.js

## 3. Protected public facts at baseline

Later bricks must not silently contradict these current source-of-truth facts:

- Brand-level audience: ages 3–12.
- Standard live 1:1 class duration: 35 minutes.
- Free demo assessment: one free 35-minute 1:1 online demo assessment before enrolment.
- Standard 1:1 public price: ₹400/class.
- Basic Public Speaking: ages 4–7, 36 lessons.
- Advanced Public Speaking: ages 7–12, 36 lessons.
- Public Speaking and Spoken English are intentionally separate commercial intents.
- Age 7 can overlap between the two public-speaking levels; placement is assessment-led.

Any later change to these facts requires a source-of-truth update, not a page-local copy edit.

### Public-fact inconsistency discovered during re-audit

src/components/Home/PopularPrograms.tsx currently labels the "Super Speakers" card as "Ages 4-15" while linking to /courses/public-speaking-foundations. This conflicts with the protected brand maximum age of 12 and the published Speaking levels of ages 4–7 and 7–12.

Brick 1 records the inconsistency only. It does not alter the home page. The correction belongs to a later implementation brick after the final Speaking architecture is locked.

## 4. Speaking URL inventory

### A. Primary commercial owners

| URL | Role | Repository intent |
|---|---|---|
| /speaking | Public Speaking + Communication commercial owner | indexable, self-canonical, sitemap |
| /spoken-english-classes-for-kids-online | Spoken English commercial owner | indexable, self-canonical, sitemap |
| /confidence-building-program-kids | specialist confidence programme | intended indexable, self-canonical, sitemap |

Important: Google URL Inspection currently reports /confidence-building-program-kids as excluded by a noindex tag even though the present repository intends index,follow. That mismatch is frozen as a separate risk below.

### B. Programme/course pages

| URL | Role |
|---|---|
| /courses/public-speaking-foundations | Basic Public Speaking, ages 4–7, 36 lessons |
| /courses/public-speaking-excellence | Advanced Public Speaking, ages 7–12, 36 lessons |

### C. Informational/support pages

| URL | Role |
|---|---|
| /shy-child-speaking-confidence | parent informational/problem intent |
| /parents/speech-confidence | parent guidance |
| /resources/speaking | speaking resource hub |
| /free-speaking-games-for-kids | free speaking-practice discovery |
| /free-speaking-practice-game-for-kids | free speaking practice game |
| speaking-related blog URLs | informational authority/support |

### D. Seasonal pages

| URL | Role |
|---|---|
| /summer-speaking-camp-kids | seasonal speaking camp |
| /summer-camps/speaking-fast-track | seasonal fast-track programme |

### E. Legacy/consolidation candidates and aliases

| URL | Current contract/state | Baseline action |
|---|---|---|
| /public-speaking-communication-kids | indexable, self-canonical, sitemap; C2 says consolidate to /speaking | HOLD in Brick 1 |
| /spoken-english-classes-for-kids | Google sees Page with redirect | preserve redirect and monitor legacy signals |
| /courses/basic-public-speaking | Google sees Page with redirect | preserve redirect to Foundations |
| /courses/advanced-public-speaking | Google sees Page with redirect | preserve redirect to Excellence |
| /courses/public-speaking | repository/Firebase 301 to Foundations | preserve |

## 5. Primary structural inconsistency frozen for later repair

The repository already states that /public-speaking-communication-kids should consolidate to /speaking, but the legacy URL is still:
- present in the public route manifest;
- self-canonical in the SEO registry;
- present in sitemap-static.xml;
- present in RSS/feed discovery;
- submitted and indexed in Google;
- earning Google impressions and clicks.

This is a real, evidence-backed consolidation issue. Brick 1 does not change it. Brick 2 must map query overlap; Brick 3 may then execute a controlled signal transfer.

## 6. Site-wide GSC context — exact 90-day windows

Direct Search Analytics aggregate:

| Metric | Current 90d | Prior 90d | Change |
|---|---:|---:|---:|
| Clicks | 7,660 | 1,969 | +5,691 |
| Impressions | 122,034 | 40,588 | +81,446 |
| CTR | 6.28% | 4.85% | +1.43 percentage points |
| Average position | 7.57 | 8.63 | improved by ~1.05 positions |

The average-position value here is the reproducible direct Search Analytics aggregate for the exact dates above. This replaces the earlier summary-derived 7.47 figure.

Interpretation: Tiny Steps has strongly improved overall organic visibility. Speaking is a category-specific growth/conversion problem rather than a site-wide discoverability failure.

## 7. Speaking-family GSC page baseline

Current exact 90 days, 2026-06-19 through 2026-09-16:

| URL | Clicks | Impressions | CTR | Avg position |
|---|---:|---:|---:|---:|
| /speaking | 66 | 2,911 | 2.27% | 8.84 |
| /public-speaking-communication-kids | 11 | 701 | 1.57% | 25.49 |
| /spoken-english-classes-for-kids-online | 2 | 261 | 0.77% | 12.25 |
| /courses/public-speaking-foundations | 1 | 29 | 3.45% | 13.52 |
| /courses/public-speaking-excellence | 0 | 22 | 0% | 9.32 |
| /confidence-building-program-kids | 0 | 3 | 0% | 13.33 |
| /shy-child-speaking-confidence | 0 | 27 | 0% | 13.48 |
| /free-speaking-games-for-kids | 1 | 37 | 2.70% | 17.32 |
| /parents/speech-confidence | 0 | 1 | 0% | 7.00 |
| /summer-camps/speaking-fast-track | 1 | 3 | 33.33% | 1.33 |
| /summer-speaking-camp-kids | 0 | 7 | 0% | 9.43 |
| legacy /spoken-english-classes-for-kids | 0 | 39 | 0% | 57.51 |
| legacy /courses/advanced-public-speaking | 0 | 2 | 0% | 9.00 |

Prior exact 90-day comparison, 2026-03-21 through 2026-06-18:

| URL | Prior clicks | Prior impressions | Prior avg position |
|---|---:|---:|---:|
| /speaking | 17 | 898 | 32.85 |
| /public-speaking-communication-kids | 0 | 311 | 28.18 |
| /spoken-english-classes-for-kids | 2 | 209 | 4.33 |
| /courses/basic-public-speaking | 0 | 10 | 4.00 |
| /courses/public-speaking-foundations | 0 | 5 | 7.60 |
| /courses/advanced-public-speaking | 1 | 7 | 6.57 |
| /shy-child-speaking-confidence | 0 | 79 | 16.19 |

Key conclusion: /speaking has become materially stronger, but the legacy public-speaking URL still carries measurable search equity and must not be removed casually.

## 8. Main commercial-query baseline for /speaking

| Query | Clicks | Impressions | Avg position |
|---|---:|---:|---:|
| public speaking classes for kids | 1 | 74 | 21.93 |
| public speaking for kids | 1 | 56 | 20.14 |
| live online public speaking training for kids | 0 | 51 | 37.08 |
| public speaking courses for kids | 0 | 26 | 34.31 |
| public speaking course for kids | 0 | 19 | 22.37 |
| public speaking classes for kids online india | 0 | 18 | 12.89 |
| online public speaking classes for kids | 0 | 15 | 19.13 |
| public speaking for children | 0 | 14 | 8.07 |
| best public speaking classes for kids | 0 | 12 | 17.50 |
| public speaking for 5 year olds | 0 | 11 | 11.09 |

The owner page's overall average position is much stronger than several high-intent head queries. Brick 2 must therefore work at query-family level rather than relying on page-average position alone.

## 9. Main commercial-query baseline for Spoken English owner

| Query | Clicks | Impressions | Avg position |
|---|---:|---:|---:|
| english speaking classes online for kids | 0 | 68 | 18.15 |
| online spoken english classes for kids | 0 | 8 | 10.50 |
| online english speaking course for kids | 0 | 7 | 20.14 |
| spoken english classes for kids | 0 | 5 | 9.20 |
| spoken english classes for kids online | 0 | 5 | 7.20 |
| english speaking course online for kids | 0 | 5 | 18.60 |
| spoken english for kids online | 0 | 4 | 10.75 |

The owner has useful near-page-one visibility but almost no non-brand click volume in this period.

## 10. Fresh Google URL Inspection baseline

Inspected on 2026-09-19 against sc-domain:tinystepslearning.com:

| URL | Google verdict/state | Last crawl |
|---|---|---|
| /speaking | PASS — Submitted and indexed | 2026-09-16 |
| /public-speaking-communication-kids | PASS — Submitted and indexed | 2026-09-16 |
| /spoken-english-classes-for-kids-online | PASS — Submitted and indexed | 2026-08-19 |
| /confidence-building-program-kids | NEUTRAL — Excluded by noindex tag / blocked by meta tag | 2026-08-27 |
| /courses/public-speaking-foundations | PASS — Submitted and indexed | 2026-08-16 |
| /courses/public-speaking-excellence | PASS — Submitted and indexed | 2026-09-15 |
| /spoken-english-classes-for-kids | NEUTRAL — Page with redirect | 2026-07-31 |
| /courses/basic-public-speaking | NEUTRAL — Page with redirect | 2026-08-16 |
| /courses/advanced-public-speaking | NEUTRAL — Page with redirect | 2026-07-01 |

All inspected fetches were successful and crawled as mobile.

The confidence-programme result is particularly important: current source code explicitly applies robots index,follow and the route manifest intends it to be indexable, but Google's last inspected state records a noindex exclusion. Brick 3 must determine whether this is stale crawl history, a deployment mismatch, or another rendered/header source of noindex before any architectural decision is made.

## 11. Existing SEO and AI-discovery infrastructure to preserve

Existing repository infrastructure includes:
- sitemap generation;
- SEO smoke checks;
- rendered HTML checks;
- route integrity;
- indexation/indexability checks;
- GSC recovery/index-target audits;
- public-facts consistency;
- commercial owner-page audits;
- buyer-intent/internal-path audits;
- public bundle checks;
- public/llms.txt with commercial owner descriptions;
- RSS/feed discovery;
- existing LLM discovery hardening and commercial-search evidence documents.

The legacy /public-speaking-communication-kids URL is still represented in RSS/feed discovery while the commercial ownership system says it should ultimately consolidate to /speaking. Later GEO work must extend this infrastructure rather than creating duplicate mechanisms.

## 12. Brick 1 risk register

### R1 — Legacy public-speaking self-competition
Severity: HIGH.  
Evidence: /public-speaking-communication-kids has 701 impressions and 11 clicks while /speaking is the declared owner and both are currently indexed.  
Action: Brick 2 maps query overlap; Brick 3 performs controlled consolidation only if the evidence remains consistent.

### R2 — Redirected legacy URLs remain visible in GSC
Severity: MEDIUM.  
Evidence: old Spoken English and course slugs still have historical/current impressions; URL Inspection confirms Page with redirect.  
Action: preserve direct redirects, eliminate any unintended internal legacy links, and monitor consolidation.

### R3 — Strong page average masks weak money-query positions
Severity: HIGH.  
Evidence: /speaking averages position 8.84 while important head terms remain roughly positions 13–37.  
Action: Brick 2 separates query families; Bricks 4–8 improve relevance/evidence without spawning duplicate owners.

### R4 — Content expansion could re-create cannibalization
Severity: HIGH.  
Action: every later resource must have a declared informational role and one commercial owner before publication.

### R5 — Parallel-development collision
Severity: HIGH operationally.  
Action: latest main was synchronized into this branch before Brick 2. Continue periodic main → feature synchronization and full regression before final merge.

### R6 — Confidence programme indexability mismatch
Severity: HIGH for search architecture.  
Evidence: repository intends index,follow, but Google URL Inspection reports Excluded by noindex tag from the last crawl.  
Action: Brick 3 investigates rendered meta/header/deployment history and resolves the mismatch deliberately.

### R7 — Public age-range drift
Severity: MEDIUM/HIGH for factual consistency.  
Evidence: Home PopularPrograms labels Super Speakers as Ages 4-15, conflicting with brand ages 3–12 and Speaking programme ages 4–7 / 7–12.  
Action: later implementation brick must normalize this to the semantic facts source of truth; Brick 1 makes no runtime change.

## 13. Parallel-development synchronization

During the re-audit, main advanced from the original branch base to commit:

3b11fee88ff21e928d2ed8af555afcb64695c815

Those changes implement the separate AV5 attendance-validation classification engine. They were merged from main into the Speaking branch only. No Speaking commit was merged into main.

The Speaking branch therefore starts Brick 2 from current main plus the Brick 1 evidence files rather than from a stale repository state.

## 14. Brick 1 exit decision

Brick 1 is complete only if:
1. the corrected baseline and project ledger are committed;
2. latest main is incorporated into the dedicated branch;
3. branch-vs-main comparison shows only Brick 1 documentation/evidence differences;
4. the branch is zero commits behind main at the closing check;
5. no production-facing runtime behavior has changed due to Brick 1.

No production behavior is authorized to change in Brick 1.
