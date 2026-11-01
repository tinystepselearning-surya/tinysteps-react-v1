# Brick 7/10 — Grammar and sentence formation parent-choice pilot

**Date:** 2026-11-01 IST. **Tracking:** [Issue #845](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/845). **Stage:** Draft review, not production release.

## Existing verified foundation

`/grammar` is already the primary C2 commercial owner for online children's Grammar and Sentence Formation. `/writing-classes-for-kids` owns extended composition; `/group-grammar-classes-for-kids` owns group-format details; `/resources/grammar` is informational and course pages own level-specific placement. The 702-line `src/pages/grammar.tsx` already contains explicit sentence formation, tenses, punctuation, teacher-led correction, parent progress, class evidence, free assessment, standard 1:1 fee, Beginner/Advanced levels and the verified broad phrase **online English grammar classes** (introduced in Brick 2). Metadata and current canonical owners are correct *in source*.

External keyword estimates are not parent lead counts. Semrush and CalmSEO both estimated `online english grammar classes` ~720 India monthly searches; some of this volume is informational and includes older learners. Separate KWE `english grammar classes online` ~720 is an overlapping variant, not safely additive. Semrush `online grammar classes` ~260 includes child-unspecified demand.

## Source-verified gaps, intentionally narrow

1. Existing FAQ `Can grammar classes improve sentence formation?` gives a generic benefit rather than explaining how children move from noticing and modelling the pattern, to guided correction, then a new independently generated sentence. The page's teaching method already specifies these steps. The updated answer explicitly describes practice and transfer instead of guaranteed outcomes.
2. Existing FAQ `Are Tiny Steps grammar classes live and 1:1?` says yes about *standard* classes but does not help parents compare the separate conditional group offering. Existing `GroupClassPage.tsx` explicitly offers grouped Grammar instruction, up to **four** learners per teacher, matching by readiness and compatible schedules, and non-immediate group demo availability. The updated FAQ distinguishes the two without implying guaranteed places or changing class duration.

## Exact development footprint

- Two existing FAQ question/answer entries in `src/pages/grammar.tsx`; the rest of the programme page stays as-is.
- A regression test guards C2 owner, `/grammar` title and canonical, 1:1 vs group truthfulness, Writing boundary, sentence-formation practice process, group links, booking and pricing CTAs.
- Dedicated PR-triggered CI runs source test, TypeScript and full Playwright-enabled prerender/build SEO checks.

## Deferred verification and exclusions

Google Search Console URL Inspection, live index selection and India query/page analysis **only after Brick 10**, per owner direction. Build success is not proof of Google indexing, AI citation, additional qualified leads, or a completed national demand estimate. Do not modify schema ownership, metadata/canonical, robots/sitemap, price constants, scheduling/booking, Firebase/Firestore, teacher facts or grant accreditation.
