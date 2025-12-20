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
    
    // Build patch with only required fields or missing optional fields
    const patch: any = {};
    const patchedPaths: string[] = [];
    
    // Letter Sound Match - Required fields
    if (letterSoundGame.progressDocId !== 'phonics_letter_sound') {
      patch['games.letter-sound-match.progressDocId'] = 'phonics_letter_sound';
      patchedPaths.push('games.letter-sound-match.progressDocId');
    }
    if (letterSoundGame.totalLevels !== 7) {
      patch['games.letter-sound-match.totalLevels'] = 7;
      patchedPaths.push('games.letter-sound-match.totalLevels');
    }
    if (letterSoundGame.category !== 'letter_sounds') {
      patch['games.letter-sound-match.category'] = 'letter_sounds';
      patchedPaths.push('games.letter-sound-match.category');
    }
    
    // Letter Sound Match - Optional fields
    if (letterSoundGame.active === undefined) {
      patch['games.letter-sound-match.active'] = true;
      patchedPaths.push('games.letter-sound-match.active');
    }
    if (!letterSoundGame.title) {
      patch['games.letter-sound-match.title'] = 'Letter Sound Match';
      patchedPaths.push('games.letter-sound-match.title');
    }
    if (letterSoundGame.order === undefined) {
      patch['games.letter-sound-match.order'] = 10;
      patchedPaths.push('games.letter-sound-match.order');
    }
    
    // Balloon Pop - Required fields
    if (balloonPopGame.progressDocId !== 'phonics_balloon_pop') {
      patch['games.balloon-pop.progressDocId'] = 'phonics_balloon_pop';
      patchedPaths.push('games.balloon-pop.progressDocId');
    }
    if (balloonPopGame.totalLevels !== 7) {
      patch['games.balloon-pop.totalLevels'] = 7;
      patchedPaths.push('games.balloon-pop.totalLevels');
    }
    if (balloonPopGame.category !== 'letter_sounds') {
      patch['games.balloon-pop.category'] = 'letter_sounds';
      patchedPaths.push('games.balloon-pop.category');
    }
    
    // Balloon Pop - Optional fields
    if (balloonPopGame.active === undefined) {
      patch['games.balloon-pop.active'] = true;
      patchedPaths.push('games.balloon-pop.active');
    }
    if (!balloonPopGame.title) {
      patch['games.balloon-pop.title'] = 'Balloon Pop (Jolly Levels)';
      patchedPaths.push('games.balloon-pop.title');
    }
    if (balloonPopGame.order === undefined) {
      patch['games.balloon-pop.order'] = 20;
      patchedPaths.push('games.balloon-pop.order');
    }
    
    // Category fields (only set if missing)
    if (!category.label) {
      patch['categories.letter_sounds.label'] = 'Letter Sounds';
      patchedPaths.push('categories.letter_sounds.label');
    }
    if (category.order === undefined) {
      patch['categories.letter_sounds.order'] = 10;
      patchedPaths.push('categories.letter_sounds.order');
    }
    
    if (patchedPaths.length === 0) {
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
    
    // Apply patch with timestamp
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
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
