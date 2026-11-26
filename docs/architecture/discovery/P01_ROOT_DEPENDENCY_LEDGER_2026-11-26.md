# P01.1-D6 — root-level resource dependency ledger (26 November 2026 IST)

**Status:** 198/198 roots represented, scoped resource evidence 198/198, unresolved root rows 0; no transitive closure certification. Pinned main 701c7ec832dbe9c531964496fa09cd4a4948ddd2. Draft #933 on #932. No endpoint invocation, production access, runtime or data changes. Named owner/reviewer and existing approval gates remain pending.

## Method and interpretation

Exact root key set parsed from previously reconciled Function root manifest (198 unique), then mapped using explicit named root assignments, prior D1–D5 anchored evidence and new pinned finance/AVS source inspections. Each assigned row is **scoped**, even where read-oriented. Grouped roots inherit only stated shared or as-applicable resource families, not identical per-command payloads. U rows deliberately do not infer effects from names. R = read-oriented source evidence (not approved safe canary; incidental telemetry/helper effects may remain); W = writes or external effects; C = conditional mutation; U = untraced effect. CA = ensureCanonicalAdmin. Event/schedule system execution is not user authorization. Exact source constructor, event path and line anchors remain in [root manifest](P01_FUNCTION_ROOT_MANIFEST_2026-11-26.md). D1–D5 refer to corresponding discovery documents linked from master tracker. All rows require closure of indirect reads/writes, rules, live coverage and tests as applicable. Counts represent assigned evidence, not percent phase completion.

| Status | Count |
|---|---:|
| R | 23 |
| W | 161 |
| C | 14 |
| U | 0 |
| Total | 198 |

## Root-keyed ledger

