# Firestore Read Audit And Mitigation Plan

Date audited: June 29, 2026  
Project: Tiny Steps React (`/Users/tinysteps/Documents/Tinysteps-react-v1`)  
Audit scope: `src/`, `functions/`, route entry points, dashboard hooks, reporting/admin surfaces, scheduled/callable Cloud Functions

## A. Executive Summary

### Bottom line
The June 29, 2026 Firestore spike is much more likely to be caused by protected app surfaces and backend aggregation/reporting code than by public SEO traffic.

The strongest patterns are:

1. Teacher routes run 4 to 6 parallel alias queries against the same logical data set, often as `onSnapshot` listeners, because teacher identity is still spread across `teacherId`, `teacherIds`, `assignedTeacherId`, `primaryTeacherId`, `teacherUid`, and `teacher_id`.
2. Admin finance/reporting pages read raw monthly collections directly in the browser and keep them live with `onSnapshot`, then fan out more reads for referenced users, kids, courses, sessions, wallets, and monthly read models.
3. Parent routes still have fallback queries that broaden reads when canonical fields miss, especially around sessions, payments, game progress, and monthly billing.
4. Several Cloud Functions recompute read models from broad source collections instead of bounded deltas, especially parent monthly attendance, finance archive preview/write, wallet calculations, and insights rollups.
5. Some admin tools still scan large collections or collection groups with weak limits or no server-side pagination.

### Top 5 likely causes of high reads

| Rank | Likely cause | Why it matters | Evidence |
| --- | --- | --- | --- |
| 1 | Teacher dashboard alias listeners | Six parallel live listeners on `classSessions`, then follow-up enrollment lookups on every snapshot publish | `src/pages/teacher/hooks/useTeacherSessions.ts:492-586`, `:615-681`, `:730-752`; `src/pages/teacher/hooks/useUpcomingSessions.ts:356-402`, `:446-558`, `:578-603` |
| 2 | Admin finance pages reading raw monthly collections live | Month-wide `billingCharges`, `payments`, `teacherEarnings`, and per-parent live wallet/read-model listeners | `src/pages/admin/ParentPayments.tsx:1149-1182`, `:1267-1328`, `:1347-1405` |
| 3 | Admin analytics loading full core collections | Full `users`, `kids`, `enrollments`, `courses` reads plus month-wide listeners | `src/pages/admin/AnalyticsDashboard.tsx:195-220`, `:234-295` |
| 4 | Parent monthly read-model recomputation scanning all parent sessions | Attendance read model queries all `classSessions` for a parent, then filters month in memory | `functions/src/parentMonthlyReadModels.ts:176-306` |
| 5 | Student/admin management monitoring large collections live | 1,000-kid listener, 2,000-credit listener, collection-group session requests listener | `src/pages/admin/StudentManagement/StudentList.tsx:1956-1967`, `:1975-2014`, `:2023-2068` |

### Where the problem is most likely concentrated

- Primary: frontend admin and teacher dashboards
- Secondary: parent dashboard fallback queries and finance functions
- Tertiary: scheduled/callable functions for insights, wallet, finance archive/reporting
- Low likelihood: public SEO pages and lead landing pages

### Immediate risk level

High.

The codebase has multiple places where one page open can legitimately cause tens to thousands of reads before any user interaction. A few admins keeping finance/student tabs open, or a moderate teacher base keeping dashboard tabs open, is enough to explain a 76K-read day.

### Estimated read-reduction potential

- Phase 0 only: 35% to 55%
- Phase 0 + Phase 1: 60% to 80%
- Phase 0 + Phase 1 + canonical field cleanup: 70% to 85%

These are estimates from static analysis, not production trace counts.

## B. Firestore Read Inventory

Estimated read costs below are per page open or per action unless noted. They are static estimates derived from query shape, not measured billing logs.

