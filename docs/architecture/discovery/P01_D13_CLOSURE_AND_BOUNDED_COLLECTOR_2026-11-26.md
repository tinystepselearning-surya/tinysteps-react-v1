# P01.1-D13 closure and bounded offline reconciliation

**26 November 2026 IST. P01 remains in progress.** Audited runtime source `701c7ec832dbe9c531964496fa09cd4a4948ddd2`. PR #933 remains a draft stacked on #932. Existing application and Functions regression evidence from revision 18 remains valid. This increment adds offline tooling and verification only. P01.2, live P01.3, M3, production migration/retirement and P02 remain gated.

## Fresh verification and deployment lineage

| Check | Observed result |
|---|---|
| Firestore and Storage Rules | [Isolated GitHub Actions run 45793680024](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45793680024), candidate `0d2116137143b4a0f4db1f9e8426757c3cb018d4`. **99 passed across 15 files**: 94 Firestore and 5 Storage tests. Local loopback only, demo project, unchanged repository Rules, clean dependency install. |
| Exact-history deployment resolver | The unchanged CLI passed on revision 18 in run 45793680024 and on the code-bearing candidate `a5a6555c7cd956d12875c16d1953ae62e81f4148` in [run 45794381155](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45794381155). Full Git history was fetched. The CLI checked marker ancestry and reported Functions deploy/full false, zero impacted and retired targets, Hosting false, Rules false and Indexes false. No force-recovery flags were used. |
| Collector synthetic tests | **50 passed** using Node 22.22.1, including exact request bounds, preflight rejections, response faults, timeout/abort, single use, privacy boundary and issue-count parity with the unchanged identity and academic reducers. |
| Collector real emulator test | **1 passed** in [the collector and Functions job](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45794381155/job/139821162524). Verified the server projection, equality filter, ordering, read-only transaction and sentinel on synthetic demo data. |

Both runs used a read-only GitHub Actions workflow on the dedicated verification branch. The workflow stays outside PR #933 and its push trigger is restricted to that branch. The production deploy workflow was not invoked. The marker check is evidence for the tested SHAs, and owners must recheck on the eventual integration candidate if source or markers move.

| Artifact | Production marker resolved by the CLI |
|---|---|
| Functions | `ci/functions-production` at `00950ac1b2560cd0a99a2ae12b541c2af1ab23b4` |
| Hosting | `ci/hosting-production` at `701c7ec832dbe9c531964496fa09cd4a4948ddd2` |
| Firestore Rules | `ci/firestore-rules-production` at `b181dbca2e835869bf52b3ba0632b957234eae1d` |
| Firestore indexes | `ci/firestore-indexes-production` at `7f93c81a9eea909f06d76c1a2d6ba1c3df5b6e9f` |

Marker observations are Git evidence. Live deployed digests remain part of the metadata approval packet.

## Disposition of all 80 skipped Functions cases

Revision 18 intentionally ran its general Functions suite without an emulator. Review of the six source files and the retained test output accounts for every reported skip. The test groups below are disjoint. The SEO attribution emulator spec was excluded by Vitest configuration and is outside the 80-case denominator.

| Source file under `functions/test/` | Cases | Reason and verification covered | Targeted follow-up |
|---|---:|---|---|
| `leadDemoAutoWorkflow.emulator.spec.ts` | 11 | `FIRESTORE_EMULATOR_HOST` required for transactional demo request creation, canonical linked records, authorized retry, assignment and orphan reconciliation. Three source guards had already run. | 11 passed |
| `websiteLeadDeduplication.emulator.spec.ts` | 14 | Loopback Firestore required for duplicate concurrency, sibling identity, consent, attribution, history merge, redirect and conflict edges. | 14 passed |
| `leadFunnel.emulator.spec.ts` | 9 | Loopback Firestore required for lifecycle replay/idempotency, immutable received time, protected settled earnings and no-show/rescheduling states. | 9 passed |
| `getParentWorksheetResources.spec.ts` | 1 | Loopback Firestore required for the server ownership/enrollment query and cross-family projection test. Three unit cases had already run. | 1 passed |
| `milestone3FirestoreFinanceEmulator.spec.ts` | 34 | Dedicated `M3_FINANCE_EMULATOR_ONLY=1` guard, exact demo project and `127.0.0.1:8787`. Covers pinned snapshots, drift, query budgets, bytes, timeout, partial reads and retry accounting. | 34 passed on pinned emulator |
| `milestone3FirestoreFinanceCompatibility.spec.ts` | 11 | Same dedicated finance guard. Covers amount/rounding, allocation, idempotency, eligibility of evidence and stale-scope behavior on synthetic data. | 11 passed on pinned emulator |

All 80 are expected environment skips in the default suite. Those cases still represent offline verification requirements until their dedicated emulator commands pass. All 80 passed in targeted reruns. The 35 admissions and worksheet cases passed in run 45794381155. The first finance attempt on Firestore emulator 1.22.0 recorded 12 passes and 33 failures, including RPC timeouts. Repeating only those 45 cases with the repository's checksum-pinned 1.19.8 emulator, exact demo target and dedicated Vitest config passed in [run 45795077560](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45795077560). No existing code, thresholds or tests were changed to get a pass. No live M3 role, freshness, production finance or provider verification is implied.

## Implementation boundary

The approved manifest and requested query aliases are separate. The collector requires all approved aliases exactly once, dispatches them in manifest order and uses an immutable request shape. It accepts synthetic transport, or an explicitly named demo project at IPv4 loopback. It rejects production configuration. The bounded set query supports explicit top-level projection, optional approved equality predicates, document-ID order and a fixed cap plus one sentinel. Point reads reserve one slot. The full request and returned-document ceilings are reserved before the first read. The collector has no automatic retries and a collector instance cannot be reused.

