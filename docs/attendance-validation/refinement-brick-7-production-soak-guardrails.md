# AVS Brick 7 — Production Soak & Safety Guardrails

Brick 7 is a bounded, manual, read-only production-soak audit. The Brick 7/8
hardening patch changes only how re-fetch health is interpreted; it does not
change AVS validation or operational data.

## Operator command

```bash
npm run audit:avs-soak -- \
  --project tinysteps-react-v1 \
  --from 2026-09-18 \
  --to 2026-09-23 \
  --json-out artifacts/avs-soak.json
```

The range is capped at 31 completed IST service dates through yesterday.

## Read boundary

Only AVS-owned sidecars are read:

- `attendanceValidationCases`
- `attendanceValidationDirtySessions`
- `attendanceValidationForceFreshRuns`
- nested `attendanceValidationForceFreshRuns/{run}/cases` checkpoints

Hard caps:

- 5,000 validation cases
- 5,000 dirty markers
- 200 re-fetch generations
- 20,000 generation checkpoints

Any cap overflow fails the audit instead of returning partial results.

## Current re-fetch state

Historical top-level generation counters are no longer treated as the current
unresolved backlog.

For every case represented in generation checkpoints, Brick 7 selects the most
recent checkpoint. A later `refreshed` checkpoint therefore supersedes an
older `failed` checkpoint for that same case.

The current backlog fields are:

- `failedCaseBacklog`
- `retryableFailureBacklog`
- `actionRequiredFailureBacklog`
- `legacyUncategorizedFailureBacklog`
- `remainingCaseBacklog`

Historical generation count, checkpoint count and logical Graph calls remain
informational only.

## Legacy fail-closed rule

A failed checkpoint created before Brick 6 may not contain `retryable`,
`failureCategory`, `retryDisposition`, or `operatorAction`.

Such a failure is never interpreted as clean. It is counted as:

- failed
- action required
- legacy uncategorized

If a current generation reports failed cases that have no corresponding
checkpoint representation, the unmatched failures are also counted as legacy
uncategorized/action-required.

This prevents legacy failures from disappearing merely because the newer
taxonomy fields did not exist when they were written.

## Safety

The report schema is now version 2 because current backlog semantics changed.

Brick 7 still performs:

- 0 Microsoft Graph calls
- 0 Firestore writes
- 0 operational collection writes
- 0 browser callables
- 0 scheduled jobs
- 0 realtime listeners
- 0 automatic attendance corrections

The report remains aggregate-only and does not emit case IDs, student/teacher
names, email addresses, Teams identities, Microsoft object IDs, or join URLs.
