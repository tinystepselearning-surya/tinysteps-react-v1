# P01.1-C — reconciled Function root manifest (26 November 2026 IST)

**Scope:** source-level named export constructor classification COMPLETE, 198/198; broader P01.1 discovery still IN PROGRESS. Main pinned at 701c7ec832dbe9c531964496fa09cd4a4948ddd2; branch prior head eee13a98511bcda3b6f508d32a380454f8ab573a. Existing P01.1-A/B/C evidence retained. No production access, endpoint invocation, code/data change or release authorization.

## Reconciliation

Parsed all named re-exports in functions/src/index.ts (104 declarations, 103 distinct direct modules). Reused 98 explicit per-root rows from P01.1-B/C, not heuristic name mentions. Fetched remaining implementation modules in independent bounded connector calls (at most ten modules per call), verified constructor lines and canonical re-export targets. Parsed prior and new evidence into a root-keyed map; compared against the actual barrel: 198 unique roots, 198 classified, zero missing, zero duplicate classifications. No new deployment inventory implied. Root declaration evidence does not prove trigger targets, call graph closure, authorization, deployed generation or runtime health.

| Constructor | Root count |
|---|---:|
| onSchedule | 7 |
| onDocumentWritten | 34 |
| onDocumentCreated | 7 |
| onCall | 148 |
| functions.https.onCall | 1 |
| onRequest | 1 |
| Total | 198 |

Callable total 149 (148 direct onCall plus one namespaced functions.https.onCall). Firestore 41; schedules seven; HTTP one. Type naming describes constructor syntax, not verified deployed generation. The four legacy identity factory roots are classified by actual onDocumentWritten factory evidence in B. Namespaced callable createStudentForParent uses functions.https.onCall at parentStudents.ts:573–574, not the direct regex constructor form. Newly resolved wrappers: adminArchiveUser → adminArchiveUserCanonical.ts:27; adminUpdateUser → adminUpdateUserCanonical.ts:308; adminSetUserRole (assignLP.ts) → adminSetUserRoleCanonical.ts:48. Actual transitionEnrollmentCourse root in scheduling/rollingScheduleCourseTransition.ts:112. Do not infer read-only behavior from audit/get/preview names.

## Complete root manifest

All paths relative to functions/src. Evidence B = P01_AUTH_AUTOMATION_TOPOLOGY_2026-11-26.md; C = P01_FUNCTION_EXPORT_TOPOLOGY_2026-11-26.md; current = new inspected definition. Schedule values are IST from prior B evidence. Event path present only for Firestore and scheduled roots. Root-level manifest is a reconciliation index, not duplication of previous narrative findings.

