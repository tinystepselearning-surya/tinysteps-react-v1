# AVS Brick 8 — Soak Trend Comparison & Exit Gate

Brick 8 is the second half of production soak. Brick 7 creates bounded,
aggregate-only snapshots from AVS sidecars. Brick 8 compares two saved snapshots
locally and decides whether the current AVS infrastructure state is clean enough
for a **manual exit-from-soak review**.

Brick 8 does not connect to Firebase or Microsoft Graph.

## Workflow

Create two Brick 7 snapshots at different times:

```bash
npm run audit:avs-soak -- \
  --project tinysteps-react-v1 \
  --from 2026-09-18 \
  --to 2026-09-23 \
  --json-out artifacts/avs-soak-before.json
```

Later, create a second snapshot and compare:

```bash
npm run audit:avs-soak-compare -- \
  --before artifacts/avs-soak-before.json \
  --after artifacts/avs-soak-after.json
```

Optional local JSON output:

```bash
npm run audit:avs-soak-compare -- \
  --before artifacts/avs-soak-before.json \
  --after artifacts/avs-soak-after.json \
  --json-out artifacts/avs-soak-comparison.json
```

Optional gate exit code:

```bash
npm run audit:avs-soak-compare -- \
  --before artifacts/avs-soak-before.json \
  --after artifacts/avs-soak-after.json \
  --require-ready
```

With `--require-ready`, exit code 2 means the current snapshot still has one or
more exit-gate blockers. Without that flag the tool is report-only.

## Accepted inputs

Both files must be authentic Brick 7 report shapes:

- schema version 1;
- `brick = AVS_BRICK_7_PRODUCTION_SOAK`;
- `projectId = tinysteps-react-v1`;
- bounded reads recorded;
- 0 Graph calls;
- 0 operational writes;
- `operationalMutationAllowed = false`;
- valid chronological timestamps and service-date windows.

The later snapshot must be generated after the earlier snapshot and cannot move
the service-date coverage backwards.

Input files are capped at 2 MiB each.

## Trend metrics

Brick 8 compares:

- open business-review cases;
- dirty-session backlog;
- infrastructure-retry dirty backlog;
- dirty markers older than 72 hours;
- failed re-fetch case backlog;
- retryable infrastructure failure backlog;
- action-required failure backlog;
- remaining re-fetch cases;
- total cases observed.

Backlog deltas are labelled improved, unchanged, or worsened. Total cases
observed is neutral because a higher number usually means the audit covered more
validated sessions rather than worse AVS health.

## Exit gate

The current snapshot is `ready_for_manual_exit_review` only when all of these
are clear:

- no AVS safety invariant violation;
- no explicit operational-mutation permission;
- no invalid AVS sidecar dates;
- no action-required infrastructure backlog;
- no retryable infrastructure backlog;
- no infrastructure-retry dirty backlog;
- no dirty markers older than 72 hours;
- no remaining re-fetch backlog.

Open business-review cases do **not** block the exit gate. Those are attendance
review outcomes, not AVS infrastructure health.

A hard AVS safety invariant produces `blocked_safety`. Other uncleared backlog
produces `continue_soak`.

## Important boundary

`ready_for_manual_exit_review` is not permission to automate attendance or add
a scheduler. Brick 8 always returns:

`automationAuthorized: false`

Any future automation requires a separate architecture decision and explicit
approval.

## Safety

Brick 8 performs:

- 0 Firebase reads;
- 0 Firebase writes;
- 0 Microsoft Graph calls;
- 0 operational writes;
- 0 browser callables;
- 0 scheduled jobs;
- 0 realtime listeners.

It emits only whitelisted aggregate fields from Brick 7 and never echoes extra
fields from the input files.
