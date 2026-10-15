# Wave 1, R5 Milestone 3 — Step 7: payment selection and pagination compatibility gate

**Started:** 2026-10-15, Asia/Kolkata
**Reviewed base:** `main` `9290ddf2e70e05faafba288c1853dc79317f463e`
**State:** OFFLINE COMPATIBILITY IMPLEMENTATION AND TESTING. **Runtime callable integration blocked.** Issue [#705](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/705) remains open.
**Authority:** No production data reads, Firebase deployments, payment corrections, finance report authorization, backfills, security changes or permissions are requested or granted here.

## Why a simple page limit is not a finance fix

The current `functions/src/parentPaymentBackfillDryRun.ts` reads all named-parent payments before local `limitPayments` selection, fetches all selected allocations in parallel, and reads charges, wallet transactions and months without server caps. Global mode instead limits a query **before** sorting the returned subset. This can create incomplete or non-chronological evidence; the current write mode imports these loaders and selected-record checks do not protect against additional historical or phantom documents. Nothing in this PR changes that runtime behavior.

Step 4 validated complete-bounded synthetic traversal and one pinned Firestore emulator readTime. However the pinned emulator adapter decodes Firestore Timestamp into a JSON **ISO string**. The legacy live selector computes numeric `paidAt.toMillis()` **only when that method exists** and otherwise sorts with zero as the date. Once a Timestamp and a literal legacy string become indistinguishable, the offline adapter cannot establish legacy output ordering. An unqualified adapter replacement could change which payment is selected and the financial report hash.

## New executable, fail-closed test-only bridge

`functions/test/support/financeSelectionCompatibility.ts` accepts a certified complete result from the test-only paginator via `evaluateComplete`. It has **no Firebase SDK, network, reads, writes or runtime Function registration** and is not imported into deployed code.

It applies five conservative decisions:

1. **INCOMPLETE_SOURCE** on any incomplete, overflowed or forged result: no selected IDs, no report or hash, no write authorization.
2. **INVALID_SCOPE** for unsafe manifest bounds or cross-parent data.
3. **INCOMPLETE_SELECTION_LIMIT** if the fully verified named-parent history contains more payments than the specified output selection cap. It deliberately refuses to silently select a few payments as complete.
4. **CONTRACT_DECISION_REQUIRED** on global prelimit chronology or any present `paidAt` field, because the current adapter does not retain enough SDK field-type provenance to certify identical historical ordering. No sorting guess, hash or financial plan.
5. **COMPLETE_PREVIEW_ONLY** only for a completely exhausted, single approved parent scope with absent/null `paidAt` values and no selection truncation; zero financial write authority, zero billed-read claims.

Nine synthetic Vitest cases validate a 5-payment multi-page scope, output-limit overflow, ISO/legacy timestamp ambiguity, global chronology, incomplete budgets, cross-parent isolation, forged result rejection, and empty history. Tests run through the existing complete-scope paginator rather than accepting unverified source row arrays.

This intentionally conservative bridge **does not solve historical global chronology, timestamp type normalization, production query budgets, write-transaction isolation or actual billed-read measurement**. It prevents treating the existing test evidence as sufficient for those unsolved parts.

## Finance owner choices before production implementation

| Decision | Current source observation | Proposed conservative behavior (requires approval) |
| --- | --- | --- |
| Named-parent audit | Full history downloaded, then sort by `paidAt.toMillis() || 0` plus ID, then output selection | Page **the entire approved named-parent scope**; never truncate source to the report limit; if the fully observed source exceeds approved budgets, return incomplete and no report/hash |
| Global audit | Unordered Firestore `limitPayments` preselection, local chronology sort on that subset | **Do not silently change** to global oldest-first; owner must approve explicit deterministic global inclusion/order semantics |
| Timestamp forms | Firestore Timestamp numeric `toMillis` vs literal strings/missing/invalid are not equivalent | Preserve original Firestore field type or a proved compatibility normalization; block selection until a strict oracle establishes equality |
| Payment population | Some payments lack a valid parent mapping, some parents have no payments, archive/month filters vary | Require explicit approved inclusion and missing-parent policy rather than silently omitting records |
| Complete balances | Charges, wallet transactions, month models, refunds, reversals, archives | Fully traverse approved history under independently capped page/attempt/row/concurrency/time budgets, or fail closed |
| Write safety | Selected-doc checks cannot guarantee absence of newly inserted child records or changed empty scopes | Historical pinned audit is evidence only; later writes require a separately reviewed *current-state transactional* full-scope verification |
| Read budgets | SDK operations/results and `dataRead` are not Firestore billed reads | Measure billed reads under separate authorization; do not claim cost readiness from emulator counters |

### Merge/exit boundary

CI acceptance requires new selection bridge tests, all existing finance, Functions and app regressions, Firestore pinned emulator consistency, Typescript/lint, and current-head exact zero-deployment classification. This PR may be merged as **test-only guardrails** after those checks. It **cannot** close issue #705, grant production finance data access, enable `auditParentPaymentBackfillDryRun`, activate `applyParentPaymentBackfillForSafeParents`, or mark R5 Milestone 3 exited.

**Still needed from the finance owner:** Which deterministic *global-payment selection* and *legacy timestamp normalization* policy is approved? Until that decision, runtime integration remains on HOLD. The user's decision not to create dedicated production canary accounts is respected; issue #706 stays deferred, not passed.
