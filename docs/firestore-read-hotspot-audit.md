# Firestore Read Hotspot Audit

## Executive Summary
- Top 5 likely read sources:
  1. `sendClassReminder10Min` scheduled every minute and reading up to 300 `classSessions` plus one `enrollments/{id}` lookup per unique enrollment on each run (`functions/src/notifications/classReminders.ts:768-818`).
  2. Parent monthly read-model refresh on every `classSessions` write, because `onClassSessionReadModelWrite` calls `recomputeParentMonthAttendanceReadModel`, which scans `classSessions` by `parentId` and can fall back to a full parent scan (`functions/src/parentMonthlyReadModels.ts:190-215`, `functions/src/parentMonthlyReadModels.ts:656-667`).
  3. Teacher session hooks, especially `useTeacherSessions`, because it opens live `onSnapshot` listeners on `classSessions`, runs alias fallback `getDocs` queries, then fans out to `enrollments` doc-id lookups; this hook is mounted from at least three teacher surfaces (`src/pages/teacher/hooks/useTeacherSessions.ts:470-736`, `src/pages/teacher/components/schedule/ScheduleView.tsx:261-265`, `src/pages/teacher/components/today-sessions/TodaySessionsList.tsx:25-30`, `src/pages/teacher/components/schedule/TeacherAvailabilityEditor.tsx:135-139`).
  4. Parent dashboard queries, because the default dashboard/payments/classes flows mount multiple separate queries for `kids`, `enrollments`, `students/{id}/progress`, `billingCharges`, `payments`, `parentWallets`, `parentWallets/{uid}/transactions`, and `classSessions`, with several legacy full-scan fallbacks (`src/pages/parent/ParentDashboard.tsx:1435-1451`, `src/pages/parent/ParentDashboard.tsx:1505-1519`, `src/pages/parent/ParentDashboard.tsx:1625-1715`, `src/pages/parent/ParentDashboard.tsx:2266-2350`, `src/pages/parent/ParentDashboard.tsx:2397-2459`).
  5. Finance/admin repair utilities, especially the daily finance reconciliation audit and admin wallet/backfill tooling, because they intentionally scan large finance collections and then do linked doc lookups (`functions/src/financeReconciliationReport.ts:273-306`, `functions/src/financeReconciliationReport.ts:919-980`, `functions/src/wallet.ts:1472-1750`, `functions/src/wallet.ts:1753-1998`, `functions/src/parentPaymentBackfillDryRun.ts:56-177`).
- Most dangerous function: `sendClassReminder10Min`. It runs every minute, so even a moderate per-run read count compounds into six figures/day (`functions/src/notifications/classReminders.ts:768-818`).
- Main source split: Cloud Functions are more likely the main cause of the daily 90K-130K baseline because the highest-frequency scheduled job and the class-session-triggered read-model refresh can generate reads continuously without user traffic (`functions/src/notifications/classReminders.ts:768-818`, `functions/src/parentMonthlyReadModels.ts:656-667`). Frontend still looks materially additive, especially on teacher and parent dashboards (`src/pages/teacher/hooks/useTeacherSessions.ts:470-736`, `src/pages/parent/ParentDashboard.tsx:2266-2459`).

