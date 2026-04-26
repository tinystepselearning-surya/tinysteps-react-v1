import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { containsPhoneNumber } from './moderation';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const MAX_MESSAGE_LENGTH = 2000;
const MAX_PUSH_BODY_LENGTH = 80;
const ACTIVE_TOKEN_QUERY_CHUNK = 10;
const FCM_BATCH_SIZE = 500;
const TOKEN_DOC_BATCH_SIZE = 400;
const PHONE_BLOCK_MESSAGE =
  'Phone numbers cannot be shared in Tiny Steps messages. Please continue inside the app.';

type AuthLike = {
  uid: string;
  token?: Record<string, unknown>;
};

interface SendMessageInput {
  threadId?: unknown;
  text?: unknown;
  clientMessageId?: unknown;
}

interface MarkMessageThreadReadInput {
  threadId?: unknown;
}

interface NotificationTokenDoc {
  docId: string;
  token: string;
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

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
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
      if (!token) return;
      seenDocIds.add(docSnap.id);
      docs.push({
        docId: docSnap.id,
        token,
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

  for (const tokenChunk of chunk(tokenDocs, FCM_BATCH_SIZE)) {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokenChunk.map((item) => item.token),
      notification: { title, body },
      data: dataPayload,
      android: {
        priority: 'high',
        notification: {
          channelId: 'messages',
          sound: 'default',
          visibility: 'public',
        },
      },
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

export const sendMessage = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

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
    const threadSnap = await threadRef.get();
    if (!threadSnap.exists) {
      throw new HttpsError('not-found', 'Message thread not found');
    }

    const threadData = (threadSnap.data() || {}) as Record<string, unknown>;
    const participantIds = asStringList(threadData.participantIds);
    const senderId = auth.uid;

    const adminAllowed = await isAdminUser(db, auth);
    if (!adminAllowed && !participantIds.includes(senderId)) {
      throw new HttpsError(
        'permission-denied',
        'You are not allowed to send messages in this thread.',
      );
    }

    const recipientIds = participantIds.filter((uid) => uid !== senderId);
    const unreadCounts =
      typeof threadData.unreadCounts === 'object' && threadData.unreadCounts !== null
        ? { ...(threadData.unreadCounts as Record<string, unknown>) }
        : {};

    recipientIds.forEach((uid) => {
      const current = Number(unreadCounts[uid] || 0);
      unreadCounts[uid] = Number.isFinite(current) ? current + 1 : 1;
    });
    unreadCounts[senderId] = 0;

    const messageRef = threadRef.collection('messages').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const preview = buildLastMessagePreview(textRaw);

    const batch = db.batch();
    batch.set(messageRef, {
      threadId,
      senderId,
      text: textRaw,
      clientMessageId: clientMessageId || null,
      createdAt: now,
    });

    batch.set(
      threadRef,
      {
        lastMessageAt: now,
        lastMessageBy: senderId,
        lastMessagePreview: preview,
        unreadCounts,
        updatedAt: now,
      },
      { merge: true },
    );

    recipientIds.forEach((userId) => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
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

    await batch.commit();
    const recipientCount = recipientIds.length;
    let tokenCount = 0;
    let successCount = 0;
    let failureCount = 0;

    try {
      const senderName = await resolveSenderName(db, threadData, senderId, auth);
      const title = `New message from ${senderName}`;
      const body = buildPushMessagePreview(textRaw);
      const tokenDocs = await fetchActiveTokensForUsers(db, recipientIds);
      tokenCount = tokenDocs.length;

      if (tokenDocs.length > 0) {
        const summary = await sendPushToTokenDocs(tokenDocs, title, body, {
          type: 'message',
          threadId,
          messageId: messageRef.id,
          senderId,
          route: '/messages',
        });

        successCount = summary.successCount;
        failureCount = summary.failureCount;

        if (summary.invalidTokenDocIds.length > 0) {
          await deactivateInvalidTokens(db, summary.invalidTokenDocIds);
        }
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
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const input = (request.data || {}) as MarkMessageThreadReadInput;
    const threadId = asOptionalString(input.threadId);
    if (!threadId) {
      throw new HttpsError('invalid-argument', 'threadId is required');
    }

    const db = admin.firestore();
    const threadRef = db.collection('messageThreads').doc(threadId);
    const threadSnap = await threadRef.get();
    if (!threadSnap.exists) {
      throw new HttpsError('not-found', 'Message thread not found');
    }

    const threadData = (threadSnap.data() || {}) as Record<string, unknown>;
    const participantIds = asStringList(threadData.participantIds);
    const userId = request.auth.uid;
    if (!participantIds.includes(userId)) {
      throw new HttpsError(
        'permission-denied',
        'You are not allowed to update this thread.',
      );
    }

    const unreadCounts = asRecord(threadData.unreadCounts);
    const unreadForUser = Number(unreadCounts[userId] || 0);
    const shouldClearUnread = Number.isFinite(unreadForUser) && unreadForUser > 0;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const updatePayload: Record<string, unknown> = {
      [`lastReadAtByUser.${userId}`]: now,
      updatedAt: now,
    };
    if (shouldClearUnread) {
      updatePayload[`unreadCounts.${userId}`] = 0;
    }

    await threadRef.update(updatePayload);

    return { ok: true, updated: true, unreadCleared: shouldClearUnread };
  },
);
