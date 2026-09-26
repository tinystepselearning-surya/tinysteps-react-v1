# R9.1 — Retired Post-Publication Review Layer

**Status:** Retired on 2026-09-26.

The former R9.1 design published governed phonics resource pages first and then tracked a separate human editorial-review state.

That architecture is no longer active.

## Current rule

Publication now requires the phonics pre-publication quality gate to pass **before** a resource can enter the governed publication registry.

Current source of truth:

- `src/lib/phonicsPrepublicationQuality.js`
- `scripts/audit-phonics-prepublication-quality.mjs`
- `src/tests/seo/resourcesR91PrepublicationQuality.spec.ts`
- `src/tests/seo/phonicsProgrammaticCompletion.spec.ts`
- `docs/seo/resources-architecture/PROGRAMMATIC_SEO_COMPLETION_2026-09-26.md`

There is no required founder review queue for the 31 governed programmatic phonics pages, and those pages must not publish a `reviewedBy` claim merely because they passed the technical/editorial publication gate.

This file is retained only to explain the historical R9.1 reference in older architecture notes.
