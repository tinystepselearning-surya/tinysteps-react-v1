import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

export const health = onRequest(
  {
    region: 'asia-south1',
    timeoutSeconds: 10,
    memory: '128MiB',
  },
  (req, res) => {
    if (req.method !== 'GET') {
      // Optional: keep logs clean and restrict to GET
      logger.warn('health endpoint called with non-GET method', {
        method: req.method,
        ip: req.ip,
      });
      res.status(405).send('Method Not Allowed');
      return;
    }

    const version =
      process.env.VITE_APP_VERSION ||
      process.env.GIT_COMMIT_HASH || // optional fallback if you set it in deploy
      'unknown';

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
    });
  }
);
