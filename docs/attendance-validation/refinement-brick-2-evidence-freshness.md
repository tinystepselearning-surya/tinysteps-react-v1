# AVS Refinement Brick 2 — Cached Evidence Freshness

Status: **implemented on a focused PR; no Graph orchestration is added in this brick.**

## Purpose

AVS must not treat every cached Microsoft Teams evidence document as permanently reusable after the operational class session changes.

Brick 2 adds one deterministic compatibility classifier with three outcomes:

```text
reuse_cached
fresh_required
unsafe_review
```

### Reuse cached evidence

Cached evidence remains reusable when Teams-relevant session identity and occurrence references are unchanged. Attendance corrections, notes, display names, and course-label metadata do not invalidate Teams evidence.

### Fresh evidence required

Fresh Microsoft Teams evidence is required when a deterministically comparable Teams-relevant reference changes:

- expected teacher;
- enrollment;
- learner;
- IST service date;
- scheduled start/end window;
- Teams join URL.

Brick 2 does **not** make the Graph call. It marks the work item as `fresh_evidence_required`, leaves the dirty marker in place, and exposes the affected session ids to the caller. Brick 3 will orchestrate the fresh collection.

### Unsafe / review

AVS fails closed when compatibility cannot be proven, including:

- evidence/session id mismatch;
- unresolved teacher, enrollment, or learner identity;
- unresolved or internally conflicting operational service date;
- invalid/missing schedule window;
- malformed captured Teams link hash;
- a captured Teams link exists but the current operational link can no longer be resolved.

These work items are skipped as `cached_evidence_compatibility_unresolved` and remain dirty.

## Cost boundary

The classifier runs inside `runAv53ShadowWithFirestore(...)` **after** the existing exact classSession/evidence point reads.

It does not perform an additional Firestore point-read pass.

Stale or unsafe evidence is filtered **before** same-day coverage aggregation, so it cannot contribute overlap to another Present row.

## Locked invariants

This brick changes no attendance thresholds, same-day overlap formula, identity proof rules, billing, payments, teacher earnings, scheduling, or operational attendance.

Latest Check remains Microsoft-Graph-free.
