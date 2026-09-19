# Brick 08 — Speaking Knowledge Cluster

Build date: 2026-09-19 IST  
Branch: `feature/speaking-seo-geo-growth`  
Status: **COMPLETE — STRUCTURALLY VERIFIED**  
Production deployment: **NO**

## Purpose

Brick 8 turns the already-existing Tiny Steps Speaking & Communication knowledge corpus into one parent-facing discovery cluster without publishing duplicate articles or creating another commercial owner.

The implementation deliberately reuses the frozen Resources architecture already present on `main`:

- nine Speaking & Communication knowledge domains;
- fifteen Tier-1 cluster records;
- fourteen unique established article destinations;
- the existing SP6 semantic journey engine;
- the existing `/resources/speaking` informational hub;
- the Brick 7 Speaking Progress Framework.

## Core decision

Brick 8 creates **zero new public article URLs**.

The repository already contains the substantive pages needed for:

- response initiation;
- response expansion;
- conversation and vocabulary transfer;
- confidence/context transfer;
- classroom communication;
- storytelling/retelling;
- speech organisation;
- discussion/reasoning;
- delivery;
- visual aids;
- rehearsal/feedback;
- competition preparation;
- familiar-audience practice;
- Story Cards speaking practice.

Creating another content wave would duplicate established intent owners and weaken the existing semantic graph.

## Five parent-facing knowledge groups

Brick 8 curates the existing Tier-1 owners into five discovery groups:

1. **Everyday speaking foundations**
   - response initiation;
   - response expansion;
   - conversation;
   - spoken vocabulary transfer.

2. **Confidence & context**
   - confidence/context transfer;
   - classroom communication;
   - familiar-audience practice.

3. **Storytelling & organisation**
   - storytelling/retelling;
   - Story Cards practice;
   - speech organisation.

4. **Discussion & presentation**
   - discussion/reasoning;
   - public-speaking delivery;
   - visual aids.

5. **Rehearsal & transfer**
   - rehearsal/feedback;
   - competition preparation.

All fifteen Tier-1 owner records are represented exactly once. Conversation and spoken-vocabulary-transfer deliberately share the same canonical article destination, so the cluster resolves to fourteen unique knowledge URLs.

## Brick 7 integration

The new cluster is mapped back to the ten Brick 7 progress dimensions.

Across the five groups, all ten are represented:

- response expansion;
- sentence formation;
- vocabulary in use;
- idea organisation;
- listening & response relevance;
- storytelling & retelling;
- delivery & intelligibility;
- speaking independence;
- presentation & audience awareness;
- fresh-task transfer.

This gives parents two complementary views:

- **knowledge cluster** — what to learn or practise;
- **progress framework** — what observable change to look for.

Brick 8 does not change the ten-dimension framework itself.

## Runtime source

New central source:

`src/lib/speakingKnowledgeCluster.ts`

Revision:

`2026-09-19-b8-v1`

The source:

- imports the established SP6 Tier-1 owners rather than redefining them;
- imports Brick 7 dimensions rather than inventing another assessment taxonomy;
- freezes groups, links, dimension lists and owner-ID lists;
- fails closed if an unknown Tier-1 owner or progress dimension is referenced;
- fails if grouped owner IDs resolve to different established URLs;
- fails if all fifteen Tier-1 records are not represented exactly once;
- fails if all ten Brick 7 dimensions are not represented;
- rejects protected commercial destinations from the knowledge corpus.

## Speaking resources hub

`/resources/speaking` remains the informational subject owner.

The hub now visibly exposes the five knowledge groups under:

**Explore speaking skills by the need you can observe**

Each group includes:

- a parent-facing description;
- related Brick 7 progress-dimension labels;
- links to the established knowledge owners;
- a direct handoff to `/speaking-progress-framework`.

The copy explicitly states that the groups are **not a rigid ladder**.

## Existing semantic journey engine preserved

Brick 8 does not replace or fork the existing blog semantic graph.

`BlogSemanticPathway.tsx` continues to use:

`speakingCommunicationCompletionSemanticJourneyGraph.js`

Therefore established blog-to-blog relationships, relation labels, and the exclusion of commercial `assessment` / `programme` links remain unchanged.

## Ownership boundary

Brick 8 preserves:

- `/resources/speaking` — informational Speaking resource discovery;
- `/speaking` — high-commercial Public Speaking programme owner;
- `/spoken-english-classes-for-kids-online` — Spoken English commercial owner;
- `/speaking-progress-framework` — progress-measurement informational owner.

No new `/speaking-knowledge-cluster` route exists.

No new canonical commercial claimant is introduced.

## Sitemap freshness

Brick 8 changes the existing `/resources/speaking` hub materially, so the sitemap generator now includes:

`src/lib/speakingKnowledgeCluster.ts`

in that route's last-modified source set.

No new sitemap URL is created.

## Regression guard

New dedicated test:

`src/tests/seo/speakingGrowthBrick8.spec.ts`

It protects:

- exactly five parent-facing groups;
- frozen SP6 architecture dependency;
- all fifteen Tier-1 owner records represented exactly once;
- fourteen unique established knowledge destinations;
- all ten Brick 7 progress dimensions represented;
- deep immutability;
- published-blog destination existence;
- commercial and hub ownership boundaries;
- visible hub integration;
- existing SP6 semantic adapter preservation;
- absence of a new Brick 8 public route;
- sitemap freshness tracking.

## Main synchronization during build

Brick 8 began after synchronizing AV7 from `main`.

While Brick 8 was being built, `main` advanced again with AV8 attendance-validation calibration and future-scheduling backend work.

One-way sync:

- PR: **#397**
- Direction: **main → feature/speaking-seo-geo-growth**
- Merge commit: `7a8eeaf83f919acb71b4fffdbd033fbffac34a97`
- Synchronized main SHA: `d0b46a251f33c0b15015d3b516993a0a0f44cb65`
- Branch behind main after sync: **0**

Incoming files were limited to attendance-validation, future-scheduling, Functions index and deployment-impact tooling. There was no Speaking / Brick 8 overlap.

## Structural verification

Source-level checks confirm:

- five knowledge groups are defined;
- fifteen Tier-1 records are represented exactly once;
- fourteen unique established content paths are used;
- all ten Brick 7 dimensions are represented;
- the Speaking hub renders the cluster;
- the existing SP6 blog semantic adapter remains in place;
- no new public route/canonical URL is introduced;
- sitemap freshness tracks the Brick 8 source;
- branch is **0 commits behind main** after PR #397;
- production merge/deployment remains **ZERO**.

## Executable-test limitation

No feature-branch CI run is claimed here.

This initial Brick 8 close does **not** claim:

- full Vitest pass;
- TypeScript build pass;
- production build/prerender pass;
- browser/rendered QA pass.

Those executable gates remain mandatory before the final Bricks 1–13 integration/production merge.

## Exit decision

Brick 8 is structurally complete when the existing Speaking knowledge corpus is:

- easy for parents to discover;
- connected to observable Brick 7 progress dimensions;
- comprehensive across the frozen Tier-1 architecture;
- protected from duplicate-page expansion;
- separate from commercial programme ownership;
- compatible with the existing semantic journey system.

That condition is satisfied on the isolated feature branch.

**Brick 8 status: COMPLETE — STRUCTURALLY VERIFIED.**
