import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPendingPushOpenRoute } from '../../lib/pushNavigationState';

const { toastMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));

vi.mock('@capacitor/app', () => ({ App: {} }));
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'ios',
    isNativePlatform: () => true,
  },
}));
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: { addListener: vi.fn() },
}));
vi.mock('../../components/hooks/use-toast', () => ({ toast: toastMock }));
vi.mock('../../lib/callFunctions', () => ({ callFunction: vi.fn() }));

import {
  handlePushNotificationActionPerformed,
  handlePushNotificationReceived,
} from '../../lib/pushNotifications';
import { OPEN_MESSAGES_FROM_PUSH_EVENT } from '../../lib/pushNavigationState';

describe('native push notification ownership', () => {
  beforeEach(() => {
    localStorage.clear();
    toastMock.mockClear();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('queues and dispatches a repeated notification action exactly once', () => {
    const eventListener = vi.fn();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, eventListener);
    const action = {
      notification: {
        id: 'native-action-1',
        data: {
          type: 'message',
          messageId: 'message-dedup-1',
          route: '/messages',
          threadId: 'thread-1',
        },
      },
    };

    handlePushNotificationActionPerformed(action);
    const firstPending = getPendingPushOpenRoute();
    handlePushNotificationActionPerformed(action);

    expect(firstPending?.threadId).toBe('thread-1');
    expect(getPendingPushOpenRoute()).toEqual(firstPending);
    expect(setItemSpy).toHaveBeenCalledOnce();
    expect(eventListener).toHaveBeenCalledOnce();
    setItemSpy.mockRestore();
    window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, eventListener);
  });

  it('notification received shows a foreground toast without queueing or navigating', () => {
    const eventListener = vi.fn();
    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, eventListener);

    handlePushNotificationReceived({
      title: 'New message',
      body: 'Open the conversation',
      data: {
        type: 'message',
        route: '/messages',
        threadId: 'received-only-thread',
      },
    });

    expect(toastMock).toHaveBeenCalledOnce();
    expect(eventListener).not.toHaveBeenCalled();
    expect(getPendingPushOpenRoute()).toBeNull();
    window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, eventListener);
  });
});
