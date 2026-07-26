import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPendingPushOpenRoute } from '../../lib/pushNavigationState';

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
vi.mock('../../lib/callFunctions', () => ({ callFunction: vi.fn() }));

import {
  resetForegroundNotificationStateForTests,
  setActiveMessageThread,
  subscribeForegroundNotifications,
} from '../../lib/foregroundNotificationState';
import {
  handlePushNotificationActionPerformed,
  handlePushNotificationReceived,
} from '../../lib/pushNotifications';
import { OPEN_MESSAGES_FROM_PUSH_EVENT } from '../../lib/pushNavigationState';

describe('native push notification ownership', () => {
  beforeEach(() => {
    localStorage.clear();
    resetForegroundNotificationStateForTests();
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

  it('disables native foreground banners while retaining badge and sound', () => {
    const capacitorConfig = readFileSync(
      join(process.cwd(), 'capacitor.config.ts'),
      'utf8',
    );
    const appDelegate = readFileSync(
      join(process.cwd(), 'ios/App/App/AppDelegate.swift'),
      'utf8',
    );
    expect(capacitorConfig).toContain("presentationOptions: ['badge', 'sound']");
    const willPresent = appDelegate.slice(
      appDelegate.indexOf('willPresent notification'),
      appDelegate.indexOf('didReceive response'),
    );
    expect(willPresent).toContain('completionHandler([.sound, .badge])');
    expect(willPresent).not.toMatch(/\.(banner|list|alert)/);
  });

  it('notification received presents one foreground banner without queueing or navigating', () => {
    const eventListener = vi.fn();
    const bannerListener = vi.fn();
    const unsubscribe = subscribeForegroundNotifications(bannerListener);
    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, eventListener);

    handlePushNotificationReceived({
      title: 'New message',
      body: 'Open the conversation',
      data: {
        type: 'message',
        messageId: 'received-only-message',
        route: '/messages',
        threadId: 'received-only-thread',
      },
    });

    expect(bannerListener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'received-only-message',
        kind: 'message',
      }),
    );
    expect(eventListener).not.toHaveBeenCalled();
    expect(getPendingPushOpenRoute()).toBeNull();
    unsubscribe();
    window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, eventListener);
  });

  it('suppresses a foreground message for the currently visible thread', () => {
    const bannerListener = vi.fn();
    const unsubscribe = subscribeForegroundNotifications(bannerListener);
    setActiveMessageThread('thread-open');

    handlePushNotificationReceived({
      title: 'New message',
      body: 'Already visible',
      data: {
        type: 'message',
        messageId: 'same-thread-message',
        route: '/messages',
        threadId: 'thread-open',
      },
    });

    expect(bannerListener).toHaveBeenCalledTimes(1);
    expect(bannerListener).toHaveBeenLastCalledWith(null);
    unsubscribe();
  });

  it('routes class reminder actions to the authenticated classes destination', () => {
    handlePushNotificationActionPerformed({
      notification: {
        id: 'reminder-action-1',
        data: {
          type: 'class_reminder',
          sessionId: 'session-1',
          route: '/parent?tab=classes',
        },
      },
    });

    expect(getPendingPushOpenRoute()).toMatchObject({
      type: 'class_reminder',
      route: '/parent?tab=classes',
      sessionId: 'session-1',
    });
  });
});
