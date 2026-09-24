# AVS Brick 7 — Production Soak & Safety Guardrails

Brick 6 completed the original AVS processing architecture. Brick 7 deliberately
does **not** add another validator, scheduler, realtime listener, or automatic
attendance action.

Its purpose is to provide a repeatable, bounded, read-only production soak audit
before any future automation is considered.

## Operator command

From the repository root:

```bash
node scripts/avs-production-soak-audit.mjs \
  --project tinysteps-react-v1 \
  --from 2026-09-18 \
  --to 2026-09-24
```

The date range is optional. By default the script audits the latest seven
completed IST service dates through yesterday. Explicit ranges are also
restricted to yesterday IST or earlier.

Optional aggregate JSON output:

```bash
node scripts/avs-production-soak-audit.mjs \
  --project tinysteps-react-v1 \
  --from 2026-09-18 \
  --to 2026-09-24 \
  --json-out artifacts/avs-soak.json
```

The command uses Firebase Admin Application Default Credentials. It refuses to
run unless `--project tinysteps-react-v1` is explicit.

## Data read

Only AVS-owned sidecars are queried:

- `attendanceValidationCases`
- `attendanceValidationDirtySessions`
- `attendanceValidationForceFreshRuns`

No classSessions, enrollments, billing, payments, or teacher-earnings
collections are queried.

Hard caps:

- 5,000 validation cases;
- 5,000 dirty markers;
- 200 re-fetch generations;
- maximum 31 service days.

If a cap would be exceeded, the audit fails rather than returning a misleading
partial report.

## Report

The report contains aggregate counts only:

- AVS classifications;
- resolution status;
- Tiny Steps attendance category;
- reason/proof/identity issue counts;
- dirty-marker reasons and age bands;
- infrastructure-retry dirty backlog;
- re-fetch generation status;
- retryable failure backlog;
- action-required failure backlog;
- remaining cases and logical Graph calls already recorded by prior runs;
- explicit operational-mutation permission violations;
- invalid AVS sidecar dates.

No student name, teacher name, email, Teams participant identity, Microsoft
object ID, join URL, or Firestore document ID is emitted.

## Exit behavior

- exit 0: bounded audit completed and no hard AVS safety invariant was violated;
- exit 1: configuration/read/runtime failure;
- exit 2: audit completed but detected an explicit AVS safety invariant violation.

Backlog or business-review counts do not by themselves make the command fail.
They are observability signals for an operator.

## Explicit exclusions

Brick 7 has:

- 0 Microsoft Graph calls;
- 0 Firestore writes;
- 0 operational collection writes;
- 0 new browser callables;
- 0 scheduled jobs;
- 0 realtime listeners;
- 0 automatic attendance corrections.

## Locked AVS rules

Brick 7 does not change:

- strictly more than 1,500 seconds per Present row;
- same-day pooling only for Present;
- non-Present scheduled-occurrence matching;
- expected teacher + learner proof;
- fail-closed teacher identity;
- attendance, scheduling, billing, payments, or teacher earnings.
