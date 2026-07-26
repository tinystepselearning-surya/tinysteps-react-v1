import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ForegroundNotificationHost from '../../components/notifications/ForegroundNotificationHost';
import {
  presentForegroundNotification,
  resetForegroundNotificationStateForTests,
  type ForegroundNotification,
} from '../../lib/foregroundNotificationState';
import {
  getPendingPushOpenRoute,
  OPEN_MESSAGES_FROM_PUSH_EVENT,
} from '../../lib/pushNavigationState';

const notification: ForegroundNotification = {
  id: 'message-1',
  kind: 'message',
  title: 'New message',
  body: 'A safe preview',
  receivedAtMs: Date.now(),
  destination: {
    type: 'message',
    route: '/messages',
    threadId: 'thread-1',
  },
};

describe('ForegroundNotificationHost', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    resetForegroundNotificationStateForTests();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders one responsive banner and replaces it safely', () => {
    const view = render(<ForegroundNotificationHost />);
    act(() => {
      presentForegroundNotification(notification);
    });
    expect(screen.getAllByTestId('foreground-notification')).toHaveLength(1);
    expect(screen.getByTestId('foreground-notification')).toHaveClass('inset-x-3');
    expect(view.container.querySelector('.min-w-0')).toBeTruthy();

    act(() => {
      presentForegroundNotification({
        ...notification,
        id: 'message-2',
        body: 'A newer preview',
      });
    });
    expect(screen.getAllByTestId('foreground-notification')).toHaveLength(1);
    expect(screen.getByText('A newer preview')).toBeVisible();
  });

  it('dismisses and auto-dismisses without routing', () => {
    const openListener = vi.fn();
    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, openListener);
    render(<ForegroundNotificationHost />);
    act(() => {
      presentForegroundNotification(notification);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByTestId('foreground-notification')).not.toBeInTheDocument();

    act(() => {
      presentForegroundNotification({ ...notification, id: 'message-2' });
    });
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByTestId('foreground-notification')).not.toBeInTheDocument();
    expect(openListener).not.toHaveBeenCalled();
    expect(getPendingPushOpenRoute()).toBeNull();
    window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, openListener);
  });

  it('routes exactly once only when the banner is tapped', () => {
    const openListener = vi.fn();
    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, openListener);
    render(<ForegroundNotificationHost />);
    act(() => {
      presentForegroundNotification(notification);
    });
    fireEvent.click(screen.getByRole('button', { name: /New message/ }));
    expect(openListener).toHaveBeenCalledOnce();
    expect(getPendingPushOpenRoute()).toMatchObject({
      type: 'message',
      threadId: 'thread-1',
    });
    expect(screen.queryByTestId('foreground-notification')).not.toBeInTheDocument();
    window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, openListener);
  });

  it('clears its timer and subscription on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const view = render(<ForegroundNotificationHost />);
    act(() => {
      presentForegroundNotification(notification);
    });
    view.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    expect(() => {
      presentForegroundNotification({ ...notification, id: 'after-unmount' });
      vi.runAllTimers();
    }).not.toThrow();
    clearTimeoutSpy.mockRestore();
  });
});
