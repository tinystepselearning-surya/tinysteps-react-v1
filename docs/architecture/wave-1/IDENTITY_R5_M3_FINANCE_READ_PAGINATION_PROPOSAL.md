# M3 follow-up proposal — complete, bounded finance audit reads

**Proposal only; no runtime, query, index or financial behavior changes.**
Baseline: `0092f47291a3c4d3305e31e96ccdc6e5494d306f` (PR #703).
The existing payment audit and backfill callables remain excluded from production
canaries. This document grants no access or implementation/deployment approval.

## Problem and evidence

`functions/src/parentPaymentBackfillDryRun.ts` has four independent sources of
unbounded returned rows: an explicit-parent payments query, each selected payment's
allocations, and parent-scoped charges / wallet transactions / month records.
`limitPayments` slices explicit-parent results after retrieval. The caller also
loads allocations before reducing the inferred parent set to `limitParents`.
Consequently the response's `dataRead.payments` and allocation totals can omit
records fetched for parents subsequently excluded from the report.

The source preflight and
`functions/test/milestone3ReadOperationCharacterization.spec.ts` reproduce query
shapes and mock SDK operations. They do not measure billed reads or production
financial correctness. Adding `.limit()` alone could silently drop charges,
credits, reversals or allocations and produce a false safe-to-backfill result.

## Dependency 1 — agree the completeness contract

The finance owner must define the exact parent/payment/month scope, archived-record
handling, chronology, opening balance, reversals, refunds and allocation semantics.
Specify whether the audit needs lifetime wallet history or a verified opening
balance plus an interval. Never assume a month filter is valid for wallet totals.
Preserve current selection/order semantics unless a separate product decision
explicitly changes them. Define treatment of parents with no payments and payments
without a valid parent mapping; do not silently expand or omit that population.

Expose an explicit result state: `COMPLETE`, `INCOMPLETE_BUDGET`,
`INCOMPLETE_CONCURRENT_CHANGE`, or `INVALID_SOURCE`. Partial subtotals cannot support
financial conclusions, a safe-parent decision or a write-authorizing report hash.
Consumers of the existing report/hash contract need a reviewed compatibility plan.

## Dependency 2 — design bounded traversal

1. Select only the approved parent scope; paginate parent discovery separately if
   a multi-parent audit is later authorized. Do not load child collections for
   parents that have already been excluded.
2. Use server-side page limits and deterministic cursors for **every** query:
   payments, allocations, billing charges, wallet transactions and monthly records.
   Keep explicit per-query, per-parent and whole-run request/row/time budgets.
3. Choose stable ordering with a document-ID tie-breaker. Current payment selection
   sorts `paidAt.toMillis()` with missing values treated as zero, then document ID.
   A new `orderBy(paidAt)` may exclude missing fields or change legacy ordering.
   Prove compatibility on synthetic legacy records before choosing an index/order.
   Do not silently change oldest-first selection into newest-first selection.
4. For scopes requiring all records, continue only within the approved run budget.
   A full last page is not proof of completion: obtain an end-of-scope signal, or
   return incomplete when the budget cannot establish it. Do not raise caps on
   overflow. Each additional page requires authorization appropriate to the future
   finance tool; it is **not** permitted for the current M3 principal sampler.
5. Support safe resumption with a scope/version-bound cursor stored privately.
   Retried pages must not double-count a document or ledger event. Do not expose
   cursors containing customer paths in GitHub, metrics or logs.
6. Establish a consistent source view across all child collections. Evaluate a
   supported consistent-read mechanism or explicit concurrent-change detection;
   an ID cursor alone is not a snapshot. If consistency cannot be proved, return
   incomplete and require a reviewed rerun. Do not introduce locks or other
   production writes as a side effect of a read-only audit.

Budget defaults, page sizes, required indexes and any API/schema changes need
separate review. This proposal deliberately does not guess production cardinality
or label an arbitrary page size a billing guarantee.

## Dependency 3 — required offline regressions

- Compare complete paginated output to an exhaustive **synthetic** reference for
  all totals, selected payments, allocations, safe/unsafe decisions and stable
  hashes. Do not use an unrestricted production scan as the reference.
- Cover empty, one-row, page-size minus/at/plus one, multiple-full-page and overflow
  cases for every query dimension; many allocations under one payment and long
  wallet histories under one parent must exhaust the appropriate independent cap.
- Cover equal/missing/invalid timestamps, document-ID ties, archived records,
  missing parent links, refunds/reversals, unallocated payments, cross-month
  transactions, parents with no payments and verified/unverified opening balances.
- Exercise retries, duplicate pages, stale/mismatched resume cursors, cancellation,
  timeout, permission failure, insertion/update/deletion between pages and source
  changes after parent selection. None may turn an incomplete result into complete.
- Verify one parent's query cannot traverse another parent; all queries have
  server limits; no write method is invoked; logs/results redact identifiers.
- Verify callers and hash consumers reject incomplete reports and cannot trigger
  backfills based on partial totals. Preserve existing financial idempotency tests.

## Dependency 4 — later evidence and rollout

Only after the above contract and tests pass, obtain separate approval for a small,
read-only production sample and a metrics window. Record SDK attempts, returned
documents, backend billed-read metrics and attributable incremental usage as
different quantities. Account for ambient traffic and metric delay; SDK counters
and `dataRead` are not substitutes for billing evidence.

Use a separate implementation PR and explicit deployment review. No financial
write-mode audit, correction, backfill, invoice, payout or wallet adjustment is
authorized by this proposal or by a successful read-only test.
