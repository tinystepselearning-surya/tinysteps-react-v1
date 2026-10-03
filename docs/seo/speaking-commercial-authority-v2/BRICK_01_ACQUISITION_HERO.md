# Speaking Commercial Authority v2 — Brick 1

Date: 2026-10-03  
Branch: `feature/speaking-commercial-authority-v2`  
Status: COMPLETE ON BRANCH — pending integration CI

## Scope

Brick 1 changes only the acquisition layer of the canonical `/speaking` commercial owner.

It does **not** implement:
- age-stage developmental architecture (Brick 2);
- parent-problem/programme-fit restructuring (Brick 3);
- AI-era communication/questioning framework (Brick 4);
- full evidence/progress/pricing restructuring (Brick 5);
- authority article and cluster reconciliation (Brick 6).

## Implemented

### Search-facing proposition
- SEO title: `Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps`
- Canonical remains `/speaking`
- Description now surfaces verified age, format, price and free-assessment facts.

### Hero
The hero now leads with:
- `Online Public Speaking Classes for Kids`
- live 1:1 positioning;
- ages 4–12 derived from the existing programme facts;
- standard ₹400/class price derived from canonical public facts;
- standard class duration;
- free 35-minute assessment.

### CTA hierarchy
1. `Book Free Assessment`
2. `Watch a Real Class`
3. `View Curriculum`

### Immediate proof strip
The hero exposes:
- ages 4–12;
- ₹400/class;
- standard live 1:1 duration;
- free 35-minute assessment;
- Tiny Steps learner/country reach from canonical public facts;
- parent progress updates.

## SEO-governance reconciliation

The September C4 snippet remains preserved as historical experiment control.

Brick 1 records the October Speaking snippet as an explicit authorized owner override in:
`COMMERCIAL_C4_AUTHORIZED_OWNER_OVERRIDES`

This avoids rewriting the prior experiment history while allowing the new Speaking Commercial Authority initiative to intentionally supersede the old snippet.

## Invariants retained
- no new commercial URL;
- `/speaking` remains the generic Public Speaking + Communication owner;
- no redirect/canonical change;
- Spoken English, Grammar and Confidence boundaries remain intact;
- exactly one H1;
- no Brick 2–6 content is pulled forward.

## Files changed
- `src/pages/speaking.tsx`
- `src/lib/routeSeoRegistry.js`
- `src/lib/commercialC4CtrOptimization.ts`
- `scripts/audit-commercial-c4-ctr-optimization.mjs`
- `src/tests/seo/speakingGrowthBrick4.spec.ts`
- `src/tests/seo/speakingCommercialAuthorityBrick1.spec.ts`
- this document
