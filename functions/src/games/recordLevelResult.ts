import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { LevelResultInput } from '../types/levelResult';

const db = getFirestore();

/**
 * recordLevelResult - Callable function to record game level completion
 * 
 * Writes raw session event to gameSessions/{eventId}.
 * Idempotent: if eventId exists, returns success without writing.
 * 
 * NO rollup logic yet - that will be added later.
 */
export const recordLevelResult = onCall(async (request) => {
  // Validate authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to record level results');
  }

  const data = request.data as Partial<LevelResultInput>;

  // Validate required fields
  if (data.schemaVersion !== 1) {
    throw new HttpsError('invalid-argument', 'schemaVersion must be 1');
  }

  const requiredFields: (keyof LevelResultInput)[] = [
    'eventId',
    'kidId',
    'gameId',
    'progressDocId',
    'levelId',
    'accuracy',
    'attempts',
    'correct',
    'wrong',
    'timeSpentSec',
    'pointsEarned',
    'skillResults',
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new HttpsError('invalid-argument', `Missing required field: ${field}`);
    }
  }

  const {
    eventId,
    kidId,
    gameId,
    progressDocId,
    levelId,
    accuracy,
    score,
    attempts,
    correct,
    wrong,
    timeSpentSec,
    pointsEarned,
    skillResults,
  } = data as LevelResultInput;

  // Validate skillResults array
  if (!Array.isArray(skillResults)) {
    throw new HttpsError('invalid-argument', 'skillResults must be an array');
  }

  // Check if session already exists (idempotent)
  const sessionRef = db.collection('gameSessions').doc(eventId);
  const existingSession = await sessionRef.get();

  if (existingSession.exists) {
    // Already recorded, return success
    return {
      success: true,
      message: 'Session already recorded',
      eventId,
    };
  }

  // Write raw session event
  await sessionRef.set({
    schemaVersion: 1,
    eventId,
    kidId,
    gameId,
    progressDocId,
    levelId,
    accuracy,
    score: score ?? null,
    attempts,
    correct,
    wrong,
    timeSpentSec,
    pointsEarned,
    skillResults,
    completedAt: FieldValue.serverTimestamp(),
    recordedBy: request.auth.uid,
  });

  return {
    success: true,
    message: 'Level result recorded',
    eventId,
  };
});
