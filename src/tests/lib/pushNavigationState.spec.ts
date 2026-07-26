import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPendingPushDestination,
  getPendingPushOpenRoute,
  PENDING_PUSH_OPEN_MAX_AGE_MS,
  parsePushDestination,
  queuePendingPushOpenRoute,
} from '../../lib/pushNavigationState';

describe('pending push navigation state', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('keeps a valid route until navigation explicitly clears it', () => {
    queuePendingPushOpenRoute('/messages', 'thread-123');

    const firstRead = getPendingPushOpenRoute();
    const secondRead = getPendingPushOpenRoute();

    expect(firstRead).not.toBeNull();
    expect(secondRead).toEqual(firstRead);
    expect(firstRead && getPendingPushDestination(firstRead)).toBe('/messages/thread-123');
  });

  it('discards a pending push route after ten minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T10:00:00.000Z'));
    queuePendingPushOpenRoute('/messages', 'expired-thread');
    vi.advanceTimersByTime(PENDING_PUSH_OPEN_MAX_AGE_MS + 1);

    expect(getPendingPushOpenRoute()).toBeNull();
    expect(localStorage.getItem('ts_pending_push_open_v1')).toBeNull();
  });

  it('normalizes external and non-message routes to the messages inbox', () => {
    queuePendingPushOpenRoute('//example.com/steal', undefined);
    const pending = getPendingPushOpenRoute();
    expect(pending && getPendingPushDestination(pending)).toBe('/messages');
  });

  it('accepts only verified internal message and class-reminder destinations', () => {
    expect(parsePushDestination('message', '/messages/thread-1', 'thread-1')).toEqual({
      type: 'message',
      route: '/messages/thread-1',
      threadId: 'thread-1',
    });
    expect(parsePushDestination(
      'class_reminder',
      '/teacher?tab=today',
      undefined,
      'session-1',
    )).toEqual({
      type: 'class_reminder',
      route: '/teacher?tab=today',
      sessionId: 'session-1',
    });
    expect(parsePushDestination('message', 'https://evil.example/messages')).toBeNull();
    expect(parsePushDestination('message', '//evil.example/messages')).toBeNull();
    expect(parsePushDestination('message', '/messages\\thread')).toBeNull();
    expect(parsePushDestination('class_reminder', '/surya')).toBeNull();
  });
});
