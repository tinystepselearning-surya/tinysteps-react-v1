# AVS Brick 8 — Soak Trend Comparison & Exit Gate

Brick 8 compares two saved Brick 7 schema-v2 snapshots locally. The Brick 7/8
hardening patch makes the exit decision depend only on corrected current-state
backlog.

## Comparable snapshots

Before and after files must use the **exact same service-date window**.

For example, this is valid:

```text
Before: 2026-09-18 through 2026-09-23
After:  2026-09-18 through 2026-09-23
```

This is rejected:

```text
Before: 2026-09-18 through 2026-09-23
After:  2026-09-19 through 2026-09-24
```

The later file must also have a later `generatedAt` timestamp.

This prevents apparent improvement caused only by dropping problematic days from
the comparison window.

## Required Brick 7 semantics

Brick 8 accepts only:

- Brick 7 report schema version 2
- current-state schema version 1
- bounded reads
- 0 Graph calls by the audit
- 0 operational writes
- `operationalMutationAllowed = false`

It validates that:

`failedCaseBacklog = retryableFailureBacklog + actionRequiredFailureBacklog`

and that legacy uncategorized failures are a subset of action-required failures.

Old Brick 7 schema-v1 snapshots must be regenerated before they can participate
in the exit gate.

## Exit gate

The after snapshot is `ready_for_manual_exit_review` only when all of these
current-state blockers are clear:

- AVS safety invariant violation
- explicit operational-mutation permission
- invalid case/dirty/checkpoint service dates
- action-required failure backlog
- retryable infrastructure failure backlog
- legacy uncategorized failure backlog
- infrastructure-retry dirty backlog
- dirty markers older than 72 hours
- remaining re-fetch backlog

Open attendance/business-review cases do not block the infrastructure gate.

The possible statuses remain:

- `ready_for_manual_exit_review`
- `continue_soak`
- `blocked_safety`

## Critical boundary

`ready_for_manual_exit_review` is not authorization for automatic attendance
correction, a scheduler, Graph polling, or realtime AVS.

Brick 8 always returns:

`automationAuthorized: false`

Brick 8 remains local-file-only with 0 Firebase reads, 0 Firebase writes,
0 Graph calls, and 0 operational writes.
