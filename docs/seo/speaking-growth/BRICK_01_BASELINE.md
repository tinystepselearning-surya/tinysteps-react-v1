# Brick 01 — Speaking Search Baseline & Safety Lock

Baseline date: 2026-09-19 IST  
GSC settled through: 2026-09-16  
Current comparison window: 2026-06-18 through 2026-09-16  
Prior comparison window: 2026-03-20 through 2026-06-17  
Branch base commit: e2946a436f1c9dd9694b034ebfd166947c01700a

## 1. Purpose

Brick 1 is intentionally non-destructive. It records the exact Speaking search architecture and organic-performance baseline that later bricks must protect.

No production-facing source, route, redirect, sitemap, schema, pricing, curriculum, dashboard, attendance, scheduling, payment, lead or game behavior is changed by this brick.

## 2. Existing commercial ownership contract found in main

The repository already contains a commercial keyword-ownership system. The Speaking growth project must extend it rather than create a second conflicting system.

| Intent | Existing owner | Current repository decision |
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

Later bricks must not silently contradict these current public facts:

- Brand-level audience: ages 3–12.
- Standard live 1:1 class duration: 35 minutes.
- Free demo assessment: one free 35-minute 1:1 online demo assessment before enrolment.
- Standard 1:1 public price currently rendered: ₹400/class.
- Basic Public Speaking: ages 4–7, 36 lessons.
- Advanced Public Speaking: ages 7–12, 36 lessons.
- Public Speaking and Spoken English are intentionally separate commercial intents.
- Age 7 can overlap between the two public-speaking levels; placement is assessment-led.

Any later change to these facts requires a source-of-truth update, not a page-local copy edit.

## 4. Speaking URL inventory

### A. Primary commercial owners

| URL | Role | Current state |
|---|---|---|
| /speaking | Public Speaking + Communication commercial owner | indexable, self-canonical, sitemap, strong current owner |
| /spoken-english-classes-for-kids-online | Spoken English commercial owner | indexable, self-canonical, sitemap |
| /confidence-building-program-kids | specialist confidence programme | indexable, self-canonical, sitemap |

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

| URL | Current behavior | Baseline action |
|---|---|---|
| /public-speaking-communication-kids | still live, indexable, self-canonical and in sitemap | HOLD in Brick 1; repository C2 contract already says CONSOLIDATE_TO_OWNER → /speaking |
| /spoken-english-classes-for-kids | redirects to /spoken-english-classes-for-kids-online | preserve and monitor legacy index signals |
| /courses/basic-public-speaking | 301 to /courses/public-speaking-foundations | preserve |
| /courses/advanced-public-speaking | 301 to /courses/public-speaking-excellence | preserve |
| /courses/public-speaking | 301 to /courses/public-speaking-foundations | preserve |

## 5. Primary structural inconsistency frozen for later repair

The repository already states that /public-speaking-communication-kids should consolidate to /speaking, but the legacy URL is still:
- present in the public route manifest,
- self-canonical in the SEO registry,
- present in sitemap-static.xml,
- publicly reachable,
- earning Google impressions and clicks.

This is therefore a real, evidence-backed consolidation issue. Brick 1 does not change it. Brick 3 must decide and execute the safe signal-transfer plan after Brick 2 freezes query ownership.

## 6. Site-wide GSC context

Latest 90-day site performance at baseline:

| Metric | Latest 90 days | Change vs prior comparable period |
|---|---:|---:|
| Clicks | 7,660 | +5,691 |
| Impressions | 122,034 | +81,446 |
| CTR | 6.28% | +1.43 percentage points |
| Average position | 7.47 | improved by about 1.44 positions |

Interpretation: Tiny Steps has strong and improving overall organic visibility. The Speaking project is a category-specific growth problem, not a site-wide discoverability failure.

## 7. Speaking-family GSC page baseline

Latest 90 days, 2026-06-18 through 2026-09-16:

| URL | Clicks | Impressions | CTR | Avg position |
|---|---:|---:|---:|---:|
| /speaking | 66 | 2,917 | 2.26% | 8.85 |
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

Prior 90-day comparison highlights:

