import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as badgeSync from '../../lib/notificationBadgeSync';
import {
  needsUnreadMessageReconciliation,
  normalizeUnreadMessageTotal,
  reconcileUnreadMessageBadge,
} from '../../lib/notificationBadgeSync';

const { callFunctionMock } = vi.hoisted(() => ({
  callFunctionMock: vi.fn(),
}));

vi.mock('../../lib/callFunctions', () => ({ callFunction: callFunctionMock }));

describe('native unread-message badge sync', () => {
  beforeEach(() => {
    localStorage.clear();
    callFunctionMock.mockReset();
    callFunctionMock.mockResolvedValue({ ok: true, unreadMessages: 7 });
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      value: undefined,
    });
  });

  it('uses the same non-negative integer meaning as dashboard tab counts', () => {
    expect(normalizeUnreadMessageTotal(3)).toBe(3);
    expect(normalizeUnreadMessageTotal(-4)).toBe(0);
    expect(normalizeUnreadMessageTotal(2.9)).toBe(2);
    expect(normalizeUnreadMessageTotal(Number.NaN)).toBe(0);
  });

  it('does not pretend an undeclared local Badge plugin is installed', () => {
    expect('syncNativeUnreadMessageBadge' in badgeSync).toBe(false);
  });

  it('deduplicates reconciliation per user and records the upgrade marker', async () => {
    const first = reconcileUnreadMessageBadge('parent-1');
    const second = reconcileUnreadMessageBadge('parent-1');
    expect(first).toBe(second);
    await expect(first).resolves.toBe(7);
    expect(callFunctionMock).toHaveBeenCalledOnce();
    expect(needsUnreadMessageReconciliation('parent-1')).toBe(false);
  });

  it('does not let one user suppress another user reconciliation', async () => {
    await reconcileUnreadMessageBadge('parent-2');
    expect(needsUnreadMessageReconciliation('teacher-2')).toBe(true);
  });
});
