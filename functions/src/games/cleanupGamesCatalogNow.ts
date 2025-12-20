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

    // 5. Build cleanup operations
    const updates: Array<[admin.firestore.FieldPath | string, any]> = [];
    const deletedDotKeys: string[] = [];
    const normalizedGames: string[] = [];
    let deletedCategoryHyphenKey = false;
    let deletedLegacyGamesBlock = false;

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
      updates.push(['games', normalizedGamesMap]);
    }

    // 5b. Delete top-level dot-key fields using FieldPath
    // These are literal field names that contain dots (e.g., "games.letter-sound-match.totalLevels")
    const allKeys = Object.keys(catalogData);
    for (const key of allKeys) {
      // Skip real nested maps
      if (key === 'games' || key === 'categories') continue;
      
      // Delete any field starting with "games." or "categories."
      if (key.startsWith('games.') || key.startsWith('categories.')) {
        // Use FieldPath with single segment for literal dot-key field
        updates.push([
          new admin.firestore.FieldPath(key),
          admin.firestore.FieldValue.delete()
        ]);
        deletedDotKeys.push(key);
      }
    }

    // 5c. Normalize categories map (remove hyphenated version, legacy blocks, ensure underscore version)
    const normalizedCategoriesMap: any = { ...categories };
    
    // Check if hyphenated version exists and mark for tracking
    if (categories['letter-sounds']) {
      deletedCategoryHyphenKey = true;
    }
    
    // Remove hyphenated version from our map
    delete normalizedCategoriesMap['letter-sounds'];
    
    // Remove legacy nested games block (not used by frontend)
    if (normalizedCategoriesMap.games) {
      delete normalizedCategoriesMap.games;
      deletedLegacyGamesBlock = true;
      logger.info('[cleanupGamesCatalogNow] Removing legacy categories.games block');
    }
    
    // Recursively normalize category IDs in any remaining nested objects
    Object.keys(normalizedCategoriesMap).forEach(key => {
      const value = normalizedCategoriesMap[key];
      if (value && typeof value === 'object') {
        if (value.category === 'letter-sounds') {
          value.category = 'letter_sounds';
          logger.info('[cleanupGamesCatalogNow] Normalized category in categories.' + key);
        }
      }
    });
    
    // Ensure correct category exists
    if (!normalizedCategoriesMap.letter_sounds) {
      normalizedCategoriesMap.letter_sounds = {
        label: 'Letter Sounds',
        order: 10,
      };
    }
    
    // Always update categories to ensure consistency
    updates.push(['categories', normalizedCategoriesMap]);
    updates.push(['version', 1]);
    updates.push(['updatedAt', admin.firestore.FieldValue.serverTimestamp()]);

    // 6. Apply cleanup if there are changes
    if (updates.length > 0) {
      try {
        // Flatten to varargs format: field1, value1, field2, value2, ...
        const flattenedArgs: any[] = [];
        for (const [field, value] of updates) {
          flattenedArgs.push(field, value);
        }
        
        // TypeScript requires explicit typing for spread in update()
        await (catalogRef.update as any)(...flattenedArgs);
        
        logger.info('[cleanupGamesCatalogNow] Cleanup applied', {
          deletedDotKeys,
          deletedCategoryHyphenKey,
          normalizedGames,
          totalDeleted: deletedDotKeys.length + (deletedCategoryHyphenKey ? 1 : 0),
        });
      } catch (error) {
        logger.error('[cleanupGamesCatalogNow] Update failed', error);
        throw new HttpsError(
          'internal',
          `Failed to cleanup catalog: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
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
        deletedDotKeys,
        deletedCategoryHyphenKey,
        deletedLegacyGamesBlock,
        normalizedGames,
        totalDeleted: deletedDotKeys.length + (deletedCategoryHyphenKey ? 1 : 0) + (deletedLegacyGamesBlock ? 1 : 0),
        gamesNormalized: normalizedGames.length,
      },
      finalCatalog: {
        games: finalData.games || {},
        categories: finalData.categories || {},
        version: finalData.version,
      },
      message: deletedDotKeys.length > 0 || deletedCategoryHyphenKey || deletedLegacyGamesBlock
        ? `Cleaned up ${deletedDotKeys.length + (deletedCategoryHyphenKey ? 1 : 0) + (deletedLegacyGamesBlock ? 1 : 0)} legacy fields, normalized ${normalizedGames.length} games`
        : 'Catalog already clean',
    };
  }
);