| Export root | Direct barrel module | Implementation / line | Constructor | Event path / schedule | Evidence |
|---|---|---|---|---|---|
| onSessionComplete | onSessionComplete.ts | onSessionComplete.ts:650 | onCall | — | current |
| onSessionRevenueWrite | sessionRevenue.ts | sessionRevenue.ts:312 | onDocumentWritten | classSessions/{sessionId} | B |
| recordPayment | revenue.ts | revenue.ts:1047 | onCall | — | C |
| recordTeacherPayout | revenue.ts | revenue.ts:1301 | onCall | — | C |
| previewFinanceCutoverArchive | revenue.ts | revenue.ts:2072 | onCall | — | C |
| archiveFinanceRecordsThroughMonth | revenue.ts | revenue.ts:2209 | onCall | — | C |
| reconcileSessionRevenueMonthKeys | revenue.ts | revenue.ts:2373 | onCall | — | C |
| adminVoidSessionCharge | revenue.ts | revenue.ts:1719 | onCall | — | C |
| recordTeacherPayoutV2 | recordTeacherPayoutV2.ts | recordTeacherPayoutV2.ts:81 | onCall | — | current |
| voidTeacherOrphanEarnings | voidTeacherOrphanEarnings.ts | voidTeacherOrphanEarnings.ts:20 | onCall | — | current |
| onTeacherEarningsRollupWrite | teacherEarningsRollupTrigger.ts | teacherEarningsRollupTrigger.ts:173 | onDocumentWritten | teacherEarnings/{earningId} | C |
| getWalletAutomationConfig | wallet.ts | wallet.ts:1294 | onCall | — | C |
| setWalletAutomationConfig | wallet.ts | wallet.ts:1319 | onCall | — | C |
| previewMissingWalletDeductions | wallet.ts | wallet.ts:1476 | onCall | — | C |
| backfillMissingWalletDeductions | wallet.ts | wallet.ts:1757 | onCall | — | C |
| onBillingChargeWalletSync | wallet.ts | wallet.ts:2230 | onDocumentWritten | billingCharges/{chargeId} | C |
| adminReceiveParentPayment | wallet.ts | wallet.ts:2531 | onCall | — | C |
| adminTopupParentWallet | wallet.ts | wallet.ts:2774 | onCall | — | C |
| adminAdjustParentWallet | wallet.ts | wallet.ts:2836 | onCall | — | C |
| initParentWalletOpeningDeficit | wallet.ts | wallet.ts:2908 | onCall | — | C |
| reconcileParentWallet | wallet.ts | wallet.ts:3039 | onCall | — | C |
| auditParentPaymentBackfillDryRun | parentPaymentBackfillDryRun.ts | parentPaymentBackfillDryRun.ts:180 | onCall | — | current |
| applyParentPaymentBackfillForSafeParents | parentPaymentBackfillWriteMode.ts | parentPaymentBackfillWriteMode.ts:142 | onCall | — | current |
| runFinanceReconciliationAudit | financeReconciliationReport.ts | financeReconciliationReport.ts:1309 | onCall | — | current |
| runFinanceReconciliationAuditDaily | financeReconciliationReport.ts | financeReconciliationReport.ts:1344 | onSchedule | 02:15 IST | B |
| auditTeacherEarningsCanonicalCoverage | auditTeacherEarningsCanonicalCoverage.ts | auditTeacherEarningsCanonicalCoverage.ts:59 | onCall | — | current |
| certifyTeacherEarningsSessionCreateFastPath | certifyTeacherEarningsSessionCreateFastPath.ts | certifyTeacherEarningsSessionCreateFastPath.ts:60 | onCall | — | current |
| prepareTeacherFinanceAnalyticsRollups | prepareTeacherFinanceAnalyticsRollups.ts | prepareTeacherFinanceAnalyticsRollups.ts:99 | onCall | — | current |
| reconcileParentPaymentsMonthReadModels | reconcileParentPaymentsMonthReadModels.ts | reconcileParentPaymentsMonthReadModels.ts:224 | onCall | — | current |
| recordLegacyFallbackUsage | legacyFallbackMetrics.ts | legacyFallbackMetrics.ts:37 | onCall | — | current |
| createSessionsFromSchedule | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:351 | onCall | — | C |
| saveEnrollmentScheduleAndGenerateSessions | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:398 | onCall | — | C |
| repairEnrollmentFutureSessionsFromSchedule | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:362 | onCall | — | C |
| repairCancelledFutureRegularSessionsForEnrollment | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:380 | onCall | — | C |
| pauseEnrollmentUpcomingSessions | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:307 | onCall | — | C |
| resumeEnrollmentSchedule | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:329 | onCall | — | C |
| setEnrollmentStatus | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:217 | onCall | — | C |
| createEnrollment | scheduling/rollingScheduleCompatibility.ts | scheduling/rollingScheduleCompatibility.ts:472 | onCall | — | C |
| transitionEnrollmentCourse | scheduling/rollingScheduleCourseTransition.ts | scheduling/rollingScheduleCourseTransition.ts:112 | onCall | — | current |
| saveRollingEnrollmentSchedule | scheduling/rollingScheduleLifecycle.ts | scheduling/rollingScheduleLifecycle.ts:593 | onCall | — | C |
| setRollingEnrollmentLifecycle | scheduling/rollingScheduleLifecycle.ts | scheduling/rollingScheduleLifecycle.ts:820 | onCall | — | C |
| reconcileRollingEnrollmentSchedule | scheduling/rollingScheduleReconciliation.ts | scheduling/rollingScheduleReconciliation.ts:543 | onCall | — | current |
| adminRepairRollingScheduleMaterialization | scheduling/rollingScheduleRepair.ts | scheduling/rollingScheduleRepair.ts:499 | onCall | — | current |
| createMakeupSessionFromCredit | createMakeupSessionFromCredit.ts | createMakeupSessionFromCredit.ts:162 | onCall | — | current |
| saveTeacherSessionProgress | saveTeacherSessionProgress.ts | saveTeacherSessionProgress.ts:477 | onCall | — | C |
| adminAttendanceCorrection | saveTeacherSessionProgress.ts | saveTeacherSessionProgress.ts:875 | onCall | — | C |
| ensureTeacherCalendarAttendanceSession | scheduling/teacherCalendarActions.ts | scheduling/teacherCalendarActions.ts:191 | onCall | — | current |
| createTeacherCalendarAdHocSession | scheduling/teacherCalendarActions.ts | scheduling/teacherCalendarActions.ts:335 | onCall | — | current |
| runAttendanceValidationRange | attendanceValidation/runValidationCallable.ts | attendanceValidation/runValidationCallable.ts:26 | onCall | — | current |
| updateAttendanceValidationMonthlyParentProgress | attendanceValidation/monthlyParentProgressCallable.ts | attendanceValidation/monthlyParentProgressCallable.ts:147 | onCall | — | current |
| revalidateAttendanceValidationGroupCached | attendanceValidation/cachedGroupRevalidationCallable.ts | attendanceValidation/cachedGroupRevalidationCallable.ts:69 | onCall | — | current |
| adminVerifyAttendanceValidationGroup | attendanceValidation/manualVerificationCallable.ts | attendanceValidation/manualVerificationCallable.ts:70 | onCall | — | current |
| onAttendanceValidationHistoricalSessionCreated | attendanceValidation/classSessionCreateDirtyTrigger.ts | attendanceValidation/classSessionCreateDirtyTrigger.ts:46 | onDocumentCreated | classSessions/{sessionId} | B |
| runAttendanceValidationLatestCheck | attendanceValidation/latestCheckCallable.ts | attendanceValidation/latestCheckCallable.ts:488 | onCall | — | current |
| forceRefreshAttendanceValidationEvidence | attendanceValidation/forceFreshEvidenceCallable.ts | attendanceValidation/forceFreshEvidenceCallable.ts:366 | onCall | — | current |
| forceRefreshAttendanceValidationRange | attendanceValidation/forceFreshRangeCallable.ts | attendanceValidation/forceFreshRangeCallable.ts:594 | onCall | — | current |
| runAttendanceValidationFirstTimeBaseline | attendanceValidation/firstTimeBaselineCallable.ts | attendanceValidation/firstTimeBaselineCallable.ts:543 | onCall | — | current |
| onAdminAttendanceCorrectionCompletionBridge | adminAttendanceCorrectionCompletionBridge.ts | adminAttendanceCorrectionCompletionBridge.ts:138 | onDocumentCreated | classSessions/{sessionId}/attendanceCorrections/{correctionId} | C |
| prepareAdminAttendanceCorrectionTeacherPayDecision | adminAttendanceCorrectionTeacherPayDecision.ts | adminAttendanceCorrectionTeacherPayDecision.ts:103 | onCall | — | C |
| cancelAdminAttendanceCorrectionTeacherPayDecision | adminAttendanceCorrectionTeacherPayDecision.ts | adminAttendanceCorrectionTeacherPayDecision.ts:245 | onCall | — | C |
| onAdminAttendanceCorrectionTeacherPayDecisionLink | adminAttendanceCorrectionTeacherPayDecision.ts | adminAttendanceCorrectionTeacherPayDecision.ts:290 | onDocumentCreated | classSessions/{sessionId}/attendanceCorrections/{correctionId} | C |
| onTeacherPayWithholdingSync | teacherPayWithholdingSync.ts | teacherPayWithholdingSync.ts:92 | onDocumentWritten | teacherEarnings/{earningId} | C |
| getAdminTeacherPayWithholdings | getAdminTeacherPayWithholdings.ts | getAdminTeacherPayWithholdings.ts:86 | onCall | — | current |
| onTeacherEarningAdjustmentSync | teacherEarningAdjustmentSync.ts | teacherEarningAdjustmentSync.ts:108 | onDocumentWritten | teacherEarnings/{earningId} | C |
| getAdminTeacherEarningAdjustments | getAdminTeacherEarningAdjustments.ts | getAdminTeacherEarningAdjustments.ts:95 | onCall | — | current |
| createAdminHistoricalAttendanceSession | createAdminHistoricalAttendanceSession.ts | createAdminHistoricalAttendanceSession.ts:138 | onCall | — | current |
| getAdminHistoricalAttendanceCandidates | getAdminHistoricalAttendanceCandidates.ts | getAdminHistoricalAttendanceCandidates.ts:86 | onCall | — | current |
| adminSyncCanonicalPhonicsCurriculum | phonicsCurriculumEnforcer.ts | phonicsCurriculumEnforcer.ts:70 | onCall | — | C |
| onCurriculumTopicsCanonicalize | phonicsCurriculumEnforcer.ts | phonicsCurriculumEnforcer.ts:89 | onDocumentWritten | config/curriculumTopics (constant at line 17) | C |
| onParentUserReadModelWrite | parentMonthlyReadModels.ts | parentMonthlyReadModels.ts:673 | onDocumentWritten | users/{parentId} | B |
| onStudentProgressReadModelWrite | childCourseProgressProjection.ts | childCourseProgressProjectionMigrationGuard.ts:37 | onDocumentWritten | students/{kidId}/progress/{topicId} | C |
| onBillingChargeReadModelWrite | parentMonthlyBillingProjectionV2.ts | parentMonthlyBillingProjectionV2.ts:467 | onDocumentWritten | billingCharges/{chargeId} | B |
| onPaymentReadModelWrite | parentMonthlyBillingProjectionV2.ts | parentMonthlyBillingProjectionV2.ts:524 | onDocumentWritten | payments/{paymentId} | B |
| onClassSessionReadModelWrite | parentMonthlyAttendanceProjection.ts | parentMonthlyAttendanceProjection.ts → parentMonthlyClassAttendanceProjectionV3.ts:779 | onDocumentWritten | classSessions/{sessionId} | B |
| bootstrapParentCourseProgress | parentCanonicalProjectionBootstrap.ts | parentCanonicalProjectionBootstrap.ts:268 | onCall | — | current |
| onParentProjectionBootstrapRequest | parentCanonicalProjectionBootstrap.ts | parentCanonicalProjectionBootstrap.ts:443 | onDocumentCreated | parentProjectionBootstrapRequests/{parentId}/kids/{kidId}/requests/{requestId} | B |
| bootstrapParentClassAttendance | bootstrapParentClassAttendanceV2.ts | bootstrapParentClassAttendanceV2.ts:507 | onCall | — | current |
| adminCreateUser | adminCreateUser.ts | adminCreateUserCanonical.ts:378 | onCall | — | C |
| backfillTeacherDocs | adminCreateUser.ts | adminCreateUser.ts:22 | onCall | — | C |
| adminDeleteUser | adminDeleteUser.ts | adminDeleteUser.ts:20 | onCall | — | current |
| adminArchiveUser | adminArchiveUser.ts | adminArchiveUserCanonical.ts:27 | onCall | — | current |
| getFounderEditorialReviewState | founderEditorialReview.ts | founderEditorialReview.ts:95 | onCall | — | current |
| setFounderEditorialReviewDecision | founderEditorialReview.ts | founderEditorialReview.ts:114 | onCall | — | current |
| adminUpdateUser | adminUpdateUser.ts | adminUpdateUserCanonical.ts:308 | onCall | — | current |
| adminGenerateResetLink | adminGenerateResetLink.ts | adminGenerateResetLink.ts:61 | onCall | — | current |
| adminResetPassword | adminResetPassword.ts | adminResetPassword.ts:24 | onCall | — | current |
| resolveLoginIdentifier | resolveLoginIdentifier.ts | resolveLoginIdentifier.ts:184 | onCall | — | current |
| getSessionsManagementSnapshot | sessionsManagementSnapshot.ts | sessionsManagementSnapshot.ts:879 | onCall | — | current |
| adminRefreshSessionsManagementSnapshot | sessionsManagementSnapshot.ts | sessionsManagementSnapshot.ts:919 | onCall | — | current |
| getSessionsManagementDateSnapshot | sessionsManagementSnapshot.ts | sessionsManagementSnapshot.ts:928 | onCall | — | current |
| refreshSessionsManagementSnapshot4am | sessionsManagementSnapshot.ts | sessionsManagementSnapshot.ts:1074 | onSchedule | 04:00 IST | B |
| onSessionsManagementEnrollmentWrite | sessionsManagementSnapshot.ts | sessionsManagementSnapshot.ts:945 | onDocumentWritten | enrollments/{enrollmentId} | B |
| onSessionsManagementClassSessionWrite | sessionsManagementSnapshot.ts | sessionsManagementSnapshot.ts:1006 | onDocumentWritten | classSessions/{sessionId} | B |
| adminCreateSchool | schools.ts | schools.ts:257 | onCall | — | current |
| adminUpdateSchool | schools.ts | schools.ts:432 | onCall | — | current |
| adminAssignSchoolLearningPartner | schools.ts | schools.ts:518 | onCall | — | current |
| adminLinkSchoolUser | schools.ts | schools.ts:627 | onCall | — | current |
| adminUnlinkSchoolUser | schools.ts | schools.ts:703 | onCall | — | current |
| schoolCreateAcademicYear | schoolAcademic.ts | schoolAcademic.ts:143 | onCall | — | current |
| schoolSetCurrentAcademicYear | schoolAcademic.ts | schoolAcademic.ts:211 | onCall | — | current |
| schoolUpsertGrade | schoolAcademic.ts | schoolAcademic.ts:259 | onCall | — | current |
| schoolSetGradeStatus | schoolAcademic.ts | schoolAcademic.ts:301 | onCall | — | current |
| schoolUpsertSection | schoolAcademic.ts | schoolAcademic.ts:405 | onCall | — | current |
| schoolSetSectionStatus | schoolAcademic.ts | schoolAcademic.ts:497 | onCall | — | current |
| schoolUpsertTeacher | schoolAcademic.ts | schoolAcademic.ts:337 | onCall | — | current |
| schoolSetTeacherStatus | schoolAcademic.ts | schoolAcademic.ts:378 | onCall | — | current |
| schoolUpdateCurriculumProgress | schoolProgress.ts | schoolProgress.ts:109 | onCall | — | current |
| schoolUpdateTeacherTraining | schoolProgress.ts | schoolProgress.ts:220 | onCall | — | current |
| schoolCreateReview | schoolEvidence.ts | schoolEvidence.ts:217 | onCall | — | current |
| schoolRecordAssessmentSummary | schoolEvidence.ts | schoolEvidence.ts:277 | onCall | — | current |
| schoolGetProgrammeSnapshot | schoolRead.ts | schoolRead.ts:129 | onCall | — | current |
| onSchoolAcademicYearActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:92 | onDocumentWritten | schools/{schoolId}/academicYears/{academicYearId} | B |
| onSchoolGradeActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:112 | onDocumentWritten | schools/{schoolId}/academicYears/{academicYearId}/grades/{gradeId} | B |
| onSchoolSectionActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:132 | onDocumentWritten | schools/{schoolId}/academicYears/{academicYearId}/sections/{sectionId} | B |
| onSchoolTeacherActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:157 | onDocumentWritten | schools/{schoolId}/teachers/{teacherId} | B |
| onSchoolCurriculumActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:176 | onDocumentWritten | schools/{schoolId}/academicYears/{academicYearId}/curriculumProgress/{sectionId} | B |
| onSchoolTrainingActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:200 | onDocumentWritten | schools/{schoolId}/academicYears/{academicYearId}/teacherTraining/{teacherId} | B |
| onSchoolReviewActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:221 | onDocumentCreated | schools/{schoolId}/academicYears/{academicYearId}/reviews/{reviewId} | B |
| onSchoolAssessmentActivity | schoolActivityTriggers.ts | schoolActivityTriggers.ts:244 | onDocumentCreated | schools/{schoolId}/academicYears/{academicYearId}/assessmentSummaries/{assessmentId} | B |
| assignLPToParent | assignLP.ts | assignLP.ts:69 | onCall | — | current |
| unassignLPFromParent | assignLP.ts | assignLP.ts:113 | onCall | — | current |
| assignLPToTeacher | assignLP.ts | assignLP.ts:140 | onCall | — | current |
| unassignLPFromTeacher | assignLP.ts | assignLP.ts:187 | onCall | — | current |
| adminSetUserRole | assignLP.ts | adminSetUserRoleCanonical.ts:48 | onCall | — | current |
| updateTeacherProfile | updateTeacherProfile.ts | updateTeacherProfile.ts:104 | onCall | — | current |
| onGameProgressWrite | gameProgressSummary.ts | gameProgressSummary.ts:95 | onDocumentWritten | kids/{kidId}/gameProgress/{gameId} | C |
| onGameSessionCreateTrigger | triggers/onGameSessionCreate.ts | triggers/onGameSessionCreate.ts:82 | onDocumentCreated | kids/{kidId}/gameSessions/{eventId} | C |
| createStudentForParent | parentStudents.ts | parentStudents.ts:573–574 | functions.https.onCall | — | current |
| adminCreateStudent | adminCreateStudent.ts | adminCreateStudent.ts:154 | onCall | — | current |
| adminUpdateStudent | adminUpdateStudent.ts | adminUpdateStudent.ts:70 | onCall | — | current |
| runInsightsRollupNow | runInsightsRollupNow.ts | runInsightsRollupNow.ts:14 | onCall | — | current |
| setInsightsEnabled | setInsightsEnabled.ts | setInsightsEnabled.ts:30 | onCall | — | current |
| batchInsightsRollup11am | scheduled/batchInsightsRollup.ts | scheduled/batchInsightsRollup.ts:1033 | onSchedule | 11:00 IST | B |
| batchInsightsRollup5pm | scheduled/batchInsightsRollup.ts | scheduled/batchInsightsRollup.ts:1045 | onSchedule | 17:00 IST | B |
| batchInsightsRollup11pm | scheduled/batchInsightsRollup.ts | scheduled/batchInsightsRollup.ts:1057 | onSchedule | 23:00 IST | B |
| globalLearnersRollup | scheduled/globalLearnersRollup.ts | scheduled/globalLearnersRollup.ts:81 | onSchedule | 02:30 IST | B |
| ensureGamesCatalogNow | games/ensureGamesCatalogNow.ts | games/ensureGamesCatalogNow.ts:21 | onCall | — | current |
| cleanupGamesCatalogNow | games/cleanupGamesCatalogNow.ts | games/cleanupGamesCatalogNow.ts:28 | onCall | — | current |
| recordLevelResult | games/recordLevelResult.ts | games/recordLevelResult.ts:157 | onCall | — | current |
| createLessonAccessSession | createLessonAccessSession.ts | createLessonAccessSession.ts:160 | onCall | — | current |
| resolveLessonAccessViewer | createLessonAccessSession.ts | createLessonAccessSession.ts:285 | onCall | — | current |
| getParentWorksheetResources | getParentWorksheetResources.ts | getParentWorksheetResources.ts:248 | onCall | — | current |
| onWave1LegacyUserIdentityWrite | identityLegacySyncTriggers.ts | identityLegacySyncTriggers.ts:50 | onDocumentWritten | users/{sourceId} | B |
| onWave1LegacyKidIdentityWrite | identityLegacySyncTriggers.ts | identityLegacySyncTriggers.ts:56 | onDocumentWritten | kids/{sourceId} | B |
| onWave1LegacySchoolIdentityWrite | identityLegacySyncTriggers.ts | identityLegacySyncTriggers.ts:62 | onDocumentWritten | schools/{sourceId} | B |
| onWave1LegacySchoolUserIdentityWrite | identityLegacySyncTriggers.ts | identityLegacySyncTriggers.ts:68 | onDocumentWritten | schoolUsers/{sourceId} | B |
| contactForm | contactForm.ts | contactForm.ts:152 | onRequest | — | current |
| enrichPublicLeadAttribution | enrichPublicLeadAttribution.ts | enrichPublicLeadAttribution.ts:230 | onCall | — | current |
| onWebsiteLeadIdentityWrite | websiteLeadDeduplication.ts | websiteLeadDeduplication.ts:213 | onDocumentWritten | leads/{leadId} | B |
| getProspectiveAcquisitionSummary | getProspectiveAcquisitionSummary.ts | getProspectiveAcquisitionSummary.ts:66 | onCall | — | current |
| reassignEnrollmentTeacher | lifecycle.ts | lifecycle.ts:2122 | onCall | — | C |
| repairEnrollmentTeacherSessionConsistency | lifecycle.ts | lifecycle.ts:2396 | onCall | — | C |
| archiveKid | lifecycle.ts | lifecycle.ts:2521 | onCall | — | C |
| createAdminManualSession | lifecycle.ts | lifecycle.ts:1469 | onCall | — | C |
| cancelAdminManualSession | lifecycle.ts | lifecycle.ts:1574 | onCall | — | C |
| auditTeacherTodaySessions | auditTeacherTodaySessions.ts | auditTeacherTodaySessions.ts:194 | onCall | — | current |
| auditAllTransferredSessionSnapshotIssues | auditAllTransferredSessionSnapshotIssues.ts | auditAllTransferredSessionSnapshotIssues.ts:678 | onCall | — | current |
| repairTransferredTeacherSessionSnapshots | repairTransferredTeacherSessionSnapshots.ts | repairTransferredTeacherSessionSnapshots.ts:145 | onCall | — | current |
| adminRepairTeacherStudentSnapshots | repairTeacherStudentSnapshots.ts | repairTeacherStudentSnapshots.ts:160 | onCall | — | current |
| traceStudentTransferHistory | traceStudentTransferHistory.ts | traceStudentTransferHistory.ts:971 | onCall | — | current |
| adminBackfillEnrollmentCanonicalFields | enrollmentCanonicalBackfill.ts | enrollmentCanonicalBackfill.ts:139 | onCall | — | current |
| runEnrollmentCanonicalCoverage | enrollmentCanonicalCoverage.ts | enrollmentCanonicalCoverage.ts:223 | onCall | — | current |
| runEnrollmentCanonicalCoverageDaily | enrollmentCanonicalCoverage.ts | enrollmentCanonicalCoverage.ts:231 | onSchedule | 02:45 IST | B |
| onDemoSessionEarningsWrite | demoSessions.ts | demoSessions.ts → demoEarningsV2.ts:120 | onDocumentWritten | demoSessions/{demoId} | B |
| adminCheckDemoPhoneConflicts | demoSessions.ts | demoSessionsLegacy.ts:771 | onCall | — | C |
| adminCreateDemoSession | demoSessions.ts | demoSessionsLegacy.ts:879 | onCall | — | C |
| adminUpdateDemoSessionDetails | demoSessions.ts | demoSessionsLegacy.ts:1057 | onCall | — | C |
| adminUpdateDemoConversion | demoSessions.ts | demoSessionsLegacy.ts:657 | onCall | — | C |
| claimDemoSession | demoSessions.ts | demoSessionsLegacy.ts:1222 | onCall | — | C |
| updateDemoSessionSchedule | demoSessions.ts | demoSessionsLegacy.ts:1315 | onCall | — | C |
| completeDemoSession | demoSessions.ts | demoSessionsLegacy.ts:1399 | onCall | — | C |
| reassignDemoSession | demoSessions.ts | demoSessionsLegacy.ts:1737 | onCall | — | C |
| cancelDemoSession | demoSessions.ts | demoSessionsLegacy.ts:1814 | onCall | — | C |
| releaseDemoSession | demoSessions.ts | demoSessionsLegacy.ts:1854 | onCall | — | C |
| deleteDemoSession | demoSessions.ts | demoSessionsLegacy.ts:1907 | onCall | — | C |
| reopenDemoSession | demoSessions.ts | demoSessionsLegacy.ts:1982 | onCall | — | C |
| onLeadCreatedCanonicalize | leadLifecycle.ts | leadLifecycle.ts:166 | onDocumentWritten | leads/{leadId} | C |
| onDemoLeadLifecycleWrite | leadLifecycle.ts | leadLifecycle.ts:220 | onDocumentWritten | demoSessions/{demoId} | C |
| teacherCancelAssignedDemo | leadLifecycle.ts | leadLifecycle.ts:361 | onCall | — | C |
| onDemoPayoutIntegrityWrite | leadLifecycle.ts | leadLifecycle.ts:420 | onDocumentWritten | teacherEarnings/{earningId} | C |
| onLeadEnsureDemoRequest | leadDemoAutoWorkflow.ts | leadDemoAutoWorkflow.ts:506 | onDocumentWritten | leads/{leadId} | B |
| adminRetryLeadDemoRequest | leadDemoAutoWorkflow.ts | leadDemoAutoWorkflow.ts:520 | onCall | — | current |
| onOrphanDemoIdentityRepair | leadDemoAutoWorkflow.ts | leadDemoAutoWorkflow.ts:633 | onDocumentWritten | demoSessions/{demoId} | B |
| adminBackfillLeadLifecycle | leadLifecycleBackfill.ts | leadLifecycleBackfill.ts:56 | onCall | — | current |
| adminUpdateLeadWorkflowRecord | adminLeadWorkflow.ts | adminLeadWorkflow.ts:160 | onCall | — | current |
| adminDeleteLeadWorkflowRecord | adminLeadWorkflow.ts | adminLeadWorkflow.ts:384 | onCall | — | current |
| adminCorrectDemoCompletion | adminCorrectDemoCompletion.ts | adminCorrectDemoCompletion.ts:91 | onCall | — | current |
| refreshPublicKb | ai/refreshPublicKb.ts | ai/refreshPublicKb.ts:255 | onCall | — | current |
| createOrSyncMessageThread | messaging/createOrSyncMessageThread.ts | messaging/createOrSyncMessageThread.ts:566 | onCall | — | current |
| sendMessage | messaging/sendMessage.ts | messaging/sendMessage.ts:153 | onCall | — | current |
| markMessageThreadRead | messaging/sendMessage.ts | messaging/sendMessage.ts:320 | onCall | — | current |
| reconcileMyUnreadMessageCount | messaging/sendMessage.ts | messaging/sendMessage.ts:395 | onCall | — | current |
| syncMessageThreadsForActiveStudents | messaging/syncMessageThreadsForActiveStudents.ts | messaging/syncMessageThreadsForActiveStudents.ts:103 | onCall | — | current |
| onEnrollmentMessageThreadAutoSync | messaging/autoSyncMessageThreads.ts | messaging/autoSyncMessageThreads.ts:174 | onDocumentWritten | enrollments/{enrollmentId} | B |
| onKidMessageThreadAutoSync | messaging/autoSyncMessageThreads.ts | messaging/autoSyncMessageThreads.ts:204 | onDocumentWritten | kids/{kidId} | B |
| onStudentMessageThreadAutoSync | messaging/autoSyncMessageThreads.ts | messaging/autoSyncMessageThreads.ts:235 | onDocumentWritten | students/{kidId} | B |
| registerNotificationToken | notifications/classReminders.ts | notifications/classReminders.ts:314 | onCall | — | current |
| sendTestPushNotification | notifications/classReminders.ts | notifications/classReminders.ts:385 | onCall | — | current |

## Next gate

P01.1 export classification complete at pinned SHA; P01.1 overall stays IN PROGRESS for source role/resource/service and integration closure, scripts and actual Git-based deployment impact. P01.3 source field/collection catalogue remains partial and live HOLD; P01.4 requires actual reader/writer/dependency tracing. P01.2 live metadata and P04 M3 gates unchanged. Do not invoke any listed endpoints in production, do not infer authorization parity, no new CI or live reconciliation claimed. Re-pin and rerun classification delta on main changes. Rollback: revert docs-only changes/close draft; no data rollback. Next eligible source slice: P01.1-D resource and write dependency closure starting with scheduling/attendance and finance, then admissions, identities and school domain; expand field catalogue as evidence warrants. Actual deployment impact and owner gate required before merge.
