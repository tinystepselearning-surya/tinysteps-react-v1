import { describe, expect, it } from 'vitest';
import {
  clearThreadUnreadFromAggregate,
  incrementRecipientUnreadCounts,
  incrementUnreadCount,
  sumUnreadForUser,
} from '../src/messaging/unreadState';
import {
  buildMessageNotificationId,
  requireAuthenticatedUserId,
} from '../src/messaging/sendMessage';

describe('exact unread-message aggregate math', () => {
  it('increments every committed send without collapsing prior unread messages', () => {
    let unread = 0;
    unread = incrementUnreadCount(unread);
    unread = incrementUnreadCount(unread);
    unread = incrementUnreadCount(unread);
    expect(unread).toBe(3);
  });

  it('subtracts the selected thread full unread amount', () => {
    expect(clearThreadUnreadFromAggregate(7, 3)).toEqual({
      unreadCleared: 3,
      unreadMessages: 4,
    });
  });

  it('never produces a negative aggregate', () => {
    expect(clearThreadUnreadFromAggregate(1, 3)).toEqual({
      unreadCleared: 3,
      unreadMessages: 0,
    });
    expect(incrementUnreadCount(Number.NaN)).toBe(1);
  });

  it('keeps aggregate counts independent across three recipients', () => {
    expect(incrementRecipientUnreadCounts([
      { userId: 'parent', threadUnread: 2, aggregateUnread: 5 },
      { userId: 'teacher', threadUnread: 0, aggregateUnread: 1 },
      { userId: 'lp', threadUnread: 'corrupt', aggregateUnread: undefined },
    ])).toEqual([
      { userId: 'parent', threadUnread: 3, aggregateUnread: 6 },
      { userId: 'teacher', threadUnread: 1, aggregateUnread: 2 },
      { userId: 'lp', threadUnread: 1, aggregateUnread: 1 },
    ]);
  });

  it('models two committed concurrent sends as two increments', () => {
    const first = incrementUnreadCount(0);
    const secondCommitted = incrementUnreadCount(first);
    expect(secondCommitted).toBe(2);
  });

  it('does not reuse a stale thread unread value after a committed increment', () => {
    const stale = 4;
    const firstCommit = incrementUnreadCount(stale);
    const retryRead = firstCommit;
    expect(incrementUnreadCount(retryRead)).toBe(6);
  });

  it('treats missing, corrupt, fractional, and negative counts safely', () => {
    expect(incrementUnreadCount(undefined)).toBe(1);
    expect(incrementUnreadCount('not-a-number')).toBe(1);
    expect(incrementUnreadCount(2.9)).toBe(3);
    expect(incrementUnreadCount(-4)).toBe(1);
  });

  it('is idempotent when an already-read thread is marked read again', () => {
    expect(clearThreadUnreadFromAggregate(4, 0)).toEqual({
      unreadCleared: 0,
      unreadMessages: 4,
    });
  });

  it('reconciles all accessible threads and only the caller field', () => {
    const threads = Array.from({ length: 151 }, (_, index) => ({
      unreadCounts: {
        caller: index % 3,
        anotherUser: 99,
      },
    }));
    expect(sumUnreadForUser(threads, 'caller')).toBe(150);
  });

  it('sanitizes corrupt and negative values during reconciliation', () => {
    expect(sumUnreadForUser([
      { unreadCounts: { caller: 2 } },
      { unreadCounts: { caller: -8 } },
      { unreadCounts: { caller: 'bad' } },
      {},
    ], 'caller')).toBe(2);
  });

  it('uses deterministic notification identities across transaction retries', () => {
    const first = buildMessageNotificationId('message-1', 'recipient-1');
    expect(buildMessageNotificationId('message-1', 'recipient-1')).toBe(first);
    expect(buildMessageNotificationId('message-1', 'recipient-2')).not.toBe(first);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects unauthenticated reconciliation and accepts only the caller uid', () => {
    expect(() => requireAuthenticatedUserId(undefined)).toThrow('Authentication required');
    expect(requireAuthenticatedUserId({ uid: 'caller' })).toBe('caller');
  });
});
