/**
 * Tiny Steps Games - Tag Stats Updater
 * 
 * Applies tag delta updates to kid skill stats in Firestore.
 * Uses incremental updates to track learning progress per skill tag.
 */

import * as admin from 'firebase-admin';
import type { TagDelta } from '../types';

/**
 * Sanitize a skill tag for use as Firestore document ID.
 * Replaces invalid characters and ensures safe document path.
 * 
 * @param tag - Raw skill tag
 * @returns Sanitized tag safe for Firestore doc ID
 */
function sanitizeTagForFirestore(tag: string): string {
  // Replace forward slashes with underscores (Firestore path separator)
  // Also replace other problematic characters
  return tag
    .replace(/\//g, '_')
    .replace(/\\/g, '_')
    .replace(/\./g, '_')
    .trim();
}

/**
 * Apply tag deltas to kid's skill stats in Firestore.
 * Updates kids/{kidId}/skillStats/{tag} documents using batch writes.
 * 
 * Each skill stat doc tracks:
 * - attempts: total attempts (incremented)
 * - correct: total correct (incremented)
 * - wrong: total wrong (incremented)
 * - lastSeenAt: timestamp of last activity
 * - lastWrongAt: timestamp of last wrong answer (if any)
 * - lastEvidence: { gameId, levelId } (optional) - last game/level where tag appeared
 * 
 * @param db - Firestore instance
 * @param kidId - Kid identifier
 * @param tagDeltas - Map of tag to delta values
 * @param nowTs - Current timestamp
 * @param evidence - Optional evidence (gameId, levelId) for tracking context
 * @returns Number of tags updated
 */
export async function applyTagStats(
  db: admin.firestore.Firestore,
  kidId: string,
  tagDeltas: Record<string, TagDelta>,
  nowTs: admin.firestore.Timestamp,
  evidence?: { gameId: string; levelId: number }
): Promise<number> {
  const MAX_TAGS = 50;
  const batch = db.batch();
  let count = 0;

  const tags = Object.entries(tagDeltas);
  
  // Warn if tag count exceeds limit
  if (tags.length > MAX_TAGS) {
    console.warn(`[applyTagStats] Tag count ${tags.length} exceeds max ${MAX_TAGS}, capping to first ${MAX_TAGS} tags`);
  }

  for (const [rawTag, delta] of tags.slice(0, MAX_TAGS)) {
    // Skip if no attempts
    if (delta.attempts === 0) continue;

    // Sanitize tag for Firestore doc ID
    const safeTag = sanitizeTagForFirestore(rawTag);
    if (!safeTag) {
      console.warn(`[applyTagStats] Skipping invalid tag: ${rawTag}`);
      continue;
    }

    const docRef = db.doc(`kids/${kidId}/skillStats/${safeTag}`);

    // Build update data
    const updateData: any = {
      attempts: admin.firestore.FieldValue.increment(delta.attempts),
      correct: admin.firestore.FieldValue.increment(delta.correct),
      wrong: admin.firestore.FieldValue.increment(delta.wrong),
      lastSeenAt: nowTs,
      tagLabel: rawTag, // Store original tag for reference
    };

    // Track last wrong timestamp if there were wrong answers
    if (delta.wrong > 0) {
      updateData.lastWrongAt = nowTs;
    }

    // Add evidence if provided
    if (evidence) {
      updateData.lastEvidence = evidence;
    }

    batch.set(docRef, updateData, { merge: true });
    count++;
  }

  // Commit batch
  if (count > 0) {
    await batch.commit();
  }

  return count;
}
