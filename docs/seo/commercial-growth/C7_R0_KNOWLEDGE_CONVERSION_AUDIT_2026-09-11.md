# C7-R0 — Knowledge to Commercial Conversion Audit

**Date:** 11 September 2026
**Status:** `knowledge-conversion-audit-complete`
**Mode:** audit only

## Purpose

C7 connects the frozen Tiny Steps knowledge base to the frozen commercial architecture. R0 records the current links before any contextual handoff changes are authorised.

## Frozen baselines

- KB-FINAL remains frozen across Phonics & Reading, Grammar & Writing, and Speaking & Communication.
- C2 commercial ownership remains frozen.
- C4 metadata controls remain in observation.
- C5 keeps `/book-demo` as the single conversion owner.
- C6 remains frozen.
- R0 creates no new knowledge or commercial URL.

## Audited sources

1. `src/lib/canonicalTopicOwnershipRegistry.js` — current informational, problem-aware, progress-aware and practice owners.
2. `src/content/blog/shared/authorityLinking.ts` — 51 existing blog authority plans and their primary/secondary destinations.
3. `src/lib/phonicsPublicationRegistry.js` — 31 published focused phonics knowledge pages.
4. `src/pages/PhonicsKnowledgePage.tsx` — concept supporting paths rendered by the shared phonics knowledge page.
5. `src/pages/SubjectResourcesPage.tsx` — the three frozen subject hubs and their programme/assessment handoffs.
6. C2 — 14 unique frozen commercial owner paths.

## Coverage labels

- `DIRECT_CONVERSION` — currently links to `/book-demo`.
- `COMMERCIAL_HANDOFF` — links to a frozen commercial owner but not directly to `/book-demo`.
- `INDIRECT_ONLY` — currently links only to informational, support, practice, curriculum, discovery or proof surfaces.
- `NO_KNOWN_HANDOFF` — no handoff is exposed by the audited registries.

These labels describe the current graph. They do not automatically authorise a live change.

## Findings

### Subject hubs are already strong bridge surfaces

The three protected hubs already expose the relevant programme and the assessment route:

- `/resources/phonics` → `/phonics` and `/book-demo`
- `/resources/grammar` → `/grammar` and `/book-demo`
- `/resources/speaking` → `/speaking` and `/book-demo`

C7 should protect this layer rather than rewrite it.

### Broad-English buyer guide needs an R1 decision

`/blog/online-english-classes-for-kids-india` is a buyer-guide authority plan, but its current destinations are `/courses` and `/class-samples`.

It does not currently hand off to `/online-english-classes-for-kids` or `/book-demo`.

R0 records the gap only. R1 must assign the correct frozen commercial owner before any live change.

### Early-intent practice and parent-help content should remain selective

Some pages correctly route to `/parents`, resource hubs or free practice. A missing direct commercial link is not automatically a defect when the parent is still at an early informational or practice stage.

### Focused phonics pages require concept-aware routing

The 31 published phonics knowledge pages inherit different concept supporting paths. C7 should not impose one generic conversion rule on all of them.

## R0 does not change

- live knowledge copy
- blog bodies
- subject hubs
- phonics knowledge pages
- C2 ownership
- C4 metadata
- C5 conversion ownership
- C6 architecture

## Files

- `src/lib/commercialC7KnowledgeConversionAudit.ts`
- `src/tests/seo/commercialC7KnowledgeConversionAudit.spec.ts`
- `scripts/audit-commercial-c7-r0-knowledge-conversion.mjs`
- `docs/seo/commercial-growth/C7_R0_KNOWLEDGE_CONVERSION_AUDIT_2026-09-11.md`
- `.github/workflows/commercial-c7-knowledge-conversion.yml`

## Next

**C7-R1 — Knowledge to Commercial Owner Mapping** will turn the R0 inventory into an explicit next-owner contract while preserving soft paths for early-intent content.