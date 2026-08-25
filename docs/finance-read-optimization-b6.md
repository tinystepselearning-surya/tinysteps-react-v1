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

## Brick 1 — arithmetic contract and live safe no-op suppression
`functions/src/helpers/teacherEarningsRollupDelta.ts` introduces a pure planner that classifies one earning change as:

- `delta`: arithmetic contribution changes are known for one monthly rollup;
- `noop`: the derived rollup contribution and payout state did not change;
- `recompute`: ambiguity exists, so the existing authoritative full scan must remain the fallback.

`functions/src/teacherEarningsRollupTrigger.ts` is the exported production entry point for `onTeacherEarningsRollupWrite`.

It suppresses the expensive teacher-month recomputation only when all of the following are true:

- the event is an update, not a create or delete;
- both snapshots have the same explicit canonical `teacherId` and `monthKey`;
- the planner returns `noop`;
- no payout-state field affecting rollup/payment semantics changed;
- the row is not an ambiguous/non-canonical legacy session earning.

Every other event delegates to the original `revenue.ts` rollup handler unchanged. Therefore legacy timestamp-derived month targeting, teacher/month moves, finance-changing updates, payout changes, session creates/deletes, and ambiguous duplicate-session cases retain the existing authoritative scans and dedupe behavior.

This first live optimization is intentionally idempotent: skipped events perform no derived write and therefore cannot double-apply on Cloud Functions event retry.

## Brick 2 — read-only canonical and legacy-month coverage audit
`auditTeacherEarningsCanonicalCoverage` is an admin-only callable used to gather production evidence before broader read cutovers or incremental finance writes are enabled.

Default mode:

- defaults to the current IST month, or accepts an explicit `YYYY-MM` month;
- queries only `teacherEarnings` rows with that explicit `monthKey`;
- is bounded (`maxDocs`, default 5,000, hard maximum 10,000);
- performs no Firestore writes or repairs;
- reports canonical `earningId === sessionId` coverage, non-canonical session rows, missing session IDs, missing canonical `teacherId`, duplicate `sessionId` groups, archived/void rows, and small ID-only samples.

Optional `includeLegacyMonthCoverage=true` mode performs one bounded full-ledger scan so the audit can also detect:

- active rows whose target month exists only in timestamps because `monthKey` is missing;
- rows whose stored `monthKey` conflicts with timestamp-derived month;
- undated rows that cannot be assigned safely to a month;
- whether the bounded full-ledger evidence is complete or truncated.

The callable returns explicit evidence gates including `fullLedgerEvidenceComplete`, `readyForMonthBoundReads`, and `readyForFurtherDeltaDesign`. A truncated scan always means the evidence is incomplete even if the partial rows look clean.

This audit is on-demand rather than scheduled, so it creates no recurring read load when unused.

## Brick 3 — month-bound Teacher Earnings UI
The Teacher Earnings screen historically queried every `teacherEarnings` document for the teacher and then filtered the selected month in the browser.

Brick 3 changes the Month preset itself:

- every valid **Month** view queries `teacherId + selected monthKey` directly in Firestore;
- changing the selected month reloads only that teacher-month ledger slice;
- Week and Custom retain the existing teacher-history query because those ranges can span month boundaries and are separate optimization work;
- the existing `teacherEarnings(monthKey, teacherId)` composite index already supports the bounded query;
- earnings calculations, paid/pending logic, session detail logic, demo earnings, and UI rendering remain unchanged;
- no finance documents are rewritten or migrated by this UI read cutover.

## Brick 4 — month-bound `voidTeacherOrphanEarnings`
Scope the orphan-earning correction callable to the requested teacher-month at the Firestore query itself while preserving all existing paid/void/session-billability protections.

## Brick 5 — reduce the broad daily reconciliation session scan
Bound the daily reconciliation `classSessions` read to the intended reconciliation month before downloading rows, without weakening the reconciliation checks themselves.

## Brick 6 — move appropriate admin analytics totals to monthly rollups
Use existing monthly derived rollups for summary-only admin totals where raw earning rows are not required. Detail views and reconciliation remain on source-of-truth ledgers when necessary.

## Later — idempotent/concurrency-safe incremental earnings rollup
The planner's `delta` result is **not** currently executed as `FieldValue.increment` in production.

A naive increment path is unsafe because Firestore/Eventarc delivery may retry an event, and an incremental write may race with a concurrent authoritative full recomputation. Either condition could double-count or lose a finance delta without additional sequencing/idempotency controls.

Before enabling incremental earnings rollups, B6 still requires:

1. Deploy and run the Brick 2 full-ledger canonical/legacy-month audit and review its production evidence.
2. Add parity coverage for representative unpaid, partial, paid, void, demo, correction, and legacy-dedup transitions.
3. Add a retry/concurrency protocol for incremental events, such as stable event receipts plus recompute/delta sequencing or another transactionally equivalent design.
4. Keep authoritative full recompute as the fallback for every event that cannot be proven incremental-safe.
5. Compare Query Insights after deployment before expanding the fast path.
