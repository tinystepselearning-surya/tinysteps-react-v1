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

The repeated rollup recomputation is the largest remaining optimization target. The daily reconciliation remains an important safety mechanism and must not be weakened merely to reduce reads.

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
The admin orphan-earning correction historically accepted `monthKey` but queried every `teacherEarnings` document for the teacher before validating linked sessions.

Brick 4 replaces the deployed export with a dedicated month-scoped module:

- the callable name and request/response shape remain `voidTeacherOrphanEarnings`;
- the Firestore query is now `teacherId + monthKey`, so only the requested teacher-month is loaded;
- the existing composite index already supports the query;
- completed/present sessions remain billable and are never voided;
- paid, partially paid, or settled orphan earnings remain protected from voiding;
- already-void rows and non-session-linked rows remain untouched;
- the current any-present attendance-map semantics are preserved exactly;
- the previous broad implementation in `revenue.ts` is no longer exported from `functions/src/index.ts`;
- no historical earnings are migrated or mass-rewritten by this read-scope change.

## Brick 5 — bounded daily reconciliation session reads
The daily reconciliation previously downloaded all completed `classSessions` and filtered the selected month in memory.

Brick 5 adds a bounded completed-session fetcher using canonical service-date shapes (`date`, `startAt`, and explicit `monthKey` compatibility), deduplicates the union, and wires the monthly reconciliation path to it. Existing downstream reconciliation checks remain unchanged. An intentionally unscoped manual audit can still use the historical all-completed path.

## Brick 6 — Finance analytics monthly-rollup summary
Brick 6 moves the Finance summary away from routinely downloading raw monthly `teacherEarnings` events.

- an admin-only preparation/certification path proves a month is safe before rollup summaries are trusted;
- preparation is dry-run by default and never mutates the source `teacherEarnings` ledger;
- certified rollups carry explicit `monthKey` and analytics readiness metadata;
- Finance reads the month readiness marker and bounded teacher-month rollups when certified;
- any unsafe, stale, or uncertified state automatically falls back to the existing month-bounded raw `teacherEarnings` calculation;
- the detailed Teachers analytics view still uses raw earning events because it needs transaction/detail and deleted/missing-teacher visibility.

## Brick 7 — idempotent/concurrency-safe incremental earnings rollup
The planner's `delta` result is still **not executed as a live money mutation**.

A naive `FieldValue.increment` path is unsafe because Firestore/Eventarc may retry an event and an incremental write can race with a concurrent authoritative full recomputation. A retry can double-apply a delta; a stale recompute can overwrite a correctly applied delta.

### Brick 7A — transaction/idempotency protocol foundation
`functions/src/helpers/teacherEarningsIncrementalProtocol.ts` defines a pure, fail-closed protocol for a future fast path:

- stable CloudEvent-derived idempotency marker IDs;
- deterministic change signatures so the same marker cannot silently represent different payloads;
- explicit rollup revision numbers;
- exact delta-to-next-total calculation with nonnegative/count invariants;
- exact replay vs marker-conflict classification;
- a mandatory `transaction_coordinated_v1` recompute fence.

Current production rollups do not carry that fence. Therefore 7A cannot qualify a live rollup for incremental mutation. A source-level regression test also verifies the live trigger does not import or execute the 7A protocol.

New session-earning creates remain on full recompute even in the hypothetical coordinated state because legacy duplicate selection for session creates is a separate evidence gate.

### Brick 7B — transaction-coordinate authoritative recompute
Before any fast delta can be enabled, the authoritative full-recompute writer must participate in the same serialization contract. Brick 7B must preserve the existing ledger scan, session dedupe, payout history, and totals while writing the rollup under a transaction/revision fence so a concurrent delta cannot be overwritten by a stale recompute.

This brick is primarily a correctness refactor, not a read saving by itself.

### Brick 7C — enable only already-proven delta categories
After 7B is green, the live trigger may use the transaction protocol for planner-approved categories such as safe standalone demo/adjustment deltas and canonical session updates. Exact event receipts must be written in the same transaction as the rollup mutation, and every unsupported state must retain authoritative full recompute.

### Brick 7D — consider canonical session-create fast path only after production evidence
The main `37 executions / 1,967 reads` pattern is likely dominated by new session earning creates, but those remain deliberately excluded until the Brick 2 production audit proves duplicate/canonical session coverage for the intended cutover window and the future-writer contract prevents new duplicate session earnings.

Only then should B6 consider allowing canonical `earningId === sessionId` session creates onto the incremental path.

## Production verification after deployment
After B6 is merged/deployed, compare a clean normal-traffic Query Insights window against the 2026-08-25 baseline. In particular track:

- teacher-month rollup `teacherEarnings` query executions and reads;
- `teacherPayouts` query executions associated with rollup recomputation;
- broad reconciliation `classSessions` reads;
- Finance analytics raw `teacherEarnings` reads;
- correctness/parity findings from the independent reconciliation job.
