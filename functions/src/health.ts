import * as functions from 'firebase-functions';

export const health = functions.https.onRequest((req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION || 'unknown'
  });
});
