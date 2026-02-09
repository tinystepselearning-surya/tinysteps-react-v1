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
// createBillingChargeOnPresent auto-bills when session completed + kid marked present
export { onSessionComplete, onSessionCompleteTrigger, createBillingChargeOnPresent } from "./onSessionComplete";

// Bulk session generator from enrollment schedule config
export { createSessionsFromSchedule } from "./createSessionsFromSchedule";

// Admin user management
export { adminCreateUser } from "./adminCreateUser";
export { adminDeleteUser } from "./adminDeleteUser";
export { adminArchiveUser } from "./adminArchiveUser";
export { adminGenerateResetLink } from "./adminGenerateResetLink";

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
export { onGameSessionCreate } from "./onGameSessionCreate";
export { onGameSessionCreateTrigger } from "./triggers/onGameSessionCreate";

// Parent data access
export { createStudentForParent } from "./parentStudents";

// Insights & analytics
export { runInsightsRollupNow } from "./runInsightsRollupNow";
export { setInsightsEnabled } from "./setInsightsEnabled";

// Scheduled batch insights rollups
export {
  batchInsightsRollup11am,
  batchInsightsRollup5pm,
  batchInsightsRollup11pm,
} from "./scheduled/batchInsightsRollup";

// Games: catalog management and level results
export { ensureGamesCatalogNow } from "./games/ensureGamesCatalogNow";
export { cleanupGamesCatalogNow } from "./games/cleanupGamesCatalogNow";
export { recordLevelResult } from "./games/recordLevelResult";

// AI: Ask TinySteps chatbot and knowledge base
export { askTinySteps } from "./ai/askTinySteps";
export { refreshPublicKb } from "./ai/refreshPublicKb";
