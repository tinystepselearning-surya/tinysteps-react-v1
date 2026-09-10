# Rolling Schedule — Brick 3: Deterministic 14-Day Materializer

## Scope

Brick 3 introduces the backend materialization primitive that can turn one operational enrollment recurrence into concrete `classSessions` for the existing operational horizon.

It is intentionally **not wired to any callable, lifecycle transition, scheduled worker, admin UI, parent UI, teacher UI, or production export yet**. Brick 4+ will decide when this primitive runs.

## Safety invariants

1. **Exactly 14 days ahead.** The materializer treats the horizon as an offset of 14 calendar days from the anchor date, matching the existing parent operational read policy (`today + 14`). It never uses `weeksAhead`, `plannedSessions`, or `endDateYmd` as a stop condition.
2. **Point reads only.** After one enrollment read, the Firestore adapter computes deterministic session IDs first and uses `getAll` only for those IDs. It never scans `classSessions` by `enrollmentId`.
3. **Create-only session behavior.** Missing recurring sessions use deterministic `DocumentReference.create(...)`. Existing documents are preserved byte-for-byte by this brick, including manual, makeup, rescheduled, cancelled, finance-linked, attendance-linked, or historical-correction sessions.
4. **Race-safe idempotency.** If another worker creates the same deterministic session between the point read and create, `ALREADY_EXISTS` is treated as a successful occupancy. The materializer never overwrites the winning document.
5. **No bulk fanout.** A single enrollment window is capped at 64 concrete occurrences. A pathological schedule fails closed before session writes.
6. **No child/course/teacher lookup fanout.** Session identity snapshots are taken from the enrollment. The materializer does not read `kids`, `courses`, or `users` during normal materialization.
7. **Canonical teacher required.** No recurring session is created until one canonical teacher can be resolved for the enrollment.
8. **Financial terms are snapshotted immediately.** New sessions include the existing immutable billing-rate, teacher-pay-rate, version, and currency snapshot fields at initial creation so finance triggers do not need to backfill those terms.
9. **Schedule revision mismatch resets bookkeeping.** Existing `scheduleMaterialization` pointers are never trusted across a revision change. The window and next pointer are recomputed from the current recurrence.
10. **Metadata is narrow.** The enrollment schedule itself is not rewritten. Only the nested `scheduleMaterialization.*` bookkeeping fields are updated after successful materialization.
11. **Partial failure is retry-safe.** Session creates happen before the materialization pointer update. If a later create or metadata update fails, already-created deterministic sessions remain safe and a retry will point-read and preserve them.
12. **Paused/terminal enrollment protection.** The primitive refuses to materialize an enrollment that is not operationally active.

## Session identity

The materializer preserves the established deterministic session ID shape:

`{enrollmentId}_{YYYYMMDD}_{HHmm}`

Example:

`enrollment-1_20260911_0400`

This is compatible with the existing scheduling/historical-correction identity convention and gives a natural deduplication key.

## Materialized session fields

A newly created rolling schedule session keeps the current operational shape used by parent, teacher, attendance and finance flows, including:

- enrollment/child/parent/teacher/course identity snapshots;
- `startAt`, `endAt`, `date`, `startTime`, `endTime`, duration;
- `status: scheduled` and `attendance: null`;
- Teams `joinUrl` when present;
- `feeAmount`, `feePerClass`, `teacherPayPerSession`, and currency;
- immutable financial snapshot fields;
- `source: rolling_schedule`;
- schedule revision, occurrence key, rolling delivery marker and materialization version;
- created/updated audit identity.

## Rolling pointer produced by Brick 3

After materializing the current horizon, the planner computes:

- `materializedThroughYmd` — anchor + 14 days;
- `nextOccurrenceYmd` — first recurrence after the current horizon;
- `nextMaterializationDueYmd` — `nextOccurrenceYmd - 14 days`.

Brick 4 will use that due pointer so the system can replenish only the far-edge occurrence instead of rebuilding the whole 14-day window every day.

## Explicit non-goals in Brick 3

Brick 3 does **not**:

- run automatically;
- change the current finite scheduler callable;
- change admission/schedule UI;
- delete/cancel/patch existing future sessions;
- implement Pause/Resume/Discontinue reconciliation;
- change parent or teacher calendar projection;
- change monthly analytics;
- retire legacy finite fields;
- deploy or merge anything to `main`.

Those remain isolated later bricks.
