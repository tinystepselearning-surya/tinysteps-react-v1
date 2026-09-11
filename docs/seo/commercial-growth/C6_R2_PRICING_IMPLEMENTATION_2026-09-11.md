# C6-R2 — Pricing / Value Decision Support

**Date:** 11 September 2026  
**Status:** implementation started on the C6 branch  
**Approved owner:** `/pricing`

## Why `/pricing` was approved

C6-R1 approved exactly one owner for R2 body-copy implementation.

The evidence basis is:

- C1 contains fee intent for reading, grammar, writing, spoken English and public speaking;
- writing, spoken-English and public-speaking fee queries have observed SERP evidence in C1;
- C2 already assigns all non-phonics fee/value intent to `/pricing`;
- the 11 September 2026 SERP spot check reinforced that parents compare programme fit, format, teacher attention and price/value together;
- `/pricing` already owns 1:1-vs-group value comparison under the C5 decision flow.

No other owner page was approved for R2 change.

## Implementation added

`/pricing` now includes a **Fees by learning need** decision section for:

- Reading
- Grammar
- Writing
- Spoken English
- Public Speaking

Each route keeps the fee decision on `/pricing` and sends the parent to the relevant programme owner only to answer the learning-fit question.

The section also states the phonics exception explicitly and links to `/phonics-fees-india` for parents doing phonics-specific market fee research.

## What did not change

R2 does **not** change:

- `/pricing` title
- `/pricing` meta description
- `/pricing` canonical
- the standard price configuration
- the package configuration
- offer schema pricing
- C2 ownership
- C4 control metadata
- `/book-demo` conversion ownership
- the commercial URL inventory

No grammar-fees, reading-fees, writing-fees, spoken-English-fees or public-speaking-fees URL was created.

## Measurement intent

This change is decision support, not a new conversion system.

Existing C5 instrumentation continues to observe programme/pricing decision clicks while C0 canonical lead lifecycle + first-touch attribution remain the qualified-lead source of truth.

## R2 state

The first evidence-approved R2 implementation is now present on the branch.

Further R2 expansion should occur only if validation shows a distinct missing pricing/value decision. R1 currently authorises no additional owner page for R2 body-copy changes.
