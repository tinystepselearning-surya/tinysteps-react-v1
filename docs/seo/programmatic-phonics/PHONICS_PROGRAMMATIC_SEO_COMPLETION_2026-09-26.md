# Phonics Programmatic SEO Completion Gate

**Revision:** 2026-09-26  
**Scope:** Existing governed phonics resource library only  
**Public prefix:** `/resources/phonics/`

## Completion target

The current programmatic phonics system is complete at **31 governed resource pages**:

- 16 frozen Wave 1 pages from R9;
- 15 explicitly approved Wave 2 pages from R12;
- no automatic Wave 3 publication;
- no mass individual word-page publication.

This document does not authorize additional URLs.

## What “implementation complete” means

The 31-page library must remain consistent across all of the following layers:

1. explicit publication registry;
2. unique path, slug, concept and canonical-topic ownership;
3. public route manifest;
4. self-canonical indexable SEO metadata;
5. prerender and sitemap eligibility;
6. visible discovery from `/resources/phonics`;
7. related-resource graph reachability;
8. RSS and site feed discovery;
9. `llms.txt` and `llms-full.txt` discovery;
10. R11 resource measurement context;
11. per-topic learning outcome and boundary differentiation;
12. minimum educational depth in examples, teaching notes, practice, confusions and curriculum alignment;
13. a passed pre-publication quality state bound to the current quality-gate revision;
14. no post-publication review dependency or reviewer attribution;
15. no leakage into uncontrolled individual word URLs.

The regression contract is:

`src/tests/seo/phonicsProgrammaticCompletion.spec.ts`

The existing R12 workflow runs this completion gate before and after the production build so both committed discovery files and generated build-time discovery remain aligned.

## Pre-publication quality truth

The publication registry is now the approval boundary.

A phonics resource cannot enter the governed published set unless it passes the pre-publication quality gate first. The gate validates the minimum contract for:

- parent/search intent;
- quick-answer depth;
- example words;
- teaching notes;
- practice ideas;
- common confusions;
- curriculum alignment;
- supporting links;
- SEO title and description;
- publication family;
- page-specific learning outcome and boundary differentiation.

Every published page exposes:

- `prepublicationQualityState: 'passed'`;
- the current `prepublicationQualityRevision`;
- the concrete pre-publication check set.

The public resource renderer has no dependency on a later founder-review state and publishes no `reviewedBy` schema or “Reviewed for phonics accuracy by” claim. Legacy review modules may remain in the repository only as dormant compatibility code; they are not wired into publication or the founder portal.

## LLM discovery

The governed 31-page library is now generated into both:

- `/llms.txt`
- `/llms-full.txt`

The section is derived from `PHONICS_PUBLISHED_RESOURCE_PAGES`, so an approved publication cannot silently exist in the sitemap/feed while being absent from the LLM discovery directory.

These focused resource pages remain distinct from:

- the editorial blog library under `/blog/`;
- the commercial phonics programme owner at `/phonics`.

## Evidence and future scale

R11 remains the measurement and expansion gate.

A future wave requires:

1. a finalized R11 `promote` decision for the relevant existing page or cluster;
2. curriculum eligibility;
3. a new explicit publication approval.

`observe`, `repair`, `insufficient-evidence`, `blocked`, or missing evidence cannot authorize scale.

Current Google Search Console indexing/performance is not asserted by this repository completion gate. Search Console evidence must come from an actual connected data source and must not be fabricated.

## R13 word/sound utility boundary

The word/sound utility is supporting infrastructure, not a mass programmatic URL layer.

- stored word maps remain explicit rather than runtime-guessed;
- individual word URLs remain unpublished;
- stored word segmentation remains explicit and governed separately from page publication;
- missing audio continues to use the existing graceful fallback until approved recordings exist.

R13 completion or any future word-page publication is a separate decision and cannot expand the 31-page programmatic library automatically.

## Exit condition

The existing programmatic SEO implementation can be considered technically complete when:

- the 31-page completion gate is green;
- R12 source and rendered audits are green;
- repository CI, crawl/discovery and dead-URL guards are green;
- `main` contains the completion changes.

No separate post-publication human-review queue is required for these 31 programmatic resource pages.
