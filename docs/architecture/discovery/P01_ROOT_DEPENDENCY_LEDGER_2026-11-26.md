# P01.1-D6 — root-level resource dependency ledger (26 November 2026 IST)

**Status:** 198/198 roots represented, scoped resource evidence 140/198, unresolved root rows 58; no transitive closure certification. Pinned main 701c7ec832dbe9c531964496fa09cd4a4948ddd2. Draft #933 on #932. No endpoint invocation, production access, runtime or data changes. Named owner/reviewer and existing approval gates remain pending.

## Method and interpretation

Exact root key set parsed from previously reconciled Function root manifest (198 unique), then mapped using explicit named root assignments, prior D1–D5 anchored evidence and new pinned finance/AVS source inspections. Each assigned row is **scoped**, even where read-oriented. Grouped roots inherit only stated shared or as-applicable resource families, not identical per-command payloads. U rows deliberately do not infer effects from names. R = read-oriented source evidence (not approved safe canary; incidental telemetry/helper effects may remain); W = writes or external effects; C = conditional mutation; U = untraced effect. CA = ensureCanonicalAdmin. Event/schedule system execution is not user authorization. Exact source constructor, event path and line anchors remain in [root manifest](P01_FUNCTION_ROOT_MANIFEST_2026-11-26.md). D1–D5 refer to corresponding discovery documents linked from master tracker. All rows require closure of indirect reads/writes, rules, live coverage and tests as applicable. Counts represent assigned evidence, not percent phase completion.