## Ranked Hotspots
| Rank | Source | Type | File | Collections | Estimated reads | Why high | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `sendClassReminder10Min` | scheduled | `functions/src/notifications/classReminders.ts:768-818` | `classSessions`, `enrollments`, `notificationTokens` | Worst case about 600 reads/run, about 864K/day if 300 sessions hit each minute | Minute-level schedule plus per-session enrollment fetch | P0 |
| 2 | `onClassSessionReadModelWrite` -> `recomputeParentMonthAttendanceReadModel` | Firestore trigger | `functions/src/parentMonthlyReadModels.ts:190-215`, `functions/src/parentMonthlyReadModels.ts:656-667` | `classSessions`, `parentMonthlyReadModels` | Worst case one parent-month scan on every session write | Triggered by every `classSessions/{sessionId}` write; fallback can scan all parent sessions | P0 |
| 3 | Parent dashboard mount path | frontend one-time queries | `src/pages/parent/ParentDashboard.tsx:1435-1451`, `src/pages/parent/ParentDashboard.tsx:1505-1519`, `src/pages/parent/ParentDashboard.tsx:1625-1715`, `src/pages/parent/ParentDashboard.tsx:2266-2459` | `kids`, `enrollments`, `students/*/progress`, `billingCharges`, `payments`, `parentWallets`, `classSessions` | Easily tens to low hundreds per open; higher on legacy fallback paths | Many parallel queries, some unbounded by month/date, plus fallback scans | P0 |
| 4 | `useTeacherSessions` across teacher screens | frontend listener | `src/pages/teacher/hooks/useTeacherSessions.ts:470-736` plus call sites above | `classSessions`, `enrollments` | One live listener + alias fallback queries + enrollment fan-out per mount; duplicated across screens | Same hook mounted in schedule, today list, and availability preview | P0 |
| 5 | `runFinanceReconciliationAuditDaily` | scheduled | `functions/src/financeReconciliationReport.ts:273-306`, `functions/src/financeReconciliationReport.ts:919-980` | `classSessions`, `billingCharges`, `teacherEarnings`, `payments`, `teacherPayouts`, `teachers/*/earnings`, linked `enrollments` | About 30K base reads/day plus linked lookups; worst case about 37K+ | Daily 5K caps across six collections plus 7K linked lookups | P1 |
| 6 | Admin `ParentPayments` screen | frontend mix of queries and listeners | `src/pages/admin/ParentPayments.tsx:1196-1316`, `src/pages/admin/ParentPayments.tsx:1418-1455`, `src/pages/admin/ParentPayments.tsx:1717-1733` | `users`, `billingCharges`, `payments`, `parentMonthlyReadModels`, `parentWallets`, `classSessions` | Tens to thousands depending on loaded parent count/mode | Batch loads scoped finance data and can fall back to per-parent queries | P1 |
| 7 | `previewMissingWalletDeductions` / `backfillMissingWalletDeductions` | callable admin | `functions/src/wallet.ts:1472-1750`, `functions/src/wallet.ts:1753-1998` | `billingCharges`, `parentWallets/*/transactions` | About 300-400 charges + one transaction query per parent in preview; up to 2000 charge scan in backfill | Manual, but designed as broad month scans | P1 |
| 8 | `auditParentPaymentBackfillDryRun` / write verification path | callable admin | `functions/src/parentPaymentBackfillDryRun.ts:56-177`, `functions/src/parentPaymentBackfillWriteMode.ts:142-170`, `functions/src/parentPaymentBackfillWriteMode.ts:395-408` | `payments`, `payments/*/allocations`, `billingCharges`, `parentWallets`, `parentMonthlyReadModels`, `users` | Payments query + allocation subquery per payment + full parent-scoped data | Manual, but expensive enough to matter if used repeatedly from admin UI | P1 |
| 9 | `batchInsightsRollup*` | scheduled | `functions/src/scheduled/batchInsightsRollup.ts:753-809`, `functions/src/scheduled/batchInsightsRollup.ts:1033-1064` | `config`, collection-group `gameSessions`, `kids`, `kids/*/gameSummaries`, `kids/*/gameProgress`, `kids/*/activity` | About `sessions returned + 4 per touched kid + 2 config docs`, three times/day | Collection-group scan and per-kid fan-out | P1 |
| 10 | `auditAllTransferredSessionSnapshotIssues` | callable admin | `functions/src/auditAllTransferredSessionSnapshotIssues.ts:678-706`, `functions/src/auditAllTransferredSessionSnapshotIssues.ts:708-778` | `classSessions`, `enrollments`, `kids`, `children`, `courses`, `users` | Default scan limit effectively 2500; max path effectively 10000 plus fan-out lookups | Manual but very broad multi-query scan | P2 |

## Cloud Functions Audit

### `sendClassReminder10Min`
- Trigger: scheduled every minute (`functions/src/notifications/classReminders.ts:768-775`).
- Reads: `classSessions` in a time window with `limit(300)` (`functions/src/notifications/classReminders.ts:782-787`), then one `enrollments/{id}` read per unique session enrollment (`functions/src/notifications/classReminders.ts:806-818`).
- Scope: date-scoped by `startAt`, but not teacher- or parent-scoped.
- `limit()`: yes, but still very high because the function runs 1,440 times/day.
- Fan-out: yes, session loop performs extra enrollment reads (`functions/src/notifications/classReminders.ts:797-818`).
- Estimated worst case: 300 session reads + 300 enrollment reads per minute.
- Why it fits 90K-130K/day: even 35-50 reads/run averages 50K-72K/day; spikes scale fast.
- Fix priority: P0.

