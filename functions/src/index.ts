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
  onTeacherEarningsRollupWrite,
  recordPayment,
  recordTeacherPayout,
  previewFinanceCutoverArchive,
  archiveFinanceRecordsThroughMonth,
  reconcileSessionRevenueMonthKeys,
  voidTeacherOrphanEarnings,
  adminVoidSessionCharge,
} from "./revenue";
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
export {
  onBillingChargeReadModelWrite,
  onPaymentReadModelWrite,
  onParentUserReadModelWrite,
  onClassSessionReadModelWrite,
  onStudentProgressReadModelWrite,
} from "./parentMonthlyReadModels";

// Admin user management
export { adminCreateUser } from "./adminCreateUser";
export { backfillTeacherDocs } from "./adminCreateUser";
export { adminDeleteUser } from "./adminDeleteUser";
export { adminArchiveUser } from "./adminArchiveUser";
export { adminUpdateUser } from "./adminUpdateUser";
export { adminGenerateResetLink } from "./adminGenerateResetLink";
export { adminResetPassword } from "./adminResetPassword";
export { resolveLoginIdentifier } from "./resolveLoginIdentifier";

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
export { adminBackfillLeadLifecycle } from './leadLifecycleBackfill';

// AI: Ask TinySteps chatbot and knowledge base
export { askTinySteps } from "./ai/askTinySteps";
export { refreshPublicKb } from "./ai/refreshPublicKb";

// WhatsApp backend foundation (admin send + webhook callbacks)
export { sendWhatsAppTemplateMessage, whatsAppWebhook } from './whatsapp';
export { whatsappWebhookV2 } from './whatsappWebhook';
export { onUnmatchedWhatsAppInboundCreateLead } from './whatsappLeadLifecycle';

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

// Push notifications
export {
  registerNotificationToken,
  sendTestPushNotification,
  sendClassReminders15Min,
} from './notifications/classReminders';
