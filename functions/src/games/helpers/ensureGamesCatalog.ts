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
  cached: boolean;
  checked: boolean;
  patched: boolean;
  patchedPaths?: string[];
  reason?: string;
}

// In-memory cache with TTL (10 minutes)
let catalogChecked = false;
let catalogCheckTimestamp = 0;
let catalogPatchResult: CatalogPatchResult = { 
  cached: false, 
  checked: false, 
  patched: false, 
  patchedPaths: [] 
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Ensure gamesCatalog contains letter-sound-match and balloon-pop games with correct metadata.
 * 
 * Required fields (never overwritten if correct):
 * - games["letter-sound-match"].progressDocId = 'phonics_letter_sound'
 * - games["letter-sound-match"].totalLevels = 7
 * - games["letter-sound-match"].category = 'letter_sounds'
 * - games["balloon-pop"].progressDocId = 'phonics_balloon_pop'
 * - games["balloon-pop"].totalLevels = 7
 * - games["balloon-pop"].category = 'letter_sounds'
 * 
 * Optional fields (only set if missing):
 * - games[...].active (default true if undefined)
 * - games[...].title (preserve existing)
 * - games[...].order (preserve existing)
 * - categories["letter_sounds"].label (only if missing)
 * - categories["letter_sounds"].order (only if missing)
 * 
 * @param db - Firestore instance
 * @returns Patch result with cached, checked, patched, and patchedPaths
 */
export async function ensureGamesCatalogPatched(db: admin.firestore.Firestore): Promise<CatalogPatchResult> {
  // Check cache with TTL
  const now = Date.now();
  if (catalogChecked && (now - catalogCheckTimestamp) < CACHE_TTL_MS) {
    const cachedResult = { ...catalogPatchResult, cached: true };
    logger.info('[ensureGamesCatalog] Returning cached result', { 
      cached: true, 
      checked: catalogPatchResult.checked, 
      patched: catalogPatchResult.patched, 
      patchedPaths: catalogPatchResult.patchedPaths,
      ageMs: now - catalogCheckTimestamp,
    });
    return cachedResult;
  }

  try {
    const catalogRef = db.doc('config/gamesCatalog');
    const catalogDoc = await catalogRef.get();
    
    const data = catalogDoc.exists ? catalogDoc.data() : {};
    const games = data?.games || {};
    const categories = data?.categories || {};
    
    // Get current values for both games
    const letterSoundGame = games['letter-sound-match'] || {};
    const balloonPopGame = games['balloon-pop'] || {};
    const category = categories['letter_sounds'] || {};
    
    // Build nested patch object (NOT dot-key strings)
    const patchedPaths: string[] = [];
    const patchGames: any = {};
    const patchCategories: any = {};
    let needsPatch = false;
    
    // Letter Sound Match game
    const letterSoundPatch: any = {};
    if (letterSoundGame.progressDocId !== 'phonics_letter_sound') {
      letterSoundPatch.progressDocId = 'phonics_letter_sound';
      patchedPaths.push('games.letter-sound-match.progressDocId');
      needsPatch = true;
    }
    if (letterSoundGame.totalLevels !== 7) {
      letterSoundPatch.totalLevels = 7;
      patchedPaths.push('games.letter-sound-match.totalLevels');
      needsPatch = true;
    }
    if (letterSoundGame.category !== 'letter_sounds') {
      letterSoundPatch.category = 'letter_sounds';
      patchedPaths.push('games.letter-sound-match.category');
      needsPatch = true;
    }
    if (letterSoundGame.active === undefined) {
      letterSoundPatch.active = true;
      patchedPaths.push('games.letter-sound-match.active');
      needsPatch = true;
    }
    if (!letterSoundGame.title) {
      letterSoundPatch.title = 'Letter Sound Match';
      patchedPaths.push('games.letter-sound-match.title');
      needsPatch = true;
    }
    if (letterSoundGame.order === undefined) {
      letterSoundPatch.order = 10;
      patchedPaths.push('games.letter-sound-match.order');
      needsPatch = true;
    }
    
    if (Object.keys(letterSoundPatch).length > 0) {
      patchGames['letter-sound-match'] = letterSoundPatch;
    }
    
    // Balloon Pop game
    const balloonPopPatch: any = {};
    if (balloonPopGame.progressDocId !== 'phonics_balloon_pop') {
      balloonPopPatch.progressDocId = 'phonics_balloon_pop';
      patchedPaths.push('games.balloon-pop.progressDocId');
      needsPatch = true;
    }
    if (balloonPopGame.totalLevels !== 7) {
      balloonPopPatch.totalLevels = 7;
      patchedPaths.push('games.balloon-pop.totalLevels');
      needsPatch = true;
    }
    if (balloonPopGame.category !== 'letter_sounds') {
      balloonPopPatch.category = 'letter_sounds';
      patchedPaths.push('games.balloon-pop.category');
      needsPatch = true;
    }
    if (balloonPopPatch.active === undefined) {
      balloonPopPatch.active = true;
      patchedPaths.push('games.balloon-pop.active');
      needsPatch = true;
    }
    if (!balloonPopGame.title) {
      balloonPopPatch.title = 'Balloon Pop (Jolly Levels)';
      patchedPaths.push('games.balloon-pop.title');
      needsPatch = true;
    }
    if (balloonPopGame.order === undefined) {
      balloonPopPatch.order = 20;
      patchedPaths.push('games.balloon-pop.order');
      needsPatch = true;
    }
    
    if (Object.keys(balloonPopPatch).length > 0) {
      patchGames['balloon-pop'] = balloonPopPatch;
    }
    
    // Category fields
    const categoryPatch: any = {};
    if (!category.label) {
      categoryPatch.label = 'Letter Sounds';
      patchedPaths.push('categories.letter_sounds.label');
      needsPatch = true;
    }
    if (category.order === undefined) {
      categoryPatch.order = 10;
      patchedPaths.push('categories.letter_sounds.order');
      needsPatch = true;
    }
    
    if (Object.keys(categoryPatch).length > 0) {
      patchCategories['letter_sounds'] = categoryPatch;
    }
    
    if (!needsPatch) {
      catalogChecked = true;
      catalogCheckTimestamp = now;
      catalogPatchResult = { cached: false, checked: true, patched: false, patchedPaths: [], reason: 'already_up_to_date' };
      
      logger.info('[ensureGamesCatalog] Catalog already up to date', { 
        cached: false, 
        checked: true, 
        patched: false, 
        patchedPaths: [] 
      });
      
      return catalogPatchResult;
    }
    
    // Build final nested patch object
    const patch: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (Object.keys(patchGames).length > 0) {
      patch.games = patchGames;
    }
    
    if (Object.keys(patchCategories).length > 0) {
      patch.categories = patchCategories;
    }
    
    await catalogRef.set(patch, { merge: true });
    
    catalogChecked = true;
    catalogCheckTimestamp = now;
    catalogPatchResult = { cached: false, checked: true, patched: true, patchedPaths, reason: 'patched_successfully' };
    
    logger.info('[ensureGamesCatalog] Patched config/gamesCatalog', {
      cached: false,
      checked: true,
      patched: true,
      patchedPaths,
    });
    
    return catalogPatchResult;
  } catch (error: any) {
    // Non-critical: log but don't fail the function
    logger.warn('[ensureGamesCatalog] Failed to patch catalog', {
      cached: false,
      checked: true,
      patched: false,
      error: error.message,
    });
    
    catalogChecked = true;
    catalogCheckTimestamp = now;
    catalogPatchResult = { cached: false, checked: true, patched: false, patchedPaths: [], reason: 'error: ' + error.message };
    
    return catalogPatchResult;
  }
}