### Parent monthly attendance read model refresh
- Trigger: Firestore trigger on every `classSessions/{sessionId}` write (`functions/src/parentMonthlyReadModels.ts:656-667`).
- Reads: scans `classSessions` by `parentId`, month-bounded when possible (`functions/src/parentMonthlyReadModels.ts:196-204`), but falls back to full parent scan on query failure and again when bounded query is empty (`functions/src/parentMonthlyReadModels.ts:205-215`).
- Scope: parent-scoped, optionally month-scoped, but fallback is broader.
- `limit()`: none.
- Fan-out: no doc-by-doc extra reads in the attendance branch, but the scan itself repeats on every triggering write.
- Estimated worst case: one full parent session scan for each class-session write touching that parent.
- Why it fits daily usage: class session documents are likely updated many times per class lifecycle, so repeated parent scans can become a baseline read tax.
- Fix priority: P0.

### `runFinanceReconciliationAuditDaily`
- Trigger: scheduled daily at 02:15 IST (`functions/src/financeReconciliationReport.ts:954-980`).
- Reads: up to 5,000 docs each from `classSessions(revenueRepairRequired)`, `classSessions(completed)`, `billingCharges`, `teacherEarnings`, `payments`, and `teacherPayouts` (`functions/src/financeReconciliationReport.ts:280-306`), plus linked `enrollments`/session lookups (`functions/src/financeReconciliationReport.ts:155-177`) and one `teachers/{id}/earnings/{monthKey}` doc per teacher (`functions/src/financeReconciliationReport.ts:706-717`).
- Scope: mostly month-scoped for finance collections, but `classSessions(status == completed)` is not month-scoped until after fetch (`functions/src/financeReconciliationReport.ts:282-283`, `functions/src/financeReconciliationReport.ts:319-320`).
- `limit()`: yes, 5,000 caps by default (`functions/src/financeReconciliationReport.ts:931-933`, `functions/src/financeReconciliationReport.ts:963-967`).
- Fan-out: yes, linked-doc fetches and per-teacher rollup reads.
- Estimated worst case: about 30,000 collection reads + about 7,000 linked lookups + per-teacher reads.
- Why it fits daily usage: a single scheduled run can consume a large share of the paid overage by itself.
- Fix priority: P1.

### `batchInsightsRollup11am/5pm/11pm`
- Trigger: scheduled three times/day (`functions/src/scheduled/batchInsightsRollup.ts:1033-1064`).
- Reads: `config/insights`, `config/gamesCatalog`, collection-group `gameSessions` since `lastRunAt`, then per touched kid: `kids/{kidId}`, `kids/{kidId}/gameSummaries`, `kids/{kidId}/gameProgress`, `kids/{kidId}/activity/head` (`functions/src/scheduled/batchInsightsRollup.ts:756-809`).
- Scope: time-scoped by `createdAt > lastRunAt`, but cross-parent because it is a collection-group query (`functions/src/scheduled/batchInsightsRollup.ts:771-776`).
- `limit()`: none.
- Fan-out: yes, one four-read bundle per touched kid.
- Estimated worst case: `sessionsSnap.size + 4 * uniqueKids + 2`.
- Why it fits daily usage: if many kids play games between runs, the per-kid fan-out can become material.
- Fix priority: P1.

### `previewMissingWalletDeductions`
- Trigger: admin callable (`functions/src/wallet.ts:1472-1478`).
- Reads: month-scoped `billingCharges` query capped by `batchLimit + 1` (`functions/src/wallet.ts:1507-1514`) and one full `parentWallets/{parentId}/transactions` query for every parent represented in the result (`functions/src/wallet.ts:1589-1598`).
- Scope: month-scoped, not parent-scoped by default.
- `limit()`: yes, caller-controlled 1-400 with default 300 (`functions/src/wallet.ts:1497-1504`).
- Fan-out: yes, extra transaction query per parent.
- Estimated worst case: about 400 charge reads plus all deduction-transaction docs for every matching parent.
- Why it fits daily usage: not a baseline unless admins run it repeatedly, but it is expensive enough to matter.
- Fix priority: P1.

