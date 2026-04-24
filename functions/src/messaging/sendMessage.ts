import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { containsPhoneNumber } from './moderation';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const MAX_MESSAGE_LENGTH = 2000;
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

    // TODO: add FCM fanout from notificationTokens in a later patch.
    await batch.commit();

    return { messageId: messageRef.id };
  },
);
