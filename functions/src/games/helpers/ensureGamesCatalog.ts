/**
 * Ensure games catalog has required entries for letter-sound-match game.
 * 
 * This patches config/gamesCatalog with minimal required fields if missing/incorrect.
 * Runs once per warm instance (in-memory flag) for efficiency.
 * Safe to run multiple times (idempotent merge).
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// In-memory flag to run once per warm instance
let catalogPatched = false;

/**
 * Ensure gamesCatalog contains letter-sound-match game with correct metadata.
 * 
 * Patches:
 * - games["letter-sound-match"] with progressDocId, totalLevels, category, active, title
 * - categories["letter_sounds"] with label, order
 * 
 * Only writes if fields are missing/incorrect to minimize writes.
 * 
 * @param db - Firestore instance
 */
export async function ensureGamesCatalogPatched(db: admin.firestore.Firestore): Promise<void> {
  // Skip if already patched in this instance
  if (catalogPatched) {
    return;
  }

  try {
    const catalogRef = db.doc('config/gamesCatalog');
    const catalogDoc = await catalogRef.get();
    
    const data = catalogDoc.exists ? catalogDoc.data() : {};
    const games = data?.games || {};
    const categories = data?.categories || {};
    
    // Check if patch needed
    const game = games['letter-sound-match'] || {};
    const category = categories['letter_sounds'] || {};
    
    const needsGamePatch = 
      game.progressDocId !== 'phonics_letter_sound' ||
      game.totalLevels !== 7 ||
      game.category !== 'letter_sounds' ||
      game.active !== true ||
      !game.title;
    
    const needsCategoryPatch = 
      category.label !== 'Letter Sounds' ||
      category.order !== 10;
    
    if (!needsGamePatch && !needsCategoryPatch) {
      catalogPatched = true;
      return;
    }
    
    // Apply patch
    const patch: any = {};
    
    if (needsGamePatch) {
      patch['games.letter-sound-match'] = {
        progressDocId: 'phonics_letter_sound',
        totalLevels: 7,
        category: 'letter_sounds',
        active: true,
        title: 'Letter Sound Match',
        order: game.order ?? 10, // Preserve existing order or default
      };
    }
    
    if (needsCategoryPatch) {
      patch['categories.letter_sounds'] = {
        label: 'Letter Sounds',
        order: 10,
      };
    }
    
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await catalogRef.set(patch, { merge: true });
    
    logger.info('[ensureGamesCatalog] Patched config/gamesCatalog', {
      gamesPatched: needsGamePatch,
      categoriesPatched: needsCategoryPatch,
    });
    
    catalogPatched = true;
  } catch (error: any) {
    // Non-critical: log but don't fail the function
    logger.warn('[ensureGamesCatalog] Failed to patch catalog', {
      error: error.message,
    });
  }
}
