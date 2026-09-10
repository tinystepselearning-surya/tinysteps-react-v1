# Rolling Schedule — Brick 4: Due-Pointer Edge Worker

## Scope

Brick 4 adds the automatic daily worker that advances an already-initialized Brick 3 rolling schedule without rebuilding the full 14-day window.

The worker is deliberately narrow: it discovers only enrollments whose persisted `scheduleMaterialization.nextMaterializationDueYmd` is due, materializes only the recurrence date that has just entered the far edge of the operational horizon, then advances the pointer.

Brick 4 does **not** initialize rolling schedules, change lifecycle transitions, replace the existing finite admin scheduling callable, migrate historical data, alter UI, or change analytics. Those remain later integration bricks.

## Daily schedule

The worker is registered as `rollingScheduleEdgeReplenisherDaily` and runs once daily at **00:15 Asia/Kolkata** in `asia-south1`.

A daily cadence is sufficient because every new session produced by this worker is approximately 14 calendar days in the future. Minute-level polling would add cost without improving the operational guarantee.

## Discovery read contract

The worker does not scan `classSessions` to discover work.

Its enrollment discovery query is bounded and index-friendly:

```ts
where('scheduleMaterialization.nextMaterializationDueYmd', '<=', todayYmd)
orderBy('scheduleMaterialization.nextMaterializationDueYmd', 'asc')
limit(500)
```

This uses one persisted due pointer as the queue. Enrollments without Brick 3 materialization metadata are invisible to Brick 4 and therefore cannot be accidentally activated by this worker.

Oldest due work is processed first.

## Healthy-operation behavior

Example initial state:

```ts
scheduleMaterialization: {
  horizonDays: 14,
  materializedThroughYmd: '2026-09-24',
  nextOccurrenceYmd: '2026-09-25',
  nextMaterializationDueYmd: '2026-09-11',
}
```

On `2026-09-11`, Brick 4:

1. reads that enrollment because its due pointer is now due;
2. computes the Brick 3 window in memory only;
3. selects only occurrences on `2026-09-25` — the single new far-edge calendar date;
4. point-reads only deterministic session IDs for that date;
5. creates only missing IDs using Brick 3 create-only semantics;
6. advances the pointer to the next recurrence date, for example `2026-09-28` / due `2026-09-14`.

It does **not** re-read or rewrite the intervening 14-day session set.

## Multiple slots on one date

If the recurrence contains more than one class time on the same weekday, all slots on that one target date are processed together. The unit of edge replenishment is the **calendar date entering the horizon**, not one arbitrary session document.

## Catch-up after an outage

A delayed worker may find several recurrence dates whose due pointers are already in the past. Brick 4 catches up only a bounded amount per enrollment:

- maximum **4 due recurrence dates** per enrollment per run;
- maximum **32 session candidates** per enrollment per run.

If more work remains, the pointer intentionally stays overdue. The enrollment is picked up again on the next daily run. This trades a small amount of recovery latency for predictable Firestore load.

## Global load budgets

One run is also bounded globally:

- maximum **500 due enrollment documents read**;
- maximum **750 edge session candidates processed**.

If the session-candidate budget is reached, remaining due enrollments are deferred. Since the sessions being created are at the far edge of a 14-day horizon, this controlled deferral does not remove today's or tomorrow's operational sessions.

## Session read/write behavior

For each due enrollment, Brick 4 reuses the Brick 3 Firestore adapter:

- deterministic `getAll(...)` point reads only;
- `DocumentReference.create(...)` for missing sessions only;
- `ALREADY_EXISTS` is treated as safe occupancy;
- existing deterministic documents are preserved without patching, regardless of whether they are normal, manual, makeup, rescheduled, cancelled, historical, attendance-linked, or finance-linked;
- one narrow `scheduleMaterialization.*` metadata update occurs only after all required session creates succeed.

There is no `classSessions.where(enrollmentId == ...)` scan, delete pass, or whole-window batch rewrite.

## Pointer safety

Brick 4 refuses to guess when materialization metadata is stale or malformed. It fails that enrollment closed when:

- the materialization schema version is unsupported;
- `horizonDays` is anything other than 14;
- `nextOccurrenceYmd` and `nextMaterializationDueYmd` are not set/cleared together;
- the due date plus 14 days does not equal the next occurrence date;
- the schedule revision differs from the materialization revision;
- the target pointer no longer resolves to a recurrence occurrence;
- the enrollment is paused, terminal, archived, or otherwise non-operational;
- child, canonical teacher, or financial terms needed for a newly created session cannot be resolved.

A schedule-revision mismatch requires the later schedule-edit/lifecycle integration path to perform a fresh Brick 3 14-day rematerialization before edge processing resumes.

## Failure and retry semantics

All missing session payloads for one enrollment are built before the first write. This prevents a financial/identity validation failure from partially writing a catch-up plan.

Session creates occur before the pointer update. Therefore:

- if a session create fails partway through, the pointer remains due and a later retry preserves already-created deterministic documents;
- if another writer wins a deterministic create race, Brick 4 treats the ID as occupied and does not overwrite it;
- if the pointer update fails after creates, the next run point-reads those deterministic IDs and advances safely.

The daily wrapper isolates failures by enrollment, logs the enrollment ID and reason, and continues with other due work.

## Explicit non-goals in Brick 4

Brick 4 does **not**:

- create Brick 3 materialization metadata for existing enrollments;
- change `Save Schedule` behavior;
- remove `weeksAhead`, `plannedSessions`, or `endDateYmd` from the admin UI or legacy callable;
- implement Pause / Resume / Discontinue cleanup or refill;
- reconcile schedule edits;
- prune legacy 20-week or 60-session future documents;
- alter parent, teacher, attendance, reminder, billing, or historical-correction read paths;
- change monthly analytics;
- merge anything to `main`.

Those remain later bricks. Brick 4 is only the bounded automatic edge replenishment mechanism for rolling enrollments that have already been safely initialized.
