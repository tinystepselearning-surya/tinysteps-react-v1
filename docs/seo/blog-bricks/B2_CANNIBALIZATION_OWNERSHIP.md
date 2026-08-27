# Blog SEO Program — B2 Cannibalization & Intent Ownership

**Brick:** B2 — Cannibalization + canonical winners  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b02-cannibalization-winners`  
**Redirects performed:** None

## What B2 changes

B2 creates an explicit search-intent ownership registry. It distinguishes four states:

- `merge-review` — likely competing pages; performance evidence required before redirecting;
- `differentiate` — similar topic, but search intent should remain distinct;
- `protect-indexable-owner` — evergreen page owns search while a weekly page remains noindex;
- `protect-existing-consolidation` — a duplicate was already retired in the current repository.

## High-risk unresolved clusters

### 1. Parent: letters/sounds known but cannot read

Current URLs:

- `why-child-knows-letter-sounds-but-cannot-read-words`
- `child-knows-abc-but-cannot-read`

**Provisional owner:** `why-child-knows-letter-sounds-but-cannot-read-words`  
**Decision gate:** compare GSC impressions, clicks, ranking queries, external links and conversions before B3.

The school/research article `why-letter-sounds-are-not-enough-to-read` is explicitly protected as a different audience/intent.

### 2. Reading confidence

Current URLs:

- `how-phonics-builds-reading-confidence`
- `how-tiny-steps-builds-reading-confidence`

**Provisional owner:** `how-phonics-builds-reading-confidence`  
**Decision gate:** performance validation before merge.

### 3. English-speaking hesitation

Current URLs:

- `child-understands-english-but-does-not-speak`
- `spoken-english-classes-for-kids-confidence`

**Provisional owner:** `child-understands-english-but-does-not-speak`.

The second URL is especially important because it is explicitly excluded from the blog sitemap but is not caught by the weekly-page noindex policy. B3 must resolve that inconsistency deliberately.

## Distinct clusters to protect from over-consolidation

The following related pages are intentionally **not** automatic merge candidates:

- blending explainer vs blending activities;
- class-selection checklist vs online/school comparison vs online-class benefits;
- “are apps enough?” decision page vs games/activity pages;
- synthetic-vs-traditional comparison vs sight-words sequencing vs science/evidence explainer;
- grammar-knowledge application gap vs sentence-formation intervention.

B2 prevents a cleanup pass from damaging useful long-tail intent coverage by merging merely because titles share keywords.

## Weekly evergreen ownership

The evergreen pages remain the indexable owners for:

- long vowels;
- R-controlled vowels.

Their Week-series counterparts are already noindex and should function as supporting content, not competing search URLs.

## Already-resolved duplicates

B2 recognises the existing consolidation work instead of recreating it. Existing protected owners include:

- `what-age-to-start-phonics` for age-to-start intent;
- `child-gives-one-word-answers` for one-word-answer intent;
- the other winners already defined by `scripts/blog-consolidation-map.mjs`.

## Validation

Run:

```bash
node scripts/audit-blog-intent-ownership.mjs
```

The audit fails if:

- a cluster references a slug that is neither current nor retired;
- a provisional canonical is outside its cluster;
- a `merge-review` bypasses performance validation;
- one current slug is accidentally assigned to multiple reviewed clusters.

## B2 completion gate

- [x] High-risk remaining cannibalization is explicitly registered.
- [x] Parent and school intent are not conflated.
- [x] Similar-but-distinct intents are protected from over-merging.
- [x] Existing redirect consolidation is recognised.
- [x] Provisional winners are named where useful.
- [x] Destructive merge decisions requiring performance data are blocked from B2.
- [x] No redirects, deletions or canonical migrations are performed in this brick.

## Required evidence before B3 destructive actions

For each `merge-review` cluster, add the best available:

1. GSC clicks/impressions by URL;
2. top query overlap;
3. average position;
4. backlinks or meaningful external references;
5. GA4 engagement;
6. demo/inquiry/enrollment contribution.

If evidence is unavailable, B3 should prefer a reversible non-destructive action (differentiate/noindex decision) over guessing a redirect winner.
