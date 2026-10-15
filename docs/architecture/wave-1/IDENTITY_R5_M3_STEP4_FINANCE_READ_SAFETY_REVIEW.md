# Wave 1 / R5 Milestone 3 — Step 4 finance-read safety revalidation

**Review date:** 2026-10-15, IST
**Baseline:** `main` `a9730104c967e414c639e7b8abd099ec448788d1` after Step 3 PR #725.
**State:** OFFLINE/SYNTHETIC VERIFICATION IN PROGRESS. CI status and run links are recorded separately on this PR. The deployed finance read/write workflows remain **BLOCKED for M3 production canaries**.
**Scope of this PR:** This report and `pull_request` triggers / test-only path allowlists in two existing finance verification workflows. Zero `functions/src`, client, Rules, indexes, Firebase settings, finance data, credentials or permissions changed.

## Current runtime source verification — risks still open

The existing live callables are **not** wired to the exhaustive, bounded test-only adapters built in PRs #707 and #708.

| Area | Current production source | Failure or billed-read risk | Safe disposition |
| --- | --- | --- | --- |
| Named-parent payments | `functions/src/parentPaymentBackfillDryRun.ts`, `loadParentPaymentBackfillPayments`, parent-specific `.get()` | All parent payments may be fetched before local `limitPayments` slice | Exclude live canaries until server-bounded, complete traversal |
| Global payments | Same source, global `.limit(limitPayments)` then JS `paidAt`/document-ID chronological sort | Truncated pre-sort subset may not represent oldest payments; absent/invalid timestamps complicate `orderBy` | Finance owner must approve deterministic complete selection semantics |
| Allocations | Each selected `payments/{id}/allocations` uses independent uncapped `.get()` inside `Promise.all` | Neither child rows nor simultaneous RPCs have independent limits | Budgeted traversal with allocation-specific concurrency guard |
| Parent scoped histories | `billingCharges` parent query, wallet `transactions` and `parentMonthlyReadModels/{id}/months` uncapped | Missing or oversized scopes can skew balances and bypass approximate read budgets | Complete scoped pagination, fail-closed overflow, explicit opening balance policy |
| Report and counters | `dataRead` counts filtered/selected output; `reportHash` hashes the selected report | Not a certificate that all matching source records were observed or all Firestore reads were billed | No safe-to-backfill conclusion from partial data / filtered read counts |
| Write mode | `functions/src/parentPaymentBackfillWriteMode.ts` uses selected-document transaction checks | Does not prove absence of inserted child documents, new payments or other previously empty source scopes; later month-model recompute has additional reads | NO live write-mode usage; full transactional source revalidation requires separate implementation and financial approval |

**Evidence limitations:** These are source-observed risks on the reviewed baseline, not new production incidents. We do not query Firebase or measure actual production billed reads in this step.

## Previously built test-only controls, being revalidated against latest main

PR #707 introduced an independently injected paginated synthetic collector, exhaustive reference, existing finance reducer compatibility, scoped deterministic cursors, per-query/per-parent/run budgets, allocation concurrency limits and incomplete-result fail closed semantics. It does **not** modify deployed financial callables.

PR #708 added an installed-SDK, disposable Firestore emulator adapter to read at one pinned server `readTime`, compare fully exhausted payment/charge/allocation/wallet/month scopes and document SDK operation/read-result counters. The test-only certificate always sets `writeAuthorized: false`. A pinned historical audit is not authority for later writes, and backend billed reads are not established by returned row or RPC counts.

**CI review gates for the same latest PR commit:**

1. `Milestone 3 Finance Offline`: new reference/pagination tests, full existing root and Functions regressions, prototype TypeScript checks, lint, code-only impact classifier.
2. `Milestone 3 Firestore Finance Consistency`: actual installed Firestore SDK over demo-only Firestore emulator, snapshot consistency, mutation/phantom/empty-scope cases, full root/Functions regressions and zero deployment impact.
3. Document CI results with run links, passing/skipped test totals, failures, diff scope and independent emulator-only resource isolation. A red CI result must not be relabeled as a passing milestone. Overlapping suite counts must not be added.
4. Confirm no changed deployed source, Firebase Rules/Storage or indexes, Firebase client configuration, scripts with live financial writes or ledger cutover flags. GitHub CI never receives production financial credentials.

