# Speaking Commercial Authority v2 — Brick 5

Date: 2026-10-03  
Branch: `feature/speaking-commercial-authority-v2`  
Status: COMPLETE ON BRANCH — pending integration CI

## Purpose

Brick 5 converts the strengthened Speaking page from a good information page into a clearer parent decision surface without inventing proof.

The intended decision sequence is:

**curriculum → real class evidence → progress method → parent evidence → pricing → free assessment**

The detailed evidence sections remain available, but parents can now inspect the five key decision surfaces from one compact pre-enrolment rail.

## Pre-enrolment decision rail

### 1. Inspect the curriculum
Canonical surface:
- `/curriculum?tab=speaking`

Purpose:
- see the Speaking roadmap;
- see the existing Foundations and Excellence structure;
- understand that placement is assessment-led.

### 2. Watch a real class
Canonical surface:
- `/class-samples`

Purpose:
- inspect live teaching style;
- see child participation;
- inspect prompting, correction, feedback and retry.

Evidence boundary:
- a class sample demonstrates teaching approach;
- it does not promise that every class or every child will look the same.

### 3. See how progress is measured
Canonical surface:
- `/speaking-progress-framework`

Purpose:
- inspect observable Speaking dimensions;
- understand support-to-independence bands;
- understand fresh-task transfer.

Evidence boundary:
- the framework is not an IQ score, developmental-age score, clinical diagnosis or universal percentage.

### 4. Read parent evidence
Canonical surface:
- `/testimonials`

Purpose:
- provide bounded first-party family experience.

Evidence boundary:
- parent feedback is not represented as a universal outcome;
- no aggregate satisfaction percentage is invented;
- no review/rating schema is added.

### 5. Check the price
Canonical surface:
- `/pricing`

Current verified public facts are read from the central Tiny Steps fact system:
- standard live 1:1 price: ₹400/class;
- standard live 1:1 duration: 35 minutes;
- one free 35-minute 1:1 assessment before enrolment.

The Speaking page surfaces the standard price for decision clarity, while `/pricing` remains the canonical pricing owner.

## Pricing + assessment conversion block

The earlier assessment-only block is upgraded to a transparent starting point:

- ₹400/class for standard live 1:1 Speaking classes;
- 35-minute standard session;
- free 35-minute assessment;
- explicit explanation of what the assessment may observe;
- direct links to:
  - full pricing;
  - class samples;
  - progress framework;
  - parent feedback.

The page states that the assessment:
- determines educational programme/level fit;
- is not a clinical diagnosis;
- does not guarantee a fixed improvement timeline.

## Evidence order

Brick 5 deliberately orders the detailed lower-page decision flow as:

1. live teacher-delivery explanation;
2. Speaking Progress Framework;
3. canonical evidence surfaces;
4. parent feedback;
5. provider-comparison criteria;
6. transparent price + free assessment;
7. FAQs;
8. final assessment CTA.

This keeps conversion after evidence rather than asking parents to buy before they can inspect the programme.

## Final CTA

The final CTA now states:
- start with the free assessment;
- if Speaking is the correct fit, standard classes are 35 minutes at ₹400/class;
- if another Tiny Steps pathway fits better, assessment should identify that before enrolment.

This reinforces assessment-first placement rather than forcing every lead into Speaking.

## Claim-safety boundaries retained

Brick 5 does not add:
- fabricated reviews;
- aggregate ratings;
- satisfaction percentages;
- guaranteed progress timelines;
- guaranteed confidence outcomes;
- a new checkout or purchase owner;
- a new Speaking commercial URL.

## Structured data

Brick 5 adds an `ItemList` describing the five parent decision-evidence surfaces.

It does **not** add aggregate rating or review schema.

## Files

- `src/pages/speaking.tsx`
- `src/tests/seo/speakingCommercialAuthorityBrick5.spec.ts`
- `src/tests/seo/speakingGrowthBrick4.spec.ts` (legacy guard reconciled with the intentionally upgraded conversion copy)
- this document