| Root | Effect | Observed read resources | Observed write resources/effects | Guard | Boundary / remaining unknown | Evidence |
|---|---|---|---|---|---|---|
| onSessionComplete | W | classSessions, enrollments | classSessions, completion state | caller/session scope | completion lock; retired credit path | D1 |
| onSessionRevenueWrite | W | classSessions, enrollments, billingCharges, teacherEarnings | same; monthly revenue rollup | event | accrual/reversal tx; settlement guard | D1 |
| recordPayment | W | enrollments, billingCharges, payments | payments, charge allocations | CA | deterministic payment ID; tx | D1 |
| recordTeacherPayout | W | teacherEarnings | teacherEarnings, teacherPayouts | CA | deterministic payout; tx | D1 |
| previewFinanceCutoverArchive | R | billingCharges, payments, teacherEarnings, teacherPayouts, parentWallets | none observed | CA | collection scans; no live budget | revenue.ts:1949–2152 |
| archiveFinanceRecordsThroughMonth | C | billingCharges, payments, teacherEarnings, teacherPayouts | same (archive flags) | CA | dryRun/confirmation; bounded batch | revenue.ts:2209–2367 |
| reconcileSessionRevenueMonthKeys | C | classSessions, billingCharges, teacherEarnings | same; old/new revenue monthly rollups | CA | apply only; per-session tx | revenue.ts:2373–2687 |
| adminVoidSessionCharge | W | classSessions, billingCharges, teacherEarnings | same; enrollments, revenue rollup | CA | tx 1744; protected finance checks | revenue.ts:1719–1895 |
| recordTeacherPayoutV2 | W | teacherEarnings, adjustments, offsets | teacherEarnings, teacherPayouts, teacherPaymentOffsets | CA | settlement tx; cash/earning month separate | D1 |
| voidTeacherOrphanEarnings | W | teacherEarnings, classSessions | teacherEarnings | CA | tx; orphan checks | voidTeacherOrphanEarnings.ts:20–112 |
| onTeacherEarningsRollupWrite | W | teacherEarnings | teacher monthly earnings, adminStats | event | incremental/recompute; replay protocol | D1 |
| getWalletAutomationConfig | R | config/finance | none observed | CA | point read | wallet.ts:1294–1318 |
| setWalletAutomationConfig | W | config/finance | config/finance | CA | tx; enabling confirmation | wallet.ts:1319–1475 |
| previewMissingWalletDeductions | R | billingCharges, parentWallets/transactions | none observed | CA | scope/caps review pending | wallet.ts:1476–1756 |
| backfillMissingWalletDeductions | C | billingCharges, parentWallets/transactions | wallet summary and transaction | CA | dryRun default; apply month/confirmation; atomic append | wallet.ts:1757–2210 |
| onBillingChargeWalletSync | W | billingCharges, wallet state | parentWallets/transactions, wallet summary | event | cycle keys; atomic append | D1 |
| adminReceiveParentPayment | C | billingCharges, payments, wallet | payments, charge allocation, wallet event/summary | CA | preview vs apply; keyed tx | D1/D2 |
| adminTopupParentWallet | W | wallet state/transactions | wallet event and summary | CA | atomic append; exact input differences in source | wallet.ts:2774–2907 |
| adminAdjustParentWallet | W | wallet state/transactions | wallet event and summary | CA | atomic append; exact input differences in source | wallet.ts:2774–2907 |
| initParentWalletOpeningDeficit | C | parentWallets | wallet event and summary | CA | dryRun default; atomic append | wallet.ts:2908–3038 |
| reconcileParentWallet | C | parentWallets/transactions | wallet summary | CA | fixSummary; critical anomalies block; tx rereads wallet | wallet.ts:3039–3338 |
| auditParentPaymentBackfillDryRun | R | payments/allocations, charges, wallet/transactions, monthly views, users | none observed | guard pending exact trace | scoped scans; M3 excluded | D2 |
| applyParentPaymentBackfillForSafeParents | W | payment/charge/wallet data, parent scope | backfill run/parent evidence; planned finance writes unresolved | CA | explicit mode, caps, confirmation; per-parent closure open | D2 |
| runFinanceReconciliationAudit | W | finance source data (full helper closure open) | adminStats/financeReconciliationReports/runs | CA callable / schedule system | report persistence; not ledger repair proof | D2 |
| runFinanceReconciliationAuditDaily | W | finance source data (full helper closure open) | adminStats/financeReconciliationReports/runs | CA callable / schedule system | report persistence; not ledger repair proof | D2 |
| auditTeacherEarningsCanonicalCoverage | R | teacherEarnings | none observed | CA | bounded scan; helper closure open | auditTeacherEarningsCanonicalCoverage.ts:59–74 |
| certifyTeacherEarningsSessionCreateFastPath | C | teacherEarnings | adminStats/teacherEarningsSessionCreateFastPath/months | CA | apply certification write | certifyTeacherEarningsSessionCreateFastPath.ts:60–146 |
| prepareTeacherFinanceAnalyticsRollups | C | teacherEarnings, teachers/earnings | teachers/earnings | CA | apply; batch; capped source scan | prepareTeacherFinanceAnalyticsRollups.ts:99–255 |
| reconcileParentPaymentsMonthReadModels | C | billingCharges, monthly models, parentWallets | parent monthly models | CA | dryRun default; projection rebuild | D2 |
| recordLegacyFallbackUsage | W | caller and input | adminStats/legacyFallbackUsage/days | authenticated | day-keyed counters; not read-only | legacyFallbackMetrics.ts:37–84 |
| createSessionsFromSchedule | R | enrollments | none on pinned retired branch | CA | permanent retirement return; dormant code not active | scheduling/rollingScheduleCompatibility.ts:351–395 |
| saveEnrollmentScheduleAndGenerateSessions | W | enrollment, recurrence inputs | enrollment schedule/metadata via rolling save/reconcile | CA | retired materializer not invoked; delegated command | scheduling/rollingScheduleCompatibility.ts:398–445; D1/D2 |
| repairEnrollmentFutureSessionsFromSchedule | R | enrollments | none on pinned retired branch | CA | permanent retirement return; dormant code not active | scheduling/rollingScheduleCompatibility.ts:351–395 |
| repairCancelledFutureRegularSessionsForEnrollment | R | enrollments | none on pinned retired branch | CA | permanent retirement return; dormant code not active | scheduling/rollingScheduleCompatibility.ts:351–395 |
| pauseEnrollmentUpcomingSessions | W | enrollments | rolling lifecycle/reservation/audit as applicable | CA | nonrolling blocked; rolling lifecycle delegated; generation retired | scheduling/rollingScheduleCompatibility.ts:307–349; D1 |
| resumeEnrollmentSchedule | W | enrollments | rolling lifecycle/reservation/audit as applicable | CA | nonrolling blocked; rolling lifecycle delegated; generation retired | scheduling/rollingScheduleCompatibility.ts:307–349; D1 |
| setEnrollmentStatus | W | enrollment, lifecycle state | enrollment and delegated lifecycle records | CA | legacy nonrolling delegation; rolling transition plus separate trial/terminal patch | scheduling/rollingScheduleCompatibility.ts:217–304 |
| createEnrollment | W | kids, courses, users, enrollments, operation/key | enrollments, operationalEnrollmentKeys, creation operations, auditLogs | CA wrapper | tx; legacy generation retired | D3 |
| transitionEnrollmentCourse | W | transition, enrollments, courses, users | transition and enrollment stages (closure open) | CA | operation replay; stages not fully traced | D3 |
| saveRollingEnrollmentSchedule | W | enrollments, lifecycle reservations | enrollment, request/reservation/audit as applicable | CA | command-specific tx; D1 separate boundaries | D1 |
| setRollingEnrollmentLifecycle | W | enrollments, lifecycle reservations | enrollment, request/reservation/audit as applicable | CA | command-specific tx; D1 separate boundaries | D1 |
| reconcileRollingEnrollmentSchedule | W | enrollments | enrollment recurrence/metadata | CA | retired materialization branch | D2 |
| adminRepairRollingScheduleMaterialization | C | enrollments, legacy materialization | apply blocked by retirement | CA | dry-run; retired apply fails closed | D2 |
| createMakeupSessionFromCredit | R | none on reachable path | none; unconditional rejection | none reached | retired before authentication/body; keep historical records | createMakeupSessionFromCredit.ts:162–174 |
| saveTeacherSessionProgress | W | session, charge/earning, occurrence claims | session, student curriculum/progress, claims, correction audit, dirty marker | teacher scope | tx then dirty marker | D1 |
| adminAttendanceCorrection | W | session, ledgers, AVS case | session, correction audit, eligible voids, AVS case/resolution/dirty | legacy role | versioned batch; settled protection | D1 |
| ensureTeacherCalendarAttendanceSession | W | enrollment, child, session, claims, ledgers | classSessions, calendarAttendanceClaims | teacher scope | child/date/time tx | D1 |
| createTeacherCalendarAdHocSession | W | enrollment, day overlaps, reservations, ledgers | classSessions, teacher/student day reservations | teacher scope | dual-reservation tx | D1 |
| runAttendanceValidationRange | W | classSessions, cases/evidence, Teams Graph | runs/evidence, cases (helper paths) | CA | evidence batch; validation helpers; provider call | attendanceValidation/runValidationCallable.ts:26–138; evidenceStore.ts:20–27 |
| updateAttendanceValidationMonthlyParentProgress | W | users, parentMonthlyReadModels/months, progress | attendanceValidationMonthlyParentProgress | CA | tx 184; additional direct set/delete branch | attendanceValidation/monthlyParentProgressCallable.ts:147–309 |
| revalidateAttendanceValidationGroupCached | W | cached group evidence and sessions | validation cases via persistAvsGroupCases | CA | helper persistence; no Graph claimed | attendanceValidation/cachedGroupRevalidationCallable.ts:40–73 |
| adminVerifyAttendanceValidationGroup | W | classSessions, attendanceValidationCases | attendanceValidationResolutions, cases | CA | resolution/case tx | attendanceValidation/manualVerificationCallable.ts:25–74 |
| onAttendanceValidationHistoricalSessionCreated | W | historical classSessions event | dirty session marker | event | conditional helper write | attendanceValidation/classSessionCreateDirtyTrigger.ts:46–68; dirtySessionMarker.ts:99–123 |
| runAttendanceValidationLatestCheck | W | cases, evidence, dirty markers, classSessions | cases, dirty marker cleanup | CA | shadow runner batches; delete batch | attendanceValidation/latestCheckCallable.ts:96–496; shadowRunner.ts:1205–1251 |
| forceRefreshAttendanceValidationEvidence | W | case, classSessions, evidence, Teams Graph | runs/evidence, cases via validation helper | CA | provider refresh; evidence batch; exact helper closure open | attendanceValidation/forceFreshEvidenceCallable.ts:127–387; evidenceStore.ts:20–27 |
| forceRefreshAttendanceValidationRange | W | case/run/checkpoint; Graph via refresh helper | run/checkpoint, cases/evidence | CA | run creation and per-outcome tx; checkpoint constants pending | attendanceValidation/forceFreshRangeCallable.ts:131–790 |
| runAttendanceValidationFirstTimeBaseline | W | classSessions, cases, Teams Graph | baseline range, dirty marker, runs/evidence, cases | CA | range checkpoint and evidence batches; exact constants pending | attendanceValidation/firstTimeBaselineCallable.ts:132–557; shadowRunner.ts:1243–1251 |
| onAdminAttendanceCorrectionCompletionBridge | W | correction, session, rescheduleCredits | session status, correction bridge evidence | event | tx; past eligible Present; pending credit blocks | adminAttendanceCorrectionCompletionBridge.ts:138–265 |
| prepareAdminAttendanceCorrectionTeacherPayDecision | W | session, teacherPayDecisions; prepare reads ledgers | session, teacherPayDecisions | CA | separate prepare/cancel tx and expiry | D2 |
| cancelAdminAttendanceCorrectionTeacherPayDecision | W | session, teacherPayDecisions; prepare reads ledgers | session, teacherPayDecisions | CA | separate prepare/cancel tx and expiry | D2 |
| onAdminAttendanceCorrectionTeacherPayDecisionLink | W | correction, session, decision, earning | session, decision, earning | event | link tx; matching decision | D2 |
| onTeacherPayWithholdingSync | W | earning, session, withholding, decision | earning, session, teacherPayWithholdings, decision | event | conditional batch/tx | D2 |
| getAdminTeacherPayWithholdings | R | teacherPayWithholdings | none observed | CA | point/month query; scope verification pending | getAdminTeacherPayWithholdings.ts:86–152 |
| onTeacherEarningAdjustmentSync | W | earning, session, decision, adjustment, offsets | earning, session, teacherEarningAdjustments, decision | event | tx; exact replay closure open | D2 |
| getAdminTeacherEarningAdjustments | R | teacherEarningAdjustments | none observed | CA | month/session queries; scope pending | getAdminTeacherEarningAdjustments.ts:95–170 |
| createAdminHistoricalAttendanceSession | W | enrollment, historical teacher, sessions | classSessions, auditLogs | CA | deterministic ID tx; initial scan outside | D2 |
| getAdminHistoricalAttendanceCandidates | R | users, enrollments, classSessions, teacherReassignments, kids | none observed | CA | alias queries; scope review | D2 |
| adminSyncCanonicalPhonicsCurriculum | W | config/curriculumTopics | config/curriculumTopics | CA callable / event | compare before canonical merge; no-op when equivalent | phonicsCurriculumEnforcer.ts:24–89 |
| onCurriculumTopicsCanonicalize | W | config/curriculumTopics | config/curriculumTopics | CA callable / event | compare before canonical merge; no-op when equivalent | phonicsCurriculumEnforcer.ts:24–89 |
| onParentUserReadModelWrite | W | users event, parent monthly models | parentMonthlyReadModels/months parentNameSort | event | changed parent name; batches of 450 | parentMonthlyReadModels.ts:673–716 |
| onStudentProgressReadModelWrite | W | student progress, curriculumTopics, summary/event | students/courseProgress, progressEvents | event | identity-only backfill skipped; transactional writer with event replay | childCourseProgressProjectionMigrationGuard.ts:37–62; childCourseProgressProjectionTransactional.ts:85–196 |
| onBillingChargeReadModelWrite | W | charge/payment, monthly/internal model, wallet/users as applicable | parentMonthlyReadModels, internalBillingProjections | event | tx/fallback recompute | D1 |
| onPaymentReadModelWrite | W | charge/payment, monthly/internal model, wallet/users as applicable | parentMonthlyReadModels, internalBillingProjections | event | tx/fallback recompute | D1 |
| onClassSessionReadModelWrite | W | classSessions, affected parent/month | parent monthly attendance | event | projection recompute | D1 |
| bootstrapParentCourseProgress | W | users, kids/students/parent child, enrollments, curriculumTopics, progress | students/courseProgress | active parent/child/course scope | bounded bootstrap writes; not getter | parentCanonicalProjectionBootstrap.ts:191–303 |
| onParentProjectionBootstrapRequest | W | request, child ownership, course assignment or sessions | request state, courseProgress or monthly attendance model | event; request shape and ownership | success/failure state separate from projection | parentCanonicalProjectionBootstrap.ts:443–550 |
| bootstrapParentClassAttendance | W | users, child aliases, sessions, current monthly view | parentMonthlyReadModels/months, repair locks | active parent/child scope | current IST month only; transactional claim, repair and completion separate | bootstrapParentClassAttendanceV2.ts:423–590 |
| adminCreateUser | W | users, canonical target probes, Auth | Auth, canonical and compatibility docs, access read model | CA | Auth separate from Firestore tx; rollback | D3 |
| backfillTeacherDocs | W | users, teachers | teachers compatibility records | CA | point merges; helper scope open | adminCreateUser.ts:22–92 |
| adminDeleteUser | W | users, Auth | Auth user deletion, users/role mirrors deletion | CA | self and protected parent/kid/schoolAdmin roles blocked; Auth then batch | adminDeleteUser.ts:20–136 |
| adminArchiveUser | W | users, Auth, canonical identity | Auth disabled, people/authIdentities/roleAssignments/personLifecycle, users/role mirror, access model | CA | Auth separate from canonical tx; rollback and refresh | adminArchiveUserCanonical.ts:27–249; canonicalPrimaryAuthUserArchive.ts:119–542 |
| getFounderEditorialReviewState | R | users, editorialReviewState | none observed | active legacy founder | point read | founderEditorialReview.ts:60–110 |
| setFounderEditorialReviewDecision | W | users, editorialReviewState, publicEditorialReviewState | editorialReviewState, publicEditorialReviewState, editorialReviewAudit | active legacy founder | tx; review revision and audit | founderEditorialReview.ts:114–190 |
| adminUpdateUser | W | users, canonical targets, Auth | Auth claims/profile, canonical/compatibility, access model | CA | guarded tx; Auth rollback | D3 |
| adminGenerateResetLink | W | Auth user, password_reset_requests | generated reset link and password_reset_requests | CA | credential recovery effect and audit; no live invocation | adminGenerateResetLink.ts:61–145 |
| adminResetPassword | W | caller, target UID | Auth credential, password_reset_requests | CA | Auth update then audit; not atomic | adminResetPassword.ts:24–90 |
| resolveLoginIdentifier | R | loginAliases, usernames, users, Auth | none observed | pre-auth resolver | bounded alias queries; sensitive account resolution; M3 hold | resolveLoginIdentifier.ts:85–217 |
| getSessionsManagementSnapshot | C | current metadata, projection state/deltas, snapshot payload, source if missing | snapshot shards/current/state/lease, delta prune on bootstrap | CA | schema mismatch/missing triggers rebuild; not read-only | sessionsManagementSnapshot.ts:548–765,879–915 |
| adminRefreshSessionsManagementSnapshot | W | classSessions, enrollments, related users/kids/students/courses | snapshot shards/current/state/lease, delta prune | CA callable / schedule system | lease tx, payload batches, publish batch; fail closed on saturated baseline | sessionsManagementSnapshot.ts:548–765,919–924,1074–1084 |
| getSessionsManagementDateSnapshot | R | current metadata, classSessions/date, related enrollments/users/kids/students/courses | none observed | CA | 200 session query cap; date payload lacks same saturation check as baseline | sessionsManagementSnapshot.ts:849–941 |
| refreshSessionsManagementSnapshot4am | W | classSessions, enrollments, related users/kids/students/courses | snapshot shards/current/state/lease, delta prune | CA callable / schedule system | lease tx, payload batches, publish batch; fail closed on saturated baseline | sessionsManagementSnapshot.ts:548–765,919–924,1074–1084 |
| onSessionsManagementEnrollmentWrite | W | event and projection state/delta | adminSessionsManagementDeltas, adminSessionsManagement/projectionState | event | delta ID and revision tx; relevant-change checks | sessionsManagementSnapshot.ts:403–425,945–1063 |
| onSessionsManagementClassSessionWrite | W | event and projection state/delta | adminSessionsManagementDeltas, adminSessionsManagement/projectionState | event | delta ID and revision tx; relevant-change checks | sessionsManagementSnapshot.ts:403–425,945–1063 |
| adminCreateSchool | W | school, users/schoolUsers as applicable | schools, schoolUsers, LP history as applicable | guard exact trace pending | separate command tx; D3 anchors | D3 |
| adminUpdateSchool | W | school, users/schoolUsers as applicable | schools, schoolUsers, LP history as applicable | guard exact trace pending | separate command tx; D3 anchors | D3 |
| adminAssignSchoolLearningPartner | W | school, users/schoolUsers as applicable | schools, schoolUsers, LP history as applicable | guard exact trace pending | separate command tx; D3 anchors | D3 |
| adminLinkSchoolUser | W | school, users/schoolUsers as applicable | schools, schoolUsers, LP history as applicable | guard exact trace pending | separate command tx; D3 anchors | D3 |
| adminUnlinkSchoolUser | W | school, users/schoolUsers as applicable | schools, schoolUsers, LP history as applicable | guard exact trace pending | separate command tx; D3 anchors | D3 |
| schoolCreateAcademicYear | W | school, year | academicYears, current year pointer | school manager | year switch tx | D4 |
| schoolSetCurrentAcademicYear | W | school, year | academicYears, current year pointer | school manager | year switch tx | D4 |
| schoolUpsertGrade | W | academic year/grade, sections on deactivate | school grades | school manager | check then merge/update | D4 |
| schoolSetGradeStatus | W | academic year/grade, sections on deactivate | school grades | school manager | check then merge/update | D4 |
| schoolUpsertSection | W | year/grade/teachers as applicable | school sections | school manager | guarded point writes | D4 |
| schoolSetSectionStatus | W | year/grade/teachers as applicable | school sections | school manager | guarded point writes | D4 |
| schoolUpsertTeacher | W | school teachers | school teachers | school manager | point writes | D4 |
| schoolSetTeacherStatus | W | school teachers | school teachers | school manager | point writes | D4 |
| schoolUpdateCurriculumProgress | W | school section/course/stage | curriculumProgress and history | school manager | tx | D4 |
| schoolUpdateTeacherTraining | W | school teacher/track | teacherTraining and history | school manager | tx | D4 |
| schoolCreateReview | W | year/section/actor | reviews | school manager | create evidence | D4 |
| schoolRecordAssessmentSummary | W | year/section/actor | assessmentSummaries | school manager | aggregate evidence create | D4 |
| schoolGetProgrammeSnapshot | R | school years/teachers/grades/sections/progress/training/reviews/assessments/activity | none observed | school reader | role-specific redaction; broad reads | D4 |
| onSchoolAcademicYearActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| onSchoolGradeActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| onSchoolSectionActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| onSchoolTeacherActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| onSchoolCurriculumActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| onSchoolTrainingActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| onSchoolReviewActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| onSchoolAssessmentActivity | W | event source, users actor | schools/activity | event | auto-ID asynchronous evidence | D4 |
| assignLPToParent | W | users relationships | users compatibility links | CA | helper closure open | D3 |
| unassignLPFromParent | W | users relationships | users compatibility links | CA | helper closure open | D3 |
| assignLPToTeacher | W | users relationships | users compatibility links | CA | helper closure open | D3 |
| unassignLPFromTeacher | W | users relationships | users compatibility links | CA | helper closure open | D3 |
| adminSetUserRole | W | users, canonical targets, Auth | Auth claims/profile, canonical/compatibility, access model | CA | guarded tx; Auth rollback | D3 |
| updateTeacherProfile | W | users, canonical person/identity/role, teacher mirrors | people, personContacts, canonical profile records, users/teachers | self/Admin branch; exact parity pending | canonical guarded tx; compatibility projections | updateTeacherProfile.ts:104–340; canonicalPrimaryTeacherProfile.ts:196–705 |
| onGameProgressWrite | W | gameProgress | gameSummaries | event | merge projection | D5 |
| onGameSessionCreateTrigger | W | gameSessions, catalog, marker | levelCompletions, gameProgress, activity, skillTagStats, rollupsApplied | event | independent writes; marker last | D5 |
| createStudentForParent | W | users, parent person/role, target probes | canonical learner/guardian and compatibility records | parent scope / CA respectively | tx and post-commit verify | D3 |
| adminCreateStudent | W | users, parent person/role, target probes | canonical learner/guardian and compatibility records | parent scope / CA respectively | tx and post-commit verify | D3 |
| adminUpdateStudent | W | people, learnerProfiles, learnerDetails, kids | same | CA | tx and verification | D3 |
| runInsightsRollupNow | W | config, gameSessions, kids, progress/summaries/activity | gameSummaries, config/insights | legacy Admin manual / schedule system | batch rollup | D5 |
| setInsightsEnabled | W | config/insights | config/insights | legacy Admin | config write | D5 |
| batchInsightsRollup11am | W | config, gameSessions, kids, progress/summaries/activity | gameSummaries, config/insights | legacy Admin manual / schedule system | batch rollup | D5 |
| batchInsightsRollup5pm | W | config, gameSessions, kids, progress/summaries/activity | gameSummaries, config/insights | legacy Admin manual / schedule system | batch rollup | D5 |
| batchInsightsRollup11pm | W | config, gameSessions, kids, progress/summaries/activity | gameSummaries, config/insights | legacy Admin manual / schedule system | batch rollup | D5 |
| globalLearnersRollup | W | parent users | eligible users country fields, public Storage aggregate | schedule system | batch plus external object save | D5 |
| ensureGamesCatalogNow | W | config/gamesCatalog | config/gamesCatalog | legacy Admin | catalog patch/normalization | D5 |
| cleanupGamesCatalogNow | W | config/gamesCatalog | config/gamesCatalog | legacy Admin | catalog patch/normalization | D5 |
| recordLevelResult | W | kids, caller scope | gameSessions/eventId | linked child or CA | create-only replay protection | D5 |
| createLessonAccessSession | W | lessons, caller role, daily counters | lessonAccessSessions, lessonDailyAudit, teacherDailyAccess | teacher/Admin | tx | D4 |
| resolveLessonAccessViewer | R | lessonAccessSessions, lessons | none observed | owner teacher/Admin | expiry/revocation; external URL | D4 |
| getParentWorksheetResources | R | parent identity, kids/students, enrollments, full worksheet library, courses | no business writes observed; shadow telemetry closure open | parent scope | compatibility reads; #925 pending | D4 |
| onWave1LegacyUserIdentityWrite | W | legacy source, references, canonical ownership | migration-owned canonical records | event | tx and projection authority guard | D3 |
| onWave1LegacyKidIdentityWrite | W | legacy source, references, canonical ownership | migration-owned canonical records | event | tx and projection authority guard | D3 |
| onWave1LegacySchoolIdentityWrite | W | legacy source, references, canonical ownership | migration-owned canonical records | event | tx and projection authority guard | D3 |
| onWave1LegacySchoolUserIdentityWrite | W | legacy source, references, canonical ownership | migration-owned canonical records | event | tx and projection authority guard | D3 |
| contactForm | W | public validated request | contactSubmissions, mail queue | public POST validation | separate adds; delivery provider not verified | contactForm.ts:152–205 |
| enrichPublicLeadAttribution | W | lead, leadMergeRedirects | lead attribution and inquiry history | public lead ID, source/recency constraints | tx; already enriched guard; no Auth gate observed | enrichPublicLeadAttribution.ts:230–348 |
| onWebsiteLeadIdentityWrite | W | leads, identity index, histories, demos | leads, history, index, redirects, demos | event | merge tx; conflict guards | D3 |
| getProspectiveAcquisitionSummary | R | authAccessReadModels via principal, leads | none observed | canonical global Admin/founder | four timestamp queries, 93-day max, overflow fails closed; aggregate output | getProspectiveAcquisitionSummary.ts:44–105 |
| reassignEnrollmentTeacher | W | enrollment, kids, users | enrollment, teacherReassignments history | CA | separate writes; retirement controls | D2 |
| repairEnrollmentTeacherSessionConsistency | C | enrollments, kids, session queries via helper | session snapshots and kid teacher ownership on apply | CA | dryRun default; exact helper closure open | lifecycle.ts:2396–2505 |
| archiveKid | W | kids, enrollment aliases | kids archive state; future-session cancellation helper | CA | active/trial block; separate cancellation; retirement/helper closure open | lifecycle.ts:2521–2587 |
| createAdminManualSession | W | enrollment, session | classSessions, auditLogs | CA | deterministic tx | D2 |
| cancelAdminManualSession | W | session, protected finance | session, auditLogs | CA | batch | D2 |
| auditTeacherTodaySessions | R | users, classSessions, enrollments, kids | none observed | CA | date/teacher alias scan | auditTeacherTodaySessions.ts:194–247 |
| auditAllTransferredSessionSnapshotIssues | R | classSessions, enrollments, users, kids/children, courses | none observed | CA | bounded scans and alias lookups; full budget unknown | auditAllTransferredSessionSnapshotIssues.ts:373–786 |
| repairTransferredTeacherSessionSnapshots | C | users, classSessions, enrollments, kids, courses | classSessions snapshot fields | CA | dryRun only when explicitly true; batch | repairTransferredTeacherSessionSnapshots.ts:145–314 |
| adminRepairTeacherStudentSnapshots | W | enrollments, kids, classSessions | always adminStats/teacherStudentSnapshotRepairRuns/runs; conditional enrollment/session fields | CA | apply batch; report even dry run | repairTeacherStudentSnapshots.ts:160–298 |
| traceStudentTransferHistory | R | users, enrollments, kids/children, classSessions | none observed | CA | alias/name query fanout; privacy and bounds pending | traceStudentTransferHistory.ts:886–1102 |
| adminBackfillEnrollmentCanonicalFields | W | enrollments | always adminStats/enrollmentCanonicalBackfillRuns/runs; conditional enrollment patches | CA | apply batch; report even dry run | enrollmentCanonicalBackfill.ts:139–272 |
| runEnrollmentCanonicalCoverage | W | enrollments | adminStats/enrollmentCanonicalCoverage and runs | CA callable / schedule system | coverage report writes; separate set operations | enrollmentCanonicalCoverage.ts:73–240 |
| runEnrollmentCanonicalCoverageDaily | W | enrollments | adminStats/enrollmentCanonicalCoverage and runs | CA callable / schedule system | coverage report writes; separate set operations | enrollmentCanonicalCoverage.ts:73–240 |
| onDemoSessionEarningsWrite | W | demo, existing earnings | teacherEarnings | event | deterministic demo earning IDs | D3 |
| adminCheckDemoPhoneConflicts | R | demoSessionsPrivate, leads, users, enrollments | none observed | Admin profile guard | phone matching; restricted PII; bounded individual queries | demoSessionsLegacy.ts:771–878 |
| adminCreateDemoSession | W | lead, demo/private, dedupe keys | demo/private, lead, keys | caller checks | tx | D3 |
| adminUpdateDemoSessionDetails | W | lead, demo/private, dedupe keys | demo/private, lead, keys | caller checks | tx | D3 |
| adminUpdateDemoConversion | W | demo | demo conversion/follow-up | legacy Admin | tx; optional replay key | D3 |
| claimDemoSession | W | demo/assignment | demo | caller checks | tx | D3 |
| updateDemoSessionSchedule | W | demo/assignment | demo | caller checks | tx | D3 |
| completeDemoSession | W | assigned demo, private/lead as applicable | demo, reschedule follow-up and private/links | assigned teacher/Admin | tx | D3 |
| reassignDemoSession | W | demo and caller/assignment as applicable | demoSessions | legacy Admin | distinct state guards; tx | demoSessionsLegacy.ts:1737–1906 |
| cancelDemoSession | W | demo and caller/assignment as applicable | demoSessions | legacy Admin | distinct state guards; tx | demoSessionsLegacy.ts:1737–1906 |
| releaseDemoSession | W | demo and caller/assignment as applicable | demoSessions | legacy Admin | distinct state guards; tx | demoSessionsLegacy.ts:1737–1906 |
| deleteDemoSession | W | demo/private, dedupe key, demo earnings | delete demo/private, owned key and unpaid earnings | legacy Admin | tx; paid/settled or positive paid amount blocks | demoSessionsLegacy.ts:1907–1967 |
| reopenDemoSession | W | demo, demo earnings | demo and eligible earnings | legacy Admin | tx; paid/settled blocked | demoSessionsLegacy.ts:1982–2078 |
| onLeadCreatedCanonicalize | W | lead | lead receipt/lifecycle | event | tx | D3 |
| onDemoLeadLifecycleWrite | W | demo/private, lead, prior attempt | lead/demo | event | tx | D3 |
| teacherCancelAssignedDemo | W | users, assigned demo | demoSessions | assigned teacher | transaction rechecks assignment | leadLifecycle.ts:361–419 |
| onDemoPayoutIntegrityWrite | W | teacherEarnings event, demo | teacherEarnings | event | conditional merge; exact replay guards pending | leadLifecycle.ts:420–462 |
| onLeadEnsureDemoRequest | W | lead, demo/private, dedupe | demo/private, lead, keys | event / legacy Admin retry | shared idempotent tx | D3 |
| adminRetryLeadDemoRequest | W | lead, demo/private, dedupe | demo/private, lead, keys | event / legacy Admin retry | shared idempotent tx | D3 |
| onOrphanDemoIdentityRepair | W | demo/private, real and synthetic leads | demo, lead, eligible synthetic removal | event | tx | D3 |
| adminBackfillLeadLifecycle | C | demo/private, leads | leads and demo links | legacy Admin | dryRun default; per-lead tx; overflow apply blocked | leadLifecycleBackfill.ts:56–223 |
| adminUpdateLeadWorkflowRecord | W | lead/demo/private, identity and demo keys | linked records/keys; delete root and redirects as applicable | legacy Admin | tx; deletion cleanup batch | D3 |
| adminDeleteLeadWorkflowRecord | W | lead/demo/private, identity and demo keys | linked records/keys; delete root and redirects as applicable | legacy Admin | tx; deletion cleanup batch | D3 |
| adminCorrectDemoCompletion | W | demo, earnings, correction payouts | demoSessions, teacherEarnings, teacherPayouts correction records | CA | tx; settlement correction workflow | adminCorrectDemoCompletion.ts:91–258 |
| refreshPublicKb | W | public KB JSON, public_kb_chunks | public_kb_chunks | CA | deactivate then replace separate commits | D5 |
| createOrSyncMessageThread | W | kids/students/enrollments/users | messageThreads | Admin/participant | deterministic thread upsert tx | D4 |
| sendMessage | W | messageThreads, recipient state | messages, thread, userNotificationState, notifications; push | Admin/participant | tx then external delivery | D4 |
| markMessageThreadRead | W | thread, userNotificationState | thread, state, push | participant | tx then push | D4 |
| reconcileMyUnreadMessageCount | W | participant threads | userNotificationState | authenticated self | aggregate write | D4 |
| syncMessageThreadsForActiveStudents | W | enrollments, kids, students, participant metadata | messageThreads | CA | grouped upsert tx; partial errors reported | messaging/syncMessageThreadsForActiveStudents.ts:71–149 |
| onEnrollmentMessageThreadAutoSync | W | event + participant source records | messageThreads | event | async upsert | D4 |
| onKidMessageThreadAutoSync | W | event + participant source records | messageThreads | event | async upsert | D4 |
| onStudentMessageThreadAutoSync | W | event + participant source records | messageThreads | event | async upsert | D4 |
| registerNotificationToken | W | token record, role | notificationTokens | authenticated self | hashed key tx | D4 |
| sendTestPushNotification | W | notificationTokens | external push; invalid token updates | CA | provider and cleanup | D4 |

