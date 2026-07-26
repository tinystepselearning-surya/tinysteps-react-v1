import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  hasApnsConfiguration,
  isApnsInvalidTokenReason,
  sendApnsAlert,
} from '../lib/sendApnsAlert';

const ACTIVE_TOKEN_QUERY_CHUNK = 10;
const FCM_BATCH_SIZE = 500;
const TOKEN_DOC_BATCH_SIZE = 400;

type NotificationProvider = 'apns' | 'fcm';

type NotificationTokenDoc = {
  docId: string;
  token: string;
  provider: NotificationProvider;
};

export type PushDeliveryPayload = {
  title?: string;
  body?: string;
  badge?: number;
  threadId?: string;
  data: Record<string, string>;
};

export type PushDeliverySummary = {
  successCount: number;
  failureCount: number;
  tokenCount: number;
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const chunk = <T>(items: T[], size: number): T[][] => {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
};

export const fetchActiveTokens = async (
  db: admin.firestore.Firestore,
  userId: string,
): Promise<NotificationTokenDoc[]> => {
  const snapshots = await Promise.all(
    chunk([userId], ACTIVE_TOKEN_QUERY_CHUNK).map((ids) =>
      db.collection('notificationTokens')
        .where('userId', 'in', ids)
        .where('active', '==', true)
        .get()),
  );
  const seen = new Set<string>();
  const tokens: NotificationTokenDoc[] = [];
  snapshots.forEach((snapshot) => snapshot.docs.forEach((docSnapshot) => {
    if (seen.has(docSnapshot.id)) return;
    const data = docSnapshot.data() || {};
    const token = asString(data.token);
    if (!token) return;
    const platform = String(data.platform || '').trim().toLowerCase();
    const providerValue = String(data.provider || '').trim().toLowerCase();
    const provider: NotificationProvider =
      providerValue === 'fcm' || (providerValue !== 'apns' && platform !== 'ios')
        ? 'fcm'
        : 'apns';
    seen.add(docSnapshot.id);
    tokens.push({ docId: docSnapshot.id, token, provider });
  }));
  return tokens;
};

export const deactivateInvalidTokens = async (
  db: admin.firestore.Firestore,
  docIds: string[],
) => {
  for (const ids of chunk(Array.from(new Set(docIds)), TOKEN_DOC_BATCH_SIZE)) {
    const batch = db.batch();
    ids.forEach((docId) => {
      batch.set(db.collection('notificationTokens').doc(docId), {
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
        invalidatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
  }
};

export const deliverPushToUser = async (
  db: admin.firestore.Firestore,
  userId: string,
  payload: PushDeliveryPayload,
): Promise<PushDeliverySummary> => {
  const tokenDocs = await fetchActiveTokens(db, userId);
  const invalidTokenDocIds: string[] = [];
  let successCount = 0;
  let failureCount = 0;
  const visible = Boolean(payload.title || payload.body);
  const fcmDocs = tokenDocs.filter((item) => item.provider === 'fcm');
  const apnsDocs = tokenDocs.filter((item) => item.provider === 'apns');

  for (const docs of chunk(fcmDocs, FCM_BATCH_SIZE)) {
    const message: admin.messaging.MulticastMessage = {
      tokens: docs.map((item) => item.token),
      data: payload.data,
      apns: {
        payload: {
          aps: {
            ...(typeof payload.badge === 'number'
              ? { badge: Math.max(0, Math.floor(payload.badge)) }
              : {}),
            ...(visible ? { sound: 'default' } : {}),
          },
        },
      },
    };
    if (visible) {
      message.notification = {
        title: payload.title || 'Tiny Steps',
        body: payload.body || '',
      };
    }
    const response = await admin.messaging().sendEachForMulticast(message);
    response.responses.forEach((result, index) => {
      if (result.success) {
        successCount += 1;
        return;
      }
      failureCount += 1;
      const code = String(result.error?.code || '');
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokenDocIds.push(docs[index].docId);
      }
    });
  }

  if (apnsDocs.length > 0 && !hasApnsConfiguration()) {
    logger.warn('pushDelivery:apns_config_missing', {
      userId,
      tokenCount: apnsDocs.length,
    });
    failureCount += apnsDocs.length;
  } else {
    for (const tokenDoc of apnsDocs) {
      try {
        const result = await sendApnsAlert({
          deviceToken: tokenDoc.token,
          title: payload.title,
          body: payload.body,
          badge: payload.badge,
          threadId: payload.threadId,
          data: payload.data,
        });
        if (result.ok) {
          successCount += 1;
        } else {
          failureCount += 1;
          if (isApnsInvalidTokenReason(result.reason)) {
            invalidTokenDocIds.push(tokenDoc.docId);
          }
        }
      } catch (error) {
        failureCount += 1;
        logger.warn('pushDelivery:apns_send_exception', {
          userId,
          tokenDocId: tokenDoc.docId,
          reason: error instanceof Error ? error.name : 'unknown',
        });
      }
    }
  }

  await deactivateInvalidTokens(db, invalidTokenDocIds);
  logger.info('pushDelivery:complete', {
    userId,
    tokenCount: tokenDocs.length,
    successCount,
    failureCount,
    visible,
    hasBadge: typeof payload.badge === 'number',
  });
  return { successCount, failureCount, tokenCount: tokenDocs.length };
};
