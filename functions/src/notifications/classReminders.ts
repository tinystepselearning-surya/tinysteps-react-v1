import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import {
  hasApnsConfiguration,
  isApnsInvalidTokenReason,
  sendApnsAlert,
} from '../lib/sendApnsAlert';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const ACTIVE_TOKEN_QUERY_CHUNK = 10;
const FCM_BATCH_SIZE = 500;
const TOKEN_DOC_BATCH_SIZE = 400;
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 180;
const TOKEN_MIN_LENGTH = 20;

type NotificationPlatform = 'ios' | 'android' | 'web';
type NotificationProvider = 'apns' | 'fcm';

type AuthLike = {
  uid: string;
  token?: Record<string, unknown>;
};

interface RegisterNotificationTokenInput {
  token?: unknown;
  platform?: unknown;
  provider?: unknown;
  deviceId?: unknown;
  appVersion?: unknown;
}

interface SendTestPushNotificationInput {
  userId?: unknown;
  title?: unknown;
  body?: unknown;
}

interface NotificationTokenDoc {
  docId: string;
  token: string;
  userId: string;
  platform: NotificationPlatform;
  provider: NotificationProvider;
}

interface PushSendSummary {
  successCount: number;
  failureCount: number;
  invalidTokenDocIds: string[];
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function normalizeRole(value: unknown): string | null {
  const role = String(value || '').trim().toLowerCase();
  if (!role) return null;

  if (role === 'learning-partner' || role === 'learningpartner') {
    return 'learningPartner';
  }

  if (role === 'parent' || role === 'teacher' || role === 'admin' || role === 'kid') {
    return role;
  }

  return role;
}

function normalizePlatform(value: unknown): NotificationPlatform {
  const platform = String(value || '').trim().toLowerCase();
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }
  throw new HttpsError('invalid-argument', 'platform must be ios, android, or web');
}

function normalizeProvider(
  value: unknown,
  platform: NotificationPlatform,
): NotificationProvider {
  const provider = String(value || '').trim().toLowerCase();
  if (provider === 'apns' || provider === 'fcm') {
    return provider;
  }
  return platform === 'ios' ? 'apns' : 'fcm';
}

