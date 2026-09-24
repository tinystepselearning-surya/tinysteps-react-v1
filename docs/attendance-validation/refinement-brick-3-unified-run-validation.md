# AVS Refinement Brick 3 — Unified Run Validation Backend

Status: **implemented behind a new admin-only callable. The existing Baseline, Latest Check, Sync Identity maintenance mode, and Force Fresh callables remain available during migration.**

## Purpose

The admin should not decide which internal AVS engine applies to a selected date range.

Brick 3 adds one backend entry point:

```text
runAttendanceValidationRange
```

It coordinates the existing AVS engines in this order:

```text
dirty queue
  -> cached AV5.3 revalidation
  -> stale cached evidence -> fresh Teams evidence
  -> missing case/evidence -> first Teams evidence
  -> remaining capacity -> existing baseline cursor engine
```

## Work ceiling

One invocation accounts for at most **100 service sessions**.

Dirty sessions consume the first part of the 100-session budget. Any remaining capacity is passed into the existing first-time baseline cursor engine.

Fresh Microsoft Graph operations use the existing bounded concurrency of **5**.

## Evidence decisions

Brick 2 remains authoritative:

- compatible cached evidence -> reuse with zero Graph calls;
- stale evidence -> fresh collection;
- unresolved compatibility -> review/fail closed.

The unified callable does not change those rules.

## Teacher identity

Brick 1 remains authoritative. Any fresh evidence automatically attempts the existing safe teacher-identity binding before AV5.3 classification.

## Failure behavior

A Graph/organizer/fresh-collection failure does not mutate operational attendance and does not silently clear the dirty marker.

The response reports:

- cached revalidated count;
- stale/missing fresh-work counts;
- fresh failures;
- unsafe/review sessions;
- logical Graph calls;
- baseline progress;
- whether another **Continue Validation** invocation is needed.

## Compatibility

The old callables remain deployed during migration. Brick 5 will switch the Admin page to the unified `Run Validation` action after this backend has proven stable.

## Locked invariants

No change to:

- >25 minute / >50 minute strict overlap thresholds;
- same-day pooling;
- AV3 identity proof rules;
- attendance;
- billing;
- payments;
- teacher earnings;
- scheduling.

AVS remains a validation/evidence sidecar.
