# B12 — Measurement, SEO Governance & Publishing Decisions

## Objective

Brick 12 turns the B0–B11 architecture into an operating system for decisions.

The question is no longer simply **"is this page optimized?"**. The question becomes:

> **Which search pages are earning visibility, which content is influencing real enquiries, and what should Tiny Steps protect, improve, consolidate, or leave alone?**

B12 does not create a new content expansion programme. It establishes the evidence rules that future bricks must follow.

## Baseline protected by B12

- Live blog inventory: **76**
- B2 intent ownership: preserved
- B6 parent authority: preserved
- B7 trust/authorship: preserved
- B8 first-party knowledge: preserved
- B9 Grammar/Speaking authority: preserved
- B10 technical authority graph: preserved
- B11 conversion-family and attribution contract: preserved
- New blog URLs in B12: **0**
- Redirect/canonical/sitemap/RSS/indexability changes in B12: **0**

## Measurement model

B12 separates three questions that must not be mixed together.

### 1. Search acquisition

Use Google Search Console as the source of truth for Google search visibility:

- impressions;
- clicks;
- CTR;
- average position;
- query;
- page;
- device/country only when a decision genuinely depends on them.

Search Console evidence is used to decide whether a page is gaining, declining, overlapping another owner, or attracting a new query family.

### 2. Website behaviour and conversion

Use the stable B11 event vocabulary:

`blog_article_view → blog_cta_impression → blog_cta_click → blog_demo_start → blog_demo_submit`

`blog_program_click` remains an exploration event rather than a submitted lead.

Do not report a CTA click as a lead or a page view as conversion intent.

### 3. Lead-level attribution

Use the lead record to preserve two different truths:

- **acquisition context** — e.g. Google Organic, Google Ads, Instagram, referral, direct;
- **content influence** — e.g. the article and conversion family that led the parent toward the assessment.

The Admin Leads workspace should show this context without introducing extra Firestore reads.

## Admin measurement principle

The Leads & Enquiries UI already reads the canonical lead document for workflow purposes. B12 may surface fields that are already present on that document, including:

- `sourceDetail`;
- `acquisitionChannel`;
- `acquisitionSource`;
- `landingPage`;
- `conversionPage`;
- the existing attribution object.

B12 must not add a new background listener or load an analytics collection merely to display this information.

## GSC review cadence

### Weekly quick review

Look for:

- sudden indexing/crawl anomalies;
- major clicks/impressions changes on protected authority pages;
- unexpected new page ownership for an important query;
- one query appearing across multiple competing Tiny Steps URLs;
- pages with growing impressions but clearly weak CTR.

Do not rewrite pages every week because of ordinary ranking noise.

### Monthly decision review

Compare:

- latest 28 days;
- previous 28 days;
- latest 3 months where broader context is useful.

For high-value pages, record:

- clicks;
- impressions;
- CTR;
- average position;
- top query families;
- whether the correct authority owner is ranking;
- B11 CTA progression;
- submitted blog-attributed leads where sample size is meaningful.

### Quarterly architecture review

Re-run the ownership and indexability questions:

- Does each important parent problem still have one clear owner?
- Has Google begun treating a satellite as the owner instead?
- Are any retired/redirected URLs reappearing?
- Are new query families large enough to justify a new owner?
- Are low-value pages accumulating without evidence?

## Decision framework

### PROTECT

Protect a page when it is the established intent owner and is earning meaningful visibility or conversions.

Typical actions:

- avoid title/slug/canonical changes without strong evidence;
- strengthen relevant internal links;
- update only when accuracy or usefulness genuinely improves;
- preserve B6/B9/B10 ownership contracts.

### IMPROVE

Improve an existing page when the query intent belongs to it but the page is underperforming.

Examples:

- impressions are growing but CTR is weak relative to comparable Tiny Steps pages;
- the page ranks for the correct problem but the answer is incomplete;
- strong traffic produces little CTA progression and the conversion context is weak;
- external facts or teaching guidance are stale.

Preferred response:

> strengthen the existing owner before creating another URL.

### CONSOLIDATE