### `backfillMissingWalletDeductions`
- Trigger: admin callable (`functions/src/wallet.ts:1753-1759`).
- Reads: paginated month-wide `billingCharges` scan up to internal cap 2,000 (`functions/src/wallet.ts:1808-1844`) plus one full `class_deduction` transaction query per parent (`functions/src/wallet.ts:1948-1957`).
- Scope: month-scoped, broad.
- `limit()`: internal page limit/cap only, not user-facing pagination for the full scan.
- Fan-out: yes, parent transaction subcollection scans.
- Estimated worst case: 2,000 charge reads plus all parent transaction reads.
- Why it fits daily usage: same as preview; dangerous if exposed through admin workflow.
- Fix priority: P1.

### `auditParentPaymentBackfillDryRun`
- Trigger: admin callable (`functions/src/parentPaymentBackfillDryRun.ts:180-189`).
- Reads: `payments` query (`functions/src/parentPaymentBackfillDryRun.ts:60-75`), allocation subcollection read for each selected payment (`functions/src/parentPaymentBackfillDryRun.ts:90-105`), then per parent `billingCharges`, `parentWallets`, wallet transactions, monthly read models, and `users/{parentId}` (`functions/src/parentPaymentBackfillDryRun.ts:128-177`).
- Scope: parent-scoped when a parent is supplied; otherwise month-scoped and capped by `limitPayments`.
- `limit()`: only on root payments query when `parentId` is absent (`functions/src/parentPaymentBackfillDryRun.ts:71-73`).
- Fan-out: yes, allocation query per payment and five reads/scans per parent.
- Estimated worst case: roughly `payments + allocations + parent-scoped scans`.
- Why it fits daily usage: manual-only, but repeated dry-runs could create noticeable spikes.
- Fix priority: P1.

### `applyParentPaymentBackfillForSafeParents`
- Trigger: admin callable, write mode only (`functions/src/parentPaymentBackfillWriteMode.ts:142-170`).
- Reads: initial payments load per parent, parent-scoped data load, then a second verification pass that reloads payments and parent-scoped data after writes (`functions/src/parentPaymentBackfillWriteMode.ts:395-408`).
- Scope: capped to `maxParents` default 5, max 20, and `maxPaymentsPerParent` (`functions/src/parentPaymentBackfillWriteMode.ts:188-190`).
- `limit()`: yes, but verification doubles the read path.
- Fan-out: yes, because the verification step re-runs the expensive loaders.
- Estimated worst case: roughly 2x the dry-run read volume for the same parents.
- Why it fits daily usage: unlikely baseline; still production-dangerous when manually invoked.
- Fix priority: P1.

### `auditAllTransferredSessionSnapshotIssues`
- Trigger: admin callable (`functions/src/auditAllTransferredSessionSnapshotIssues.ts:678-706`).
- Reads: two `classSessions` scans using `scanLimit = max(limit * 5, 1000)` (`functions/src/auditAllTransferredSessionSnapshotIssues.ts:706-715`), then direct enrollment doc reads plus four more enrollment fan-out queries by kid IDs (`functions/src/auditAllTransferredSessionSnapshotIssues.ts:740-747`), then per-kid and per-course doc fetches (`functions/src/auditAllTransferredSessionSnapshotIssues.ts:772-776`).
- Scope: date-scoped, not user-scoped.
- `limit()`: yes, but default limit 500 and max 2000 still imply scan windows of 2500 to 10000 (`functions/src/auditAllTransferredSessionSnapshotIssues.ts:13-14`, `functions/src/auditAllTransferredSessionSnapshotIssues.ts:691`).
- Fan-out: heavy.
- Estimated worst case: thousands of session reads plus thousands of linked lookups.
- Why it fits daily usage: probably not baseline unless admins are using it repeatedly.
- Fix priority: P2.

### `repairEnrollmentTeacherSessionConsistency`
- Trigger: admin callable (`functions/src/lifecycle.ts:1379-1380`).
- Reads: if no filter is provided it reads the full `enrollments` collection (`functions/src/lifecycle.ts:1390-1399`), then reads `kids/{kidId}` and deeper repair queries per enrollment (`functions/src/lifecycle.ts:1413-1423`).
- Scope: optional single-enrollment or full-scan.
- `limit()`: none on the full-enrollment path.
- Fan-out: yes.
- Estimated worst case: all enrollments + one kid doc + session repair work per active enrollment.
- Why it fits daily usage: likely manual, but dangerous if an admin runs it broadly in production.
- Fix priority: P2.

