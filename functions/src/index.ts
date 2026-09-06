/**
 * functions/src/index.ts
 *
 * Export barrel for all Cloud Functions.
 * Each function is defined in its own module for better organization and testing.
 *
 * IMPORTANT: This file should ONLY contain exports, never function implementations.
 * Callable functions are for manual retry/admin operations; UI should NOT auto-call.
 * Firestore triggers handle automatic background processing.
 */

// Session completion (attendance + credit processing + billing)
// Callable is for manual retry only; teacher UI must not auto-call to prevent double-processing
export { onSessionComplete } from "./onSessionComplete";

// Revenue rollups (expected + earned)
export {
  onSessionRevenueWrite,
  recordPayment,
  recordTeacherPayout,
  previewFinanceCutoverArchive,
  archiveFinanceRecordsThroughMonth,
  reconcileSessionRevenueMonthKeys,
  adminVoidSessionCharge,
} from "./revenue";
export { voidTeacherOrphanEarnings } from "./voidTeacherOrphanEarnings";
export { onTeacherEarningsRollupWrite } from "./teacherEarningsRollupTrigger";
export {
  getWalletAutomationConfig,
  setWalletAutomationConfig,
  previewMissingWalletDeductions,
  backfillMissingWalletDeductions,
  onBillingChargeWalletSync,
  adminReceiveParentPayment,
  adminTopupParentWallet,
  adminAdjustParentWallet,
  initParentWalletOpeningDeficit,
  reconcileParentWallet,
} from "./wallet";
export { auditParentPaymentBackfillDryRun } from "./parentPaymentBackfillDryRun";
export { applyParentPaymentBackfillForSafeParents } from "./parentPaymentBackfillWriteMode";
export { runFinanceReconciliationAudit, runFinanceReconciliationAuditDaily } from "./financeReconciliationReport";
export { auditTeacherEarningsCanonicalCoverage } from "./auditTeacherEarningsCanonicalCoverage";
export { certifyTeacherEarningsSessionCreateFastPath } from "./certifyTeacherEarningsSessionCreateFastPath";
export { prepareTeacherFinanceAnalyticsRollups } from "./prepareTeacherFinanceAnalyticsRollups";
export { reconcileParentPaymentsMonthReadModels } from "./reconcileParentPaymentsMonthReadModels";
export { recordLegacyFallbackUsage } from "./legacyFallbackMetrics";

// Bulk session generator from enrollment schedule config
export { createSessionsFromSchedule } from "./createSessionsFromSchedule";
export { saveEnrollmentScheduleAndGenerateSessions } from "./createSessionsFromSchedule";
export { repairEnrollmentFutureSessionsFromSchedule } from "./createSessionsFromSchedule";
export { repairCancelledFutureRegularSessionsForEnrollment } from "./createSessionsFromSchedule";
export { pauseEnrollmentUpcomingSessions } from "./createSessionsFromSchedule";
export { resumeEnrollmentSchedule } from "./createSessionsFromSchedule";
export { createMakeupSessionFromCredit } from "./createMakeupSessionFromCredit";
export { saveTeacherSessionProgress, adminAttendanceCorrection } from "./saveTeacherSessionProgress";
export { onAdminAttendanceCorrectionCompletionBridge } from "./adminAttendanceCorrectionCompletionBridge";
export { createAdminHistoricalAttendanceSession } from "./createAdminHistoricalAttendanceSession";
export { getAdminHistoricalAttendanceCandidates } from "./getAdminHistoricalAttendanceCandidates";
export {
  adminSyncCanonicalPhonicsCurriculum,
  onCurriculumTopicsCanonicalize,
} from "./phonicsCurriculumEnforcer";
export { onParentUserReadModelWrite } from "./parentMonthlyReadModels";
export { onStudentProgressReadModelWrite } from "./childCourseProgressProjection";
export {
  onBillingChargeReadModelWrite,
  onPaymentReadModelWrite,
} from "./parentMonthlyBillingProjectionV2";
export { onClassSessionReadModelWrite } from "./parentMonthlyAttendanceProjection";
export {
  bootstrapParentCourseProgress,
  onParentProjectionBootstrapRequest,
} from "./parentCanonicalProjectionBootstrap";
export { bootstrapParentClassAttendance } from "./bootstrapParentClassAttendanceV2";