Investigate consolidation when two or more Tiny Steps URLs repeatedly appear for the same search intent and neither has a defensible separate job.

Do not consolidate merely because two articles share vocabulary.

Protected distinctions from B2/B6/B9 remain separate unless new evidence proves the intent model itself is wrong.

### LEAVE ALONE

Leave a page alone when:

- performance is stable;
- it serves a clear supporting role;
- the query volume is too small to justify intervention;
- a short-term ranking fluctuation has no sustained pattern;
- no factual/UX issue exists.

No change is a valid SEO decision.

### NEW PAGE GATE

A new indexable search page requires all of the following:

1. a meaningful query/problem cluster exists;
2. no current indexable page adequately owns it;
3. expanding the nearest current owner would distort that owner's job;
4. the page can provide genuinely unique parent/school value;
5. it does not compete with a commercial route that already owns the intent;
6. internal links and authority relationships are defined before publication;
7. the page has a measurement plan after launch.

This gate applies especially to:

- city/location pages;
- competitor comparison pages;
- age variants;
- repeated "best classes" pages;
- AI-generated query permutations.

## Cannibalization watch

Flag a review when the same important query family repeatedly surfaces multiple Tiny Steps URLs across a sustained window.

Before changing anything, classify the pages as:

- true competing owners;
- legitimate distinct intents;
- broad hub + diagnostic;
- evergreen owner + noindex/support satellite;
- commercial page + informational article.

Never resolve cannibalization by simply deleting the lower-ranking page without this classification.

## CTR review rule

Do not chase a universal CTR benchmark.

Instead compare a page against:

- its own prior period;
- pages with similar average positions;
- the nature of the query (brand, informational, local, commercial);
- whether Google is showing AI Overviews or other SERP features that naturally affect CTR.

A title/meta test should be made only when the page already owns the correct query intent.

## Conversion review rule

For blog authority pages evaluate the funnel in order:

1. article view;
2. conversion card impression;
3. CTA click;
4. demo start;
5. demo submit.

Example interpretations:

- high views, low card impressions → article depth/layout problem;
- card impressions, low CTA clicks → CTA relevance/value problem;
- CTA clicks, low demo starts → landing/form transition problem;
- demo starts, low submits → form friction or mismatch;
- submits but weak enrolment → lead quality/sales follow-up question, not necessarily SEO.

Do not rewrite an article when the actual leak is further down the funnel.

## Crawl and rendering governance

Tiny Steps currently prerenders public routes and validates rendered output during CI.

The reported third-party crawler error is therefore treated as a verification item, not evidence for an SSR migration.

Representative Google Search Console URL Inspection checks should cover:

- `/`;
- `/pricing`;
- `/curriculum`;
- `/phonics`;
- `/blog`;
- one major indexable blog authority page.

If Google's live test shows rendered content and expected canonical/indexability, no framework migration is justified.

If a real rendering defect appears, diagnose that route/build failure first.

## Content update governance

A material update should have a reason recorded in one of these categories:

- factual correction;
- changed Tiny Steps programme information;
- new verified first-party teaching guidance;
- sustained GSC opportunity;
- sustained ranking decline with a diagnosed content gap;
- ownership/internal-link correction;
- conversion UX correction.

"SEO refresh" alone is not a sufficient reason.

B7 modified-date rules remain in force. Do not manufacture recency by updating dates after cosmetic edits.

## Evidence required for B13–B15

### B13 — Curriculum + programme authority

Proceed from the already identified architecture/trust findings, not from a need to publish more URLs.

### B14 — Trust/entity + schools

Use verified founder/team qualifications, school evidence and third-party trust only.

### B15 — controlled expansion

Location, comparison and distribution expansion must pass the B12 new-page gate and be supported by real demand or strategic evidence.

## B12 success condition

B12 is complete when Tiny Steps can answer, without guessing:

- Which page owns this query?
- Is that owner gaining or declining?
- Did this article influence a real lead?
- Where did the parent originally come from?
- Is the conversion leak in content, CTA, form, or follow-up?
- Should we protect, improve, consolidate, or leave the page alone?
- Is there enough evidence to create a new URL?
