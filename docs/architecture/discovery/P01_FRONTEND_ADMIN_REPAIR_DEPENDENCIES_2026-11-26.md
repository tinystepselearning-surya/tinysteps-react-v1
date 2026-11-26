# P01.1-D2 — frontend, administrative and repair dependencies (26 November 2026 IST)

**Status:** Scoped source evidence verified; broader P01.1-D/P01.4 in progress. Pinned main 701c7ec832dbe9c531964496fa09cd4a4948ddd2, unchanged from D1. Draft PR #933 stacked on #932. No production access, invocation, mutation, Rules or runtime changes. Named engineering owner and reviewer remain pending. This is a source audit, not runtime reachability, authorization parity or incident proof. Code search used for candidate discovery followed by pinned file inspection; search is not an exhaustive call graph.

## 1. Actual frontend command paths

| UI source / anchor | Verified command flow and boundary |
|---|---|
| src/pages/teacher/components/schedule/ScheduleView.tsx:185–199,303–306,575–637 | Ad hoc booking calls createTeacherCalendarAdHocSession. Attendance on virtual projection calls ensureTeacherCalendarAttendanceSession then saveTeacherSessionProgress; if hasPresentOrLate, calls onSessionComplete. Confirmation cache read follows save; confirmation failure is handled separately. |
| src/pages/teacher/components/today-sessions/TodaySessionsList.tsx:91–159 | Same conditional ensure → save → finalize sequence; separate cache confirmation. No single transaction across calls. Preserve retries/partial-success semantics. |
| src/pages/admin/attendanceCorrectionTeacherPay.ts:77–170 | Without new teacher pay decision, directly calls adminAttendanceCorrection. Otherwise prepareAdminAttendanceCorrectionTeacherPayDecision → correction, best-effort cancel on failure; pending decision is separate state. |
| src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx:189,288,350,381,399,460,530–571,657,1021–1037 | Reads kid/session/enrollment/parent and teacher resources; missing-session create followed by correction helper. |
| src/pages/admin/HistoricalAttendanceMissingSessionPanel.tsx:147,256–259 | Candidate discovery callable and createAdminHistoricalAttendanceSession; preserve historical teacher selection. |
| src/pages/admin/attendanceCorrectionWorkflow.ts:50–73 | createMissingSessionAndSaveAttendance returns session identity, then separately saves attendance. On second-call failure throws AttendanceCorrectionAfterCreateError including created session ID; avoid recreating the session. |
| src/pages/admin/TeacherPayments.tsx:1170,1213 | recordTeacherPayoutV2 and voidTeacherOrphanEarnings. V2 used by this UI, not proof old callable has zero callers. |
| src/pages/admin/ParentPaymentsV2.tsx:699–745 | adminReceiveParentPayment preview dryRun:true; require current matching preview before apply dryRun:false; same receiveRequestKey. |
| src/pages/admin/ParentPayments.tsx:5–41 | V2 is default outside test mode; explicitly accessible lazy legacy maintenance workspace remains intentional, not dead code. |
| src/pages/admin/ParentPaymentsLegacy.tsx:2108,2176,2234,2285,2329,2396,2502,2573 | Wallet top-up, adjustments, reconciliation, get/set automation config and receipt operations. Preserve exceptional Admin tools and explicit authorization. |
| src/pages/admin/StudentManagement/StudentList.tsx:1653–1667,2079,2111,2177,2267 | Reads enrollment; routes lifecycle via rolling or compatibility callables; schedule reconcile/save and createAdminManualSession. |
| src/pages/admin/AdminDashboard.tsx:721,764,768 | Mounts attendance corrections, teacher payments and parent payments workspaces. |

**Important refinement to D1:** both current teacher attendance UI paths do explicitly call onSessionComplete after saving when hasPresentOrLate. Do not remove this supported completion call based on the index barrel comment about manual retry; the actual caller and server idempotency guard are source truth for migration. This is a documentation refinement, not a runtime fix.

## 2. Direct Firestore client writes — confirmed scoped paths