### Lower-risk Cloud Function surfaces
- Firestore trigger `onGameSessionCreateTrigger` reads only a few docs per event: idempotency marker, `config/gamesCatalog`, level marker, and progress doc (`functions/src/triggers/onGameSessionCreate.ts:132-176`, `functions/src/triggers/onGameSessionCreate.ts:194-220`). This is not a top hotspot.
- `globalLearnersRollup` does a full parent-user scan once/day (`functions/src/scheduled/globalLearnersRollup.ts:180-206`). It is broad but likely much smaller than the minute-level reminder job.
- HTTP functions found in this pass are `contactForm`, `whatsAppWebhook`, `whatsappWebhookV2`, and `notFoundRoute` (`functions/src/contactForm.ts:152`, `functions/src/whatsapp.ts:540`, `functions/src/whatsappWebhook.ts:18`, `functions/src/notFoundRoute.ts:13`). None surfaced in the read-pattern search as major Firestore scan hotspots.
- One callable admin utility worth flagging separately is `adminUpdateUser`, because it full-scans `users` to enforce uniqueness (`functions/src/adminUpdateUser.ts:109-126`). It is likely low-frequency, but the query shape is bad.

## Frontend Listener Audit

### Parent dashboard
- Route/page: parent dashboard.
- Query gating: tabs reduce some work, but dashboard still loads billing and class-session data by default (`src/pages/parent/ParentDashboard.tsx:1435-1451`).
- Queries:
  - `kids` by `parentIds array-contains` (`src/pages/parent/ParentDashboard.tsx:1505-1519`).
  - Two `enrollments` queries plus legacy `studentId in` fallback chunks (`src/pages/parent/ParentDashboard.tsx:1625-1683`).
  - Full `students/{id}/progress` subcollection read with no limit (`src/pages/parent/ParentDashboard.tsx:1686-1704`).
  - `billingCharges` current month query, then full parent-history fallback when canonical month rows are absent (`src/pages/parent/ParentDashboard.tsx:2266-2303`).
  - Full parent `payments` query with no month or limit (`src/pages/parent/ParentDashboard.tsx:2306-2320`).
  - `parentWallets/{uid}/transactions` limited to 20, which is fine (`src/pages/parent/ParentDashboard.tsx:2336-2350`).
  - `classSessions` query for the selected kid; recent mode is date-scoped, classes tab can switch to full history (`src/pages/parent/ParentDashboard.tsx:2397-2459`).
  - `parentClassRecordings` full parent query with no limit (`src/pages/parent/ParentDashboard.tsx:2524-2539`).
  - Worksheet library fan-out queries by course chunk plus legacy parent-target query (`src/pages/parent/ParentDashboard.tsx:2572-2606`).
- Duplicated/hidden tab risk: low-to-moderate. The code does gate by `activeTab`, but the default dashboard tab still mounts several expensive queries at once.
- Estimated reads per open: often tens; can exceed 100 when parent history/progress collections are large or legacy fallbacks trigger.
- Fix priority: P0.

### `useTeacherSessions`
- Route/page: teacher schedule, today sessions, availability preview.
- Hook/component: `useTeacherSessions` (`src/pages/teacher/hooks/useTeacherSessions.ts:470-736`).
- Number of listeners/queries:
  - One primary `onSnapshot` on `classSessions` (`src/pages/teacher/hooks/useTeacherSessions.ts:716-736`).
  - Alias fallback `getDocs` queries through `fetchTeacherSessionAliasFallbacks` (`src/pages/teacher/hooks/useTeacherSessions.ts:649-713`).
  - Batched `enrollments` doc-id lookups for every visible session batch (`src/pages/teacher/hooks/useTeacherSessions.ts:456-467`, `src/pages/teacher/hooks/useTeacherSessions.ts:554-579`).
- Duplication risk: high. The same hook is mounted in `ScheduleView`, `TodaySessionsList`, and `TeacherAvailabilityEditor` preview (`src/pages/teacher/components/schedule/ScheduleView.tsx:261-265`, `src/pages/teacher/components/today-sessions/TodaySessionsList.tsx:25-30`, `src/pages/teacher/components/schedule/TeacherAvailabilityEditor.tsx:135-139`).
- Estimated reads per open: each mount replays the same live query and enrollment fan-out; concurrent teacher screens can multiply reads by 2-3x.
- Fix priority: P0.

