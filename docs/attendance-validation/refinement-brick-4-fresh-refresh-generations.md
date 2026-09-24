# AVS Refinement Brick 4 — Robust Fresh-Refresh Generations

Status: **implemented behind the existing admin-only Force Fresh selected-range callable.**

## Purpose

The old selected-range Force Fresh coordinator used one deterministic document per
service-date range. Once that document completed, the same range could not cleanly
represent a later intentional re-fetch.

Brick 4 changes the execution model to explicit generations.

## Generation model

Each fresh range re-fetch has a unique `runId`:

```text
attendanceValidationForceFreshRuns/{runId}
  cases/{caseId}
```

A client may supply the explicit run id. The current Admin page creates it before
the first network call and keeps it after a timeout, so retrying the request resumes
the same generation.

If no run id is supplied, the backend creates a fresh generation id.

The same date range can therefore be run again later by starting a new generation.

## Per-case checkpointing

Each attempted case receives a terminal backend-only checkpoint:

- `refreshed`
- `skipped`
- `failed`

The checkpoint is committed before the discovery cursor advances. If an invocation
times out, a retry scans from the persisted cursor and skips terminal checkpoints
already written in that generation.

No growing `completedCaseIds` array is used.

## Bounds

Unchanged:

- selected range max: 31 days;
- fresh work max: 100 cases per invocation;
- Microsoft Graph concurrency: 5;
- one callable instance with request concurrency **1**;
- internal Microsoft Graph case concurrency remains **5**.

## Failures and retries

When the range scan reaches the end:

- zero current failures -> `complete`;
- one or more current failures -> `complete_with_failures`.

A failed-case retry uses the same generation and selects only failed checkpoint
documents, at most 100 per invocation. A failed checkpoint that later refreshes
moves from the failed counter to the refreshed counter transactionally.

A retry cursor prevents a large failure set from starving later failed cases.

## Idempotency

The Admin page chooses the generation id before calling the backend. If the request
times out, that id is retained for the next attempt.

Completed/skipped/failed terminal checkpoints are not repeated during normal range
continuation. Work that never reached a terminal checkpoint can be attempted again,
which is the fail-safe boundary around an external Microsoft Graph operation.

## Compatibility

The callable name remains:

```text
forceRefreshAttendanceValidationRange
```

The legacy `attendanceValidationForceFreshRanges` collection remains denied to
clients but is no longer read or written by Brick 4. It can be retired after soak
in Brick 6.

Brick 5 will simplify the Admin UI and move this operation under
**Advanced -> Re-fetch Teams Data**.

## Locked safety invariants

No change to:

- strict >1500 seconds per Present row;
- same-day Present pooling;
- non-Present scheduled matching;
- teacher identity proof;
- AV5.3 classification;
- operational attendance;
- scheduling;
- billing;
- payments;
- teacher earnings.

AVS writes remain confined to AVS evidence/case/progress sidecars plus guarded
dirty-marker cleanup.
