# Tiny Steps School Partnership Portal — Bricks 2–11 Integration Audit

Status: **Draft integration audit — do not merge until all CI/Codex gates pass**

## Audit objective

This audit reviews Bricks 2–11 as one connected product rather than as isolated screens. The primary risk is not whether a form renders; it is whether school tenancy, academic history, assessment evidence, implementation health, and management reporting remain internally consistent under real school operations.

## Product invariants

1. School children do not require Tiny Steps user accounts in this programme phase.
2. School teachers are lightweight school-domain records and are not required to maintain daily progress dashboards.
3. Admin and the currently assigned Learning Partner may perform authorised operational mutations through server callables.
4. School Admin/Principal access is read-only.
5. Nested school-programme Firestore data is not a browser-readable/writable API; a server-authorised snapshot is the read boundary.
6. Current Learning Partner ownership is `schools/{schoolId}.learningPartnerId`; no large reverse school arrays are introduced.
7. Closed academic years are retained as read-only historical evidence.
8. Reviews and assessment checkpoints are append-only evidence; they are not silently overwritten.
9. Curriculum stage and demonstrated reading level remain separate concepts.
10. TS-0…TS-9 is an internal Tiny Steps instructional scale, not a national norm or standardised population benchmark.
11. A baseline is starting evidence and cannot by itself qualify implementation as “on track”.
12. School-level growth is calculated from matched sections with baseline and later evidence, not from unrelated aggregate snapshots.

## Findings and corrections

### A. First-pass nested Firestore reads were not a safe read model

**Finding:** Initial frontend services attempted direct browser reads of academic years, sections, curriculum, training, reviews, and assessments. That conflicted with the tenant/security model and would have required broad Firestore read rules.

**Correction:** Added `schoolGetProgrammeSnapshot` in `functions/src/schoolRead.ts`. It performs server-side school-reader authorisation and returns the complete programme snapshot. Nested school-programme collections remain client-denied. Principal snapshots are field-minimised on the server.

### B. Principal read-only needed server enforcement, not UI-only hiding

**Finding:** Hiding edit buttons is not an access-control mechanism.

**Correction:** School Admin is an explicit reader kind but never a manager kind. Mutating callables continue to require Admin or the currently assigned Learning Partner. Principal snapshot output removes internal operational notes and actor UIDs where not necessary for management reporting.

### C. Callable region/export coverage was incomplete

**Finding:** New callables could fail at runtime if not exported or if the client guessed the wrong Firebase Functions region.

**Correction:** All school programme callables are exported from `functions/src/index.ts` and pinned to `asia-south1` in `src/lib/callFunctions.ts`.

### D. Academic structure was initially too rigid

**Finding:** A fixed Nursery/LKG/UKG list does not fit schools using PP1/PP2, Pre-K/K1/K2, or other naming conventions. The first section form also effectively modelled one teacher.

**Correction:** Custom class names are supported; sections support multiple participating teachers; student counts and teacher assignments are editable; teacher records can be edited; and active dependency guards prevent deactivating a teacher/class still required by an active section.

### E. Closed academic years needed immutability

**Finding:** Historical years could otherwise be accidentally rewritten after reporting.

**Correction:** Structure, curriculum, training, reviews, and assessments reject writes to closed years. A historical year can be deliberately made current again when an authorised correction is genuinely required.

### F. Assessment had three competing sources of truth

**Finding:** Manually entering assessed count, average TS level, and TS distribution could create contradictory evidence.

**Correction:** TS-level distribution is now the source of truth. The server derives assessed count, weighted average TS level, and coverage. If legacy clients send count/average values, they must match the derivation.

### G. “Expected reading level” overstated the meaning of the curriculum mapping

**Finding:** “Expected” could be interpreted as an age/population norm.

**Correction:** Renamed the concept to **programme reference reading level**. This is an internal implementation reference only. Legacy parser fallback remains solely for early branch/test records.

### H. Programme health was initially too optimistic

