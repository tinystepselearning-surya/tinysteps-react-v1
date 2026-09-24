# AVS Brick 3 Hardening

This patch closes two edge cases found during the post-Brick-3 audit.

## Missing referenced Teams evidence

Latest Check now tells AV5.3 to treat a session-backed case whose referenced `attendanceValidationEvidence` document is missing as `fresh_evidence_required`.

That session remains dirty and is routed into the unified **missing/first evidence** path rather than being counted as a successful cached revalidation.

The targeted collector checks whether an existing case's referenced evidence document actually exists before taking the no-Graph race/idempotency shortcut.

## Newly created historical sessions

A new Firestore create trigger watches `classSessions/{sessionId}` and writes only an AVS dirty sidecar when the new session's service date:

- is on or after 2026-09-01; and
- is already completed (strictly before today IST).

Today's/future scheduled materialization is not marked, avoiding unnecessary AVS writes for normal future schedule generation.

This lets late historical/ad-hoc/backfilled sessions enter Run Validation even if the selected baseline range was previously marked complete.

## Safety

No change to AVS thresholds, same-day allocation, identity proof, operational attendance, scheduling, billing, payments, or teacher earnings.
