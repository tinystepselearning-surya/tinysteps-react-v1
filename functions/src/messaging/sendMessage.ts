import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { containsPhoneNumber } from './moderation';
import {
  clearThreadUnreadFromAggregate,
  incrementUnreadCount,
  sumUnreadForUser,
} from './unreadState';
import { hasApnsConfiguration } from '../lib/sendApnsAlert';
import { deliverPushToUser } from '../notifications/pushDelivery';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const MAX_MESSAGE_LENGTH = 2000;
const MAX_PUSH_BODY_LENGTH = 80;
const PHONE_BLOCK_MESSAGE =
  'Phone numbers cannot be shared in Tiny Steps messages. Please continue inside the app.';

type AuthLike = {
  uid: string;
  token?: Record<string, unknown>;
};

export const requireAuthenticatedUserId = (
  auth: { uid?: string } | null | undefined,
): string => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  return auth.uid;
};

interface SendMessageInput {
  threadId?: unknown;
  text?: unknown;
  clientMessageId?: unknown;
}

interface MarkMessageThreadReadInput {
  threadId?: unknown;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  value.forEach((item) => {
    const normalized = asOptionalString(item);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  });
  return out;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function toEmailPrefix(value: unknown): string | null {
  const email = asOptionalString(value);
  if (!email) return null;
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return null;
  return email.slice(0, atIndex).trim() || null;
}

function isTokenAdmin(token: Record<string, unknown> | undefined): boolean {
  if (!token) return false;
  if (token.admin === true) return true;
  return String(token.role || '').trim().toLowerCase() === 'admin';
}

async function isAdminUser(
  db: admin.firestore.Firestore,
  auth: AuthLike,
): Promise<boolean> {
  if (isTokenAdmin(auth.token)) return true;
  const userSnap = await db.collection('users').doc(auth.uid).get();
  if (!userSnap.exists) return false;
  const user = userSnap.data() || {};
  if (user.superUser === true) return true;
  return String(user.role || '').trim().toLowerCase() === 'admin';
}

function buildLastMessagePreview(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 140) return normalized;
  return `${normalized.slice(0, 137)}...`;
}

