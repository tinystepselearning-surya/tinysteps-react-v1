/**
 * Manual Insights Rollup Callable
 * 
 * Admin-only callable function to trigger batch insights rollup on demand.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { runBatchInsightsRollup } from './scheduled/batchInsightsRollup';

if (!admin.apps.length) admin.initializeApp();

export const runInsightsRollupNow = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      logger.warn('[runInsightsRollupNow] Unauthenticated call attempt');
      throw new HttpsError('unauthenticated', 'You must be logged in');
    }

    const db = admin.firestore();

    // Check if user is admin
    const userDoc = await db.collection('users').doc(uid).get();
    const role = userDoc.data()?.role;

    if (role !== 'admin') {
      logger.warn(`[runInsightsRollupNow] Non-admin (${role}) attempted to run rollup: ${uid}`);
      throw new HttpsError('permission-denied', 'Only admins can run manual rollup');
    }

    logger.info(`[runInsightsRollupNow] Admin ${uid} triggered manual rollup`);

    try {
      const result = await runBatchInsightsRollup('manual', db);

      logger.info(`[runInsightsRollupNow] Rollup completed: ${result.kidsUpdated} kids, ${result.sessionsProcessed} sessions`);

      return {
        ok: true,
        kidsUpdated: result.kidsUpdated,
        sessionsProcessed: result.sessionsProcessed,
        from: result.from.toDate().toISOString(),
        to: result.to.toDate().toISOString(),
        label: 'manual',
      };
    } catch (error: any) {
      // Handle insights disabled error
      if (error.message?.includes('disabled')) {
        logger.info(`[runInsightsRollupNow] Insights disabled, returning ok:false`);
        return {
          ok: false,
          message: 'Insights are currently disabled',
        };
      }

      logger.error('[runInsightsRollupNow] Rollup failed', error);
      throw new HttpsError('internal', 'Failed to run insights rollup');
    }
  }
);
