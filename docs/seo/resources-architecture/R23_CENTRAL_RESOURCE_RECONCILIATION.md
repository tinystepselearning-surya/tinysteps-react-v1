# Resources Architecture — R23 Central Resource Reconciliation

**Status:** high-level reconciliation  
**Primary gateway:** `/resources`  
**Rule:** one Resource Center for discovery; preserve established canonical URLs and intent owners.

## Why this reconciliation exists

Tiny Steps now has multiple mature content systems:

- the editorial guide library under `/blog/*`;
- three subject hubs under `/resources/phonics`, `/resources/grammar`, and `/resources/speaking`;
- 31 governed phonics pattern resources under `/resources/phonics/*`;
- parent problem-solving routes under `/parents`;
- free interactive practice routes;
- school and educator resources.

The user-facing architecture should not present these as disconnected libraries. `/resources` is the single educational discovery front door.

## Reconciled model

`/resources` orchestrates these content families:

1. **Phonics & Reading** — subject hub, editorial phonics/reading guides, the governed 31-page focused phonics set, diagnostics and practice.
2. **Grammar & Writing** — subject hub, grammar/writing guides, diagnostics and practice.
3. **Speaking & Communication** — subject hub, speaking/communication guides, diagnostics and practice.
4. **Parent Help** — the existing `/parents` support system.
5. **Free Learning Activities** — the existing free-games/practice ecosystem.
6. **Schools & Educators** — school implementation, research, teacher development and partnership material.

The Resources landing page also exposes the underlying content families directly so users can understand that editorial guides, focused phonics resources, parent help, activities and school resources belong to the same Resource Center.

## URL and ownership safety

This reconciliation does **not** move content merely to make URLs look uniform.

Preserved owners include:

- `/blog` — complete editorial guide library/archive;
- every existing `/blog/*` article;
- `/resources/phonics/*` — the governed focused phonics resources;
- `/parents` — parent problem-solving hub;
- `/free-english-games-for-kids` — practice ecosystem;
- `/for-schools` — school/B2B owner;
- commercial programme and conversion pages.

There are no new `/resources/blog`, `/resources/parents`, `/resources/games`, or `/resources/schools` duplicates.

## Canonical principle

Discovery hierarchy and canonical ownership are separate concerns.

A page can remain at `/blog/...` while still belonging to the Resource Center. The Resource Center is the navigation and taxonomy layer; the existing URL remains the canonical content owner.

## Programmatic phonics placement

The current 31 governed programmatic phonics pages are classified as part of **Phonics & Reading** inside the central Resource Center.

This does not authorize Wave 3. The existing R11 evidence gate and explicit future publication approval remain unchanged.

## Machine-readable source of truth

The reconciliation registry is:

- `src/lib/centralResourceSystem.js`

It records:

- the central gateway;
- the three subject hubs;
- the principal content families;
- the preserved-owner policy;
- the current 31-page governed phonics count.

The regression contract is:

- `src/tests/seo/resourcesR23CentralResourceReconciliation.spec.ts`

## Acceptance criteria

R23 is complete when:

- `/resources` remains the primary educational discovery gateway;
- all six existing pathways remain visible;
- the content-family layer is visible from `/resources`;
- the 31 focused phonics pages reconcile under the Phonics & Reading pathway;
- `/blog` remains the editorial library owner but has `/resources` as its discovery parent;
- parent, practice and school hubs remain their established owners;
- no duplicate Resources wrappers are created;
- no existing canonical URL, redirect, indexability or commercial ownership is changed.
