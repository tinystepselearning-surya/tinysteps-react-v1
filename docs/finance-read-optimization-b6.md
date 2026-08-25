# B6 — Finance Read Optimization

## Goal
Reduce Firestore reads caused by teacher-earnings and finance reporting without changing the authoritative financial ledger, payout allocation, attendance billing, historical attribution, or correction semantics.

## Query Insights baseline observed on 2026-08-25
The production Query Insights screenshots showed two teacher-finance patterns that need separate treatment:

- `teacherEarnings`: 37 executions / 1,967 reads / about 53 documents per execution.
- `teacherEarnings`: 1 execution / about 580 reads.
- `teacherPayouts`: 37 executions / 0 returned documents in the same window.

Repository tracing maps those patterns to:

1. `onTeacherEarningsRollupWrite`: every `teacherEarnings/{earningId}` write currently recomputes a teacher-month rollup by re-reading all matching `teacherEarnings` and `teacherPayouts` rows.
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

- `delta`: safe to apply exact numeric changes to one monthly rollup;
- `noop`: finance totals did not change;
- `recompute`: ambiguity exists, so the existing authoritative full scan must remain the fallback.

The planner is intentionally conservative. In particular, a new or deleted session-linked earning still requests a full recompute until production/current-month duplicate coverage proves that incremental creation/deletion cannot conflict with legacy session-earning rows.

## Next implementation gates
Before wiring the planner into the Firestore trigger:

1. Run full Functions unit/build CI for the pure planner.
2. Add parity tests comparing delta results with full recomputation for representative unpaid, partial, paid, void, demo, and correction transitions.
3. Audit current-month session-linked `teacherEarnings` for duplicate `sessionId` rows and canonical `earningId === sessionId` coverage.
4. Only after that evidence, wire safe `delta`/`noop` paths into `onTeacherEarningsRollupWrite`; retain full recompute for all `recompute` plans.
5. Compare Query Insights after deployment. The target is to remove most repeated ~teacher-month scans while preserving exact rollup parity.

## Separate later optimizations
These are real read opportunities but are not mixed into the first trigger change:

- month-bound the teacher Earnings screen instead of loading the teacher's entire earning history for the default monthly view;
- month-bound `voidTeacherOrphanEarnings` at the Firestore query itself;
- replace raw teacher-earnings analytics totals with monthly rollups where detail rows are not required;
- month-bound the daily reconciliation `classSessions(status == completed)` scan before downloading records.