| File path | Function / hook / component | User role / route | Read type | Collection(s) | Filters used | Has limit? | Realtime? | Fan-out follow-up? | Duplicate query risk? | Estimated read cost | Severity | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/pages/teacher/hooks/useTeacherSessions.ts:464-780` | `useTeacherSessions` | Teacher `/teacher?tab=today` and schedule consumers | `onSnapshot` x 1-6 + `getDocs` | `classSessions`, `enrollments` | date range + 6 teacher aliases | No | Yes | Yes | Yes | ~60-180 initial, then live updates | Critical | Six parallel listeners, then enrollment lookup batches for merged rows |
| `src/pages/teacher/hooks/useUpcomingSessions.ts:322-650` | `useUpcomingSessions` | Teacher `/teacher?tab=upcoming` | `onSnapshot` x 6 + `getDocs` | `classSessions`, `enrollments` | next 7 dates + 6 teacher aliases | No | Yes | Yes | Yes | ~40-140 initial | Critical | Same alias fan-out pattern as today sessions |
| `src/pages/teacher/hooks/useTeacherStudents.ts:19-164` | `fetchTeacherStudents` | Teacher students tab | `getDocs` + `getDoc` loop | `kids`, `courses`, `enrollments`, `users`, `parents` | 2 kid queries + 6 enrollment alias queries | No | No | Yes | Yes | ~50-250 | High | Full `courses` read and N parent lookups |
| `src/pages/teacher/components/students/TeacherMyStudentsV2.tsx:294-351` | `fetchTeacherEnrollments` | Teacher students tab | `getDocs` x 6 | `enrollments` | 6 teacher alias queries | No | No | No | Yes | ~20-120 | High | Raw alias fan-out |
| `src/pages/teacher/components/students/TeacherMyStudentsV2.tsx:354-434` | `fetchTeacherSessionsWindow` | Teacher students tab | `getDocs` x 6 | `classSessions` | 6 aliases, preferred `startAt` window, fallback alias-only | No | No | No | Yes | ~30-200 | Critical | Fallback query can read all teacher sessions then filter client-side |
| `src/pages/teacher/components/earnings/EarningsSummary.tsx:602-654` | `loadTeacherEnrollments` | Teacher earnings tab | `getDocs` | `enrollments` | `teacherId == resolvedTeacherId` | No | No | No | Moderate | ~10-80 | Medium | Missing alias support here may also cause mismatched retries elsewhere |
| `src/pages/teacher/components/earnings/EarningsSummary.tsx:656-798` | `loadMonthSessions` | Teacher earnings tab | `getDocs` | `classSessions` | month date range; fallback `teacherId == resolvedTeacherId` only | No | No | No | Moderate | ~20-200 | High | Fallback reads all teacher sessions then filters month locally |
| `src/pages/teacher/components/earnings/EarningsSummary.tsx:810-869` | `loadStudentNamesFromDocs` | Teacher earnings tab | `getDoc` loop | `kids`, `students`, `children` | doc-by-doc | N/A | No | Yes | No | ~1-3 per student id | High | Classic N+1 name lookup |
| `src/pages/teacher/components/earnings/EarningsSummary.tsx:871-918` | `loadLedger` | Teacher earnings tab | `getDocs` | `teacherEarnings` | `teacherId == resolvedTeacherId` | No | No | No | No | ~all teacher earnings docs | High | Unbounded teacher ledger read |
| `src/pages/teacher/components/schedule/TeacherAvailabilityEditor.tsx:149-230` | availability editor | Teacher schedule tab | `onSnapshot` x 3 | `teachers/{id}/availability`, `blockedSlots`, `demoSessions` | date range for blocked slots, teacher for demos | No | Yes | No | Low | ~config + all in-range slots + all teacher demos | Medium | Reasonable per teacher, but live |
| `src/pages/parent/ParentDashboard.tsx:1505-1519` | `kidsQuery` | Parent `/parent` | `getDocs` | `kids` | `parentIds array-contains uid` | No | No | No | No | ~1-5 | Low | Small, necessary |
| `src/pages/parent/ParentDashboard.tsx:1614-1684` | `enrollmentsQuery` | Parent insights/classes/profile | `getDocs` | `enrollments` | canonical `kidId` + `kidIds`, fallback `studentId in` | No | No | No | Yes | ~5-40 | High | Alias fallback multiplies reads when canonical fields miss |
| `src/pages/parent/ParentDashboard.tsx:1687-1705` | `phonicsProgressQuery` | Parent insights | `getDocs` | `students/{id}/progress` | none | No | No | No | No | ~all progress docs for child | Medium | Unbounded subcollection read |
| `src/pages/parent/ParentDashboard.tsx:1854-1877` | `coursesLookupQuery` | Parent insights/profile | `getDocs` | `courses` | none | No | No | No | No | ~all courses docs | Medium | Full collection read for labels |
| `src/pages/parent/ParentDashboard.tsx:1895-1927` | `teacherLookupQuery` | Parent profile | `getDocs` batched | `users` | `documentId in chunks` | N/A | No | No | No | ~1 per teacher doc | Low | Fine if teacher ids remain small |
| `src/pages/parent/ParentDashboard.tsx:1975-1989` | `gameSummariesQuery` | Parent games progress | `getDocs` | `kids/{id}/gameSummaries` | none | No | No | No | No | ~all summary docs | Medium | Acceptable if summary docs stay compact |
| `src/pages/parent/ParentDashboard.tsx:2057-2071` | `gameProgressQuery` | Parent games progress fallback | `getDocs` | `kids/{id}/gameProgress` | none | No | No | No | No | ~all progress docs | Medium | Fallback only, but still broad |
| `src/pages/parent/ParentDashboard.tsx:2266-2304` | `billingChargesQuery` | Parent billing tab | `getDocs` | `billingCharges` | canonical by `parentId + monthKey`, fallback `parentId` only | No | No | No | Yes | ~current month OK, fallback can be all parent charges | High | Legacy fallback is expensive |
| `src/pages/parent/ParentDashboard.tsx:2307-2321` | `parentPaymentsQuery` | Parent payment history | `getDocs` | `payments` | `parentId == uid` | No | No | No | No | ~all parent payments | Medium | Unbounded |
| `src/pages/parent/ParentDashboard.tsx:2336-2351` | `parentWalletTransactionsQuery` | Parent payment history | `getDocs` | `parentWallets/{id}/transactions` | `orderBy createdAt desc limit 20` | Yes | No | No | No | <=20 | Low | Good shape |
| `src/pages/parent/ParentDashboard.tsx:2397-2517` | `kidSessionsQuery` | Parent classes tab | `getDocs` x 2 | `classSessions` | canonical `kidIds+parentId`, fallback `kidId+parentId`, optional date window | No | No | No | Yes | ~20-120 recent, much more for full history | Critical | Dual query plus optional full-history mode |
| `src/pages/parent/ParentDashboard.tsx:2519-2540` | `classRecordingsQuery` | Parent classes tab | `getDocs` | `parentClassRecordings` | `parentId == uid` | No | No | No | No | ~all parent recording docs | Medium | Could be bounded by month |
| `src/pages/parent/ParentDashboard.tsx:2572-2611` | `parentWorksheetsQuery` | Parent classes tab | `getDocs` | `parentWorksheetLibrary` | course chunks + legacy `targetParentIds` | `limit(200)` | No | No | Yes | up to 400+ | Medium | Two broad queries merged client-side |
| `src/pages/parent/ParentDashboard.tsx:2629-2642` | `parentMonthlyBillingReadModelQuery` | Parent classes/billing | `getDoc` | `parentMonthlyReadModels/{parent}/months/{month}` | doc read | N/A | No | No | No | 1 | Low | Preferred pattern |
| `src/pages/admin/ParentPayments.tsx:1023-1147` | `loadRefs` | Admin finance | `getDocs` batched | `users`, `kids`, `courses`, `classSessions` | documentId chunk lookups for everything referenced by month results | N/A | No | Yes | No | proportional to distinct ids in month | High | Reference fan-out after large base reads |
| `src/pages/admin/ParentPayments.tsx:1149-1182` | charges/payments live loaders | Admin finance | `onSnapshot` x 2 | `billingCharges`, `payments` | `monthKey == selectedMonth` | No | Yes | No | No | month-wide raw docs | Critical | Core monthly finance collections kept live |
| `src/pages/admin/ParentPayments.tsx:1267-1328` | per-parent wallet + read model listeners | Admin finance | `onSnapshot` N per visible parent | `parentWallets`, `parentMonthlyReadModels` | doc listeners for each visible parent | N/A | Yes | No | No | ~2 * visible parent count | Critical | Multiplies fast on large month tables |
| `src/pages/admin/ParentPayments.tsx:1347-1405` | selected parent wallet drill-down | Admin finance | `onSnapshot` + query | `parentWallets`, `transactions` | wallet doc + `limit 20` txs | Yes | Yes | No | No | 1 + <=20 | Medium | Fine individually |
| `src/pages/admin/AnalyticsDashboard.tsx:195-220` | `loadCore` | Admin analytics | `getDocs` x 4 | `users`, `kids`, `enrollments`, `courses` | none | No | No | No | No | full collection reads | Critical | Entire collections loaded to browser |
| `src/pages/admin/AnalyticsDashboard.tsx:234-295` | month listeners | Admin analytics | `onSnapshot` x 4 | `billingCharges`, `payments`, `teacherEarnings`, `classSessions` | month/date range | No | Yes | No | No | month-wide live reads | Critical | Reporting by raw collections |
| `src/pages/admin/AdminDashboard.tsx:584-725` | attendance corrections panel | Admin `/surya?tab=attendance-corrections` | `getDocs` | `users`, `classSessions`, `kids` | teachers by role; sessions by teacher only; kids by ids | No | No | Yes | No | can read all sessions for a teacher then filter date locally | High | Missing date filter in classSessions query |
| `src/pages/admin/StudentManagement/StudentList.tsx:1937-1954` | `loadUsers` | Admin students | `getDocs` x 2 | `users` | role parent / teacher | No | No | No | No | all parent + teacher docs | Medium | Full role lists |
| `src/pages/admin/StudentManagement/StudentList.tsx:1956-1967` | student monitor | Admin students | `onSnapshot` | `kids` | `orderBy createdAt desc limit 1000` | Yes | Yes | No | No | 1,000 docs initial | Critical | Large live list |
| `src/pages/admin/StudentManagement/StudentList.tsx:1975-2014` | session requests monitor | Admin students | `onSnapshot` | `collectionGroup(sessionRequests)` | `status=requested orderBy startAt limit 200` | Yes | Yes | No | No | <=200 | Medium | Reasonable, but collection-group |
| `src/pages/admin/StudentManagement/StudentList.tsx:2023-2068` | reschedule credits monitor | Admin students | `onSnapshot` | `rescheduleCredits` | `orderBy updatedAt desc limit 2000` | Yes | Yes | No | No | 2,000 docs initial | Critical | Very expensive live admin monitor |
| `src/pages/admin/DemoSessionsManagement.tsx:508-560` | demo sessions management | Admin leads/demo | `onSnapshot` x 3 | `demoSessions`, `demoSessionsPrivate`, `users` | all demos, all private phones, all teachers | No | Yes | No | No | potentially all demo docs | High | Live reads for entire demo surface |
| `src/pages/admin/LeadsInquiriesWorkspace.tsx:1183-1277` | leads workspace | Admin leads | `onSnapshot` x 4 | `leads`, `lead communications`, `demoSessions`, `demoSessionsPrivate` | date range on leads; comms by lead id | No | Yes | No | No | all matched leads plus all demos | High | Main leads page keeps several streams open |
| `src/hooks/useLPFilteredData.ts:35-89` | `useLPFilteredTeachers` | LP dashboard | `onSnapshot` + `getDoc` fan-out | `users` | LP profile then teacher docs by id | N/A | Yes | Yes | No | 1 + assigned teacher count | Medium | Acceptable if assignments small |
| `src/hooks/useLPFilteredData.ts:107-168` | `useLPFilteredParents` | LP dashboard | `onSnapshot` + `getDoc` + `getDocs` fan-out | `users`, `kids` | LP profile, then per-parent child query | No | Yes | Yes | No | 1 + 2 * assigned parent count | High | N+1 child count lookups |
| `src/hooks/useTeacherFilteredData.ts:106-130` | `fetchTeacherFilteredStudents` | teacher-adjacent filters | `getDocs` x 6 | `enrollments` | 6 teacher aliases | No | No | No | Yes | ~10-80 | Medium | Same alias problem |
| `src/hooks/useData.ts:118-168` | `useTeacherSessions` | generic teacher hook | `getDocs` x 6 | `classSessions` | 6 aliases | No | No | No | Yes | ~20-150 | High | Old duplicate path beside newer hooks |
| `src/hooks/useData.ts:172-213` | `useKidAttendance` | generic kid hook | `getDocs` scan + subquery loop | `attendance`, `attendanceRecords` | none, then per-session kid filter | No | No | Yes | No | potentially huge | Critical | Full collection scan + per-doc subcollection read |
| `src/hooks/useData.ts:321-334` | `useAllEnrollments` | admin/shared | `getDocs` | `enrollments` | none | No | No | No | No | full collection read | High | Should not be on hot surfaces |
| `src/hooks/useData.ts:337-458` | `useEnrollmentsForStudents` | admin/shared | `getDocs` x canonical + fallback + reference fetches | `enrollments`, `courses`, `users` | `kidId in`, `kidIds array-contains-any`, fallback `studentId in` | No | No | Yes | Yes | ~10-100+ | High | Alias fallback and enrichment fan-out |
| `src/hooks/useMessageThreads.ts:181-245` | `useMessageThreads` | teacher/parent/admin messages | `onSnapshot` | `messageThreads` | participant or adminVisible, `limit 100` | Yes | Yes | No | No | <=100 | Medium | Live but bounded |
| `src/hooks/useThreadMessages.ts:84-125` | `useThreadMessages` | messages thread view | `onSnapshot` | `messageThreads/{id}/messages` | `orderBy createdAt desc limit 50` | Yes | Yes | No | No | <=50 | Low | Good shape |
| `src/services/demoSessionsService.ts:121-188` | demo session listeners | admin/teacher demos | `onSnapshot` | `demoSessions`, `demoSessionsPrivate` | all/open/teacher-specific | No | Yes | No | No | all matching demo docs | High | Broad all-doc streams |
| `src/pages/ClassSamplesPage.tsx:255-285` | class samples page | Public | `getDocs` | `classSamples` | `active == true limit 200` | Yes | No | No | No | <=200 | Low | Public read exists but bounded |
| `src/pages/KidsPhonicsLibrary.tsx:150-168` | kid game summaries | Kids library | `getDocs` | `kids/{kid}/gameSummaries` | `orderBy lastPlayedAt desc limit 50` | Yes | No | No | No | <=50 | Low | Bounded |
| `src/games/engine/catalog.ts:18-33` | `fetchGamesCatalog` | Kids games / parent games | `getDoc` | `config/gamesCatalog` | doc read | N/A | No | No | No | 1 | Low | Cheap |
| `functions/src/parentMonthlyReadModels.ts:176-306` | `recomputeParentMonthAttendanceReadModel` | backend read model | scheduled/triggered function | `classSessions` | `parentId == parentId`, month filtered in memory | No | No | No | No | all parent sessions every recompute | Critical | Most suspicious backend read amplifier |
| `functions/src/parentMonthlyReadModels.ts:309-369` | `recomputeParentMonthBillingReadModel` | backend read model | function | `billingCharges`, `parentWallets` | `parentId + monthKey` | No | No | No | No | current month charge set + wallet doc | Medium | Acceptable shape |
| `functions/src/parentMonthlyReadModels.ts:372-450` | progress projection | backend read model | function | `kids`, `students`, `progress`, `config` | doc reads + whole progress subcollection | No | No | Yes | No | all progress docs for affected student | Medium | Could be reduced with deltas |
| `functions/src/scheduled/batchInsightsRollup.ts:753-809` | `runBatchInsightsRollup` | scheduled 3x/day | scheduled | `collectionGroup(gameSessions)`, `kids/{id}`, `gameSummaries`, `gameProgress`, `activity/head` | `createdAt > lastRunAt` | No | No | Yes | No | changed sessions + 4 reads per kid + subcollections | High | May be large on active game days |
| `functions/src/wallet.ts:1206-1279` | `computeOutstandingDuesFromBillingCharges` | callable/admin backend | function | `billingCharges` | `parentId == parentId` | No | No | No | No | all parent charges | High | Full parent charge scan |
| `functions/src/wallet.ts:1472-1751` | `previewMissingWalletDeductions` | admin callable | function | `billingCharges`, `parentWallets/*/transactions` | monthKey, then per-parent tx scan | Partial | No | Yes | No | up to batchLimit charges + all class_deduction tx per parent | High | Cost spikes with parent count |
| `functions/src/wallet.ts:1753-1844` | `backfillMissingWalletDeductions` | admin callable | function | `billingCharges` | paged monthKey scan up to 2,000 | Yes | No | Yes | No | up to 2,000 charge docs | High | Controlled, but expensive |
| `functions/src/revenue.ts:1938-1979` | `previewFinanceCutoverArchiveForCollection` | admin callable | function | arbitrary finance collection | none; full collection `.get()` | No | No | No | No | full collection scan | Critical | Reads entire collection for preview |
| `functions/src/revenue.ts:2182-2205` | `archiveFinanceRecordsThroughMonth` | admin callable | function | finance collections | none; full collection `.get()` | No | No | No | No | full collection scan | Critical | Reads entire collections again before archiving |
| `functions/src/notifications/classReminders.ts:782-823` | `sendClassReminder10Min` | scheduled every minute | scheduled | `classSessions`, `enrollments` | `startAt` window `limit 300` | Yes | No | Yes | No | up to 300 sessions + per-unique enrollment doc | Medium | Not the main spike, but constant |

## C. Route-Level Read Map

### Public website

| Route / persona | Likely reads on load | Realtime while open | Re-mount / refresh behavior | Follow-up lookups | Multi-tab multiplier | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| SEO/blog/public pages | Usually 0 | 0 | 0 | 0 | none | Repo search found no Firestore reads on most public pages |
| `/class-samples` public page | up to 200 docs | none | repeats on page load | none | yes | `src/pages/ClassSamplesPage.tsx:268-274` |
| Lead booking landing pages | none directly in audited files | none | none | none | none | Lead writes may happen elsewhere, but not read-heavy here |

### Admin `/surya`

| Route / persona | Initial reads | Realtime while open | Refresh / remount | Follow-up lookups | Multi-tab multiplier | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/surya?tab=finance` | hundreds to thousands | high | high | high | very high | Raw month collections plus per-parent listeners in `ParentPayments` |
| `/surya?tab=analytics` | thousands on first open | high | high | low | high | Full `users/kids/enrollments/courses` reads plus month listeners |
| `/surya?tab=students` | ~1,000 kids + 2,000 credits + 200 requests | high | high | moderate | high | Three large live monitors in `StudentList` |
| `/surya?tab=attendance-corrections` | all teacher docs + all selected teacher sessions | none after load | high | kid id lookup batches | yes | Missing date filter on session query |
| `/surya?tab=leads` | all leads in selected date range + all demos + private phones + teachers | high | high | communications subcollection | high | Broad live streams |

### Teacher `/teacher`

| Route / persona | Initial reads | Realtime while open | Refresh / remount | Follow-up lookups | Multi-tab multiplier | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Today tab | ~60-180 estimated | high | high | enrollment batch lookups | very high | Six live alias queries |
| Upcoming tab | ~40-140 estimated | high | high | enrollment lookups | very high | Six more live alias queries |
| Students tab | ~50-250 | none, but always refetch on mount in V2 | high | parent/course/session lookups | high | Mixed old/new student loaders |
| Earnings tab | ~all teacher earnings + monthly sessions + N name lookups | none | high | `getDoc` per student | high | Several unbounded queries |
| Schedule tab | today-style session listeners + availability listeners + demos | high | high | some | very high | Teacher schedule compounds read load |
| Messages tab | <=100 threads + <=50 messages per thread | moderate | bounded | none | moderate | Not a top culprit |

### Parent `/parent`

| Route / persona | Initial reads | Realtime while open | Refresh / remount | Follow-up lookups | Multi-tab multiplier | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Overview / profile | low to moderate | none | moderate | course and teacher lookups | yes | Mostly query-based, not live |
| Billing tab | moderate to high | none | moderate | charges fallback can broaden | yes | Current month bounded unless legacy fallback activates |
| Classes tab | moderate to high | none | moderate | dual session queries, recordings, worksheets | yes | One of the heavier parent tabs |
| Games progress tab | moderate | none | moderate | game summaries + progress fallback + catalog | yes | Controlled but still unbounded subcollection reads |
| Messages tab | <=100 threads + selected thread messages | moderate | bounded | none | moderate | Acceptable |

### Kids routes

| Route / persona | Initial reads | Realtime while open | Refresh / remount | Follow-up lookups | Multi-tab multiplier | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/kids/library` | <=50 summaries + catalog doc | none | bounded | none | yes | Cheap |
| `/kids/... games` | mostly writes, plus catalog doc reads in some flows | none | low | none | yes | Not a likely cause of 76K/day |
| Legacy kid dashboard | depends on wrapped parent hooks | none | moderate | topic progress subcollection | yes | Not obviously top-tier versus admin/teacher |

### Learning Partner dashboard

| Route / persona | Initial reads | Realtime while open | Refresh / remount | Follow-up lookups | Multi-tab multiplier | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/learning-partner/dashboard` | low to moderate | moderate | moderate | N+1 assigned parent child counts | yes | Can be optimized, but not main spike source |

## D. Anti-Patterns Identified

### Reading entire collections

- `src/pages/admin/AnalyticsDashboard.tsx:199-203` reads full `users`, `kids`, `enrollments`, `courses`.
- `src/hooks/useData.ts:330-331` reads full `enrollments`.
- `src/hooks/useData.ts:182-207` scans full `attendance`, then each `attendanceRecords` subcollection.
- `functions/src/revenue.ts:1943`, `:2184` reads entire finance collections in archive preview/write helpers.

### Month-wide or day-wide data without pagination

- `src/pages/admin/ParentPayments.tsx:1154-1179` keeps all month charges and payments live with no pagination.
- `src/pages/admin/AnalyticsDashboard.tsx:234-295` keeps month-wide finance/session streams live.
- `src/pages/admin/AdminDashboard.tsx:642-682` loads all sessions for a teacher, then filters the selected day in memory.

### Realtime listeners on large or frequently changing collections

- `src/pages/teacher/hooks/useTeacherSessions.ts:730-752` and `src/pages/teacher/hooks/useUpcomingSessions.ts:578-603`
- `src/pages/admin/StudentManagement/StudentList.tsx:1957-2068`
- `src/pages/admin/ParentPayments.tsx:1158-1180`, `:1271-1328`
- `src/pages/admin/DemoSessionsManagement.tsx:508-540`
- `src/pages/admin/LeadsInquiriesWorkspace.tsx:1196-1282`

### Multiple parallel alias queries for the same logical data

- `teacherId`, `teacherIds`, `assignedTeacherId`, `primaryTeacherId`, `teacherUid`, `teacher_id`
- Seen in `useTeacherSessions`, `useUpcomingSessions`, `useTeacherStudents`, `TeacherMyStudentsV2`, `useTeacherFilteredData`, `useData.ts`

### Fan-out `getDoc` loops after `getDocs`

- `src/pages/teacher/hooks/useTeacherStudents.ts:80-95`
- `src/pages/teacher/components/earnings/EarningsSummary.tsx:836-856`
- `src/hooks/useLPFilteredData.ts:128-146`
- `functions/src/notifications/classReminders.ts:811-816`

### N+1 lookups for names that should be embedded or denormalized

- Teacher earnings/student lookups
- Teacher students parent lookups
- Parent finance reference loaders for parent, kid, course, teacher, session display fields

### Re-fetching on every mount

- `TeacherMyStudentsV2` sets `refetchOnMount: 'always'` for both enrollments and sessions: `src/pages/teacher/components/students/TeacherMyStudentsV2.tsx:442-465`

### Missing `limit()` on admin tables and reports

- Teacher session listeners
- Parent monthly finance listeners
- Analytics month listeners
- Parent payment history
- Parent class recordings

### Historic queries when only recent data is needed

- `src/pages/teacher/components/earnings/EarningsSummary.tsx:780-789` fallback reads all teacher sessions
- `src/pages/admin/AdminDashboard.tsx:642-682` all sessions for teacher
- `functions/src/parentMonthlyReadModels.ts:181-184` all parent sessions every attendance recompute
- `functions/src/wallet.ts:1216-1219` all parent charges for outstanding dues

### Client pages doing reporting work that should use read models

- `ParentPayments`
- `AnalyticsDashboard`
- parts of `StudentList` and admin finance drill-downs

## E. Top 10 Likely Read Drivers

| Rank | Culprit | Why it is expensive | Realistic read volume | Matches billing pattern? | Safe to optimize? | Expected reduction if fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `useTeacherSessions` | 6 live alias listeners + enrollment batch lookups | ~60-180 per open tab, plus update traffic | Yes | Yes | 10-20% total |
| 2 | `useUpcomingSessions` | Same alias listener pattern for next 7 days | ~40-140 per open tab | Yes | Yes | 5-12% |
| 3 | `ParentPayments` monthly live finance view | Month-wide live reads plus 2 doc listeners per visible parent | hundreds to thousands | Yes | Yes | 10-18% |
| 4 | `AnalyticsDashboard` | Full core collections + 4 month listeners | thousands on open | Yes | Yes | 8-15% |
| 5 | `StudentList` live monitors | 1,000 kids + 2,000 reschedule credits + requests | 3,200+ initial | Yes | Yes | 8-12% |
| 6 | `ParentDashboard` class session loader | Dual queries, optional full history, legacy fallback | 20-120 per parent classes tab | Possibly | Yes | 4-8% |
| 7 | `TeacherMyStudentsV2` / teacher student loaders | 6 alias enrollment queries + 6 session queries, refetch-on-mount | 50-250 per visit | Yes | Yes | 3-7% |
| 8 | `parentMonthlyReadModels` attendance recompute | all parent sessions scanned per recompute | depends on write frequency; can be very high backend churn | Yes | Yes | 5-10% |
| 9 | `revenue.ts` finance archive preview/write helpers | full collection scans | bursty, admin-triggered | Yes for monthly spikes | Yes | variable; mostly burst reduction |
| 10 | `wallet.ts` outstanding/backfill helpers | full parent/month scans plus parent tx fan-out | bursty, admin-triggered | Yes for finance/admin days | Yes | variable; mostly burst reduction |

### Detail notes on the biggest culprits

1. Teacher alias listeners are the cleanest explanation for daily excess reads.
   They are user-facing, live, and multiply across tabs, remounts, and browsers.

2. Admin finance reads are especially dangerous because the code reads raw financial facts and then derives view models client-side.
   That is the opposite of what Firestore is good at for low-cost dashboards.

3. Parent monthly attendance read-model recomputation is a backend amplifier.
   Every trigger that calls `recomputeParentMonthAttendanceReadModel` currently reads all sessions for the parent and only then filters to the month.

4. Student/admin management screens are likely silent offenders because the monitors stay open for long periods.

5. Public pages are not the likely source.
   The repo mostly avoids Firestore there, with the bounded `classSamples` query as the main exception.

## F. Mitigation Plan

### Phase 0: Immediate safety changes, no data-model migration

1. Collapse teacher alias listeners.
   Keep support for legacy alias fields, but stop listening to all six live in the browser.
   Use one canonical live query on `teacherId` only, then do lazy fallback `getDocs` for legacy aliases once per session when canonical returns empty or when an explicit transferred-teacher repair flag is present.

2. Remove broad `onSnapshot` usage from raw reporting views.
   Convert `ParentPayments`, `AnalyticsDashboard`, `StudentList` monitors, and demo/leads broad lists from live listeners to one-time `getDocs` with manual refresh unless the use case truly needs live updates.

3. Add hard limits and pagination to admin views.
   `ParentPayments`, analytics tables, student monitors, demo tables, recordings, and payment history should page.

4. Add query scoping to attendance corrections.
   Query `classSessions` by `teacherId` and selected date instead of loading all teacher sessions and filtering locally.

5. Stop full-history fallback reads where a bounded range exists.
   Teacher earnings month fallback, parent class session full-history mode, and similar paths should be capped.

6. Disable duplicate tab loads.
   Do not load hidden admin/teacher tabs until they are active.
   Several screens already partly do this; expand that pattern.

7. Standardize TanStack Query refetch behavior.
   Remove `refetchOnMount: 'always'` from teacher student screens unless there is a correctness reason.

8. Make parent dashboard prefer read models first.
   For billing and classes, try `parentMonthlyReadModels` first and only fallback to raw collections when the read model is missing.

### Phase 1: Read-model and denormalization improvements

1. Teacher daily schedule read model.
   Collection or doc per teacher/day containing canonical sessions already resolved for transfers and legacy aliases.

2. Parent classes monthly read model.
   Extend `parentMonthlyReadModels` to include upcoming/today/completed/rescheduled slices so `/parent` does not query raw `classSessions`.

3. Admin finance summary docs.
   Precompute month dashboards and parent finance summaries server-side.

4. Session display-field denormalization.
   Ensure `classSessions` and `billingCharges` always carry kid, parent, teacher, and course display fields.

5. LP summary docs.
   Store assigned parent counts and child counts on LP or parent summary docs to remove per-parent child fan-out.

### Phase 2: Structural cleanup

1. Canonicalize teacher ownership fields across `classSessions` and `enrollments`.
   Target canonical fields:
   - `teacherId`
   - `teacherIds`

2. Backfill canonical teacher fields and transferred-teacher snapshots.

3. Remove legacy alias queries after migration coverage reaches acceptable threshold.

4. Move expensive finance archive/reporting logic behind paged admin summaries or BigQuery/export-like workflows if needed.

5. Rewrite parent monthly attendance recompute to query only month-scoped sessions.

### Phase 3: Monitoring and guardrails

1. Add a dev-only Firestore query wrapper that logs query shape, collection, limit, caller, and estimated risk.
2. Add lint/test guardrails for unbounded admin queries.
3. Document route-level read budgets.
4. Add production dashboards for:
   - reads by route family
   - reads by function
   - active listener counts
   - fallback alias query count
5. Add telemetry counters when legacy alias fallback is used.

## G. Concrete Code Recommendations

### 1. Teacher sessions

- Current file/function: `src/pages/teacher/hooks/useTeacherSessions.ts:492-586`, `:730-752`
- Current pattern: 1 to 6 parallel live listeners over `classSessions`, followed by enrollment batch lookups
- Safer pattern:
  - live listener only on canonical `teacherId`
  - optional one-time fallback `getDocs` on legacy aliases only if canonical query returns empty or a known migration gap is detected
  - cache enrollment snapshots by id across publishes, not per publish
- Use `getDocs` or `onSnapshot`: keep `onSnapshot` only for canonical current-day query
- Add filters: keep date bounds, add `limit()` if UI only shows bounded rows
- Denormalize: embed canonical student/course display fields in session docs
- Risk: medium, because transferred-teacher visibility is sensitive
- Tests needed:
  - teacher sees current sessions with canonical `teacherId`
  - teacher still sees transferred legacy sessions
  - duplicate sessions are not shown when docs match multiple aliases

### 2. Teacher upcoming sessions

- Current file/function: `src/pages/teacher/hooks/useUpcomingSessions.ts:356-402`, `:578-603`
- Current pattern: six live listeners for seven days
- Safer pattern:
  - canonical `teacherId` listener only
  - fallback legacy alias sweep via one-time query if canonical misses
  - server-built teacher daily/upcoming read model in Phase 1
- Risk: medium
- Tests needed:
  - upcoming transferred sessions remain visible
  - no duplicate session rows

### 3. Admin ParentPayments

- Current file/function: `src/pages/admin/ParentPayments.tsx:1149-1182`, `:1267-1328`
- Current pattern: month-wide live `billingCharges` and `payments`, plus per-parent wallet and monthly model listeners
- Safer pattern:
  - replace raw month listeners with one-time paged `getDocs`
  - show parent rows from a precomputed monthly summary collection
  - only open wallet/read-model listeners for the selected parent row, not every visible parent
- Use `getDocs` or `onSnapshot`: `getDocs` for lists, optional `onSnapshot` only for currently focused parent
- Add filters: page size, parent search, status filters
- Denormalize/read model: yes, admin finance summary docs
- Risk: low to medium
- Tests needed:
  - finance totals match existing view for a sample month
  - wallet balances and FIFO settlement still match backend

### 4. Admin AnalyticsDashboard

- Current file/function: `src/pages/admin/AnalyticsDashboard.tsx:195-220`, `:234-295`
- Current pattern: full collections plus live month streams
- Safer pattern:
  - read admin stats summary docs only
  - manual refresh button instead of live streams
  - if raw drill-down is needed, load per card on demand
- Risk: low
- Tests needed:
  - KPI totals match source-of-truth summary docs

### 5. Admin StudentList

- Current file/function: `src/pages/admin/StudentManagement/StudentList.tsx:1956-2068`
- Current pattern: large live monitors for `kids`, `sessionRequests`, `rescheduleCredits`
- Safer pattern:
  - initial paged `getDocs`
  - optional live listener only for the currently filtered page or selected record
  - lower `rescheduleCredits` page size drastically
- Risk: low
- Tests needed:
  - student list still updates after admin actions
  - session request and credit monitors still usable with manual refresh

### 6. Parent classes session loader

- Current file/function: `src/pages/parent/ParentDashboard.tsx:2397-2517`
- Current pattern: canonical query plus legacy query, optional full-history mode, merge/dedupe client-side
- Safer pattern:
  - prefer `parentMonthlyReadModels` for today/upcoming/completed counts
  - for raw fallback, query only current month or recent 60-90 days
  - run legacy `kidId` fallback only if canonical `kidIds` query returns zero rows
- Risk: medium because parent upcoming sessions must not break
- Tests needed:
  - parent upcoming sessions remain correct
  - old `kidId`-only records still appear during migration

### 7. Parent monthly attendance read model recompute

- Current file/function: `functions/src/parentMonthlyReadModels.ts:176-306`
- Current pattern: query all parent sessions, filter target month in memory
- Safer pattern:
  - query `classSessions` by `parentId` and month-bounded `date >= monthStart && date <= monthEnd`
  - or trigger incremental counter updates from the changed session document only
- Risk: low to medium
- Tests needed:
  - month attendance totals match current logic for parents with multi-month history

### 8. Wallet outstanding dues

- Current file/function: `functions/src/wallet.ts:1216-1279`
- Current pattern: reads all `billingCharges` for parent
- Safer pattern:
  - use month-bounded or unpaid-status-bounded queries
  - maintain per-parent outstanding summary doc
- Risk: medium because finance reconciliation must remain exact
- Tests needed:
  - FIFO, overdue, wallet balance, and reconciliation totals remain consistent

### 9. Revenue archive preview/write helpers

- Current file/function: `functions/src/revenue.ts:1938-1979`, `:2182-2205`
- Current pattern: full collection scans
- Safer pattern:
  - require monthKey-bounded paged queries
  - store archive eligibility summaries incrementally
- Risk: low for app UX, medium for back-office operations
- Tests needed:
  - archive counts stay correct for sampled months

### 10. LP filtered parents

- Current file/function: `src/hooks/useLPFilteredData.ts:107-168`
- Current pattern: per-parent doc fetch plus per-parent child-count query
- Safer pattern:
  - batch parent doc lookup using `documentId in`
  - store child counts on parent summary docs
- Risk: low
- Tests needed:
  - LP sees correct assigned parent counts

## H. Test Plan

### Unit / integration tests to add

1. Teacher alias dedupe tests for today and upcoming sessions
2. Parent classes fallback tests covering:
   - canonical `kidIds`
   - legacy `kidId`
   - transferred teachers
3. Parent monthly attendance read-model parity tests before/after bounded query change
4. Finance summary parity tests between raw docs and read models
5. Wallet reconciliation parity tests for:
   - monthly payment status
   - wallet balance
   - FIFO settlement
   - overdue reports

### Manual QA routes

1. `/teacher?tab=today`
2. `/teacher?tab=upcoming`
3. `/teacher?tab=students`
4. `/teacher?tab=earnings`
5. `/parent?tab=classes`
6. `/parent?tab=insights`
7. `/parent?tab=payments`
8. `/surya?tab=finance`
9. `/surya?tab=attendance-corrections`
10. `/surya?tab=students`
11. `/surya?tab=leads`
12. `/learning-partner/dashboard`

### Emulator / production-safe rollout

1. Add logging around every Phase 0 query change.
2. Release Phase 0 changes behind small admin/teacher feature flags where possible.
3. Measure reads/day and reads/session for 3 to 5 days.
4. Only then remove legacy fallback paths.

### Before / after metrics to monitor

- Firestore daily reads
- Reads by hour
- Reads per active teacher session
- Reads per admin finance session
- Count of legacy alias fallback executions
- Count of parent dashboard raw-session fallbacks
- Cloud Function invocations and average document reads for:
  - `parentMonthlyReadModels`
  - `batchInsightsRollup`
  - wallet admin helpers

## I. Final Decision Matrix

| Fix | Estimated read reduction | Engineering effort | Risk | Priority | Recommended decision |
| --- | --- | --- | --- | --- | --- |
| Canonical-only live teacher session listeners with controlled fallback | High | Medium | Medium | P0 | Do now |
| Convert admin finance list pages from live raw collections to manual/paged loads | High | Medium | Low | P0 | Do now |
| Bound attendance corrections by date in query | Medium | Low | Low | P0 | Do now |
| Remove `refetchOnMount: 'always'` from teacher student loaders | Low to medium | Low | Low | P0 | Do now |
| Replace StudentList broad listeners with paged/manual loads | Medium | Medium | Low | P0 | Do now |
| Parent dashboard classes should prefer monthly read model, reduce raw fallback range | Medium | Medium | Medium | P0 | Do now |
| Rewrite parent monthly attendance recompute to month-bounded reads | Medium | Medium | Low | P1 | Do now |
| Introduce teacher daily/upcoming read models | High | High | Medium | P1 | Plan |
| Introduce admin finance summary docs | High | High | Medium | P1 | Plan |
| Canonicalize teacher identity fields and remove legacy aliases | High | High | Medium | P1/P2 | Plan |
| Replace LP N+1 parent child counts with summary docs | Low | Medium | Low | P2 | Plan |
| Rework finance archive preview/write full scans | Burst reduction | Medium | Low | P2 | Plan |

## Final Audit Conclusion

The read problem is primarily structural, not accidental traffic.

The strongest read amplifiers are:

1. teacher session alias listeners
2. admin finance raw collection dashboards
3. admin analytics and student monitoring
4. parent dashboard raw class/session fallbacks
5. backend read-model recomputes that scan too broadly

It is safe to proceed with Phase 0 fixes, provided the rollout explicitly protects:

- transferred teacher visibility
- parent upcoming sessions
- finance reconciliation and wallet/FIFO correctness
- legacy alias support until migration coverage is verified

The recommended next step is to implement Phase 0 only, measure, then decide whether teacher and parent read models should move into Phase 1 immediately.
