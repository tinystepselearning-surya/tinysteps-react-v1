// Lightweight stub for generateSpellingWords
// The original implementation used AI calls, large in-repo datasets and persisted
// results to Firestore. That logic has been removed per repository cleanup.
// This file preserves the exported callables (HTTP + callable) but returns
// a harmless, empty payload so clients that import these functions do not fail.

const { onCall, onRequest } = require('firebase-functions/v2/https');
const cors = require('cors')({ origin: true });

function noopPayload() {
  return {
    words: [],
    difficulty: null,
    estimatedDuration: 0,
    message: 'generateSpellingWords functionality has been removed from this deployment',
  };
}

exports.generateSpellingWords = onCall(
  {
    region: 'us-central1',
    memory: '128MiB',
    timeoutSeconds: 30,
  },
  async (data, context) => {
    return noopPayload();
  }
);

exports.generateSpellingWordsHttp = onRequest(
  {
    region: 'us-central1',
    memory: '128MiB',
    timeoutSeconds: 30,
  },
  (req, res) =>
    cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }
      res.status(200).json(noopPayload());
    })
);
