// @vitest-environment node

import * as admin from 'firebase-admin';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  adminDb,
  callFunction,
  clearEmulatorState,
  disposeHarness,
  expectCallableErrorCode,
  initializeAdminClient,
  signInExistingFixtureUser,
  signInFixtureUser,
  signOutFixtureUser,
} from './enrollmentIntegrityHarness';

const senderId = 'notifications-sender';
const recipientOneId = 'notifications-recipient-one';
const recipientTwoId = 'notifications-recipient-two';
const outsiderId = 'notifications-outsider';
const threadId = 'notifications-thread';

const threadUnread = async (userId: string): Promise<number> => {
  const snapshot = await adminDb.collection('messageThreads').doc(threadId).get();
  return Number(snapshot.data()?.unreadCounts?.[userId] || 0);
};

const aggregateUnread = async (userId: string): Promise<number> => {
  const snapshot = await adminDb.collection('userNotificationState').doc(userId).get();
  return Number(snapshot.data()?.unreadMessages || 0);
};

beforeAll(async () => {
  await clearEmulatorState();
  await initializeAdminClient();
  await signInFixtureUser({ uid: senderId, role: 'teacher' });
  await signInFixtureUser({ uid: recipientOneId, role: 'parent' });
  await signInFixtureUser({ uid: recipientTwoId, role: 'learningPartner' });
  await signInFixtureUser({ uid: outsiderId, role: 'parent' });
  await adminDb.collection('messageThreads').doc(threadId).set({
    participantIds: [senderId, recipientOneId, recipientTwoId],
    participantNames: {
      [senderId]: 'Teacher Fixture',
      [recipientOneId]: 'Parent Fixture',
      [recipientTwoId]: 'Learning Partner Fixture',
    },
    unreadCounts: {
      [senderId]: 9,
      [recipientOneId]: 0,
      [recipientTwoId]: 0,
    },
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

afterAll(async () => {
  await clearEmulatorState();
  await disposeHarness();
});

describe('notification unread transactions through callable emulators', () => {
  it('serializes concurrent sends, exact mark-read, and complete reconciliation', async () => {
    await signInExistingFixtureUser(senderId);
    await Promise.all([
      callFunction('sendMessage', {
        threadId,
        text: 'First concurrent update',
        clientMessageId: 'emulator-message-1',
      }),
      callFunction('sendMessage', {
        threadId,
        text: 'Second concurrent update',
        clientMessageId: 'emulator-message-2',
      }),
    ]);

    expect(await threadUnread(senderId)).toBe(0);
    expect(await threadUnread(recipientOneId)).toBe(2);
    expect(await threadUnread(recipientTwoId)).toBe(2);
    expect(await aggregateUnread(recipientOneId)).toBe(2);
    expect(await aggregateUnread(recipientTwoId)).toBe(2);
    const notificationsAfterRetrySafeSends = await adminDb.collection('notifications').get();
    expect(notificationsAfterRetrySafeSends.size).toBe(4);

    await signInExistingFixtureUser(recipientOneId);
    await Promise.all([
      callFunction('markMessageThreadRead', { threadId }),
      callFunction('markMessageThreadRead', { threadId }),
    ]);
    expect(await threadUnread(recipientOneId)).toBe(0);
    expect(await aggregateUnread(recipientOneId)).toBe(0);
    expect(await threadUnread(recipientTwoId)).toBe(2);
    expect(await aggregateUnread(recipientTwoId)).toBe(2);

    await signInExistingFixtureUser(senderId);
    await callFunction('sendMessage', {
      threadId,
      text: 'Third update',
      clientMessageId: 'emulator-message-3',
    });
    expect(await threadUnread(recipientOneId)).toBe(1);
    expect(await threadUnread(recipientTwoId)).toBe(3);
    expect(await aggregateUnread(recipientOneId)).toBe(1);
    expect(await aggregateUnread(recipientTwoId)).toBe(3);

    const legacyBatch = adminDb.batch();
    for (let index = 0; index < 105; index += 1) {
      legacyBatch.set(adminDb.collection('messageThreads').doc(`legacy-thread-${index}`), {
        participantIds: [recipientOneId, `legacy-peer-${index}`],
        unreadCounts: {
          [recipientOneId]: 1,
          [recipientTwoId]: 500,
        },
        lastMessageAt: admin.firestore.Timestamp.fromMillis(1_000 + index),
      });
    }
    await legacyBatch.commit();

    await signInExistingFixtureUser(recipientOneId);
    const reconciled = await callFunction<Record<string, never>, {
      ok: boolean;
      unreadMessages: number;
    }>('reconcileMyUnreadMessageCount', {});
    expect(reconciled).toEqual({ ok: true, unreadMessages: 106 });
    expect(await aggregateUnread(recipientOneId)).toBe(106);
    expect(await aggregateUnread(recipientTwoId)).toBe(3);
  });

  it('rejects unauthenticated reconciliation and outsider mark-read access', async () => {
    await signOutFixtureUser();
    await expect(callFunction('reconcileMyUnreadMessageCount', {}))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'unauthenticated');
        return true;
      });

    await signInExistingFixtureUser(outsiderId);
    await expect(callFunction('markMessageThreadRead', { threadId }))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'permission-denied');
        return true;
      });
    const outsiderReconciled = await callFunction<Record<string, unknown>, {
      ok: boolean;
      unreadMessages: number;
    }>('reconcileMyUnreadMessageCount', { userId: recipientOneId });
    expect(outsiderReconciled).toEqual({ ok: true, unreadMessages: 0 });
    expect(await aggregateUnread(recipientOneId)).toBe(106);
    expect(await aggregateUnread(outsiderId)).toBe(0);
  });
});