### `useUpcomingSessions`
- Route/page: teacher upcoming sessions.
- Hook/component: `useUpcomingSessions` (`src/pages/teacher/hooks/useUpcomingSessions.ts:358-626`).
- Number of listeners/queries:
  - Two live listeners (`primary` plus explicit `teacherIds`) (`src/pages/teacher/hooks/useUpcomingSessions.ts:372-381`, `src/pages/teacher/hooks/useUpcomingSessions.ts:599-626`).
  - Alias fallback `getDocs` queries for `assignedTeacherId`, `primaryTeacherId`, `teacherUid`, `teacher_id` (`src/pages/teacher/hooks/useUpcomingSessions.ts:531-597`).
  - Enrollment doc-id lookups per merged session batch (`src/pages/teacher/hooks/useUpcomingSessions.ts:416-467`).
- Duplication risk: medium. It is a single screen, but it already opens multiple session sources at once.
- Estimated reads per open: several snapshot result sets plus follow-on enrollment reads.
- Fix priority: P1.

### `useTeacherStudents`
- Route/page: teacher students.
- Hook/component: `fetchTeacherStudents` (`src/pages/teacher/hooks/useTeacherStudents.ts:19-95`).
- Number of queries:
  - 2 `kids` queries (`src/pages/teacher/hooks/useTeacherStudents.ts:20-27`).
  - Full `courses` collection read with no filter or limit (`src/pages/teacher/hooks/useTeacherStudents.ts:32-38`).
  - 6 `enrollments` queries across alias fields (`src/pages/teacher/hooks/useTeacherStudents.ts:42-55`).
  - One `users/{parentId}` or `parents/{parentId}` read per distinct parent (`src/pages/teacher/hooks/useTeacherStudents.ts:80-95`).
- Duplication risk: medium.
- Estimated reads per open: broad teacher-scoped scans plus per-parent fan-out.
- Fix priority: P1.

### Teacher earnings page
- Route/page: teacher earnings.
- Hook/component: `EarningsSummary`.
- Number of queries:
  - Teacher enrollments query (`src/pages/teacher/components/earnings/EarningsSummary.tsx:605-643`).
  - Month sessions query with full-teacher fallback if the date-scoped query fails (`src/pages/teacher/components/earnings/EarningsSummary.tsx:766-790`).
  - Per-student cross-collection `getDoc` loop over `kids`, `students`, `children` (`src/pages/teacher/components/earnings/EarningsSummary.tsx:813-857`).
  - Full `teacherEarnings` query with no month filter (`src/pages/teacher/components/earnings/EarningsSummary.tsx:874-889`).
- Duplication risk: medium.
- Estimated reads per open: potentially hundreds if teacher earnings history is large.
- Fix priority: P1.

### Admin `ParentPayments` screen
- Route/page: admin parent payments.
- Number of queries/listeners:
  - Batch reads `users`, `billingCharges`, `payments`, `parentMonthlyReadModels`, and `parentWallets` for every loaded parent (`src/pages/admin/ParentPayments.tsx:1217-1316`).
  - Fallback path degrades to one query per parent for `billingCharges` or `payments` if `in` query fails (`src/pages/admin/ParentPayments.tsx:1241-1264`).
  - Loads referenced `classSessions` by chunk from gathered `sessionIds` (`src/pages/admin/ParentPayments.tsx:1196-1208`).
  - Opens live listeners for one selected wallet summary and its last 20 transactions (`src/pages/admin/ParentPayments.tsx:1418-1455`).
  - Top-10 fallback can derive parents from `billingCharges` if read models are absent (`src/pages/admin/ParentPayments.tsx:1717-1733`).
- Duplicated/hidden tab risk: medium; the page can reload scoped datasets each month/mode change.
- Estimated reads per open: very sensitive to `loadedParentIds`; in “all parents” style modes it can become one of the heaviest frontend screens.
- Fix priority: P1.

### Lower-priority frontend surfaces
- `useMessageThreads` uses a single `onSnapshot` limited to 100 docs (`src/hooks/useMessageThreads.ts:197-205`). It is not free, but it is not a top hotspot.
- `useUpcomingSessions` for parents reads all parent-owned `classSessions` and all parent-owned `enrollments` without date limits (`src/pages/parent/hooks/useUpcomingSessions.ts:52-57`, `src/pages/parent/hooks/useUpcomingSessions.ts:81-83`). This is still worth a P2 review if the hook is mounted often.
- `TeacherAvailabilityEditor` itself adds extra live listeners for `blockedSlots` and all assigned `demoSessions` on top of `useTeacherSessions` (`src/pages/teacher/components/schedule/TeacherAvailabilityEditor.tsx:178-219`).