function buildPushMessagePreview(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_PUSH_BODY_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_PUSH_BODY_LENGTH - 3)}...`;
}

export const buildMessageNotificationId = (
  messageId: string,
  recipientId: string,
): string => createHash('sha256')
  .update(`message:${messageId}:${recipientId}`)
  .digest('hex');

function resolveSenderNameFromData(data: Record<string, unknown>): string | null {
  const fromDisplayName = asOptionalString(data.displayName);
  if (fromDisplayName) return fromDisplayName;

  const fromFullName = asOptionalString(data.fullName);
  if (fromFullName) return fromFullName;

  const fromName = asOptionalString(data.name);
  if (fromName) return fromName;

  const firstName = asOptionalString(data.firstName);
  const lastName = asOptionalString(data.lastName);
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;

  return toEmailPrefix(data.email);
}

async function resolveSenderName(
  db: admin.firestore.Firestore,
  threadData: Record<string, unknown>,
  senderId: string,
  auth: AuthLike,
): Promise<string> {
  const participantNames = asRecord(threadData.participantNames);
  const fromThread = asOptionalString(participantNames[senderId]);
  if (fromThread) return fromThread;

  const fromToken = resolveSenderNameFromData(asRecord(auth.token));
  if (fromToken) return fromToken;

  const userSnap = await db.collection('users').doc(senderId).get();
  if (userSnap.exists) {
    const fromUser = resolveSenderNameFromData(asRecord(userSnap.data()));
    if (fromUser) return fromUser;
  }

  return 'Team Member';
}

export const sendMessage = onCall(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    requireAuthenticatedUserId(request.auth);

    const auth = request.auth as AuthLike;
    const input = (request.data || {}) as SendMessageInput;
    const threadId = asOptionalString(input.threadId);
    const textRaw = asOptionalString(input.text);
    const clientMessageId = asOptionalString(input.clientMessageId);

    if (!threadId) {
      throw new HttpsError('invalid-argument', 'threadId is required');
    }
    if (!textRaw) {
      throw new HttpsError('invalid-argument', 'Message text cannot be empty');
    }
    if (textRaw.length > MAX_MESSAGE_LENGTH) {
      throw new HttpsError(
        'invalid-argument',
        `Message is too long. Max ${MAX_MESSAGE_LENGTH} characters.`,
      );
    }
    if (containsPhoneNumber(textRaw)) {
      throw new HttpsError('failed-precondition', PHONE_BLOCK_MESSAGE);
    }

    const db = admin.firestore();
    const threadRef = db.collection('messageThreads').doc(threadId);
    const senderId = auth.uid;
    const adminAllowed = await isAdminUser(db, auth);
    const messageRef = threadRef.collection('messages').doc();
    const now = FieldValue.serverTimestamp();
    const preview = buildLastMessagePreview(textRaw);
    let threadData: Record<string, unknown> = {};
    let recipientIds: string[] = [];
    const recipientUnreadMessages: Record<string, number> = {};

    await db.runTransaction(async (tx) => {
      const threadSnap = await tx.get(threadRef);
      if (!threadSnap.exists) {
        throw new HttpsError('not-found', 'Message thread not found');
      }

      threadData = (threadSnap.data() || {}) as Record<string, unknown>;
      const participantIds = asStringList(threadData.participantIds);
      if (!adminAllowed && !participantIds.includes(senderId)) {
        throw new HttpsError(
          'permission-denied',
          'You are not allowed to send messages in this thread.',
        );
      }

      recipientIds = participantIds.filter((uid) => uid !== senderId);
      const stateRefs = recipientIds.map((userId) =>
        db.collection('userNotificationState').doc(userId));
      const stateSnapshots = await Promise.all(stateRefs.map((ref) => tx.get(ref)));

      const threadUpdate: Record<string, unknown> = {
        lastMessageAt: now,
        lastMessageBy: senderId,
        lastMessagePreview: preview,
        updatedAt: now,
        [`unreadCounts.${senderId}`]: 0,
      };

      recipientIds.forEach((userId, index) => {
        const unreadCounts = asRecord(threadData.unreadCounts);
        const currentThreadUnread = Number(unreadCounts[userId] || 0);
        threadUpdate[`unreadCounts.${userId}`] = incrementUnreadCount(currentThreadUnread);

        const aggregate = asRecord(stateSnapshots[index].data());
        const currentAggregate = Number(aggregate.unreadMessages || 0);
        const nextAggregate = incrementUnreadCount(currentAggregate);
        recipientUnreadMessages[userId] = nextAggregate;
        tx.set(stateRefs[index], {
          unreadMessages: nextAggregate,
          updatedAt: now,
          lastMessageAt: now,
        }, { merge: true });
      });

      tx.set(messageRef, {
        threadId,
        senderId,
        text: textRaw,
        clientMessageId: clientMessageId || null,
        createdAt: now,
      });
      tx.update(threadRef, threadUpdate);
      recipientIds.forEach((userId) => {
        const notificationRef = db.collection('notifications')
          .doc(buildMessageNotificationId(messageRef.id, userId));
        tx.set(notificationRef, {
          userId,
          type: 'message',
          threadId,
          messageId: messageRef.id,
          title: 'New message',
          body: preview,
          read: false,
          createdAt: now,
          updatedAt: now,
        });
      });
    });
    const recipientCount = recipientIds.length;
    let tokenCount = 0;
    let successCount = 0;
    let failureCount = 0;

    try {
      const senderName = await resolveSenderName(db, threadData, senderId, auth);
      const title = `New message from ${senderName}`;
      const body = buildPushMessagePreview(textRaw);
      logger.info('sendMessage:fanout_plan', {
        threadId,
        messageId: messageRef.id,
        senderId,
        recipientIds,
        recipientBadgeCounts: recipientUnreadMessages,
        apnsConfigured: hasApnsConfiguration(),
      });

      for (const recipientId of recipientIds) {
        const summary = await deliverPushToUser(db, recipientId, {
          title,
          body,
          badge: recipientUnreadMessages[recipientId],
          threadId,
          data: {
            type: 'message',
            threadId,
            messageId: messageRef.id,
            senderId,
            route: '/messages',
          },
        });
        tokenCount += summary.tokenCount;
        successCount += summary.successCount;
        failureCount += summary.failureCount;
      }
    } catch (error) {
      logger.warn('sendMessage:push_fanout_failed', {
        threadId,
        messageId: messageRef.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info('sendMessage:push_fanout', {
      threadId,
      messageId: messageRef.id,
      recipients: recipientCount,
      tokens: tokenCount,
      successCount,
      failureCount,
    });

    return { messageId: messageRef.id };
  },
);

export const markMessageThreadRead = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    const userId = requireAuthenticatedUserId(request.auth);

    const input = (request.data || {}) as MarkMessageThreadReadInput;
    const threadId = asOptionalString(input.threadId);
    if (!threadId) {
      throw new HttpsError('invalid-argument', 'threadId is required');
    }

    const db = admin.firestore();
    const threadRef = db.collection('messageThreads').doc(threadId);
    const stateRef = db.collection('userNotificationState').doc(userId);
    const result = await db.runTransaction(async (tx) => {
      const [threadSnap, stateSnap] = await Promise.all([
        tx.get(threadRef),
        tx.get(stateRef),
      ]);
      if (!threadSnap.exists) {
        throw new HttpsError('not-found', 'Message thread not found');
      }

      const threadData = (threadSnap.data() || {}) as Record<string, unknown>;
      if (!asStringList(threadData.participantIds).includes(userId)) {
        throw new HttpsError(
          'permission-denied',
          'You are not allowed to update this thread.',
        );
      }

      const { unreadCleared, unreadMessages } = clearThreadUnreadFromAggregate(
        asRecord(stateSnap.data()).unreadMessages,
        asRecord(threadData.unreadCounts)[userId],
      );
      const timestamp = FieldValue.serverTimestamp();

      tx.update(threadRef, {
        [`unreadCounts.${userId}`]: 0,
        [`lastReadAtByUser.${userId}`]: timestamp,
        updatedAt: timestamp,
      });
      tx.set(stateRef, {
        unreadMessages,
        updatedAt: timestamp,
        lastMessageAt: asRecord(stateSnap.data()).lastMessageAt || null,
      }, { merge: true });

      return {
        ok: true as const,
        updated: unreadCleared > 0,
        unreadCleared,
        unreadMessages,
      };
    });

    try {
      await deliverPushToUser(db, userId, {
        badge: result.unreadMessages,
        data: {
          type: 'badge_sync',
          route: '/messages',
        },
      });
    } catch (error) {
      logger.warn('markMessageThreadRead:badge_sync_failed', {
        userId,
        errorName: error instanceof Error ? error.name : 'unknown',
      });
    }

    return result;
  },
);

export const reconcileMyUnreadMessageCount = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    const userId = requireAuthenticatedUserId(request.auth);
    const db = admin.firestore();
    const snapshot = await db.collection('messageThreads')
      .where('participantIds', 'array-contains', userId)
      .get();
    let lastMessageAt: Timestamp | null = null;
    const unreadMessages = sumUnreadForUser(
      snapshot.docs.map((documentSnapshot) => documentSnapshot.data()),
      userId,
    );
    snapshot.docs.forEach((documentSnapshot) => {
      const threadData = documentSnapshot.data();
      const candidate = threadData.lastMessageAt;
      if (
        candidate instanceof Timestamp &&
        (!lastMessageAt || candidate.toMillis() > lastMessageAt.toMillis())
      ) {
        lastMessageAt = candidate;
      }
    });
    await db.collection('userNotificationState').doc(userId).set({
      unreadMessages,
      updatedAt: FieldValue.serverTimestamp(),
      lastMessageAt,
    }, { merge: true });
    try {
      await deliverPushToUser(db, userId, {
        badge: unreadMessages,
        data: {
          type: 'badge_sync',
          route: '/messages',
        },
      });
    } catch (error) {
      logger.warn('reconcileMyUnreadMessageCount:badge_sync_failed', {
        userId,
        errorName: error instanceof Error ? error.name : 'unknown',
      });
    }
    return { ok: true, unreadMessages };
  },
);
