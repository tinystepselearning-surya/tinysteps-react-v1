# Rolling Schedule — Brick 2 Enrollment Contract

## Purpose

Brick 2 defines the permanent enrollment-side data contract for rolling schedules. It does not write Firestore, generate sessions, alter lifecycle behavior, or change any UI.

The contract intentionally separates **recurrence truth** from **materialization bookkeeping**.

## Canonical recurrence source of truth

A rolling enrollment schedule is represented as:

```ts
schedule: {
  schemaVersion: 1,
  deliveryMode: 'rolling',
  timezone: 'Asia/Kolkata',
  revision: 1,
  weeklySlots: [
    { weekday: 2, time: '16:00', durationMinutes: 35 },
    { weekday: 4, time: '16:00', durationMinutes: 35 },
    { weekday: 6, time: '16:00', durationMinutes: 35 },
  ],
}
```

`weekday` follows JavaScript `Date.getDay()`: Sunday = 0 through Saturday = 6.

`classesStartDateYmd` remains an enrollment-level lower bound. Existing fallback date fields continue to be understood for compatibility.

## Lifecycle is authoritative

Automatic recurrence delivery is controlled only by the enrollment lifecycle status.

- Active / Trial / existing active aliases: eligible for automatic materialization.
- Paused: recurrence remains configured but automatic materialization is stopped.
- Discontinued / Completed / Cancelled / other terminal states: automatic materialization is stopped permanently.
- No new `isActive`, `scheduleEnabled`, or duplicate boolean switch is introduced.

## No finite scheduling controls

The rolling source of truth has no scheduling stop based on:

- `weeksAhead`
- `plannedSessions`
- `endDateYmd`

Legacy enrollments may still contain those fields during the compatibility period. Brick 2 detects them for migration/audit visibility but excludes them from the canonical rolling schedule object. They are not recurrence truth.

The legacy `weekdays + timeHHmm + durationMins` schedule shape also remains readable and can be normalized into canonical weekly slots.

## Materialization bookkeeping

Operational rolling state is stored separately from recurrence definition:

```ts
scheduleMaterialization: {
  schemaVersion: 1,
  horizonDays: 14,
  scheduleRevision: 1,
  materializedThroughYmd: '2026-09-24',
  nextOccurrenceYmd: '2026-09-26',
  nextMaterializationDueYmd: '2026-09-12',
}
```

Semantics:

- `horizonDays` is fixed by code at **14**. A stale persisted 21/30-day value cannot widen the operational horizon.
- `materializedThroughYmd` is the farthest IST calendar date already reconciled for the current rolling state.
- `nextOccurrenceYmd` is the next recurring class occurrence beyond the reconciled horizon.
- `nextMaterializationDueYmd` is the IST processing date when that next occurrence first enters the 14-day horizon.
- `scheduleRevision` identifies which recurrence revision the bookkeeping belongs to.

These fields are operational metadata only. They never define whether a class should recur.

## Backward compatibility

Brick 2 resolves both canonical rolling enrollments and existing legacy schedule documents without rewriting them. Existing schedule fields and production behavior are untouched in this brick.

The resolver classifies an enrollment as:

- `canonical_rolling` — explicit schema v1 + rolling delivery mode;
- `legacy_compatible` — a valid existing recurrence that can be normalized;
- `unconfigured` — no valid recurring slots.

## Safety boundary

Brick 2 introduces no Firestore reads or writes and is not imported by existing production scheduling paths yet. It is a typed contract + compatibility resolver for later bricks.

Brick 3 may use this contract to build deterministic 14-day materialization, but only after Brick 2 is reviewed and green.