| URL | Prior clicks | Prior impressions | Prior avg position |
|---|---:|---:|---:|
| /speaking | 17 | 892 | 32.99 |
| /public-speaking-communication-kids | 0 | 341 | 28.86 |
| /spoken-english-classes-for-kids | 2 | 209 | 4.33 |
| /courses/public-speaking-foundations | 0 | 5 | 7.60 |
| /courses/advanced-public-speaking | 1 | 8 | 6.13 |
| /shy-child-speaking-confidence | 0 | 79 | 16.19 |

Key baseline conclusion: /speaking has become materially stronger, but the legacy public-speaking URL still carries search equity and must not be deleted or redirected casually.

## 8. Main commercial-query baseline for /speaking

| Query | Clicks | Impressions | Avg position |
|---|---:|---:|---:|
| public speaking classes for kids | 1 | 75 | 21.65 |
| public speaking for kids | 1 | 56 | 20.14 |
| live online public speaking training for kids | 0 | 51 | 37.08 |
| public speaking courses for kids | 0 | 27 | 34.96 |
| public speaking course for kids | 0 | 19 | 22.37 |
| public speaking classes for kids online india | 0 | 18 | 12.89 |
| online public speaking classes for kids | 0 | 15 | 19.13 |
| public speaking for children | 0 | 14 | 8.07 |
| best public speaking classes for kids | 0 | 12 | 17.50 |
| public speaking for 5 year olds | 0 | 11 | 11.09 |

This freezes the primary commercial opportunity: the owner page has page-one authority overall, but several high-intent head terms remain around positions 12–35.

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

This owner has useful near-page-one visibility but extremely low non-brand click volume.

## 10. Live public-page verification at baseline

Verified live on 2026-09-19:

- /speaking renders the Public Speaking & Communication owner page with the correct public-speaking vs Spoken-English vs Grammar vs confidence boundaries.
- /spoken-english-classes-for-kids-online renders the dedicated Spoken English owner page and links back to public speaking.
- /public-speaking-communication-kids remains live as a separate legacy page.
- /confidence-building-program-kids remains a specialist programme.
- /courses/public-speaking-foundations is live.
- /courses/public-speaking-excellence is live.
- /spoken-english-classes-for-kids redirects to the current Spoken English owner.
- /courses/basic-public-speaking redirects to the Foundations course.
- /courses/advanced-public-speaking redirects to the Excellence course.

## 11. Existing SEO safety infrastructure that later bricks must preserve

The repository already runs substantial SEO validation, including:
- sitemap generation,
- SEO smoke checks,
- rendered HTML checks,
- route integrity,
- indexation/indexability checks,
- GSC recovery/index-target audits,
- public-facts consistency,
- commercial owner-page audits,
- buyer-intent/internal-path audits,
- public bundle checks.

The 13-brick project should add only Speaking-specific safeguards where existing generic checks do not cover a new invariant.

## 12. Brick 1 risk register

### R1 — Legacy public-speaking self-competition
Severity: HIGH for this project.  
Evidence: /public-speaking-communication-kids has 701 impressions and 11 clicks while /speaking is the declared owner.  
Action: Brick 2 maps query overlap; Brick 3 performs safe consolidation if confirmed.

### R2 — Redirected URLs still visible in GSC
Severity: MEDIUM.  
Evidence: old Spoken English and old course slugs still show impressions after redirects.  
Action: monitor; do not create new internal links to legacy paths; verify all current internal references use canonical destinations.

### R3 — Strong owner-page average can hide weak money-query positions
Severity: HIGH.  
Evidence: /speaking averages position 8.85, while key head terms remain around positions 13–35.  
Action: Brick 2 separates query families; Bricks 4–8 improve relevance/evidence without spawning duplicate owners.

### R4 — Content expansion could re-create cannibalization
Severity: HIGH.  
Action: every later resource must have a declared funnel role and one commercial owner before publication.

### R5 — Parallel-development collision
Severity: HIGH operationally.  
Action: periodically merge latest main into this branch, resolve conflicts here, and run the complete final regression suite before any merge to main.

## 13. Brick 1 exit decision

Brick 1 is complete when this baseline and the project ledger are committed on the dedicated branch and a branch-vs-main comparison confirms that only Brick 1 documentation/evidence files changed.

No production behavior is authorized to change in Brick 1.