## Independent broad regression discovery — five source-contract drifts

The **initial current-main reruns** both failed in the full root application suite, not the focused finance or Functions suites: **60 focused finance passed, 1,368 Functions passed; root 4,552 passed / 5 failed**. Both finance workflows correctly remain red. A diagnostic-only CI step now prints JSON-report failures without suppressing failures.

Five baseline assertions were linked to current deployed behavior and have been **updated in tests only**, subject to fresh full-suite validation:

1. AV7 session correction retains `batch.update(sessionRef, sessionUpdate, {lastUpdateTime: sessionUpdateTime})` version precondition. Replace a whitespace-dependent source match with a structured regular expression.
2. Teacher attendance status chooser now intentionally offers only **Present / Absent**, retaining historical `reschedule_requested` support in data types and readers.
3. Teacher attendance is committed in `db.runTransaction` before the AVS dirty marker, not via the old `await batch.commit()` path. Check the actual transaction-boundary ordering and leave Admin batch ordering protected.
4. Parent virtual schedule projection can open the enrollment Teams link without materializing a session; the old blanket block is obsolete. A no-join-link or terminal status still prevents joining.
5. Teacher virtual schedule projection is deliberately attendance-actionable; `ensureTeacherCalendarAttendanceSession` materializes exactly the selected occurrence before saving attendance. Merely displaying a timetable does not write a session.

Four `src/tests/` files are the **only additional changes**; the system CI has been extended to exercise them in its daily operational regression job. Both finance CI allowlists enumerate all changed paths exactly. No production source, Firestore Rules, business records, role grants or application deployment resources change.

**Acceptance remains blocked until every independent latest-head CI job passes.** Updating obsolete strings alone is not considered a successful repair without the real behavior checks already covered by emulator and prior Step 2.

## Finance owner decisions needed before production runtime integration

- **Payment selection:** historic oldest-first versus other chronology, `paidAt` absent/equal/invalid handling, document-ID ties, parentId mapping, payments with no parent and zero-payment parents. Changing semantics can change receipts, hashes and reconcile decisions.
- **Scope and balances:** include/exclude archived records; charges, refunds, reversals, partial payouts, credits and wallet opening balance versus lifetime ledger history; month filters cannot silently replace complete wallet information.
- **Bounded execution:** proposed page/query/row/concurrency/timeout/cost defaults; explicit approval for required indexes and legacy record cardinality; what status clients display on `INCOMPLETE_BUDGET`, `INCOMPLETE_CONCURRENT_CHANGE` and `INVALID_SOURCE`.
- **Source consistency:** pinned historical readTime can establish a complete audit but **cannot authorize** a later financial write. Financially complete write-mode validation needs an approved atomic transaction/revision contract protecting all source scopes including phantom insertions and future month-model recomputation.
- **Reporting/compatibility:** what constitutes a complete report and a stable report hash; old hash/caller compatibility migration; guarantee that partial data never produces an authoritative report, a write plan or a safe-to-backfill decision.
- **Owner-operated verification:** issue #706 still needs private explicit authenticated access permission, allowlisted exact non-sensitive resources and read budgets; finance operations remain excluded until this code is proven bounded and separately approved. No assumption that operation count equals actual billed reads.

## Gate and exit decision

**Step 4 offline safety verification can pass** when both independent CI workflows are green on this PR's final SHA, source risk register is confirmed, and zero-deployment classifier passes.

**Issue #705 remains OPEN** until an independently reviewed production integration establishes full-scope bounded reads without losing finance information. The existing prototype is not safe to connect to an actual write-capable path merely by replacing a query.

**R5 Milestone 3 remains IN PROGRESS** even with an offline Step 4 PASS; no real payment dry-run/backfill, teacher payout, wallet correction, finance settlement, authenticated production audit, Cloud Functions deployment, Rules cutover, or new permissions are authorized.

## Record evidence after CI

- Offline synthetic run: **PENDING**.
- Firestore emulator consistency run: **PENDING**.
- Changes / deployment classifier: **PENDING**.
- Production SDK billed reads and Firestore metrics: **NOT VERIFIED / NOT REQUESTED**.
- Runtime integration: **NOT IMPLEMENTED**.
- Live finance audit approval: **NOT APPROVED**.