// Admin user management
export { adminCreateUser } from "./adminCreateUser";
export { backfillTeacherDocs } from "./adminCreateUser";
export { adminDeleteUser } from "./adminDeleteUser";
export { adminArchiveUser } from "./adminArchiveUser";
export { adminUpdateUser } from "./adminUpdateUser";
export { adminGenerateResetLink } from "./adminGenerateResetLink";
export { adminResetPassword } from "./adminResetPassword";
export { resolveLoginIdentifier } from "./resolveLoginIdentifier";

// Admin Sessions Management snapshot: one authoritative rebuild at 04:00 IST plus explicit admin refresh.
export {
  getSessionsManagementSnapshot,
  adminRefreshSessionsManagementSnapshot,
  getSessionsManagementDateSnapshot,
  refreshSessionsManagementSnapshot4am,
} from './sessionsManagementSnapshot';

// Admin / school management
export {
  adminCreateSchool,
  adminUpdateSchool,
  adminAssignSchoolLearningPartner,
  adminLinkSchoolUser,
  adminUnlinkSchoolUser,
} from './schools';

// School Partnership programme
export {
  schoolCreateAcademicYear,
  schoolSetCurrentAcademicYear,
  schoolUpsertGrade,
  schoolSetGradeStatus,
  schoolUpsertSection,
  schoolSetSectionStatus,
  schoolUpsertTeacher,
  schoolSetTeacherStatus,
} from './schoolAcademic';
export {
  schoolUpdateCurriculumProgress,
  schoolUpdateTeacherTraining,
} from './schoolProgress';
export {
  schoolCreateReview,
  schoolRecordAssessmentSummary,
} from './schoolEvidence';
export { schoolGetProgrammeSnapshot } from './schoolRead';
export {
  onSchoolAcademicYearActivity,
  onSchoolGradeActivity,
  onSchoolSectionActivity,
  onSchoolTeacherActivity,
  onSchoolCurriculumActivity,
  onSchoolTrainingActivity,
  onSchoolReviewActivity,
  onSchoolAssessmentActivity,
} from './schoolActivityTriggers';

// Learning Partner assignment
export {
  assignLPToParent,
  unassignLPFromParent,
  assignLPToTeacher,
  unassignLPFromTeacher,
  adminSetUserRole
} from "./assignLP";

// Game progress tracking
export { onGameProgressWrite } from "./gameProgressSummary";
export { onGameSessionCreateTrigger } from "./triggers/onGameSessionCreate";

// Parent data access
export { createStudentForParent } from "./parentStudents";
export { adminCreateStudent } from "./adminCreateStudent";

// Insights & analytics
export { runInsightsRollupNow } from "./runInsightsRollupNow";
export { setInsightsEnabled } from "./setInsightsEnabled";
export {
  getAdminExternalTrafficAnalytics,
  adminSyncExternalTrafficAnalytics,
  syncExternalTrafficAnalyticsDaily,
} from './externalTrafficAnalytics';

// Scheduled batch insights rollups
export {
  batchInsightsRollup11am,
  batchInsightsRollup5pm,
  batchInsightsRollup11pm,
} from "./scheduled/batchInsightsRollup";
export { globalLearnersRollup } from "./scheduled/globalLearnersRollup";

// Games: catalog management and level results
export { ensureGamesCatalogNow } from "./games/ensureGamesCatalogNow";
export { cleanupGamesCatalogNow } from "./games/cleanupGamesCatalogNow";
export { recordLevelResult } from "./games/recordLevelResult";
export { createLessonAccessSession, resolveLessonAccessViewer } from "./createLessonAccessSession";
export { getParentWorksheetResources } from "./getParentWorksheetResources";

