/**
 * Tiny Steps – Cloud Functions (v2)
 * Clean Index File – Only exports existing functions
 */

import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Global settings (prevent runaway cost)
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------- Imports from existing modules ----------

// Admin: Create Users
export { adminCreateUser } from './adminCreateUser';

// Admin: Password Reset Link
export { adminGenerateResetLink } from './adminGenerateResetLink';
export { adminDeleteUser } from './adminDeleteUser';
export { adminArchiveUser } from './adminArchiveUser';

// Admin: Assign / Unassign Learning Partners
export {
  assignLPToParent,
  unassignLPFromParent,
  assignLPToTeacher,
  unassignLPFromTeacher,
} from './assignLP';

// Admin: Control Insights Kill Switch
export { setInsightsEnabled } from './setInsightsEnabled';

// Admin: Manual Insights Rollup
export { runInsightsRollupNow } from './runInsightsRollupNow';

// Parent → Students Subcollection Operations
export { createStudentForParent } from './parentStudents';

// Session Completion Handler
export {
  onSessionComplete,
  onSessionCompleteTrigger,
} from './onSessionComplete';

// Game Progress Summary Generator
export { onGameProgressWrite } from './gameProgressSummary';

// Game Session Summary Updater
export { onGameSessionCreate } from './onGameSessionCreate';

// Batch Insights Rollup (Scheduled 3x daily)
export {
  batchInsightsRollup11am,
  batchInsightsRollup5pm,
  batchInsightsRollup11pm,
} from './scheduled/batchInsightsRollup';

// Games: Record Level Result
export { recordLevelResult } from './games/recordLevelResult';

// Games: Force Catalog Patching (Admin only)
export { ensureGamesCatalogNow } from './games/ensureGamesCatalogNow';

// Games: Cleanup Catalog Structure (Admin only)
export { cleanupGamesCatalogNow } from './games/cleanupGamesCatalogNow';

// Health ping (optional small endpoint you may add later)
// export { healthCheck } from './health'; // Uncomment only if file exists

logger.info('Tiny Steps Cloud Functions Initialized (v2)');
