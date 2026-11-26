# P01.1-D10 — targeted integrity and authorization verification matrix

**Status: prepared, static checks verified, live verification HOLD.** 26 November 2026 IST. Source pinned to main 701c7ec832dbe9c531964496fa09cd4a4948ddd2; draft #933 stacked on #932. P01.5/P01.6 readiness evidence only. No production access, credentials loaded, application reads, mutations, deployment, migration or new runtime test execution. Existing strict Wave 1 M3 controls prevail.

## 1. Fresh source-only verification

Read back scripts/milestone3-canary-read-safety-preflight.mjs and its seven inputs from pinned GitHub source. Independently evaluated the same 19 invariant predicates against those exact source strings and parsed ledger (not execution of the repository Node CLI). All 19 true; no failed predicates:

| Predicate family | Passed / expected | Meaning |
|---|---:|---|
| Prior M1/M2 completed; M3 held | 2/2 | Existing ledger status only |
| Rules, Storage, target-user reader, pre-auth resolver, destructive operation flags | 5/5 | All false in ledger |
| Payment parent branch limit, post-fetch slicing, uncapped allocations, uncapped scoped detail, canonical dry-run guard, write callable guard | 6/6 | Risk exclusions remain necessary |
| Snapshot bootstrap, manual refresh, date query | 3/3 | All three remain excluded from live read-only canary |
| Canonical Admin guard without legacy users fallback | 1/1 | Source guard boundary |
| Operator sampler limits and no billed-read claim | 1/1 | SDK counts are not billing counts |
| Actor-bound v4 cache and authorization-denied handling | 1/1 | Source cache boundary |
| Total | 19/19 | Static predicates only |

Inputs: functions/src/parentPaymentBackfillDryRun.ts, parentPaymentBackfillWriteMode.ts, sessionsManagementSnapshot.ts, helpers/canonicalAdminGuard.ts; scripts/milestone3-bounded-principal-audit.mjs; src/lib/sessionsManagementSnapshot.ts; docs/architecture/wave-1/migrations/identity-foundation-v1.json. Existing script's expected verdict CANARY_NOT_AUTHORIZED_LIVE_EVIDENCE_PENDING; M3 finalExitGate not_attempted, productionMutationsAuthorized false. Passing checks intentionally confirm known risky branches, not safe operation of those branches.

## 2. Existing CI evidence and execution blocker

Reverified [scheduled CI run 45602427036](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45602427036), exact pinned head, completed success 25 Nov 2026 11:15:12 UTC. Three successful jobs: Canonical authorization + full Functions (includes M3 source, held-Rules inventory, canary safety, identity/deployment tooling, full Functions regression and build); Attendance, scheduling, finance and portals (operational contract regressions); Firestore Rules deny/allow emulator (Firestore roles and Storage exceptions/isolation). This is historical CI for main, not new CI for #933, and does not prove every proposed scenario below has coverage.

Recursive source tree untruncated; 836 paths matching test filename heuristics (not a count of executable test cases). Local runtime inspection: no repository checkout, no gh CLI, Node v22.16.0/npm 10.9.2 available, repository root package requires Node 22.22.1. Therefore no full local preflight, package install, emulator, or fresh regression execution claimed. scripts/preflight.mjs:9–44 depends on actual git refs/diffs; --plan is not a substitute for execution. Use isolated authorized checkout at exact candidate, pinned toolchain and synthetic fixtures. Check emulator target/host and command import side effects before running; never use actual project credentials for emulator tests. No dispatch of deployment workflow.

## 3. Integrity verification contracts (P01.5)

Proposed acceptance criteria below, not new runtime changes or approved live sampling. Existing tests are evidence leads, not proof of exhaustive coverage. For live checks, specify exact approved scope, field mask, aggregate counts, examined vs eligible denominator, date/revision, cap/overflow and unknowns. No raw IDs, contacts, learner content, payment amounts by individual or provider tokens in repository reports. Count mismatches by category; require explicit disposition, not automatic merge/repair. Zero unexpected mismatches is the proposed criterion within verified coverage, with legacy exceptions explicitly classified and reviewed.