| Status | Count |
|---|---:|
| R | 9 |
| W | 121 |
| C | 10 |
| U | 58 |
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
| recordLegacyFallbackUsage | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | legacyFallbackMetrics.ts:37 |
| createSessionsFromSchedule | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | scheduling/rollingScheduleCompatibility.ts:351 |
| saveEnrollmentScheduleAndGenerateSessions | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | scheduling/rollingScheduleCompatibility.ts:398 |
| repairEnrollmentFutureSessionsFromSchedule | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | scheduling/rollingScheduleCompatibility.ts:362 |
| repairCancelledFutureRegularSessionsForEnrollment | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | scheduling/rollingScheduleCompatibility.ts:380 |
| pauseEnrollmentUpcomingSessions | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | scheduling/rollingScheduleCompatibility.ts:307 |
| resumeEnrollmentSchedule | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | scheduling/rollingScheduleCompatibility.ts:329 |
| setEnrollmentStatus | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | scheduling/rollingScheduleCompatibility.ts:217 |
| createEnrollment | W | kids, courses, users, enrollments, operation/key | enrollments, operationalEnrollmentKeys, creation operations, auditLogs | CA wrapper | tx; legacy generation retired | D3 |
| transitionEnrollmentCourse | W | transition, enrollments, courses, users | transition and enrollment stages (closure open) | CA | operation replay; stages not fully traced | D3 |
| saveRollingEnrollmentSchedule | W | enrollments, lifecycle reservations | enrollment, request/reservation/audit as applicable | CA | command-specific tx; D1 separate boundaries | D1 |
| setRollingEnrollmentLifecycle | W | enrollments, lifecycle reservations | enrollment, request/reservation/audit as applicable | CA | command-specific tx; D1 separate boundaries | D1 |
| reconcileRollingEnrollmentSchedule | W | enrollments | enrollment recurrence/metadata | CA | retired materialization branch | D2 |
| adminRepairRollingScheduleMaterialization | C | enrollments, legacy materialization | apply blocked by retirement | CA | dry-run; retired apply fails closed | D2 |
| createMakeupSessionFromCredit | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | createMakeupSessionFromCredit.ts:162 |
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
| onAdminAttendanceCorrectionCompletionBridge | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | adminAttendanceCorrectionCompletionBridge.ts:138 |
| prepareAdminAttendanceCorrectionTeacherPayDecision | W | session, teacherPayDecisions; prepare reads ledgers | session, teacherPayDecisions | CA | separate prepare/cancel tx and expiry | D2 |
| cancelAdminAttendanceCorrectionTeacherPayDecision | W | session, teacherPayDecisions; prepare reads ledgers | session, teacherPayDecisions | CA | separate prepare/cancel tx and expiry | D2 |
| onAdminAttendanceCorrectionTeacherPayDecisionLink | W | correction, session, decision, earning | session, decision, earning | event | link tx; matching decision | D2 |
| onTeacherPayWithholdingSync | W | earning, session, withholding, decision | earning, session, teacherPayWithholdings, decision | event | conditional batch/tx | D2 |
| getAdminTeacherPayWithholdings | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | getAdminTeacherPayWithholdings.ts:86 |
| onTeacherEarningAdjustmentSync | W | earning, session, decision, adjustment, offsets | earning, session, teacherEarningAdjustments, decision | event | tx; exact replay closure open | D2 |
| getAdminTeacherEarningAdjustments | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | getAdminTeacherEarningAdjustments.ts:95 |
| createAdminHistoricalAttendanceSession | W | enrollment, historical teacher, sessions | classSessions, auditLogs | CA | deterministic ID tx; initial scan outside | D2 |
| getAdminHistoricalAttendanceCandidates | R | users, enrollments, classSessions, teacherReassignments, kids | none observed | CA | alias queries; scope review | D2 |
| adminSyncCanonicalPhonicsCurriculum | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | phonicsCurriculumEnforcer.ts:70 |
| onCurriculumTopicsCanonicalize | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | phonicsCurriculumEnforcer.ts:89 |
| onParentUserReadModelWrite | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | parentMonthlyReadModels.ts:673 |
| onStudentProgressReadModelWrite | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | childCourseProgressProjectionMigrationGuard.ts:37 |
| onBillingChargeReadModelWrite | W | charge/payment, monthly/internal model, wallet/users as applicable | parentMonthlyReadModels, internalBillingProjections | event | tx/fallback recompute | D1 |
| onPaymentReadModelWrite | W | charge/payment, monthly/internal model, wallet/users as applicable | parentMonthlyReadModels, internalBillingProjections | event | tx/fallback recompute | D1 |
| onClassSessionReadModelWrite | W | classSessions, affected parent/month | parent monthly attendance | event | projection recompute | D1 |
| bootstrapParentCourseProgress | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | parentCanonicalProjectionBootstrap.ts:268 |
| onParentProjectionBootstrapRequest | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | parentCanonicalProjectionBootstrap.ts:443 |
| bootstrapParentClassAttendance | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | bootstrapParentClassAttendanceV2.ts:507 |
| adminCreateUser | W | users, canonical target probes, Auth | Auth, canonical and compatibility docs, access read model | CA | Auth separate from Firestore tx; rollback | D3 |
| backfillTeacherDocs | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | adminCreateUser.ts:22 |
| adminDeleteUser | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | adminDeleteUser.ts:20 |
| adminArchiveUser | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | adminArchiveUserCanonical.ts:27 |
| getFounderEditorialReviewState | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | founderEditorialReview.ts:95 |
| setFounderEditorialReviewDecision | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | founderEditorialReview.ts:114 |
| adminUpdateUser | W | users, canonical targets, Auth | Auth claims/profile, canonical/compatibility, access model | CA | guarded tx; Auth rollback | D3 |
| adminGenerateResetLink | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | adminGenerateResetLink.ts:61 |
| adminResetPassword | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | adminResetPassword.ts:24 |
| resolveLoginIdentifier | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | resolveLoginIdentifier.ts:184 |
| getSessionsManagementSnapshot | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | sessionsManagementSnapshot.ts:879 |
| adminRefreshSessionsManagementSnapshot | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | sessionsManagementSnapshot.ts:919 |
| getSessionsManagementDateSnapshot | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | sessionsManagementSnapshot.ts:928 |
| refreshSessionsManagementSnapshot4am | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | sessionsManagementSnapshot.ts:1074 |
| onSessionsManagementEnrollmentWrite | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | sessionsManagementSnapshot.ts:945 |
| onSessionsManagementClassSessionWrite | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | sessionsManagementSnapshot.ts:1006 |
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
| updateTeacherProfile | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | updateTeacherProfile.ts:104 |
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
| contactForm | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | contactForm.ts:152 |
| enrichPublicLeadAttribution | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | enrichPublicLeadAttribution.ts:230 |
| onWebsiteLeadIdentityWrite | W | leads, identity index, histories, demos | leads, history, index, redirects, demos | event | merge tx; conflict guards | D3 |
| getProspectiveAcquisitionSummary | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | getProspectiveAcquisitionSummary.ts:66 |
| reassignEnrollmentTeacher | W | enrollment, kids, users | enrollment, teacherReassignments history | CA | separate writes; retirement controls | D2 |
| repairEnrollmentTeacherSessionConsistency | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | lifecycle.ts:2396 |
| archiveKid | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | lifecycle.ts:2521 |
| createAdminManualSession | W | enrollment, session | classSessions, auditLogs | CA | deterministic tx | D2 |
| cancelAdminManualSession | W | session, protected finance | session, auditLogs | CA | batch | D2 |
| auditTeacherTodaySessions | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | auditTeacherTodaySessions.ts:194 |
| auditAllTransferredSessionSnapshotIssues | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | auditAllTransferredSessionSnapshotIssues.ts:678 |
| repairTransferredTeacherSessionSnapshots | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | repairTransferredTeacherSessionSnapshots.ts:145 |
| adminRepairTeacherStudentSnapshots | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | repairTeacherStudentSnapshots.ts:160 |
| traceStudentTransferHistory | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | traceStudentTransferHistory.ts:971 |
| adminBackfillEnrollmentCanonicalFields | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | enrollmentCanonicalBackfill.ts:139 |
| runEnrollmentCanonicalCoverage | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | enrollmentCanonicalCoverage.ts:223 |
| runEnrollmentCanonicalCoverageDaily | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | enrollmentCanonicalCoverage.ts:231 |
| onDemoSessionEarningsWrite | W | demo, existing earnings | teacherEarnings | event | deterministic demo earning IDs | D3 |
| adminCheckDemoPhoneConflicts | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | demoSessionsLegacy.ts:771 |
| adminCreateDemoSession | W | lead, demo/private, dedupe keys | demo/private, lead, keys | caller checks | tx | D3 |
| adminUpdateDemoSessionDetails | W | lead, demo/private, dedupe keys | demo/private, lead, keys | caller checks | tx | D3 |
| adminUpdateDemoConversion | W | demo | demo conversion/follow-up | legacy Admin | tx; optional replay key | D3 |
| claimDemoSession | W | demo/assignment | demo | caller checks | tx | D3 |
| updateDemoSessionSchedule | W | demo/assignment | demo | caller checks | tx | D3 |
| completeDemoSession | W | assigned demo, private/lead as applicable | demo, reschedule follow-up and private/links | assigned teacher/Admin | tx | D3 |
| reassignDemoSession | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | demoSessionsLegacy.ts:1737 |
| cancelDemoSession | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | demoSessionsLegacy.ts:1814 |
| releaseDemoSession | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | demoSessionsLegacy.ts:1854 |
| deleteDemoSession | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | demoSessionsLegacy.ts:1907 |
| reopenDemoSession | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | demoSessionsLegacy.ts:1982 |
| onLeadCreatedCanonicalize | W | lead | lead receipt/lifecycle | event | tx | D3 |
| onDemoLeadLifecycleWrite | W | demo/private, lead, prior attempt | lead/demo | event | tx | D3 |
| teacherCancelAssignedDemo | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | leadLifecycle.ts:361 |
| onDemoPayoutIntegrityWrite | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | leadLifecycle.ts:420 |
| onLeadEnsureDemoRequest | W | lead, demo/private, dedupe | demo/private, lead, keys | event / legacy Admin retry | shared idempotent tx | D3 |
| adminRetryLeadDemoRequest | W | lead, demo/private, dedupe | demo/private, lead, keys | event / legacy Admin retry | shared idempotent tx | D3 |
| onOrphanDemoIdentityRepair | W | demo/private, real and synthetic leads | demo, lead, eligible synthetic removal | event | tx | D3 |
| adminBackfillLeadLifecycle | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | leadLifecycleBackfill.ts:56 |
| adminUpdateLeadWorkflowRecord | W | lead/demo/private, identity and demo keys | linked records/keys; delete root and redirects as applicable | legacy Admin | tx; deletion cleanup batch | D3 |
| adminDeleteLeadWorkflowRecord | W | lead/demo/private, identity and demo keys | linked records/keys; delete root and redirects as applicable | legacy Admin | tx; deletion cleanup batch | D3 |
| adminCorrectDemoCompletion | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | adminCorrectDemoCompletion.ts:91 |
| refreshPublicKb | W | public KB JSON, public_kb_chunks | public_kb_chunks | CA | deactivate then replace separate commits | D5 |
| createOrSyncMessageThread | W | kids/students/enrollments/users | messageThreads | Admin/participant | deterministic thread upsert tx | D4 |
| sendMessage | W | messageThreads, recipient state | messages, thread, userNotificationState, notifications; push | Admin/participant | tx then external delivery | D4 |
| markMessageThreadRead | W | thread, userNotificationState | thread, state, push | participant | tx then push | D4 |
| reconcileMyUnreadMessageCount | W | participant threads | userNotificationState | authenticated self | aggregate write | D4 |
| syncMessageThreadsForActiveStudents | U | Untraced | Untraced | Untraced | Inspect body/helper; exclude from live canary | messaging/syncMessageThreadsForActiveStudents.ts:103 |
| onEnrollmentMessageThreadAutoSync | W | event + participant source records | messageThreads | event | async upsert | D4 |
| onKidMessageThreadAutoSync | W | event + participant source records | messageThreads | event | async upsert | D4 |
| onStudentMessageThreadAutoSync | W | event + participant source records | messageThreads | event | async upsert | D4 |
| registerNotificationToken | W | token record, role | notificationTokens | authenticated self | hashed key tx | D4 |
| sendTestPushNotification | W | notificationTokens | external push; invalid token updates | CA | provider and cleanup | D4 |

## New source findings and priority follow-up

Finance: archive preview includes wallet but write archive targets four non-wallet collections; do not equate preview scope to write scope. Wallet reconciliation reads ledger before summary correction transaction, which rereads wallet; concurrent ledger change handling requires test, not a demonstrated incident. Fast-path certification and analytics preparation have apply writes, even where default dry-run. AVS: validation range/evidence/baseline can use Teams Graph; evidenceStore batches attendanceValidationRuns and attendanceValidationEvidence, shadowRunner batches attendanceValidationCases, latest check deletes dirty markers. Manual verification transaction writes resolution/cases, not attendance mutation in that helper. Preserve workflow evidence separate from official attendance and finance. Exact force-refresh run/baseline constants and helper targets remain unresolved; no secret values requested or stored.

Next D7: resolve U rows, starting sessions management snapshot/parent bootstraps and identity account lifecycle; then legacy scheduling, admissions maintenance, AVS completion bridge, repair/coverage and acquisition. Continue mapping per-root helper closure, script inventory and direct client paths. P01.1-D/P01.4 remain IN PROGRESS; P01.3 partial; live P01.2/P01.3 and M3 HOLD. No new tests or CI; actual Git deployment resolver and owner approval before merge. Re-pin on main change; docs-only rollback.
