/**
 * Ensure games catalog has required entries for all phonics games.
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
 * Ensure gamesCatalog contains all phonics games with correct metadata.
 * 
 * Games (11 total):
 * - letter-sound-match (7 levels) - Actual game has 7 levels
 * - sound-detective (5 levels)
 * - rhyme-time (5 levels)
 * - cvc-word-builder (5 levels)
 * - sound-sequencer (5 levels)
 * - blend-slide (5 levels)
 * - blend-build (5 levels)
 * - vowel-explorer (5 levels)
 * - word-quest (5 levels)
 * - story-builder (5 levels)
 * - balloon-pop (7 levels) - Legacy game
 * 
 * Required fields (never overwritten if correct):
 * - games[...].progressDocId (unique snake_case identifier)
 * - games[...].totalLevels (number of levels)
 * - games[...].category = 'letter_sounds'
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
    if (letterSoundGame.progressDocId !== 'phonics_letter_sound_match') {
      letterSoundPatch.progressDocId = 'phonics_letter_sound_match';
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
    if (balloonPopGame.active === undefined) {
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
    
    // Sound Detective game
    const soundDetectiveGame = games['sound-detective'] || {};
    const soundDetectivePatch: any = {};
    if (soundDetectiveGame.progressDocId !== 'phonics_sound_detective') {
      soundDetectivePatch.progressDocId = 'phonics_sound_detective';
      patchedPaths.push('games.sound-detective.progressDocId');
      needsPatch = true;
    }
    if (soundDetectiveGame.totalLevels !== 5) {
      soundDetectivePatch.totalLevels = 5;
      patchedPaths.push('games.sound-detective.totalLevels');
      needsPatch = true;
    }
    if (soundDetectiveGame.category !== 'letter_sounds') {
      soundDetectivePatch.category = 'letter_sounds';
      patchedPaths.push('games.sound-detective.category');
      needsPatch = true;
    }
    if (soundDetectiveGame.active === undefined) {
      soundDetectivePatch.active = true;
      patchedPaths.push('games.sound-detective.active');
      needsPatch = true;
    }
    if (!soundDetectiveGame.title) {
      soundDetectivePatch.title = 'Sound Detective';
      patchedPaths.push('games.sound-detective.title');
      needsPatch = true;
    }
    if (soundDetectiveGame.order === undefined) {
      soundDetectivePatch.order = 30;
      patchedPaths.push('games.sound-detective.order');
      needsPatch = true;
    }
    if (Object.keys(soundDetectivePatch).length > 0) {
      patchGames['sound-detective'] = soundDetectivePatch;
    }
    
    // Rhyme Time game
    const rhymeTimeGame = games['rhyme-time'] || {};
    const rhymeTimePatch: any = {};
    if (rhymeTimeGame.progressDocId !== 'phonics_rhyme_time') {
      rhymeTimePatch.progressDocId = 'phonics_rhyme_time';
      patchedPaths.push('games.rhyme-time.progressDocId');
      needsPatch = true;
    }
    if (rhymeTimeGame.totalLevels !== 5) {
      rhymeTimePatch.totalLevels = 5;
      patchedPaths.push('games.rhyme-time.totalLevels');
      needsPatch = true;
    }
    if (rhymeTimeGame.category !== 'letter_sounds') {
      rhymeTimePatch.category = 'letter_sounds';
      patchedPaths.push('games.rhyme-time.category');
      needsPatch = true;
    }
    if (rhymeTimeGame.active === undefined) {
      rhymeTimePatch.active = true;
      patchedPaths.push('games.rhyme-time.active');
      needsPatch = true;
    }
    if (!rhymeTimeGame.title) {
      rhymeTimePatch.title = 'Rhyme Time';
      patchedPaths.push('games.rhyme-time.title');
      needsPatch = true;
    }
    if (rhymeTimeGame.order === undefined) {
      rhymeTimePatch.order = 40;
      patchedPaths.push('games.rhyme-time.order');
      needsPatch = true;
    }
    if (Object.keys(rhymeTimePatch).length > 0) {
      patchGames['rhyme-time'] = rhymeTimePatch;
    }
    
    // CVC Word Builder game
    const cvcWordBuilderGame = games['cvc-word-builder'] || {};
    const cvcWordBuilderPatch: any = {};
    if (cvcWordBuilderGame.progressDocId !== 'phonics_cvc_word_builder') {
      cvcWordBuilderPatch.progressDocId = 'phonics_cvc_word_builder';
      patchedPaths.push('games.cvc-word-builder.progressDocId');
      needsPatch = true;
    }
    if (cvcWordBuilderGame.totalLevels !== 5) {
      cvcWordBuilderPatch.totalLevels = 5;
      patchedPaths.push('games.cvc-word-builder.totalLevels');
      needsPatch = true;
    }
    if (cvcWordBuilderGame.category !== 'letter_sounds') {
      cvcWordBuilderPatch.category = 'letter_sounds';
      patchedPaths.push('games.cvc-word-builder.category');
      needsPatch = true;
    }
    if (cvcWordBuilderGame.active === undefined) {
      cvcWordBuilderPatch.active = true;
      patchedPaths.push('games.cvc-word-builder.active');
      needsPatch = true;
    }
    if (!cvcWordBuilderGame.title) {
      cvcWordBuilderPatch.title = 'CVC Word Builder';
      patchedPaths.push('games.cvc-word-builder.title');
      needsPatch = true;
    }
    if (cvcWordBuilderGame.order === undefined) {
      cvcWordBuilderPatch.order = 50;
      patchedPaths.push('games.cvc-word-builder.order');
      needsPatch = true;
    }
    if (Object.keys(cvcWordBuilderPatch).length > 0) {
      patchGames['cvc-word-builder'] = cvcWordBuilderPatch;
    }
    
    // Sound Sequencer game
    const soundSequencerGame = games['sound-sequencer'] || {};
    const soundSequencerPatch: any = {};
    if (soundSequencerGame.progressDocId !== 'phonics_sound_sequencer') {
      soundSequencerPatch.progressDocId = 'phonics_sound_sequencer';
      patchedPaths.push('games.sound-sequencer.progressDocId');
      needsPatch = true;
    }
    if (soundSequencerGame.totalLevels !== 5) {
      soundSequencerPatch.totalLevels = 5;
      patchedPaths.push('games.sound-sequencer.totalLevels');
      needsPatch = true;
    }
    if (soundSequencerGame.category !== 'letter_sounds') {
      soundSequencerPatch.category = 'letter_sounds';
      patchedPaths.push('games.sound-sequencer.category');
      needsPatch = true;
    }
    if (soundSequencerGame.active === undefined) {
      soundSequencerPatch.active = true;
      patchedPaths.push('games.sound-sequencer.active');
      needsPatch = true;
    }
    if (!soundSequencerGame.title) {
      soundSequencerPatch.title = 'Sound Sequencer';
      patchedPaths.push('games.sound-sequencer.title');
      needsPatch = true;
    }
    if (soundSequencerGame.order === undefined) {
      soundSequencerPatch.order = 60;
      patchedPaths.push('games.sound-sequencer.order');
      needsPatch = true;
    }
    if (Object.keys(soundSequencerPatch).length > 0) {
      patchGames['sound-sequencer'] = soundSequencerPatch;
    }
    
    // Blend & Slide game
    const blendSlideGame = games['blend-slide'] || {};
    const blendSlidePatch: any = {};
    if (blendSlideGame.progressDocId !== 'phonics_blend_slide') {
      blendSlidePatch.progressDocId = 'phonics_blend_slide';
      patchedPaths.push('games.blend-slide.progressDocId');
      needsPatch = true;
    }
    if (blendSlideGame.totalLevels !== 5) {
      blendSlidePatch.totalLevels = 5;
      patchedPaths.push('games.blend-slide.totalLevels');
      needsPatch = true;
    }
    if (blendSlideGame.category !== 'letter_sounds') {
      blendSlidePatch.category = 'letter_sounds';
      patchedPaths.push('games.blend-slide.category');
      needsPatch = true;
    }
    if (blendSlideGame.active === undefined) {
      blendSlidePatch.active = true;
      patchedPaths.push('games.blend-slide.active');
      needsPatch = true;
    }
    if (!blendSlideGame.title) {
      blendSlidePatch.title = 'Blend & Slide';
      patchedPaths.push('games.blend-slide.title');
      needsPatch = true;
    }
    if (blendSlideGame.order === undefined) {
      blendSlidePatch.order = 70;
      patchedPaths.push('games.blend-slide.order');
      needsPatch = true;
    }
    if (Object.keys(blendSlidePatch).length > 0) {
      patchGames['blend-slide'] = blendSlidePatch;
    }
    
    // Blend & Build game
    const blendBuildGame = games['blend-build'] || {};
    const blendBuildPatch: any = {};
    if (blendBuildGame.progressDocId !== 'phonics_blend_build') {
      blendBuildPatch.progressDocId = 'phonics_blend_build';
      patchedPaths.push('games.blend-build.progressDocId');
      needsPatch = true;
    }
    if (blendBuildGame.totalLevels !== 5) {
      blendBuildPatch.totalLevels = 5;
      patchedPaths.push('games.blend-build.totalLevels');
      needsPatch = true;
    }
    if (blendBuildGame.category !== 'letter_sounds') {
      blendBuildPatch.category = 'letter_sounds';
      patchedPaths.push('games.blend-build.category');
      needsPatch = true;
    }
    if (blendBuildGame.active === undefined) {
      blendBuildPatch.active = true;
      patchedPaths.push('games.blend-build.active');
      needsPatch = true;
    }
    if (!blendBuildGame.title) {
      blendBuildPatch.title = 'Blend & Build';
      patchedPaths.push('games.blend-build.title');
      needsPatch = true;
    }
    if (blendBuildGame.order === undefined) {
      blendBuildPatch.order = 80;
      patchedPaths.push('games.blend-build.order');
      needsPatch = true;
    }
    if (Object.keys(blendBuildPatch).length > 0) {
      patchGames['blend-build'] = blendBuildPatch;
    }
    
    // Vowel Explorer game
    const vowelExplorerGame = games['vowel-explorer'] || {};
    const vowelExplorerPatch: any = {};
    if (vowelExplorerGame.progressDocId !== 'phonics_vowel_explorer') {
      vowelExplorerPatch.progressDocId = 'phonics_vowel_explorer';
      patchedPaths.push('games.vowel-explorer.progressDocId');
      needsPatch = true;
    }
    if (vowelExplorerGame.totalLevels !== 5) {
      vowelExplorerPatch.totalLevels = 5;
      patchedPaths.push('games.vowel-explorer.totalLevels');
      needsPatch = true;
    }
    if (vowelExplorerGame.category !== 'letter_sounds') {
      vowelExplorerPatch.category = 'letter_sounds';
      patchedPaths.push('games.vowel-explorer.category');
      needsPatch = true;
    }
    if (vowelExplorerGame.active === undefined) {
      vowelExplorerPatch.active = true;
      patchedPaths.push('games.vowel-explorer.active');
      needsPatch = true;
    }
    if (!vowelExplorerGame.title) {
      vowelExplorerPatch.title = 'Vowel Explorer';
      patchedPaths.push('games.vowel-explorer.title');
      needsPatch = true;
    }
    if (vowelExplorerGame.order === undefined) {
      vowelExplorerPatch.order = 90;
      patchedPaths.push('games.vowel-explorer.order');
      needsPatch = true;
    }
    if (Object.keys(vowelExplorerPatch).length > 0) {
      patchGames['vowel-explorer'] = vowelExplorerPatch;
    }
    
    // Word Quest game
    const wordQuestGame = games['word-quest'] || {};
    const wordQuestPatch: any = {};
    if (wordQuestGame.progressDocId !== 'phonics_word_quest') {
      wordQuestPatch.progressDocId = 'phonics_word_quest';
      patchedPaths.push('games.word-quest.progressDocId');
      needsPatch = true;
    }
    if (wordQuestGame.totalLevels !== 5) {
      wordQuestPatch.totalLevels = 5;
      patchedPaths.push('games.word-quest.totalLevels');
      needsPatch = true;
    }
    if (wordQuestGame.category !== 'letter_sounds') {
      wordQuestPatch.category = 'letter_sounds';
      patchedPaths.push('games.word-quest.category');
      needsPatch = true;
    }
    if (wordQuestGame.active === undefined) {
      wordQuestPatch.active = true;
      patchedPaths.push('games.word-quest.active');
      needsPatch = true;
    }
    if (!wordQuestGame.title) {
      wordQuestPatch.title = 'Word Quest';
      patchedPaths.push('games.word-quest.title');
      needsPatch = true;
    }
    if (wordQuestGame.order === undefined) {
      wordQuestPatch.order = 100;
      patchedPaths.push('games.word-quest.order');
      needsPatch = true;
    }
    if (Object.keys(wordQuestPatch).length > 0) {
      patchGames['word-quest'] = wordQuestPatch;
    }
    
    // Story Builder game
    const storyBuilderGame = games['story-builder'] || {};
    const storyBuilderPatch: any = {};
    if (storyBuilderGame.progressDocId !== 'phonics_story_builder') {
      storyBuilderPatch.progressDocId = 'phonics_story_builder';
      patchedPaths.push('games.story-builder.progressDocId');
      needsPatch = true;
    }
    if (storyBuilderGame.totalLevels !== 5) {
      storyBuilderPatch.totalLevels = 5;
      patchedPaths.push('games.story-builder.totalLevels');
      needsPatch = true;
    }
    if (storyBuilderGame.category !== 'letter_sounds') {
      storyBuilderPatch.category = 'letter_sounds';
      patchedPaths.push('games.story-builder.category');
      needsPatch = true;
    }
    if (storyBuilderGame.active === undefined) {
      storyBuilderPatch.active = true;
      patchedPaths.push('games.story-builder.active');
      needsPatch = true;
    }
    if (!storyBuilderGame.title) {
      storyBuilderPatch.title = 'Story Builder';
      patchedPaths.push('games.story-builder.title');
      needsPatch = true;
    }
    if (storyBuilderGame.order === undefined) {
      storyBuilderPatch.order = 110;
      patchedPaths.push('games.story-builder.order');
      needsPatch = true;
    }
    if (Object.keys(storyBuilderPatch).length > 0) {
      patchGames['story-builder'] = storyBuilderPatch;
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
