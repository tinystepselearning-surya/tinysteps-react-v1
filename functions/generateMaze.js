// Phonics maze generation removed. Provide a safe no-op callable for backward compatibility.
const { onCall } = require('firebase-functions/v2/https');

exports.generateMaze = onCall(async (data, context) => {
  return {
    rows: 0,
    cols: 0,
    difficulty: null,
    junctions: [],
    correctPath: [],
    message: 'generateMaze has been removed',
  };
});
