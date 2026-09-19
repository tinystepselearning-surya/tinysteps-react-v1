# Brick 08 — Speaking Knowledge Cluster

Build date: 2026-09-19 IST  
Branch: `feature/speaking-seo-geo-growth`  
Status: **COMPLETE — RE-AUDITED**  
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

`2026-09-19-b8-v2`

The source:

- imports the established SP6 Tier-1 owners rather than redefining them;
- imports Brick 7 dimensions rather than inventing another assessment taxonomy;
- verifies the established nine-domain Speaking & Communication architecture remains fully represented;
- freezes groups, links, dimension lists and owner-ID lists;
- fails closed if an unknown Tier-1 owner or progress dimension is referenced;
- fails if grouped owner IDs resolve to different established URLs;
- fails if all fifteen Tier-1 records are not represented exactly once;
- fails if all ten Brick 7 dimensions are not represented;
- fails if all nine established Speaking & Communication knowledge domains are not represented;
- fails unless the 15 Tier-1 records still resolve to exactly 14 established knowledge URLs;
- fails if a Brick 8 knowledge destination stops being an established `/blog/` resource;
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
- sitemap freshness tracking;
- all nine established knowledge domains;
- canonical-owner uniqueness for all fourteen destinations;
- indexability and blog-sitemap discovery for all fourteen destinations;
- structured ItemList destination deduplication.

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

## Re-audit findings

Brick 8 was independently re-audited before Brick 9.

The re-audit found and fixed one concrete structured-data defect and hardened four architectural boundaries.

### 1. Structured ItemList duplication — fixed

The Speaking hub intentionally repeats some useful destinations in different visible contexts. Before the re-audit, those repeated links were passed directly into the structured `ItemList`.

Mechanical count before the fix:

- existing Speaking hub link entries: **9**;
- Brick 8 knowledge destinations: **14**;
- raw structured candidates: **23**;
- unique destinations: **18**;
- duplicate structured entries: **5**.

Visible navigation remains unchanged, because repeated links can be useful in different parent pathways.

Only the schema list is deduplicated by destination. It now uses `structuredLinks`, so `numberOfItems` and `itemListElement` describe unique resource URLs rather than repeated cards.

### 2. Nine-domain architecture coverage — hardened

The initial Brick 8 build implicitly inherited all nine Speaking & Communication domains because it consumed all fifteen SP6 Tier-1 records.

Revision `2026-09-19-b8-v2` now makes that contract explicit at runtime.

The module derives `SPEAKING_KNOWLEDGE_CLUSTER_DOMAIN_IDS` and fails if any established knowledge domain is missing.

### 3. Destination boundary — hardened

Brick 8 now fails closed unless:

- all fifteen Tier-1 records still resolve to exactly fourteen unique knowledge URLs;
- every Brick 8 knowledge URL remains an established `/blog/` resource;
- protected commercial owners remain outside the knowledge cluster.

This prevents a future architecture change from silently moving a commercial/programme route into the informational knowledge corpus.

### 4. Canonical/indexability verification — deepened

All fourteen knowledge destinations were rechecked.

For every destination:

- the article is represented by the established content architecture;
- canonical ownership resolves through the frozen SP6/R20→R22 chain;
- the article is indexable under `blogIndexingPolicy`;
- the clean public URL is present in `sitemap-blog.xml`.

Three R21 guides use dynamic canonical resolution rather than literal `ownerPath` declarations:

- `/blog/conversation-skills-for-kids`;
- `/blog/how-to-teach-storytelling-to-kids`;
- `/blog/public-speaking-delivery-for-kids`.

Their ownership chain was explicitly traced as:

**R20 proposedPath → R21 published execution → R21 canonical owner**

No canonical collision was found.

### 5. Sitemap source naming — cleaned

The sitemap generator map was still named `brick7LastmodSources` even though Brick 8 now contributes to `/resources/speaking` freshness.

It is now named `speakingGrowthLastmodSources`.

Behavior is unchanged; the name now matches the cross-brick responsibility.

## Independent re-audit matrix

Source-level re-audit:

- Architecture contracts: **11 / 11**
- Hub & structured-data contracts: **11 / 11**
- Fourteen destination checks — canonical/indexability/sitemap: **42 / 42**
- Brick 8 regression-spec hardening: **6 / 6**

**Source-level total: 70 / 70 passed.**

Protected-surface SHA comparison against the pre-Brick-8 checkpoint:

- Brick 7 framework source/page;
- `/speaking`;
- `/book-demo`;
- parent tracking guide;
- canonical topic registry;
- application routes;
- SP6 BlogSemanticPathway;
- SP6 completion semantic graph;
- SP6 completion architecture;
- operational progress skills;
- parent dashboard;
- teacher progress editor;
- teacher progress save backend;
- Brick 7 regression test.

**Protection total: 15 / 15 unchanged.**

The re-audit implementation delta contains exactly four intended runtime/test files:

1. `src/lib/speakingKnowledgeCluster.ts`
2. `src/pages/SubjectResourcesPage.tsx`
3. `scripts/generate-sitemaps.js`
4. `src/tests/seo/speakingGrowthBrick8.spec.ts`

No operational attendance, scheduling, finance, teacher-progress or parent-progress implementation was changed by the Brick 8 re-audit.

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

**Brick 8 status: COMPLETE — RE-AUDITED.**
