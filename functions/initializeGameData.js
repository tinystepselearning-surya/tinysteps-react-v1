// One-time initializer to seed gameData/* documents in Firestore.
// Run via: firebase functions:shell and call initializeGameData() OR deploy as callable.
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (_) {
  /* already initialized */
}

const db = admin.firestore();

const gameDataToInitialize = {
  spellbee: require('./data/spellbeeData.json'),
  maze: require('./data/mazeData.json'),
  bingo: require('./data/bingoData.json'),
  grammar: require('./data/grammarData.json'),
  speaking: require('./data/speakingData.json'),
  reading: require('./data/readingData.json'),
};

async function initializeGameData() {
  try {
    for (const [game, data] of Object.entries(gameDataToInitialize)) {
      await db.collection('gameData').doc(game).set(data);
      console.log(`✅ Initialized ${game} data`);
    }
    console.log('✅ All game data initialized!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing game data:', error);
    throw error;
  }
}

module.exports = { initializeGameData };
