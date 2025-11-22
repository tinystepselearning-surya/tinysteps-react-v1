// Bingo generation logic removed. Export a lightweight no-op callable.
const { onCall } = require('firebase-functions/v2/https');

exports.generateBingoCard = onCall(async (data, context) => {
  return {
    words: [],
    clues: [],
    card: [[],[],[],[],[]],
    difficulty: null,
    message: 'generateBingoCard has been removed',
  };
});