// Public website contact form
export { contactForm } from "./contactForm";
export { enrichPublicLeadAttribution } from "./enrichPublicLeadAttribution";
export { onWebsiteLeadIdentityWrite } from "./websiteLeadDeduplication";
export { notFoundRoute } from "./notFoundRoute";

// Enrollment lifecycle (createEnrollment also permits the assigned Learning Partner)
export {
  setEnrollmentStatus,
  reassignEnrollmentTeacher,
  repairEnrollmentTeacherSessionConsistency,
  archiveKid,
  createAdminManualSession,
  cancelAdminManualSession,
  createEnrollment,
  transitionEnrollmentCourse,
} from "./lifecycle";
export { auditTeacherTodaySessions } from "./auditTeacherTodaySessions";
export { auditAllTransferredSessionSnapshotIssues } from "./auditAllTransferredSessionSnapshotIssues";
export { repairTransferredTeacherSessionSnapshots } from "./repairTransferredTeacherSessionSnapshots";
export { adminRepairTeacherStudentSnapshots } from "./repairTeacherStudentSnapshots";
export { traceStudentTransferHistory } from "./traceStudentTransferHistory";
export { adminBackfillEnrollmentCanonicalFields } from "./enrollmentCanonicalBackfill";
export {
  runEnrollmentCanonicalCoverage,
  runEnrollmentCanonicalCoverageDaily,
} from "./enrollmentCanonicalCoverage";

// Admin-only purge (temporary)

// Demo sessions assignment workflow
export {
  onDemoSessionEarningsWrite,
  adminCheckDemoPhoneConflicts,
  adminCreateDemoSession,
  adminUpdateDemoSessionDetails,
  adminUpdateDemoConversion,
  claimDemoSession,
  updateDemoSessionSchedule,
  completeDemoSession,
  reassignDemoSession,
  cancelDemoSession,
  releaseDemoSession,
  deleteDemoSession,
  reopenDemoSession,
} from "./demoSessions";

// Canonical lead -> demo -> enrollment lifecycle synchronization
export {
  onLeadCreatedCanonicalize,
  onDemoLeadLifecycleWrite,
  teacherCancelAssignedDemo,
  onDemoPayoutIntegrityWrite,
} from "./leadLifecycle";
export {
  onLeadEnsureDemoRequest,
  onOrphanDemoIdentityRepair,
} from './leadDemoAutoWorkflow';
export { adminBackfillLeadLifecycle } from './leadLifecycleBackfill';
export {
  adminUpdateLeadWorkflowRecord,
  adminDeleteLeadWorkflowRecord,
} from './adminLeadWorkflow';
export { adminCorrectDemoCompletion } from './adminCorrectDemoCompletion';

// Public website knowledge-base refresh tooling
export { refreshPublicKb } from "./ai/refreshPublicKb";

// Meta WhatsApp Cloud API integration intentionally retired until explicitly reintroduced.
// Normal website lead forms and website WhatsApp contact links are independent and remain active.

// Internal messaging
export { createOrSyncMessageThread } from './messaging/createOrSyncMessageThread';
export {
  sendMessage,
  markMessageThreadRead,
  reconcileMyUnreadMessageCount,
} from './messaging/sendMessage';
export { syncMessageThreadsForActiveStudents } from './messaging/syncMessageThreadsForActiveStudents';
export {
  onEnrollmentMessageThreadAutoSync,
  onKidMessageThreadAutoSync,
  onStudentMessageThreadAutoSync,
} from './messaging/autoSyncMessageThreads';

// Push notification token support stays available for app testing.
// The scheduled 15-minute class reminder is intentionally not exported until the parent app goes live.
export {
  registerNotificationToken,
  sendTestPushNotification,
} from './notifications/classReminders';
