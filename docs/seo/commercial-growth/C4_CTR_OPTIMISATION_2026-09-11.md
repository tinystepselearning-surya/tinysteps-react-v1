# C4 — CTR Optimisation

**Started:** 11 September 2026  
**Branch:** `seo/c4-ctr-optimisation`  
**Status:** baseline armed; no snippet candidate deployed yet

## Purpose

C4 improves organic click-through rate without reopening C1 keyword research, C2 ownership, or C3 commercial-page architecture.

The optimisation sequence is:

> observed impressions/rankings → identify CTR opportunity → preserve canonical owner → prepare a cleaner snippet candidate → measure fresh post-C3 evidence → deploy only when evidence supports the change

## Critical timing constraint

The frozen Google Search Console export covers **9 June–8 September 2026**.

C3 was merged and deployed on **11 September 2026**.

Therefore the historical CTR data largely reflects metadata and page states that existed **before the final C3 implementation**. It is useful for opportunity ranking, but it cannot be used as proof that the new C3 snippets are underperforming.

C4 r1 therefore treats the C3 snippets as the **control**.

No candidate title or description is deployable until fresh post-C3 evidence exists.

## Historical opportunity ranking

The strongest first observation set is:

| Owner | Historical impressions | Clicks | CTR | Avg. position | C4 action |
| --- | ---: | ---: | ---: | ---: | --- |
| `/phonics` | 11,306 | 371 | 3.28% | 4.86 | Priority observe |
| `/best-online-phonics-classes-for-kids-in-india` | 3,835 | 101 | 2.63% | 8.69 | Priority observe |
| `/online-english-classes-hyderabad` | 3,556 | 86 | 2.42% | 7.94 | Priority observe |
| `/speaking` | 2,602 | 62 | 2.38% | 9.10 | Priority observe |
| `/pricing` | 1,551 | 16 | 1.03% | 5.09 | Priority observe |
| `/grammar` | 811 | 12 | 1.48% | 7.08 | Priority observe |

These pages combine meaningful impression volume, useful ranking positions, and enough historical CTR headroom to justify controlled snippet testing.

## First candidate set

Because C3 titles were only just finalised, C4 r1 deliberately avoids title churn. It prepares **description-only** candidates for the six priority pages.

### `/phonics`

Control title remains:

> Online Phonics Classes for Kids | Live 1:1 | Tiny Steps

Prepared description candidate:

> Live 1:1 online phonics classes for kids ages 3–12. Build blending, decoding, spelling and reading fluency. Free 35-minute assessment; India + worldwide.

### `/best-online-phonics-classes-for-kids-in-india`

Control title remains:

> Best Online Phonics Classes for Kids in India | Tiny Steps Learning

Prepared description candidate:

> Compare online phonics classes for kids in India by 1:1 vs group format, curriculum, live correction, reading transfer, progress visibility and fees.

### `/online-english-classes-hyderabad`

Control title remains:

> Online English Classes for Kids in Hyderabad | Tiny Steps

Prepared description candidate:

> Live online English classes for kids ages 3–12 in Hyderabad. Phonics, reading, grammar, writing and speaking. Start with a free 35-minute 1:1 assessment.

### `/speaking`

Control title remains:

> Public Speaking & Communication Classes for Kids | Tiny Steps

Prepared description candidate:

> Live 1:1 public speaking and communication classes for kids. Build structured answers, storytelling, presentations and confidence in 35-minute classes.

### `/pricing`

Control title remains:

> Online English Classes for Kids Fees & Pricing | Tiny Steps

Prepared description candidate:

> Online English class fees for kids: live 1:1 ₹400/class or ₹4,800 for 12 classes; small groups ₹180–₹300 per child/class. Compare formats and value.

### `/grammar`

Control title remains:

> Online Grammar Classes for Kids | Live 1:1 | Tiny Steps

Prepared description candidate:

> Live 1:1 online grammar classes for kids. Build sentence formation, tenses, punctuation and clearer school answers. Assessment-led; India + worldwide.

## Deployment gate

A C4 snippet candidate remains blocked until fresh evidence satisfies the baseline policy:

- at least **14 days** of post-C3 observation
- at least **200 page impressions** for the tested owner
- at least **50 impressions** for the relevant query/query family where available
- position must be reviewed alongside CTR so a ranking movement is not misread as a snippet effect

These are operating thresholds, not ranking guarantees.

## Guardrails

C4 must not:

- create new commercial URLs
- reassign C2 ownership
- turn one owner into a second owner for another programme
- add keyword variants merely to increase repetition
- introduce unsupported urgency, guarantees, discounts, availability or outcomes
- interpret pre-C3 historical CTR as post-C3 performance

## Success definition

C4 succeeds when Tiny Steps earns more qualified clicks from commercial impressions while preserving the frozen owner architecture.

The primary measurement set is:

**impressions · clicks · CTR · average position · qualified organic leads**

CTR improvements are useful only when they continue to send the right parent to the right owner page and support the C0 lead objective.
