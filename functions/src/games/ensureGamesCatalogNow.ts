/**
 * Admin-only callable to force games catalog patching.
 * 
 * Use this to seed/repair config/gamesCatalog without requiring gameplay.
 * Restricted to admin users only.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureGamesCatalogPatched } from './helpers/ensureGamesCatalog';

if (!admin.apps.length) admin.initializeApp();

/**
 * Callable function to ensure games catalog exists.
 * 
 * Security: Admin users only
 * Returns: Catalog patch result + full catalog data
 */
export const ensureGamesCatalogNow = onCall(
  {
    region: 'asia-south1',
    timeoutSeconds: 30,
  },
  async (request) => {
    // 1. Authentication check
    const uid = request.auth?.uid;
    if (!uid) {
      logger.warn('[ensureGamesCatalogNow] Unauthenticated call attempt');
      throw new HttpsError('unauthenticated', 'You must be logged in');
    }

    // 2. Authorization check (admin only)
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const role = userDoc.data()?.role;
    
    if (role !== 'admin') {
      logger.warn('[ensureGamesCatalogNow] Non-admin call attempt', { uid, role });
      throw new HttpsError(
        'permission-denied',
        'Only admins can force catalog patching'
      );
    }

    logger.info('[ensureGamesCatalogNow] Admin request', { uid });

    // 3. Force catalog patching (bypasses cache)
    const patchResult = await ensureGamesCatalogPatched(db);
    
    logger.info('[ensureGamesCatalogNow] Patch result', patchResult);

    // 4. Read full catalog data
    const catalogDoc = await db.doc('config/gamesCatalog').get();
    const catalogData = catalogDoc.exists ? catalogDoc.data() : null;

    // 5. Return result
    return {
      success: true,
      patchResult,
      catalog: catalogData,
      message: patchResult.patched 
        ? `Patched ${patchResult.patchedPaths?.length || 0} fields`
        : 'Catalog already up to date',
    };
  }
);
