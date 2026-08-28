# Blog SEO Program — B2 Cannibalization & Intent Ownership

**Brick:** B2 — Cannibalization + canonical winners  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b02-cannibalization-winners`  
**Redirects performed by B2:** None

## What B2 changes

B2 creates an explicit search-intent ownership registry. It distinguishes these states:

- `merge-review` — likely competing pages; URL/query performance evidence is required before any destructive action;
- `differentiate` — similar topic, but search intent should remain distinct;
- `protect-indexable-owner` — an evergreen page owns search while a weekly page remains noindex;
- `protect-existing-consolidation` — a duplicate was already retired in the current repository and the redirect lineage is now recorded explicitly;
- `protect-distinct-audience` — a related school/research article must not be folded into parent-help content;
- `protect-gsc-visible-owner` — a URL with real user-shared Search Console visibility is explicitly protected from accidental consolidation.

## Search Console evidence used in the second-pass review

The user shared real three-month Google Search Console screenshots during the B0–B2 review. Those screenshots showed visibility across phonics, reading, English, grammar, speaking/communication and institutional research content. They specifically surfaced:

- competing parent “cannot read” URLs;
- age-to-start phonics URL history;
- one-word-answer URL history;
- institutional URLs covering CBSE/NCF, school phonics scope-and-sequence, international benchmarks and teacher training.

The screenshots demonstrated real impressions/clicks, but the exact numeric page/query breakdown is not preserved in the project text available to this branch. B2 therefore uses that evidence only as a **protection signal**. It does **not** invent metrics and does **not** select a new redirect winner from incomplete retained data.

## URL-by-URL ownership decisions after GSC review

| Intent | Current/retired URL ownership | GSC evidence status | B2 decision |
|---|---|---|---|
| Parent cannot read despite letters/sounds | `why-child-knows-letter-sounds-but-cannot-read-words` + `child-knows-abc-but-cannot-read` | Real competing visibility observed; exact page/query metrics not retained | **Merge-review only. No provisional winner.** |
| School letter-sounds transfer | `why-letter-sounds-are-not-enough-to-read` | Different school/research audience | Protect distinct audience |
| CBSE/NCF phonics | `does-cbse-include-phonics-ncf-foundational-literacy` | Real GSC visibility observed | Protect current institutional owner |
| School scope and sequence | `phonics-scope-and-sequence-for-cbse-schools` | Real GSC visibility observed | Protect current institutional owner |
| International school benchmarks | `international-phonics-benchmarks-for-indian-schools` | Real GSC visibility observed | Protect current institutional owner |
| School teacher training | `phonics-teacher-training-for-schools-implementation` | Real GSC visibility observed | Protect current institutional owner |
| Age to start phonics | owner `what-age-to-start-phonics`; retired `best-age-to-start-phonics-classes-for-kids` | GSC surfaced age-to-start URL history | Protect existing redirect lineage |
| Reading confidence | `how-phonics-builds-reading-confidence` + `how-tiny-steps-builds-reading-confidence` | No retained URL/query metrics sufficient to select winner | **Merge-review only. No provisional winner.** |
| One-word answers | owner `child-gives-one-word-answers`; retired `why-child-answers-only-in-one-word` | GSC surfaced legacy/current URL history | Protect existing redirect lineage |
| English-speaking hesitation | `child-understands-english-but-does-not-speak` + `spoken-english-classes-for-kids-confidence` | No retained URL/query metrics sufficient to select winner | **Merge-review only. No provisional winner.** |

## High-risk unresolved clusters

### 1. Parent: letters/sounds known but cannot read

Current URLs:

- `why-child-knows-letter-sounds-but-cannot-read-words`
- `child-knows-abc-but-cannot-read`

The first-pass B2 registry named `why-child-knows-letter-sounds-but-cannot-read-words` as a provisional owner. The second-pass review removes that bias. Real GSC evidence confirms the cluster matters, but the retained evidence does not contain enough page/query metrics to justify a winner. Both URLs therefore remain reversible until B3 has the required evidence.

The school/research article `why-letter-sounds-are-not-enough-to-read` remains explicitly protected as a different audience and intent.

### 2. Reading confidence

Current URLs:

- `how-phonics-builds-reading-confidence`
- `how-tiny-steps-builds-reading-confidence`

The first-pass semantic preference for the generic phonics URL is no longer treated as a canonical recommendation. B2 now records the overlap but names **no winner** until performance evidence exists.

### 3. English-speaking hesitation

Current URLs:

- `child-understands-english-but-does-not-speak`
- `spoken-english-classes-for-kids-confidence`

B2 names **no winner**. The second URL is explicitly excluded from the blog sitemap but is not caught by the weekly-page noindex policy. That policy mismatch remains a deliberate B3 decision gate, not something B2 guesses around.

## Institutional URLs protected by GSC evidence

The following current URLs are now explicit `protect-gsc-visible-owner` entries:

- `does-cbse-include-phonics-ncf-foundational-literacy`
- `phonics-scope-and-sequence-for-cbse-schools`
- `international-phonics-benchmarks-for-indian-schools`
- `phonics-teacher-training-for-schools-implementation`

This prevents a later cannibalization cleanup from collapsing real school/research visibility into parent-facing phonics pages merely because terms such as “phonics,” “reading,” or “training” overlap.

## Distinct clusters to protect from over-consolidation

The following related pages remain intentionally **not** automatic merge candidates:

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

## Existing redirect consolidations now audited as lineages

B2 no longer records only the destination. It also records the retired source slug and validates the live repository map:

- `best-age-to-start-phonics-classes-for-kids` → `what-age-to-start-phonics`;
- `why-child-answers-only-in-one-word` → `child-gives-one-word-answers`.

The audit fails if a recorded retired source is missing from `scripts/blog-consolidation-map.mjs` or points to a different owner.

## Validation

Run:

```bash
node scripts/audit-blog-intent-ownership.mjs
```

The audit now fails if:

- a current cluster references a slug missing from the real blog registry;
- a provisional owner is outside its current cluster;
- an unresolved `merge-review` names a provisional canonical before evidence selects a winner;
- a `merge-review` bypasses performance validation;
- a protected consolidation omits its retired source URL;
- a retired source does not map to the recorded owner;
- a GSC-visible institutional URL is missing, assigned to the wrong audience, or not protected;
- GSC evidence is claimed without an explicit source/finding/metric-retention state;
- one current or retired slug is accidentally assigned to multiple reviewed lineages.

The same audit is also executed by `src/tests/seo/blogIntentOwnership.spec.ts`, so the normal unit-test CI gate covers B2 rather than relying on a manual script only.

## B2 completion gate

- [x] High-risk remaining cannibalization is explicitly registered.
- [x] Parent and school intent are not conflated.
- [x] Similar-but-distinct intents are protected from over-merging.
- [x] Existing redirect consolidation is recognised with source → owner lineage.
- [x] User-shared GSC-visible institutional URLs are protected.
- [x] First-pass semantic winner guesses were removed from unresolved high-risk clusters.
- [x] Numeric GSC metrics are not invented when they are not retained.
- [x] Destructive merge decisions requiring performance data remain blocked from B2.
- [x] The B2 audit is wired into the normal unit-test suite.
- [x] No redirects, deletions, canonical migrations, sitemap changes or article rewrites are performed in this brick.

## Required evidence before B3 destructive actions

For each `merge-review` cluster, capture the best available:

1. GSC clicks/impressions by URL;
2. top query overlap and query-to-URL ownership;
3. average position;
4. backlinks or meaningful external references;
5. GA4 engagement;
6. demo/inquiry/enrollment contribution.

If evidence is unavailable, B3 must prefer a reversible non-destructive action (differentiate/noindex decision) over guessing a redirect winner.