| ID / priority | Invariant and test case | Existing source test evidence | Remaining evidence / acceptance |
|---|---|---|---|
| I01 high | Each eligible Auth UID maps to one valid canonical person; role/scope active, no conflicting ownership; separate protected archive vs hard delete | scripts/test/identity-reference-audit.node-test.mjs (healthy, alias mismatch, missing mapping, redaction); functions/test/canonicalAdminGuard.spec.ts; canonicalPrimaryAuthUserArchive.spec.ts | bounded canonical/legacy references, duplicate/ambiguous counts, Auth/Firestore partial failure and refresh; no new M3 canary |
| I02 high | Child, guardian, enrollment and course relationships consistent; active operation key unique; contradictory aliases fail closed | scripts/test/academic-enrollment-audit.node-test.mjs (healthy, missing course/enrollment/key, future group shape); teacherProgressAuthorization.rules.spec.ts | approved exact fixture and aggregate duplicate/reference counts; historical vs active scope; never merge by name |
| I03 high | One authoritative occurrence for eligible child/IST time, preserve retired future generation and makeup credit policy | sessionScheduleIntegrity.spec.ts; RollingScheduleCalendarProjection.spec.ts; functions/test/createSessionsFromSchedule.spec.ts | race between request approval, historical manual, virtual attendance and ad hoc writers; separate cancellation protection; no duplicate active occurrence |
| I04 high | Present/Late correction replay does not double accrue, nonbillable does not create money, paid records not erased | functions/test/attendanceFinanceIdempotency.spec.ts:5–154; attendanceFinancialCycles.spec.ts; historicalAttendanceCorrection.spec.ts | exact charge/earning links, cycle IDs, settlement/reversal and protected-history tests; aggregate discrepancies per service month |
| I05 high | Wallet event sums and balance summaries reconcile; payments/allocations and payouts/offsets retain separate ledger authority | src/tests/functions/ParentPaymentAllocator.spec.ts; parentMonthlyBillingReadModel.spec.ts; functions/test/teacherPayoutPeriod.spec.ts | concurrent append during summary reconciliation; opening/closing balance, reversal link, duplicate idempotency key, incomplete pagination; no balance repair |
| I06 high | AVS evidence, resolution, official attendance and finance remain distinct; pending-credit bridge and date scope enforced | functions/test/attendanceValidationReconciliation.spec.ts; attendanceValidationEvidenceFreshness.spec.ts; adminAttendanceCorrectionCompletionBridge.spec.ts | partial Graph result, stale evidence and retry checks; no provider calls or evidence refresh in read-only verification |
| I07 high | School scoped academic year/grade/section/staff membership, no cross-school linkage or unauthorized principal data | functions/test/schools.spec.ts; src/tests/firestore/schoolDomain.rules.spec.ts; schoolProgramme.rules.spec.ts | concurrent grade/section changes, future field redaction and independent school contexts; review aggregate counts only |
| I08 high | Parent child ownership, course assignment and resource targeting, no synthetic education event from identity-only backfill | functions/test/getParentWorksheetResources.spec.ts; parentCanonicalProjectionBootstrap.spec.ts; src/tests/firestore/childCourseProgress.rules.spec.ts, parentWorksheets.rules.spec.ts | projection rebuild vs live writer race; worksheet #925 not yet merged; external link revocation separately |
| I09 high | Message membership removed on reassignment; legacy messages not assumed retired; private recording links and token ownership | functions/test/canonicalAdminMessageThreadSyncRouting.spec.ts; D4/D9 source | cross-owner tests on reassignment, replay/notification count, provider folder/link privacy; current mounted legacy hook unknown |
| I10 medium/high | Snapshot baseline publication and deltas preserve operational date and revision; capped date view must not silently truncate | functions/test/sessionsManagementSnapshotRollingHorizon.spec.ts:15–91 | explicit 199/200/201 date rows, cold bootstrap excluded, failed lease/shard publication, actor cache switch |
| I11 medium | CRM first touch, return inquiry, one demo link, paid earning protection and teacher recruitment privacy | functions/test/leadDemoAutoWorkflow.emulator.spec.ts; demoCompletionCorrection.spec.ts; demoEarningPolicy.spec.ts; src/tests/firestore/publicLeads.rules.spec.ts, publicTeacherInquiries.rules.spec.ts | multiple different-day inquiry/ack history, transaction partial failure, attribution and deletion linkage; no marketing PII |
| I12 medium | Games event dedupe and rollup replay, public KB publication consistency, public stats privacy | D5 source; functions/test/canonicalAdminGameResultRouting.spec.ts, canonicalAdminPublicKbRefreshRouting.spec.ts | helper failure injection and concurrent direct progress writer; old/new chunk activation and public aggregate redaction; no refresh invoked |
| I13 high | Maintenance modes and diagnostic evidence correctly distinguished from no-write canary | D6/D7; scripts/test/milestone3-canary-read-safety-preflight.node-test.mjs:21–92 | verify default modes, audit persistence in dry-run, caps and stop conditions before invocation |