Responses must be complete, scoped, filtered, ordered, duplicate-free and attested to a single snapshot. Missing required points, inconsistent statuses, timeouts, drift, failures and overflow stop the run before any aggregate. Transport failures are redacted. Projected records reach the injected reducer only after every read succeeds. The returned report contains predefined numeric metrics and counts. The unchanged audit reducers can be called by a trusted fixture summarizer.

The injected transport remains responsible for enforcing the actual query, snapshot and cancellation semantics. The test-only SDK transport uses an actual read-only transaction on the demo emulator. The collector itself has no credentials, SDK, production adapter or CLI. This slice handles fixed query plans with top-level masks only. Dynamic traversal, production manifest signing and retention, payload-byte limits, independent accounting of physical SDK attempts and billed/index reads require separate design and approval before any live collector can be considered.

## Source dependency findings

| Gap | Closure and residual question |
|---|---|
| PhonePe invoice writers | Commit `c4a6aed155b71e8a65ecd62687b87e453bf0cd33` removed the callable/webhook exports. Commit `fec02e9c9` removed their implementation modules. Those modules read and updated invoice status; an invoice creation authority was not identified. The parent router still mounts its payments screen, dynamic invoice checkout and callback routes. `src/lib/callFunctions.ts` retains both names in its region map. Invoice-management components have no located mounting references. Treat the reachable checkout as a compatibility path with retired source handlers. Current deployed endpoints, operational ownership and historical document volume remain unresolved. |
| Weekly and monthly student reports | `29537997a` introduced `generateWeeklyReport` and `publishWeeklyReport`. They wrote the student weekly path and rolled published data into the monthly path. `1e995ab8d` removed the backend module and exports. The Rules and indexes still reference both paths. Reclassify both as historical and preserve retention holds. |
| CSV import jobs | `adminProcessEnrollmentCSV.ts` created and updated `bulkUploadJobs` records. `fec02e9c9` removed that implementation. The Rules remain. Reclassify as historical source and verify other import operators separately. |
| Parent payment confirmations | Historical `ParentDashboard.tsx` wrote `paymentConfirmations` through a direct client submission. The change at `507a99e07` removed that writer. The Rules remain. Reclassify the historical workflow and retain the finance reconciliation hold. |
| Meta WhatsApp unmatched inbound | Commit `8a07398e8` removed the webhook producer and unmatched-inbound-to-lead trigger. The pinned Rules still retain the historical path. Classified as historical in the source catalogue. Retention, data existence and external writers remain unresolved. |
| Game skill statistics | Commit `4927cb31a` shows the historical `recordLevelResult` writer. Commit `f86e4ac88` removed the call and import. The pinned source retains the standalone helper and destructive cleanup script. Do not delete either or infer retention eligibility. |
| Legacy attendance reader | The standalone `useKidAttendance` export in `src/hooks/useData.ts` has no located caller in pinned source. Other hooks from that shared module are used by current Admin routes. Preserve the file. Check older client bundles before any retirement proposal. |
| Non-SDK database paths | `scripts/investigate_schedule_cancellations.mjs` and `scripts/runTeacherStudentSnapshotRepair.mjs` explicitly address Firestore `(default)` through REST. The latter includes a mutation path behind apply mode. Keep both outside verification execution. This adds source evidence for default-database assumptions and operator dependencies, independently of live infrastructure inventory. |

Catalogue coverage is **175 structural paths, 165 scoped, 10 unresolved**. That leaves three Rules-only unknowns and seven academic inventory probes. Dynamic, older-client and external ownership still require confirmation.

## Acceptance requirements for measured verification

| Evidence | Required measurement and decision |
|---|---|
| P01.5 bounded integrity | Name the domain owner, exact fixture cohorts and invariants from D10 I01–I13. Run on fixtures seeded with known missing references, duplicates, late events and drift. Record denominators, requests reserved and executed, documents returned, failed and excluded cohorts, timestamps/watermarks, discrepancy totals and independent reducer parity. Require complete coverage for each approved fixture scope and an explicit disposition for each discrepancy. Live aggregate sampling needs separate scope and approval. |
| P01.6 authorization | Preserve emulator allow/deny controls, exercise all applicable parent/teacher/Admin/founder/school boundaries, and record source and Rules digests plus positive and negative fixture results. Live role parity and deployed transport remain separately approved. |
| P01.7 performance/cost | Compare the same pinned workloads and fixture cardinalities with cold and warm caches, fixed concurrency and controlled retries. Measure p50/p95 latency, timeouts/error rate, Rules denials, projection freshness lag, returned documents and operation counts by artifact/domain. With approval, record authoritative billed reads/index-entry and write charges separately. Owner ratifies workload-specific limits and acceptable regressions before acceptance. |
| P01.7 recovery | Under metadata-only approval inventory Firestore backups/PITR, Storage retention, Auth/config recreation and external-provider recovery ownership separately. Propose per-domain RPO/RTO, then run a synthetic restore in an isolated target under separate authorization. Capture source checkpoint, loss window, time to usable service, cross-domain integrity/role validation and cleanup. Owner compares measured results with approved targets and signs recovery exceptions. |
| P01.8 / P01.9 | Keep existing migration ledger holds. Record the exact verified cohort, unresolved owners, approvals and evidence references. Require owner and independent reviewer sign-off before discovery acceptance and separate P02 authorization. |

Production metadata approval is still pending. No production reads, Rules edits, deployment, migrations or P02 work occurred.
