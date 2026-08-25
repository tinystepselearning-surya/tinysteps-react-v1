# B6 — Finance Read Optimization

## Goal
Reduce Firestore reads caused by teacher-earnings and finance reporting without changing the authoritative financial ledger, payout allocation, attendance billing, historical attribution, or correction semantics.

## Query Insights baseline observed on 2026-08-25
The production Query Insights screenshots showed two teacher-finance patterns that need separate treatment:

- `teacherEarnings`: 37 executions / 1,967 reads / about 53 documents per execution.
- `teacherEarnings`: 1 execution / about 580 reads.
- `teacherPayouts`: 37 executions / 0 returned documents in the same window.

Repository tracing maps those patterns to:

1. `onTeacherEarningsRollupWrite`: every `teacherEarnings/{earningId}` write historically recomputed a teacher-month rollup by re-reading all matching `teacherEarnings` and `teacherPayouts` rows.
2. `runFinanceReconciliationAuditDaily`: once per day it intentionally scans the current month's finance collections for integrity checks.

The repeated rollup recomputation is the first optimization target. The daily reconciliation remains an important safety mechanism and must not be weakened merely to reduce reads.

## B6 safety rules
- `teacherEarnings` remains the source-of-truth event ledger.
- `teacherPayouts` remains the source-of-truth payout ledger.
- `teachers/{teacherId}/earnings/{monthKey}` remains a derived read model only.
- Existing paid/settled/partial/void semantics must remain unchanged.
- Session-linked duplicate/deduplication behavior must remain unchanged.
- Demo completion and demo enrollment bonus earnings must remain unchanged.
- Teacher/month reassignment of an earning must repair both affected monthly rollups.
- No historical finance records are mass-deleted or rewritten as part of read optimization.
- The daily reconciliation job remains available as an independent parity/safety check.

## Phase 1 — arithmetic and fallback contract
`functions/src/helpers/teacherEarningsRollupDelta.ts` introduces a pure planner that classifies one earning change as:

- `delta`: arithmetic contribution changes are known for one monthly rollup;
- `noop`: the derived rollup contribution and payout state did not change;
- `recompute`: ambiguity exists, so the existing authoritative full scan must remain the fallback.

The planner is intentionally conservative. In particular, a new or deleted session-linked earning still requests a full recompute until production/current-month duplicate coverage proves that incremental creation/deletion cannot conflict with legacy session-earning rows.

Payout-state mutations also stay on authoritative recompute. The monthly read model includes recent `teacherPayouts` history as well as numeric totals, so changing `paidAmount`, payout IDs, payout timestamps, reversal fields, or paid-like status must not bypass the payout query.

## Phase 2 — live safe no-op suppression
`functions/src/teacherEarningsRollupTrigger.ts` is the exported production entry point for `onTeacherEarningsRollupWrite`.

It suppresses the expensive teacher-month recomputation only when all of the following are true:

- the event is an update, not a create or delete;
- both snapshots have the same explicit canonical `teacherId` and `monthKey`;
- the planner returns `noop`;
- no payout-state field affecting rollup/payment semantics changed;
- the row is not an ambiguous/non-canonical legacy session earning.

Every other event delegates to the original `revenue.ts` rollup handler unchanged. Therefore legacy timestamp-derived month targeting, teacher/month moves, finance-changing updates, payout changes, session creates/deletes, and ambiguous duplicate-session cases retain the existing authoritative scans and dedupe behavior.

This first live optimization is intentionally idempotent: skipped events perform no derived write and therefore cannot double-apply on Cloud Functions event retry.

## Delta execution remains gated
The planner's `delta` result is **not** currently executed as `FieldValue.increment` in production.

A naive increment path is unsafe because Firestore/Eventarc delivery may retry an event, and an incremental write may race with a concurrent authoritative full recomputation. Either condition could double-count or lose a finance delta without additional sequencing/idempotency controls.

Before enabling delta writes, B6 still requires:

1. Audit current-month session-linked `teacherEarnings` for duplicate `sessionId` rows and canonical `earningId === sessionId` coverage.
2. Add parity coverage for representative unpaid, partial, paid, void, demo, correction, and legacy-dedup transitions.
3. Add a retry/concurrency protocol for incremental events, such as stable event receipts plus recompute/delta sequencing or another transactionally equivalent design.
4. Keep authoritative full recompute as the fallback for every event that cannot be proven incremental-safe.
5. Compare Query Insights after deployment before expanding the fast path.

## Separate later optimizations
These are real read opportunities but are not mixed into the first trigger change:

- month-bound the teacher Earnings screen instead of loading the teacher's entire earning history for the default monthly view;
- month-bound `voidTeacherOrphanEarnings` at the Firestore query itself;
- replace raw teacher-earnings analytics totals with monthly rollups where detail rows are not required;
- month-bound the daily reconciliation `classSessions(status == completed)` scan before downloading records.