Existing audit CLI limitations: scripts/audit-identity-references.mjs:785–812 and audit-academic-enrollment.mjs:600–623 use field-selected but uncapped collection/collection-group and school nested gets. No approved global read ceiling. Do NOT run their production CLI merely because tests or comments say read-only; develop separately reviewed bounded adapters with completeness/overflow evidence. Their synthetic unit tests can run locally after import/entrypoint safety inspection (imports Firebase Admin but main gated by script entrypoint: identity 934–935, academic 746–747).

## 4. Authorization verification (P01.6)

Existing source tests confirm deliberate current held-Rules gap: milestone3AuthorizationParity.rules.spec.ts:106–194 expects legacy superUser Admin access in specific fixtures, canonical-only Admin denied on held legacy Rules, active legacy Admin allowed, inactive/orphan claims denied, Founder read-only and separate, two school/LP contexts and independent parent/teacher ownership. Do not change expected parity to imply cutover.

| Role | Proposed positive target (existing approved fixture only) | Proposed negative target | Existing source evidence |
|---|---|---|---|
| Global Admin | Admin projection-state exact doc | unauthorized resource/actor expectation per private matrix; no invented universal deny | canonicalAdminGuard.spec.ts; M3 parity tests |
| Founder | allowed finance read | Admin-only projection read; no live write probe | M3 parity:126–131, founderManagement.rules.spec.ts |
| School Admin | own school root | other school and global Admin projection | M3 parity:134–160, schoolDomain.rules.spec.ts |
| Learning Partner | assigned school | unassigned school / global Admin projection | M3 parity:142–160 |
| Teacher | own session | unrelated teacher session; cross-course progress denied in emulator only | M3 parity:164–194; teacherProgressAuthorization.rules.spec.ts:249–376 |
| Parent | own session or wallet | other family session/wallet | M3 parity:164–194; parentWorksheets.rules.spec.ts:45–66 (direct library denied) |

Kid role/unauthenticated and mutations remain emulator/synthetic coverage candidates, not additional live M3 actors without separate approval. Real browser auth and service operator IAM are separate. Only exact allowlisted existing non-sensitive point reads after private approval; no collection scan, app bootstrap route, callable, live write probe, impersonation outside approved actors, or provider read. Expected permission-denied passes negative; absent/not-found/network error inconclusive. Unexpected allow stops. Existing M3 private packet governs max 12 actors, 7 SDK get attempts per actor, max two person-scoped limit(51) queries, 107 returned documents per actor, metrics/retention/approval; not billed reads. P01.2 packet separate, zero application document reads. No approvals obtained.

## 5. Discovery exit checklist (P01.7–9 prerequisites)

| Gate | Current evidence | Required disposition |
|---|---|---|
| Source inventory | 198 scoped roots, 151/159 current catalogue paths scoped, 8 unresolved | exact remaining path delta (attendance/attendanceRecords, curriculum root), bounded risk-based closure of writers/scripts/native and typed fields |
| Deployment baseline | earlier marker evidence, scheduled CI pinned | actual integration candidate Git resolver, deployed digest metadata, independent review |
| Live metadata | packet prepared | named operator/owner, exact scope and approved limits; no production access yet |
| Data reconciliation | I01–I13 proposed; historical Wave1 ledger | bounded authorized aggregate data evidence, coverage and exceptions, no repair |
| Role parity | prior emulator and static predicates | current expected role matrix, authorized client point reads and independent sampler, no global cutover |
| Measured cost/recovery | source caps only | separate Cloud Monitoring/Billing approval, per-workflow read/write/latency/error/freshness and existing backup/PITR metadata, RPO/RTO proposal and authorized restore test outside production |
| Migration reconciliation | current ledger M3 held | recheck Wave0/1 and outstanding PR dependencies, owner risk disposition |
| Acceptance | draft docs and historical CI | named independent reviewer, owner approval; explicit UNKNOWN/HOLD for any unverified prerequisite; no P02 advancement on source-only evidence |

Next D11: consolidate P01 acceptance/gap handoff and measurable test execution path, recheck actual main and pending PR deltas, close remaining critical path/script unknowns with targeted evidence, prepare private approval handoff without collecting secrets; avoid repetitive general discovery. P01 remains IN PROGRESS, P01.5/P01.6 prepared only, live P01.2/P01.3 and M3 HOLD. No runtime change or production approval; documentation rollback close/revert.