StudentList.tsx:1727–1768 subscribes to collectionGroup('sessionRequests'), requested status, order by startAt, limit 200. The dialog at 3103–3157 wires approval/rejection handlers. This is reachable in source UI, not evidence of actual production usage. At 2293–2384, Admin approval resolves enrollment/student and uses deterministic enrollment/date/time session ID, builds scheduled payload with identity aliases, times, feeAmount, currency, joinUrl, attendance:null and source:admin_approved_request. It performs setDoc(classSessions/{id}, payload, merge:true) then separately deleteDoc(request path). Reject at 2629–2638 deletes request. These are not atomic; no transaction/occurrence claim is visible in this handler. Rules for classSessions allow valid Admin client create/update/delete, per D1. Request collection permission and other matching Rules require follow-up before any migration.

| Other direct client write | Source |
|---|---|
| courses canonical/legacy metadata | StudentList.tsx:2405–2440 setDoc merges |
| config/curriculumTopics | StudentList.tsx:2498–2524,2556–2603 setDoc merges; canonicalization trigger separately listens |
| session request approval/rejection | StudentList.tsx:2380–2382,2636 |

**Risk candidate D2-R1 (priority review; not proven incident):** approval can partially succeed if request deletion fails after session write; repeat merge may overwrite existing session fields, including attendance/status, if same identity is reused. Scope is the observed handler, not proof a collision occurred. Before redesign, verify request producers, Rules, live request counts under separate approval, duplicate/protected-session guard behavior and retry/finance scenarios. Future command should preserve authorized explicit request approval, not revive background generation, and require idempotent protected-session handling plus atomic request disposition if approved. Do not delete this UI or alter Rules in discovery.

## 3. Admin historical, manual, timetable and repair paths

| Backend source / anchor | Read/write classification and preserved constraints |
|---|---|
| getAdminHistoricalAttendanceCandidates.ts:86–175 | Canonical Admin; query enrollments/classSessions by current and historical teacher aliases; reassignment subcollection and kid reads. Read-oriented, broad coverage; no approved live budget. |
| createAdminHistoricalAttendanceSession.ts:138–340 | Canonical Admin; past date, historical teacher/enrollment/identity checks. Existing enrollment/date/time query at 231 outside transaction; deterministic session ID check and session + audit creation in transaction 265 onward. Session created completed, historical fields retained; correction separate. Do not assume all child/time identities are locked by this transaction. |
| lifecycle.ts:1469–1573 | createAdminManualSession canonical Admin, operational enrollment, deterministic ID; session/audit create transaction. Explicit manual route distinct from retired recurrence generator. |
| lifecycle.ts:1574–1621 | cancelAdminManualSession canonical Admin, manual type and protected history/finance guards; cancellation batch plus audit. |
| lifecycle.ts:2122–2395 | reassignEnrollmentTeacher canonical Admin, child/current/new teacher and conflict checks; enrollment merge at 2276; retirement-controlled session handling; teacherReassignments audit write at 2333–2334 separately. Preserve original teacher snapshots, historical authority and partial-success behavior. |
| scheduling/rollingScheduleReconciliation.ts:543–670 | canonical Admin, operational rolling enrollment, fee and slots; retired branch updates recurrence and reconciliation metadata, removes obsolete materialization fields; not a future-session writer. |
| scheduling/rollingScheduleRepair.ts:407–445,499–509 | canonical Admin wrapper; apply:true fails closed at 412 while permanent retirement flag is true. Dry-run audits state; no revival of old writes; source message refers to historical daily generator but D1 verifies automatic generator retired. |
| parentPaymentBackfillDryRun.ts:60–135,180 | Reads payment/allocations, parent charges, wallet/transactions, monthly read models and user profile. Broad scoped data still excluded from live canaries per M3 safety preflight; no new approval. |
| parentPaymentBackfillWriteMode.ts:142–276 | canonical Admin; exact mode/confirmation, explicit parent allowlist, capped counts, rejects archived/drift/anomaly overrides, optional matching freshly recomputed report hash. Persists run and parent evidence, processes parent plans; write path not read-only. Full per-parent writes/rollback still to be traced. |
| financeReconciliationReport.ts:1240–1258,1274–1295,1309–1367 | Both callable and scheduled audit persist adminStats/financeReconciliationReports/runs/{runId}; failure report path exists. Diagnostic evidence mutation, not necessarily ledger repair. Not harmless read. |
| reconcileParentPaymentsMonthReadModels.ts:224–320 | canonical Admin, default dryRun:true, queries month charges and models, caps candidate parent count, wallet point reads in slices. With dryRun:false rebuilds mismatched parent read models, explicitly reports no payment/charge/wallet writes. Projection repair is still production mutation. |

