import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const getGameContent = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (data: any, context: any) => {
    if (!context.auth || !context.auth.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { game, level, topic, difficulty } = data || {};

    if (!game) {
      throw new HttpsError('invalid-argument', 'Game type is required');
    }

    const db = admin.firestore();
    const gameRef = db.collection('gameData').doc(game);

    try {
      const doc = await gameRef.get();
      if (!doc.exists) {
        throw new HttpsError('not-found', `Game data for ${game} not found`);
      }

      const gameData = doc.data();
      if (!gameData) {
        throw new HttpsError('not-found', `Game data for ${game} is empty`);
      }

      // Return appropriate data based on game type and parameters
      switch (game) {
        case 'spellbee':
          if (level && gameData.phonicsPatterns && gameData.phonicsPatterns[level]) {
            return { data: gameData.phonicsPatterns[level], type: 'phonicsPatterns' };
          }
          return { data: gameData.phonicsPatterns || {}, type: 'phonicsPatterns' };

        case 'maze':
          const mazeDifficulty = difficulty || 'medium';
          if (gameData.mazes && gameData.mazes[mazeDifficulty]) {
            return { data: gameData.mazes[mazeDifficulty], type: 'maze' };
          }
          return { data: gameData.mazes || {}, type: 'maze' };

        case 'bingo':
          const bingoDifficulty = difficulty || 'medium';
          if (gameData.bingoCards && gameData.bingoCards[bingoDifficulty]) {
            return { data: gameData.bingoCards[bingoDifficulty], type: 'bingo' };
          }
          return { data: gameData.bingoCards || {}, type: 'bingo' };

        case 'grammar':
          if (topic && gameData.topics && gameData.topics[topic]) {
            return { data: gameData.topics[topic], type: 'grammar' };
          }
          return { data: gameData.topics || {}, type: 'grammar' };

        case 'speaking':
          if (level && gameData[level]) {
            const levelData = gameData[level];
            if (difficulty && levelData[difficulty]) {
              return { data: levelData[difficulty], type: 'speaking' };
            }
            return { data: levelData, type: 'speaking' };
          }
          return { data: gameData, type: 'speaking' };

        case 'reading':
          if (level && gameData.levels) {
            const readingLevel = gameData.levels.find((l: any) => l.level === level);
            if (readingLevel) {
              return { data: readingLevel, type: 'reading' };
            }
          }
          return { data: gameData.levels || [], type: 'reading' };

        default:
          throw new HttpsError('invalid-argument', `Unsupported game type: ${game}`);
      }
    } catch (error) {
      console.error('Error fetching game content:', error);
      throw new HttpsError('internal', 'Failed to fetch game content');
    }
  }
);