**Finding:** A section could potentially appear healthy with incomplete teacher assignment/training evidence or with baseline-only reading evidence.

**Correction:** Health is conservative:
- no assigned teacher → insufficient data;
- no verified curriculum stage → insufficient data;
- baseline only → insufficient data;
- stale post-baseline checkpoint relative to current curriculum → insufficient data;
- severe reading/reference gap → intervention;
- missing assigned-teacher training evidence → needs support;
- moderate gap or low training progress → needs support;
- only established post-baseline reading evidence + adequate training evidence can produce on track.

### I. Aggregate growth could compare different cohorts

**Finding:** `current aggregate - baseline aggregate` can be misleading when different sections have evidence at each checkpoint.

**Correction:** Growth uses only sections with both baseline and a later checkpoint. Section growth is weighted by the smaller assessed count across the matched pair. Domain growth similarly requires both baseline and later domain evidence for the same section.

**Limit:** This is matched-section growth, not individual-child longitudinal growth, because this product phase intentionally does not store child identities.

### J. Reporting print behaviour needed isolation

**Finding:** Generic `window.print()` could print the surrounding portal chrome.

**Correction:** Added report-specific print CSS that isolates the management report and uses A4 landscape settings. CSV export is generated from the same analytics object used by the visible report.

### K. Operational audit needed automatic server capture

**Finding:** Relying on each callable to remember to write an audit event is easy to regress.

**Correction:** Firestore triggers record academic structure, curriculum, training, review, and assessment activity into a server-written school activity stream. Browser clients cannot forge activity records.

### L. Existing CI did not compile Cloud Functions on pull requests

**Finding:** Frontend-only PR gates allowed server TypeScript errors to survive until deployment time.

**Correction:** PR CI now installs/builds Cloud Functions before frontend gates and executes school-domain Firestore rules tests through the emulator. This immediately found real first-pass trigger/type issues during the audit.

## Assessment framework review

The Tiny Steps Early Reading Benchmark protocol is documented separately in `docs/SCHOOL_EARLY_READING_BENCHMARK_PROTOCOL.md`.

Key integrity requirements:
- equivalent forms across checkpoints;
- controlled unfamiliar words and developmentally appropriate pseudowords when useful;
- no testing of patterns not yet taught;
- absent/non-assessed children are not treated as TS-0;
- coverage is retained alongside results;
- domain scores are entered only when that domain was actually assessed;
- management interprets TS distribution, domains, training, curriculum stage, and classroom review together.

## Security review matrix

| Actor | Root school identity | Programme snapshot | Programme mutation | Other school | Browser nested collections |
|---|---:|---:|---:|---:|---:|
| Admin | Yes | Yes | Yes | Yes | Denied |
| Assigned Learning Partner | Assigned schools | Assigned schools | Assigned schools | Denied | Denied |
| School Admin / Principal | Member schools | Member schools | Denied | Denied | Denied |
| Teacher / Parent / Kid | Existing unrelated app permissions only | Denied | Denied | Denied | Denied |

## Remaining release gates

Before merge:

1. Cloud Functions TypeScript build passes from a clean install.
2. School-domain Firestore emulator rules tests pass.
3. Root lint passes with no new school-portal violations.
4. Root TypeScript check passes.
5. Unit tests for assessment calculation, health logic, and matched analytics pass.
6. Production frontend build and SEO smoke pass.
7. Codex/local emulator validation executes the role matrix and representative school workflow end-to-end.
8. Manual browser review confirms Admin, LP, and Principal views on desktop/mobile.
9. Print/PDF and CSV report outputs are visually/semantically checked with realistic data.
10. PR remains unmerged until these gates are complete and the final diff/security review is clean.

## Explicit non-goals for this release

- individual school-child accounts;
- daily per-child progress entry;
- parent progress portals for school cohorts;
- student-device requirements;
- gamified progression as the school evidence system;
- AI-generated health ratings;
- claims that TSERB is standardised/norm-referenced;
- punitive teacher ranking.
