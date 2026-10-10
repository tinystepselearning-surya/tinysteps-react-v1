# Milestone 3, Step 2: Firestore finance consistency

## 1. Decision and scope

**READY_FOR_RUNTIME_DESIGN_REVIEW**, not production readiness. Milestone 3 remains **IN PROGRESS**. This test-only adapter establishes **A: a consistent audit of explicitly selected parents at one historical server readTime**. It does **not** establish **B: authorization to commit a later financial plan**. Every result and certificate proposal retains `writeAuthorized: false`.

No production records, credentials, sessions, billing metrics or Firebase configuration were accessed. No deployed implementation, Rules, indexes, Hosting or financial behavior changed. Issue #705 remains open for integration; #706 remains unapproved. The emulator uses only `demo-tinysteps-finance-consistency` on `127.0.0.1:8787`.

Baseline: latest fetched main `a739a4be37fe9b5b86868e4b984ae9a258af56c9`, incorporating merged [PR #704](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/704) and [PR #707](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/707). The prior offline report remains the exhaustive defect/reference inventory.

## 2. Existing defects remain unchanged

| Source on baseline | Confirmed behavior / risk |
| --- | --- |
| `functions/src/parentPaymentBackfillDryRun.ts:62–88` | Named-parent payment query has no server limit; cap is applied after retrieval. Global cap occurs before in-memory chronology, so selection is not globally chronological. |
| Same file, lines 90–105 | Every selected payment gets an uncapped allocation query through `Promise.all`; no independent allocation concurrency limit. |
| Same file, lines 128–135 | Charges, wallet transactions and monthly records are unbounded; wallet/profile are point reads. Parent population derived from selected payments omits zero-payment parents. |
| `functions/src/parentPaymentBackfillWriteMode.ts:102–145` | Verification covers selected payment/charge fields and planned allocation IDs. It does not prove complete histories or exclude new documents in other/previously empty scopes. |
| Same file, hash/planning and transaction path | Optional comparison hash is not source-completeness authorization. Single-parent dry-run filter differs from write-mode parent scope. Separate later rereads do not make the initial report atomic with writes. |
| `functions/src/parentMonthlyReadModels.ts:357–363,703` | Monthly rebuilding has additional uncapped charge/model traversal. Pagination of the audit alone does not bound the entire eventual write workflow. |

Retrieved rows, reducer-selected payments, planned patches and transaction-verified documents are different sets. The new collector retrieves all declared scopes, including archived/excluded records, before the **unchanged** reducer selects report records. A plan is a further subset. SDK operations count actual RPC dispatch; neither query returns nor plan size measures billed reads.

## 3. Installed SDK capabilities and evidence

Installed `@google-cloud/firestore` **7.11.6** (root and Functions), Functions `firebase-admin` **13.7.0**, Node **22.22.1**, pinned Firestore Emulator **1.19.8**. Production database edition, retention and indexes were deliberately not queried.

The installed SDK exposes read-only transactions with `readTime` and public v1 `runQuery`/`batchGetDocuments` streaming methods. Its read-only transaction declarations describe a consistent snapshot, no document locks and no automatic transaction retries; its `readTime` option documents a conservative 60-second window. Tests keep runs within 15 seconds. Latest web SDK reference versions are not substituted for the installed version.

The server [RunQuery contract](https://cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.documents/runQuery) supports transaction or readTime consistency selectors, including an empty-query readTime response. Historical retention/PITR provisions in that REST contract are not production settings verified here. The adapter requires identical returned timestamps on every response carrying readTime.

## 4. Consistency decision matrix

| Mechanism | Multiple collections, insert/delete, empty/child scopes | A: audit view | B: later writes | Evidence / overhead |
| --- | --- | --- | --- | --- |
| Independent current queries | Each query sees its own view; gaps between queries admit all mutations | No whole-audit proof | No | Baseline behavior; low apparent cost is insufficient |
| Read-only transaction / fixed server readTime | All declared scopes can be queried at the same historical instant, including empty allocations | Yes, for fully exhausted declared scope | No locks on future state; no | Documented semantics + actual emulator SDK experiment; pinned adapter adds one anchor point RPC |
| Individual updateTime/precondition | Covers only named document; child insertion does not update parent | No | Only that document | Actual stale update rejected; new allocation child did not invalidate parent precondition |
| Maximum time, count, repeated result/hash | Cannot prove absence of unseen inserts/deletes or changing empty scopes | No | No | Rejected as design, not used |
| Application revision document | Only if every relevant writer atomically advances it, including children/deletes | Potentially | Only if checked in same commit transaction | Not present or implemented; introducing it requires a complete writer inventory |
| Read-write transaction: complete scoped reads, recompute/compare, then writes | Serializable execution can bind queried financial state to commit | Yes within transaction | Practical proposed mechanism | Documented server semantics; full multi-scope phantom-race/write integration not implemented or certified by this emulator batch |

[Firestore transaction semantics](https://firebase.google.com/docs/firestore/transaction-data-contention) provide serializable isolation by commit time. A future write transaction must perform **all reads before writes**, revalidate all relevant inputs on every retry, and keep operation/row/time budgets across retries. A separate fresh audit before a later commit still has a race; the tests demonstrate that race. Do not reuse a historical readTime to claim a current write transaction is protected.

The PR707 interface comment describes a monotonic live revision. This adapter uses the same interface shape but a **different, explicitly declared consistency contract**: revision is an immutable snapshot identifier. Concurrent live changes can therefore yield `COMPLETE` for A. They are not silently claimed absent. Runtime design must encode this distinction in types/API before integration.

## 5. Emulator-only implementation

`functions/test/firestoreFinance/emulatorGuard.ts` checks the exact project, loopback endpoint and opt-in flag **before SDK import, construction or networking**. Tests prove the SDK loader is not invoked when the gate fails. Connection instances are privately branded; each operation rechecks the gate. Fixtures use random synthetic run namespaces and enumerated batch writes, never production discovery or collection scans.

`pinnedSource.ts` implements the existing collector Source with actual SDK RPCs. One missing synthetic anchor establishes server readTime. Payments/charges use explicit parent equality, `__name__ ASC`, server limits and exclusive document-reference cursors; nested histories have parent-qualified paths. Allocation requests require previously discovered payment ownership. HMAC cursor tokens bind snapshot, scope and full document path. Equal child IDs in different scopes are distinct records. Wallet/profile use point reads, with a cached terminal page after a present document.

Every required collection must reach an empty terminal page. This intentionally conservative strategy does not infer exhaustion from a short page. The adapter fetches payments, allocations, charges, transactions, monthly records, wallet and profile for explicitly selected parents, including zero-payment parents. No listeners, background tasks or recurring reads exist.

## 6. Budgets and memory

PR707 defaults remain test defaults: page 20; query rows 200 / attempts 30; parent rows 1,000 / attempts 200; run rows 4,000 / source operations 800; allocation concurrency 3; retries 2; run deadline 5s / request deadline 500ms. Experiments use explicit larger local timeout values (3s / 15s) and bounded scale overrides. Collector hard ceilings include page 100, concurrency 8, retries 3, parents 12.

The SDK layer independently reserves response capacity before dispatch and charges documents received even on a failed partial stream. Reservations cover query, parent and whole-run rows. SDK attempts are bounded independently of successful pages; collector attempt counters are more conservative because local terminal pages and rejected dispatches also count. No query is launched when its maximum response cannot fit. Consequently a boundary run may be incomplete even if the next query would have returned empty; safety takes precedence over exploiting unknown capacity.

GAX automatic retries are disabled (`retry: null`); controlled retries are charged by the collector. This avoids hidden high-level Query stream retries. Abort signals cancel outstanding streams; drain waits for settlement. SDK deadlines and whole-run deadlines fail closed. Default received-document byte cap is 2 MiB, configurable only up to 8 MiB. Row, byte and cursor bounds constrain retained data; this is not a measured process-RSS guarantee. A single incoming document may cross the byte cap before rejection. No partial report is then exposed.

## 7. Timestamp and selection compatibility

Real storage cases include missing timestamp, Timestamp, Date (stored as Timestamp), numeric, string, invalid, equal and submillisecond timestamps. Wire Timestamp decoding reproduces the unchanged reducer's `Timestamp.toDate()` **rounding** to milliseconds; `toMillis()` floors nanoseconds and would produce a subtle difference. Reference hashes match at this boundary.

An actual `orderBy('paidAt')` query returned seven of eight synthetic payments because the eighth lacked that field, consistent with [Firestore ordering behavior](https://firebase.google.com/docs/firestore/query-data/order-limit-data). Document identity transport order preserves that record. It is not the financial sort order. The legacy loader treats missing time as zero; the pure reducer's fallback ordering differs. Tests retain this distinction rather than replacing either rule.

**FINANCE-OWNER APPROVAL REQUIRED:** choosing all historical payments versus a legacy selected cap, changing global chronological selection, correcting unsafe eligibility after fuller histories, new timestamp policy, or changing hash filters. Matching the old truncated dataset is not the correctness target; matching unchanged calculations on identical complete inputs is.

## 8. Completeness states and failure evidence

- `COMPLETE`: exhausted scopes at a single pinned view; comparison report/hash permitted, never write authorization.
- `INCOMPLETE_BUDGET`: rows, attempts, bytes, concurrency capacity, timeout or retry exhaustion; no report/hash/usable plan.
- `INCOMPLETE_CONCURRENT_CHANGE`: conflicting source/snapshot evidence; no report/hash/usable plan.
- `INVALID_SOURCE`: invalid scope/cursor/data/source contract; no report/hash/usable plan.

Tests exercise empty/one/exact-page/page-plus-one/multipage histories; repeated IDs; insertion/deletion/amount changes between payment pages; charge insertion; wallet mutation; initially empty allocation insertion; repeated mutations during retries; duplicate page; invalid cursor; concurrent worker failure; timeout; abort; partial-stream failure and all row/attempt budgets. Pinned audit hashes remain the original view during mutations; a fresh audit sees changed values. This is expected A behavior, not live-change detection.

Fault injection is labeled: transient and mid-stream failures, replayed pages and revision mismatch are injected around real SDK queries. Source hooks cannot obtain certificate attestations. A malformed real SDK query (`collectionId` with slash) exposed emulator 1.19.8 behavior: it stalls until cancellation/deadline rather than reliably returning a validation error. The initial INVALID_SOURCE expectation failed; the final test explicitly verifies observed `INCOMPLETE_BUDGET`, cancellation/failure and no report. Compound-index rejection is **unverified** because the emulator does not enforce production compound indexes.

## 9. Versioned certificate proposal

`certificate.ts` is an offline trusted-issuer experiment, not a deployable authorization service. It accepts only privately attested COMPLETE results from the non-instrumented adapter. A signed envelope binds contract/calculation version, approved parents, complete scope manifest (including empty scopes), pinned readTime, source digest including document versions, fixed filters, transport/financial order, normalized unchanged legacy report hash, limits/byte budget/outcome/counters, issue/expiry times, nonce, idempotency key and required atomic write revalidation.

Tampered tokens, forged COMPLETE objects, foreign parent scopes, expired tokens, replay, reused idempotency keys, incomplete sources and changed source digests are rejected. HMAC key and replay/idempotency registry are ephemeral; future durable storage, trusted issuer authentication, key rotation and atomic consumption are prerequisites. A client-supplied hash is a comparison value, not trusted completeness evidence. Even a valid token only returns an offline proposal with `requiresAtomicRevalidation: true`.

Migration proposal: versioned audit response with explicit completeness state and opaque server certificate; UI must display incomplete reasons and disable approval when incomplete. A future versioned write request references certificate and idempotency key. Server recomputes/validates complete source in its write transaction and atomically records consumption. Preserve existing hash normalization; resolve the optional-hash and single-parent filter mismatch explicitly with finance-owner-approved API migration, never silently require the new token in existing endpoints.

## 10. Write-time boundary

The test demonstrates source change after separate certificate revalidation, while the proposal remains non-authoritative. The strongest simple next design is a bounded per-approved-scope read-write transaction with all necessary collection queries, unchanged reducer/allocator, certificate comparison, and writes/consumption in that same transaction. Scope size and transaction limits may make this unsuitable for large parents; such parents must fail closed until an approved alternative exists. Splitting into transactions changes the financial atomicity contract and requires owner approval.

No claim is made that the current write callable implements this design. Query phantom races, retry behavior under contention, all writer participation and full monthly rebuild dependencies need dedicated runtime-design tests. Individual payment updateTime guards cannot fill this gap.

## 11. Measured emulator operations

Measurements exclude synthetic seeding and deliberately injected mutation writes. Rows are actual returned documents, including any received before failures; operation counts include the anchor and empty-query/point responses. Successful benchmark cases had zero failed SDK operations. Collector page attempts, retries, duplicates, unique rows and SDK counters are emitted separately in `emulator-operations.json`.

| Synthetic case | State | Attempted SDK RPCs | Returned documents | Peak allocation requests |
| --- | --- | ---: | ---: | ---: |
| 0 payments with history | COMPLETE | 10 | 7 | 0 |
| 1 payment | COMPLETE | 13 | 9 | 1 |
| 2 payments | COMPLETE | 14 | 11 | 2 |
| 3 payments | COMPLETE | 17 | 13 | 3 |
| 9 payments | COMPLETE | 29 | 25 | 3 |
| 80 payments | COMPLETE | 98 | 87 | 3 |
| 8 payments × 30 allocations | COMPLETE | 43 | 255 | 2 |
| 2 payments + 100 ledger + 100 month records | COMPLETE | 33 | 209 | 2 |
| Three unequal parent histories | COMPLETE | 111 | 306 | 3 |
| 16 payments, concurrency ceiling 8 | COMPLETE | 44 | 71 | 8 |
| Run row budget 35 | INCOMPLETE_BUDGET | 5 | 35 | 0 |

An entirely absent parent completes in seven RPCs with zero documents. Scale fixtures include deliberately synthetic month IDs for transport stress, not financial eligibility. The partial-stream retry experiment consumes one returned document and two SDK attempts (anchor + failed query); capacity reservation refuses a retry that could exceed runRows=2.

Static scaling: one anchor + payment/charge/ledger/month pages and their terminal queries + one allocation traversal per payment + two parent point reads. Thus many empty allocation subcollections still impose linear RPC overhead. Larger approved page sizes reduce pagination overhead but increase reservation/memory pressure. There is no redundant end-of-run reread because fixed readTime already establishes A. Any future B revalidation costs additional reads and must be budgeted separately.

## 12. Production billing

**Production billed reads: NOT MEASURED.** RPC attempts, returned documents, unique rows and serialized byte counts are emulator/instrumentation measurements. They exclude billing-specific index-entry/minimum-query charges and retries below observation. No currency savings or production read-cost reduction is claimed.

## 13. Financial regression evidence

Unchanged production report, allocator, write-plan builder and hash functions are compared against exhaustive synthetic inputs. Coverage includes partial/full/overpayment, wallet-only/FIFO, historical dues/opening balance/refunds/reversals, archived and void/cancelled records, duplicate business transactions, cross-month allocation, existing allocation precedence, zero-payment parents and repeated identical timestamps. Synthetic application of a plan followed by recollection produces an idempotent skip with no payment/charge patches.

The prior 60 reference/pagination/write-boundary tests remain unchanged and passing. Whole-repository and Functions suites also cover existing backfill/hash/idempotency contracts. Improved completeness can legitimately change totals relative to truncated legacy reads; no runtime selection change is included here.

## 14. Emulator and production limitations

Observed emulator read-only transactions and explicit readTime queries retain old values across synthetic mutations. Documented server consistency provides the architectural basis; emulator observations alone are not production proof. [Firebase emulator limitations](https://firebase.google.com/docs/emulator-suite/connect_firestore) include transaction differences, missing compound-index enforcement and incomplete production limits. Index plans, contention/phantom behavior at actual operational scale, timeout policy and retention require separately approved verification. Unsupported wire values (references, geo points, bytes, unsafe integers/nonfinite numbers) fail closed pending a reviewed codec.

## 15. Owner decisions and blockers

1. Approve complete-source selection and timestamp/filter semantics before any runtime behavior changes.
2. Approve scope/atomicity, production budgets, certificate expiry and retry policy.
3. Resolve dry-run/write filter mismatch and optional hash migration; decide API/UI versioning.
4. Establish full transactional revalidation and durable certificate consumption, including every financial dependency and monthly rebuild.
5. Separately authorize production access through #706; this PR conveys none.

## 16. Recommended implementation sequence

Review A versus B and owner contracts first. Add a runtime-design-only transactional prototype with bounded full-source reads and concurrent insert/delete/empty-scope races next. Inventory every writer and derived rebuild read; test aborts/retries and idempotency as a whole. Only after finance-owner approval integrate a versioned server audit/certificate and UI completeness handling. Keep legacy reducer/hash unchanged until an explicitly approved migration. Production verification and deployment remain separate approval gates.

## 17. Validation and exact deployment impact

The dedicated `Milestone 3 Firestore Finance Consistency` workflow has read-only repository permission, no secrets and no deploy command. It downloads a SHA-256-pinned emulator, runs synthetic experiments, the previous 60 tests, full Functions/root suites, build/types/lint, then checks an exact test/docs/workflow path allowlist and deployment impact at the CI SHA. Existing Milestone 3 system CI supplies applicable Firestore/Storage Rules emulator checks.

Local results and final CI links are recorded in the PR handoff. Emulator tests are explicitly skipped in ordinary suites without the gate and are counted as passed only in the focused emulator job. Existing root lint warnings remain visible. No skipped test is treated as passing. The exact impact must report: Functions deployment false, full deployment false, impacted Functions 0, Firestore Rules false, indexes false, Hosting false. No merge or auto-merge is authorized.
