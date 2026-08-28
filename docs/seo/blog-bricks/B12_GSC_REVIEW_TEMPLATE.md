# B12 — Google Search Console Review Template

Use this template for monthly and quarterly SEO decisions. The purpose is to preserve evidence and stop ad-hoc publishing or rewrites.

## Review metadata

- Review date:
- Comparison window:
- Reviewer:
- GSC property:
- Notes on unusual seasonality / holidays / campaigns:

## Protected authority pages

Record the latest period and comparison period for the strongest authority pages first.

| URL | Role | Clicks | Impressions | CTR | Avg position | Prior clicks | Prior impressions | Decision |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/blog/satpin-phonics-guide` | SATPIN authority | | | | | | | |
| `/blog/phonics-for-parents-guide` | parent phonics hub | | | | | | | |
| `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | letter-sounds diagnostic | | | | | | | |
| `/blog/child-knows-abc-but-cannot-read` | alphabet/decoding diagnostic | | | | | | | |
| `/blog/how-kids-learn-blending` | blending-stage owner | | | | | | | |
| `/blog/phonics-blending-activities` | blending activity satellite | | | | | | | |
| `/blog/how-to-improve-reading-fluency-in-children` | fluency authority | | | | | | | |
| `/blog/week-7-grammar-nouns-to-paragraphs` | broad grammar authority | | | | | | | |
| `/blog/how-to-improve-sentence-formation-in-kids` | sentence formation owner | | | | | | | |
| `/blog/child-knows-grammar-but-makes-mistakes` | grammar transfer diagnostic | | | | | | | |
| `/blog/week-12-speaking-confidence-seeds` | broad speaking authority | | | | | | | |
| `/blog/child-understands-english-but-does-not-speak` | speaking hesitation diagnostic | | | | | | | |
| `/blog/child-gives-one-word-answers` | one-word-answer diagnostic | | | | | | | |

Decision values should be one of:

- `PROTECT`
- `IMPROVE`
- `INVESTIGATE CANNIBALIZATION`
- `LEAVE ALONE`

Do not enter `NEW PAGE` until the new-page gate below is completed.

## Query ownership review

For each significant query family, confirm whether Google is surfacing the intended Tiny Steps owner.

| Query family | Intended owner | Actual ranking URL(s) | Correct owner? | Action |
| --- | --- | --- | --- | --- |
| SATPIN / SATPIN phonics | `satpin-phonics-guide` | | | |
| knows sounds but cannot read words | `why-child-knows-letter-sounds-but-cannot-read-words` | | | |
| knows ABC but cannot read | `child-knows-abc-but-cannot-read` | | | |
| how children learn blending | `how-kids-learn-blending` | | | |
| blending activities | `phonics-blending-activities` | | | |
| sentence formation | `how-to-improve-sentence-formation-in-kids` | | | |
| knows grammar but makes mistakes | `child-knows-grammar-but-makes-mistakes` | | | |
| understands English but does not speak | `child-understands-english-but-does-not-speak` | | | |
| gives one-word answers | `child-gives-one-word-answers` | | | |

## Opportunity review

### Growing impressions, weak CTR

List pages where the query ownership is correct but impressions are growing faster than clicks.

| URL | Main query cluster | Impressions trend | CTR trend | Position context | Proposed change |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Allowed first actions:

- title/meta refinement;
- answer clarity improvement;
- internal-link reinforcement;
- snippet formatting where useful.

Do **not** create a competing page merely to improve CTR.

### Sustained decline

| URL | Click trend | Impression trend | Position trend | Likely cause | Evidence | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Before editing, distinguish:

- demand decline;
- ranking decline;
- SERP/AI Overview change;
- cannibalization;
- content staleness;
- technical/indexing problem.

## Cannibalization review

| Query cluster | URL A | URL B | Intended distinction | Is overlap harmful? | Action |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Never classify two pages as cannibalizing solely because they share keywords.

## New-page gate

Complete every field before approving a new indexable search page.

- Query/problem cluster:
- Evidence of demand:
- Existing closest owner:
- Why the existing owner cannot absorb the need:
- Unique parent/school value of the proposed page:
- Commercial route overlap check:
- Intended internal-link parents:
- Intended supporting pages:
- Indexability:
- Author/trust model:
- Conversion family:
- 28-day post-launch measurement plan:

**Decision:** APPROVE / REJECT / DEFER

## Location-page gate

Do not publish a city/country page by swapping place names.

Record:

- GSC query evidence:
- real Tiny Steps learner/lead relevance:
- local scheduling/time-zone value:
- local parent/school evidence available:
- unique page content that cannot live on an existing national/global page:

If these fields are weak, do not create the URL.

## Conversion review

Use B11 analytics and lead attribution only after enough traffic exists for a meaningful interpretation.

Use the stable event funnel rather than substituting visually similar metrics:

`blog_article_view → blog_cta_impression → blog_cta_click → blog_demo_start → blog_demo_submit`

`blog_program_click` is an exploration event and must not be counted as a submitted lead.

| Article / family | Article views | CTA impressions | CTA clicks | Demo starts | Demo submits | Observed leak |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| | | | | | | |

Interpret the funnel in order; do not assume article content is the problem when the leak occurs at the form or follow-up stage.

## Lead-quality review

For blog-attributed submitted leads, review aggregate patterns rather than exposing parent details in SEO documentation.

| Conversion family | Submitted leads | Demo completed | Interested/enrolled | Observation |
| --- | ---: | ---: | ---: | --- |
| phonics diagnostic | | | | |
| phonics practice | | | | |
| reading fluency | | | | |
| grammar diagnostic | | | | |
| sentence building | | | | |
| speaking confidence | | | | |
| general English | | | | |
| schools partnership | | | | |

## Crawl/render verification

Representative GSC URL Inspection status:

| URL | Indexable | Canonical expected | Rendered content present | Notes |
| --- | --- | --- | --- | --- |
| `/` | | | | |
| `/pricing` | | | | |
| `/curriculum` | | | | |
| `/phonics` | | | | |
| `/blog` | | | | |
| one protected blog authority | | | | |

A third-party crawler error alone is not sufficient evidence for an SSR/framework migration.

## Final monthly decisions

### Protect

- 

### Improve

- 

### Investigate

- 

### Leave alone

- 

### New URLs approved

- None unless the new-page gate above is fully satisfied.