## New source findings and priority follow-up

Finance: archive preview includes wallet but write archive targets four non-wallet collections; do not equate preview scope to write scope. Wallet reconciliation reads ledger before summary correction transaction, which rereads wallet; concurrent ledger change handling requires test, not a demonstrated incident. Fast-path certification and analytics preparation have apply writes, even where default dry-run. AVS: validation range/evidence/baseline can use Teams Graph; evidenceStore batches attendanceValidationRuns and attendanceValidationEvidence, shadowRunner batches attendanceValidationCases, latest check deletes dirty markers. Manual verification transaction writes resolution/cases, not attendance mutation in that helper. Preserve workflow evidence separate from official attendance and finance. Exact force-refresh run/baseline constants and helper targets remain unresolved; no secret values requested or stored.

D7: all former U rows now have scoped assignments; next D8 closes indirect dependencies and resource catalogue, prioritizing high-risk writers. R includes permanently retired no-effect paths; no R row is automatically a production canary. Continue mapping per-root helper closure, script inventory and direct client paths. P01.1-D/P01.4 remain IN PROGRESS; P01.3 partial; live P01.2/P01.3 and M3 HOLD. No new tests or CI; actual Git deployment resolver and owner approval before merge. Re-pin on main change; docs-only rollback.

## D7 evidence extension (26 November 2026)

All 58 formerly unresolved rows inspected at pinned main and updated individually. Snapshot getter conditionally bootstraps, while date getter reads up to 200 sessions without the same saturation refusal as baseline build; verify truncation behavior before migration. Parent bootstraps mutate projection and lock/request state. Enrollment canonical backfill and teacher/student snapshot repair persist run records even when apply=false; transferred-session repair defaults to apply unless dryRun=true. Makeup credit booking rejects before old body, and future generator/repair returns retired response; pause/resume rolling entry points still mutate enrollment. Preserve pending-credit guard on correction completion. Hard delete excludes protected parent/kid/schoolAdmin roles; Auth deletion before Firestore batch requires partial-failure handling. Demo hard delete is distinct from active lead deletion and blocks paid earnings. Public contact and enrichment paths are separate from authorized CRM; verify abuse controls and privacy in later scoped review. These are source-level findings, not observed production incidents. All 198 assignments remain scoped, not full call-graph, Rules or runtime certification. No production, scripts or tests executed.