## Immediate Fix Plan
1. Add hard instrumentation first around `sendClassReminder10Min` and the `onClassSessionReadModelWrite` -> `recomputeParentMonthAttendanceReadModel` path, because those are the two strongest always-on suspects (`functions/src/notifications/classReminders.ts:768-818`, `functions/src/parentMonthlyReadModels.ts:190-215`).
2. Remove fallback full scans from parent monthly read models and parent dashboard finance queries. The worst offenders are the parent-scan fallbacks in `parentMonthlyReadModels` and `ParentDashboard` billing/payments flows (`functions/src/parentMonthlyReadModels.ts:205-215`, `src/pages/parent/ParentDashboard.tsx:2289-2303`, `src/pages/parent/ParentDashboard.tsx:2313-2320`).
3. Collapse teacher session consumers so `ScheduleView`, `TodaySessionsList`, and `TeacherAvailabilityEditor` do not each open their own `useTeacherSessions` pipeline (`src/pages/teacher/components/schedule/ScheduleView.tsx:261-265`, `src/pages/teacher/components/today-sessions/TodaySessionsList.tsx:25-30`, `src/pages/teacher/components/schedule/TeacherAvailabilityEditor.tsx:135-139`).
4. Gate admin finance tools more aggressively. `ParentPayments`, wallet backfill callables, finance reconciliation, and payment backfill utilities are all broad enough that they should not be casually opened or run in production (`src/pages/admin/ParentPayments.tsx:1217-1316`, `functions/src/wallet.ts:1472-1998`, `functions/src/financeReconciliationReport.ts:919-980`, `functions/src/parentPaymentBackfillDryRun.ts:56-177`).
5. Replace broad full-history reads with month-scoped or paginated reads in the parent dashboard and teacher earnings screen (`src/pages/parent/ParentDashboard.tsx:2313-2320`, `src/pages/teacher/components/earnings/EarningsSummary.tsx:780-789`, `src/pages/teacher/components/earnings/EarningsSummary.tsx:883-889`).
6. Review callable repair/audit utilities and add stronger manual-run guards before any admin UI exposes them further. The riskiest are `auditAllTransferredSessionSnapshotIssues`, `repairEnrollmentTeacherSessionConsistency`, `previewMissingWalletDeductions`, and `backfillMissingWalletDeductions` (`functions/src/auditAllTransferredSessionSnapshotIssues.ts:678-778`, `functions/src/lifecycle.ts:1390-1423`, `functions/src/wallet.ts:1472-1998`).

## Instrumentation Plan
- Cloud Functions:
  - Add temporary `console.info` or `logger.info` around each high-risk read block with `functionName`, `collection`, `queryPurpose`, `docsReturned`, `elapsedMs`, and `mode`.
  - First targets: `sendClassReminder10Min`, `recomputeParentMonthAttendanceReadModel`, `buildFinanceReconciliationReport`, `previewMissingWalletDeductions`, `backfillMissingWalletDeductions`, `auditParentPaymentBackfillDryRun`, and `applyParentPaymentBackfillForSafeParents` (`functions/src/notifications/classReminders.ts:782-818`, `functions/src/parentMonthlyReadModels.ts:196-215`, `functions/src/financeReconciliationReport.ts:280-306`, `functions/src/wallet.ts:1507-1598`, `functions/src/wallet.ts:1814-1957`, `functions/src/parentPaymentBackfillDryRun.ts:75-177`, `functions/src/parentPaymentBackfillWriteMode.ts:395-408`).
- Frontend:
  - Add DEV-only logging at hook boundaries with `hookName`, `queryName`, `collection`, `docsReturned`, `route`, and `authUid`.
  - First targets: `ParentDashboard`, `useTeacherSessions`, `useUpcomingSessions`, `useTeacherStudents`, `EarningsSummary`, and admin `ParentPayments` (`src/pages/parent/ParentDashboard.tsx:2266-2459`, `src/pages/teacher/hooks/useTeacherSessions.ts:716-736`, `src/pages/teacher/hooks/useUpcomingSessions.ts:599-626`, `src/pages/teacher/hooks/useTeacherStudents.ts:19-95`, `src/pages/teacher/components/earnings/EarningsSummary.tsx:766-889`, `src/pages/admin/ParentPayments.tsx:1217-1455`).
- Safety:
  - Do not log personal data, message content, phone numbers, or payment references.
  - Do not deploy instrumentation until it is reviewed.
