/**
 * Ensure games catalog has required entries for letter-sound-match game.
 * 
 * This patches config/gamesCatalog with minimal required fields if missing/incorrect.
 * Runs once per warm instance (in-memory flag) for efficiency.
 * Safe to run multiple times (idempotent merge).
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

/**
 * Result of catalog patch check
 */
export interface CatalogPatchResult {
  checked: boolean;
  patched: boolean;
  patchedPaths: string[];
}

// In-memory flag to run once per warm instance
let catalogChecked = false;
let catalogPatchResult: CatalogPatchResult = { checked: false, patched: false, patchedPaths: [] };

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
 * @returns Patch result with checked, patched, and patchedPaths
 */
export async function ensureGamesCatalogPatched(db: admin.firestore.Firestore): Promise<CatalogPatchResult> {
  // Return cached result if already checked in this instance
  if (catalogChecked) {
    return catalogPatchResult;
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
      catalogChecked = true;
      catalogPatchResult = { checked: true, patched: false, patchedPaths: [] };
      
      logger.info('[ensureGamesCatalog] Catalog already up to date', { patched: false });
      
      return catalogPatchResult;
    }
    
    // Apply patch
    const patch: any = {};
    const patchedPaths: string[] = [];
    
    if (needsGamePatch) {
      patch['games.letter-sound-match'] = {
        progressDocId: 'phonics_letter_sound',
        totalLevels: 7,
        category: 'letter_sounds',
        active: true,
        title: 'Letter Sound Match',
        order: game.order ?? 10, // Preserve existing order or default
      };
      patchedPaths.push('games.letter-sound-match');
    }
    
    if (needsCategoryPatch) {
      patch['categories.letter_sounds'] = {
        label: 'Letter Sounds',
        order: 10,
      };
      patchedPaths.push('categories.letter_sounds');
    }
    
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await catalogRef.set(patch, { merge: true });
    
    catalogChecked = true;
    catalogPatchResult = { checked: true, patched: true, patchedPaths };
    
    logger.info('[ensureGamesCatalog] Patched config/gamesCatalog', {
      patched: true,
      patchedPaths,
    });
    
    return catalogPatchResult;
  } catch (error: any) {
    // Non-critical: log but don't fail the function
    logger.warn('[ensureGamesCatalog] Failed to patch catalog', {
      error: error.message,
    });
    
    catalogChecked = true;
    catalogPatchResult = { checked: true, patched: false, patchedPaths: [] };
    
    return catalogPatchResult;
  }
}
