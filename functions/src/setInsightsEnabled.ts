/**
 * setInsightsEnabled.ts
 *
 * Admin-only callable function to control the insights kill switch.
 * Updates config/insights.enabled for onGameSessionCreate trigger.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) admin.initializeApp();

interface SetInsightsEnabledRequest {
  enabled: boolean;
}

interface SetInsightsEnabledResponse {
  ok: boolean;
  enabled: boolean;
}

/**
 * Callable: setInsightsEnabled
 * 
 * Admin-only function to enable/disable game session insights.
 * Updates config/insights.enabled flag.
 */
export const setInsightsEnabled = onCall<SetInsightsEnabledRequest>(
  { region: 'asia-south1' },
  async (request): Promise<SetInsightsEnabledResponse> => {
    // 1) Auth required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const uid = request.auth.uid;

    // 2) Admin-only check
    const db = admin.firestore();
    let userRole: string | undefined;

    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('permission-denied', 'User document not found');
      }
      userRole = userDoc.data()?.role;
    } catch (error) {
      logger.error('[setInsightsEnabled] Failed to read user document', { uid, error });
      throw new HttpsError('internal', 'Failed to verify permissions');
    }

    if (userRole !== 'admin') {
      logger.warn('[setInsightsEnabled] Non-admin attempted access', { uid, userRole });
      throw new HttpsError('permission-denied', 'Admin only');
    }

    // 3) Validate input
    const { enabled } = request.data;

    if (typeof enabled !== 'boolean') {
      throw new HttpsError('invalid-argument', 'enabled must be boolean');
    }

    // 4) Write config (ensure batch mode by default)
    try {
      const configRef = db.doc('config/insights');
      const configSnap = await configRef.get();

      // Preserve existing mode, or default to 'batch'
      const existingMode = configSnap.exists ? configSnap.data()?.mode : undefined;
      const modeToWrite = existingMode ? existingMode : 'batch';

      await configRef.set({
        enabled,
        mode: modeToWrite,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
        source: 'callable:setInsightsEnabled',
      }, { merge: true });

      logger.info('[setInsightsEnabled] Config updated', { uid, enabled, mode: modeToWrite });

      // 5) Return success
      return {
        ok: true,
        enabled,
      };
    } catch (error) {
      logger.error('[setInsightsEnabled] Failed to update config', { uid, enabled, error });
      throw new HttpsError('internal', 'Failed to update config');
    }
  }
);