**Risk candidate D2-R2:** historical/manual deterministic ID and occurrence claim boundaries differ; historical initial scan is outside transaction. Verify interaction with regular teacher child/date/time claims, prior enrollment transitions and legacy same-time sessions before unifying. No duplicate observed live.
**Risk candidate D2-R3:** reassign enrollment/audit separate writes and create-then-correct sequence require retry/reconciliation tests and clear user feedback; do not silently roll back a committed legitimate history event.
**Risk candidate D2-R4:** audit/preview/repair names do not prove safety; persisted report, scoped reads and apply branches need distinct execution policies. Existing M3 exclusions remain intact.

## 4. Teacher pay decisions, withholdings, adjustments, offsets

| Source anchor | Verified dependency |
|---|---|
| adminAttendanceCorrectionTeacherPayDecision.ts:103–240 | Prepare transaction reads session, earning, charge, writes teacherPayDecisions and session pending state/expiry. |
| same:245–286 | Cancel transaction checks same current decision ID before updating decision/session. |
| same:290–362 | Correction created-event link transaction checks decision child/status and validity, reads decision/earning, updates linked state. |
| teacherPayWithholdingSync.ts:92–357 | Earnings event; reads classSession; conditional direct/batch updates and transaction at 187; reads earning/session/teacherPayWithholdings/{sessionId}/teacherPayDecisions; creates withholding and updates earning/decision state. |
| teacherEarningAdjustmentSync.ts:108–557 | Earnings event; transaction at 157 reads earning/session/decision/adjustment plus adjustments and source/target offsets queries. Creates adjustment and updates earning/session/decision. Exact eligibility and loop/retry closure remain pending. |
| helpers/teacherPaymentOffsetLedger.ts:3–6,57,71,77,111,144,282 | Ledger v1; record type teacher_payment_offset, prior_overpayment_carry, source teacher_earning_adjustment; separates historical cash from offsets, deterministic ID planner and restoration validation. |
| recordTeacherPayoutV2.ts:144–547 (D1) | Cash payout and noncash offset creation in settlement transaction, using same earnings ledger; do not treat an offset as a new cash payment. |

Collection ownership seed (source contracts only; identifiers and amounts restricted): classSessions/{sessionId}/teacherPayDecisions/{decisionId} = decision workflow and historical evidence, expiry and disposition; teacherPayWithholdings/{sessionId} = withholding evidence, not cash payout; teacherEarningAdjustments/{adjustmentId} = adjustment evidence; teacherPaymentOffsets/{offsetId} = prior overpayment carry allocation; adminStats/financeReconciliationReports/runs/{runId} = diagnostic evidence; parentPaymentBackfillRuns/{runId}/parents/{parentId} = migration execution evidence. Exact fields/types and immutability policy remain open, no new registry IDs assigned.

## 5. Pending PR interaction and gates

Main still pinned, #932/#933 open; #928 (StudentList scheduling/Teams link) overlaps D2 frontend scope; #924/#925 and combined #927 remain pending and may change finance/worksheet paths. #929 lead changes separate. Prior changed-file inventories in B remain baseline, no pending PR absorbed. Re-pin and refresh affected rows if any merge. Owner/reviewer approval and actual deployment-impact resolver required before either documentation PR merges.

Verification: pinned source reads, actual callsites, scoped client writes, mutation classes and transaction boundaries. No fresh tests/CI, runtime coverage, production access or live data parity. D2 is scoped evidence, not full P01.1-D/P01.4 completion. P01.2/live P01.3 HOLD, P04 M3 HOLD. Rollback close/revert docs only; no runtime or data changes. Next D3: admissions/lead/demo/enrollment and identity/membership writer graph, plus follow-up explicit request producer/Rules and repair/offset closure; preserve D1/D2 and do not duplicate verified work.
