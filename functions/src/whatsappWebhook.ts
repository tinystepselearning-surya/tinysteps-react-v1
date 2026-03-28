import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const VERIFY_TOKEN = 'tinysteps_whatsapp_verify_2026_prod_a9k3';
const EVENTS_COLLECTION = 'whatsappWebhookEvents';

const readQueryParam = (value: unknown): string => {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return typeof value === 'string' ? value : '';
};

export const whatsappWebhookV2 = onRequest({region: REGION}, async (request, response) => {
  const method = request.method.toUpperCase();

  if (method === 'GET') {
    const mode = readQueryParam(request.query['hub.mode']);
    const verifyToken = readQueryParam(request.query['hub.verify_token']);
    const challenge = readQueryParam(request.query['hub.challenge']);

    if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {
      logger.info('[whatsappWebhook] verification succeeded');
      response.status(200).send(challenge);
      return;
    }

    logger.warn('[whatsappWebhook] verification failed', {mode});
    response.sendStatus(403);
    return;
  }

  if (method === 'POST') {
    try {
      await admin.firestore().collection(EVENTS_COLLECTION).add({
        source: 'meta_whatsapp_cloud_api',
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        headers: {
          'user-agent': request.get('user-agent') || null,
          'content-type': request.get('content-type') || null,
        },
        body: request.body ?? null,
      });

      logger.info('[whatsappWebhook] event captured');
      response.status(200).send('EVENT_RECEIVED');
      return;
    } catch (error) {
      logger.error('[whatsappWebhook] failed to capture event', {error: String(error)});
      response.status(500).send('INTERNAL_ERROR');
      return;
    }
  }

  response.set('Allow', 'GET, POST');
  response.status(405).send('Method Not Allowed');
});
