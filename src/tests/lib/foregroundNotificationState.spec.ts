import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  openForegroundNotification,
  presentForegroundNotification,
  resetForegroundNotificationStateForTests,
  sanitizeForegroundNotificationText,
  setActiveMessageThread,
  subscribeForegroundNotifications,
  type ForegroundNotification,
} from '../../lib/foregroundNotificationState';
import {
  getPendingPushOpenRoute,
  OPEN_MESSAGES_FROM_PUSH_EVENT,
} from '../../lib/pushNavigationState';

const messageNotification = (
  id: string,
  threadId: string,
): ForegroundNotification => ({
  id,
  kind: 'message',
  title: 'New message',
  body: 'A safe preview',
  receivedAtMs: Date.now(),
  destination: {
    type: 'message',
    route: '/messages',
    threadId,
  },
});

describe('foreground notification presentation state', () => {
  beforeEach(() => {
    localStorage.clear();
    resetForegroundNotificationStateForTests();
  });

  it('deduplicates a message ID and replaces an older banner', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeForegroundNotifications(listener);
    expect(presentForegroundNotification(messageNotification('message-1', 'thread-1')))
      .toBe(true);
    expect(presentForegroundNotification(messageNotification('message-1', 'thread-1')))
      .toBe(false);
    expect(presentForegroundNotification(messageNotification('message-2', 'thread-2')))
      .toBe(true);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'message-2' }),
    );
    unsubscribe();
  });

  it('suppresses the exact active thread but not another conversation', () => {
    setActiveMessageThread('thread-1');
    expect(presentForegroundNotification(messageNotification('same', 'thread-1')))
      .toBe(false);
    expect(presentForegroundNotification(messageNotification('other', 'thread-2')))
      .toBe(true);
  });

  it('shows a message while the Messages inbox is open without a thread', () => {
    setActiveMessageThread(null);
    expect(presentForegroundNotification(messageNotification('inbox', 'thread-1')))
      .toBe(true);
  });

  it('safely replaces legacy phone-number previews', () => {
    expect(sanitizeForegroundNotificationText(
      'Call +91 99999 12345',
      'Open Messages to view the latest update.',
    )).toBe('Open Messages to view the latest update.');
  });

  it('queues and dispatches the safe route when tapped', () => {
    const listener = vi.fn();
    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, listener);
    const notification = messageNotification('tap-message', 'thread-23');

    openForegroundNotification(notification);

    expect(getPendingPushOpenRoute()).toMatchObject({
      type: 'message',
      threadId: 'thread-23',
    });
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, listener);
  });
});
