/**
 * Admin-only callable to cleanup games catalog structure.
 * 
 * Removes legacy dot-key fields and normalizes category IDs.
 * One-time operation to fix historical data issues.
 * Restricted to admin users only.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureGamesCatalogPatched } from './helpers/ensureGamesCatalog';

if (!admin.apps.length) admin.initializeApp();

/**
 * Callable function to cleanup games catalog structure.
 * 
 * Security: Admin users only
 * Actions:
 * - Ensures nested maps are correct
 * - Removes dot-key fields (e.g., "games.letter-sound-match")
 * - Standardizes category IDs to "letter_sounds"
 * - Removes inconsistent categories (e.g., "letter-sounds")
 * 
 * Returns: Cleanup summary + final catalog state
 */
export const cleanupGamesCatalogNow = onCall(
  {
    region: 'asia-south1',
    timeoutSeconds: 30,
  },
  async (request) => {
    // 1. Authentication check
    const uid = request.auth?.uid;
    if (!uid) {
      logger.warn('[cleanupGamesCatalogNow] Unauthenticated call attempt');
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
      logger.warn('[cleanupGamesCatalogNow] Non-admin call attempt', { uid, role });
      throw new HttpsError(
        'permission-denied',
        'Only admins can cleanup catalog'
      );
    }

    logger.info('[cleanupGamesCatalogNow] Admin cleanup request', { uid });

    // 3. Ensure nested maps are correct first
    const patchResult = await ensureGamesCatalogPatched(db);
    logger.info('[cleanupGamesCatalogNow] Patch result', patchResult);

    // 4. Read current catalog
    const catalogRef = db.doc('config/gamesCatalog');
    const catalogDoc = await catalogRef.get();
    
    if (!catalogDoc.exists) {
      throw new HttpsError('not-found', 'Catalog document does not exist');
    }

    const catalogData = catalogDoc.data() || {};
    const games = catalogData.games || {};
    const categories = catalogData.categories || {};

    // 5. Build cleanup payload
    const updatePayload: any = {};
    const deletedFields: string[] = [];
    const normalizedGames: string[] = [];

    // 5a. Normalize category IDs in nested games map
    const normalizedGamesMap: any = {};
    let gamesNeedUpdate = false;

    for (const [gameId, game] of Object.entries(games)) {
      const gameData = game as any;
      const normalizedGame = { ...gameData };
      
      // Standardize category to "letter_sounds"
      if (gameData.category && gameData.category !== 'letter_sounds') {
        normalizedGame.category = 'letter_sounds';
        normalizedGames.push(gameId);
        gamesNeedUpdate = true;
      }
      
      normalizedGamesMap[gameId] = normalizedGame;
    }

    if (gamesNeedUpdate) {
      updatePayload.games = normalizedGamesMap;
    }

    // 5b. Delete dot-key fields at top level
    const allKeys = Object.keys(catalogData);
    for (const key of allKeys) {
      // Delete any field starting with "games." or "categories."
      if (key.startsWith('games.') || key.startsWith('categories.')) {
        updatePayload[key] = admin.firestore.FieldValue.delete();
        deletedFields.push(key);
      }
    }

    // 5c. Remove inconsistent category IDs from categories map
    if (categories['letter-sounds']) {
      // Delete the hyphenated version from categories map
      updatePayload['categories.letter-sounds'] = admin.firestore.FieldValue.delete();
      deletedFields.push('categories.letter-sounds');
    }

    // 5d. Ensure correct category exists
    const normalizedCategoriesMap: any = { ...categories };
    delete normalizedCategoriesMap['letter-sounds']; // Remove hyphenated version
    
    if (!normalizedCategoriesMap.letter_sounds) {
      normalizedCategoriesMap.letter_sounds = {
        label: 'Letter Sounds',
        order: 10,
      };
    }
    
    updatePayload.categories = normalizedCategoriesMap;
    updatePayload.version = 1;
    updatePayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // 6. Apply cleanup if there are changes
    if (deletedFields.length > 0 || gamesNeedUpdate || updatePayload.categories) {
      await catalogRef.update(updatePayload);
      
      logger.info('[cleanupGamesCatalogNow] Cleanup applied', {
        deletedFields,
        normalizedGames,
        totalDeleted: deletedFields.length,
      });
    } else {
      logger.info('[cleanupGamesCatalogNow] No cleanup needed');
    }

    // 7. Read final state
    const finalDoc = await catalogRef.get();
    const finalData = finalDoc.data() || {};

    // 8. Return summary
    return {
      success: true,
      patchResult,
      cleanup: {
        deletedFields,
        normalizedGames,
        totalDeleted: deletedFields.length,
        gamesNormalized: normalizedGames.length,
      },
      finalCatalog: {
        games: finalData.games || {},
        categories: finalData.categories || {},
        version: finalData.version,
      },
      message: deletedFields.length > 0 
        ? `Cleaned up ${deletedFields.length} legacy fields, normalized ${normalizedGames.length} games`
        : 'Catalog already clean',
    };
  }
);