function normalizeLimitedString(value: unknown, maxLength: number): string | null {
  const normalized = asOptionalString(value);
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function buildTokenDocId(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function resolveUserRole(
  db: admin.firestore.Firestore,
  auth: AuthLike,
): Promise<string | null> {
  const roleFromToken = normalizeRole(auth.token?.role);
  if (roleFromToken) return roleFromToken;

  const userSnap = await db.collection('users').doc(auth.uid).get();
  if (!userSnap.exists) return null;

  const userData = userSnap.data() || {};
  return normalizeRole((userData as Record<string, unknown>).role);
}

async function fetchActiveTokensForUsers(
  db: admin.firestore.Firestore,
  userIds: string[],
): Promise<NotificationTokenDoc[]> {
  if (userIds.length === 0) return [];

  const chunks = chunk(userIds, ACTIVE_TOKEN_QUERY_CHUNK);
  const docs: NotificationTokenDoc[] = [];
  const seenDocIds = new Set<string>();

  for (const userChunk of chunks) {
    const snap = await db
      .collection('notificationTokens')
      .where('userId', 'in', userChunk)
      .where('active', '==', true)
      .get();

    snap.docs.forEach((docSnap) => {
      if (seenDocIds.has(docSnap.id)) return;
      const data = asRecord(docSnap.data());
      const token = asOptionalString(data.token);
      const userId = asOptionalString(data.userId);
      if (!token || !userId) return;
      const platform = normalizePlatform(data.platform);
      const provider = normalizeProvider(data.provider, platform);
      seenDocIds.add(docSnap.id);
      docs.push({
        docId: docSnap.id,
        token,
        userId,
        platform,
        provider,
      });
    });
  }

  return docs;
}

async function sendPushToTokenDocs(
  tokenDocs: NotificationTokenDoc[],
  title: string,
  body: string,
  dataPayload: Record<string, string>,
): Promise<PushSendSummary> {
  if (tokenDocs.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokenDocIds: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const invalidTokenDocIds = new Set<string>();
  const fcmTokenDocs = tokenDocs.filter((item) => item.provider === 'fcm');
  const apnsTokenDocs = tokenDocs.filter((item) => item.provider === 'apns');

  for (const tokenChunk of chunk(fcmTokenDocs, FCM_BATCH_SIZE)) {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokenChunk.map((item) => item.token),
      notification: {
        title,
        body,
      },
      data: dataPayload,
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    response.responses.forEach((sendResponse, index) => {
      if (sendResponse.success) {
        successCount += 1;
        return;
      }

      failureCount += 1;
      const code = String(sendResponse.error?.code || '').trim();
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokenDocIds.add(tokenChunk[index].docId);
      }
    });
  }

  if (apnsTokenDocs.length > 0 && !hasApnsConfiguration()) {
    logger.warn('notifications:apns_config_missing', {
      apnsTokenCount: apnsTokenDocs.length,
    });
    failureCount += apnsTokenDocs.length;
  }

  for (const tokenDoc of apnsTokenDocs) {
    if (!hasApnsConfiguration()) break;
    const threadId = dataPayload.threadId || dataPayload.sessionId || 'tinysteps';

    try {
      const outcome = await sendApnsAlert({
        deviceToken: tokenDoc.token,
        title,
        body,
        threadId,
        data: dataPayload,
      });

      if (outcome.ok) {
        successCount += 1;
        continue;
      }

      failureCount += 1;
      if (isApnsInvalidTokenReason(outcome.reason)) {
        invalidTokenDocIds.add(tokenDoc.docId);
      }

      logger.warn('notifications:apns_send_failed', {
        tokenDocId: tokenDoc.docId,
        status: outcome.status,
        reason: outcome.reason || 'unknown',
      });
    } catch (error) {
      failureCount += 1;
      logger.warn('notifications:apns_send_exception', {
        tokenDocId: tokenDoc.docId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    successCount,
    failureCount,
    invalidTokenDocIds: Array.from(invalidTokenDocIds),
  };
}

async function deactivateInvalidTokens(
  db: admin.firestore.Firestore,
  tokenDocIds: string[],
): Promise<void> {
  if (tokenDocIds.length === 0) return;

  const now = admin.firestore.FieldValue.serverTimestamp();
  for (const idChunk of chunk(tokenDocIds, TOKEN_DOC_BATCH_SIZE)) {
    const batch = db.batch();
    idChunk.forEach((docId) => {
      const ref = db.collection('notificationTokens').doc(docId);
      batch.set(
        ref,
        {
          active: false,
          updatedAt: now,
          invalidatedAt: now,
        },
        { merge: true },
      );
    });
    await batch.commit();
  }
}

export const registerNotificationToken = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const auth = request.auth as AuthLike;
    const input = asRecord(request.data) as RegisterNotificationTokenInput;

    const token = asOptionalString(input.token);
    if (!token || token.length < TOKEN_MIN_LENGTH) {
      throw new HttpsError('invalid-argument', 'A valid push token is required');
    }

    const platform = normalizePlatform(input.platform);
    const provider = normalizeProvider(input.provider, platform);
    const deviceId = normalizeLimitedString(input.deviceId, 120);
    const appVersion = normalizeLimitedString(input.appVersion, 64);

    logger.info('registerNotificationToken:request', {
      uid: auth.uid,
      platform,
      provider,
      tokenLength: token.length,
      hasDeviceId: Boolean(deviceId),
      hasAppVersion: Boolean(appVersion),
    });

    const db = admin.firestore();
    const role = await resolveUserRole(db, auth);
    const tokenDocId = buildTokenDocId(token);
    const tokenRef = db.collection('notificationTokens').doc(tokenDocId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
      const existingSnap = await tx.get(tokenRef);
      const existing = asRecord(existingSnap.data());
      const createdAt = existing.createdAt || now;

      tx.set(
        tokenRef,
        {
          userId: auth.uid,
          role: role || null,
          token,
          platform,
          provider,
          active: true,
          deviceId: deviceId || null,
          appVersion: appVersion || null,
          createdAt,
          updatedAt: now,
          lastSeenAt: now,
        },
        { merge: true },
      );
    });

    logger.info('registerNotificationToken:stored', {
      uid: auth.uid,
      platform,
      provider,
      tokenDocId,
      tokenDocPath: `notificationTokens/${tokenDocId}`,
    });

    return { ok: true };
  },
);

export const sendTestPushNotification = onCall(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const input = asRecord(request.data) as SendTestPushNotificationInput;
    const targetUserId = asOptionalString(input.userId) || request.auth!.uid;

    const title =
      normalizeLimitedString(input.title, MAX_TITLE_LENGTH) ||
      'Tiny Steps push test';
    const body =
      normalizeLimitedString(input.body, MAX_BODY_LENGTH) ||
      'Push notifications are enabled for Tiny Steps.';

    const db = admin.firestore();
    const tokenDocs = await fetchActiveTokensForUsers(db, [targetUserId]);

    if (tokenDocs.length === 0) {
      return {
        ok: true,
        sent: 0,
        failed: 0,
        targetUserId,
        message: 'No active notification tokens found for this user.',
      };
    }

    const summary = await sendPushToTokenDocs(tokenDocs, title, body, {
      type: 'test_push',
      targetPath: '/messages',
    });

    if (summary.invalidTokenDocIds.length > 0) {
      await deactivateInvalidTokens(db, summary.invalidTokenDocIds);
    }

    return {
      ok: true,
      sent: summary.successCount,
      failed: summary.failureCount,
      targetUserId,
    };
  },
);

// Manual reminder workflow is active. Scheduled reminder sending is disabled to avoid repeated Firestore reads.
