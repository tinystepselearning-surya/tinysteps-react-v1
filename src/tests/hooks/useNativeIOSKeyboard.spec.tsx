import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { appListenerMock } = vi.hoisted(() => ({
  appListenerMock: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'ios',
  },
}));

vi.mock('@capacitor/app', () => ({
  App: { addListener: appListenerMock },
}));

import useNativeIOSKeyboard from '../../hooks/useNativeIOSKeyboard';

class VisualViewportFixture extends EventTarget {
  height = 800;
  offsetTop = 0;
}

function Harness() {
  const state = useNativeIOSKeyboard();
  return (
    <>
      <textarea aria-label="Message" />
      <output data-testid="keyboard-state">
        {state.keyboardOpen ? `open:${state.keyboardHeight}` : 'closed:0'}
      </output>
    </>
  );
}

describe('useNativeIOSKeyboard', () => {
  let viewport: VisualViewportFixture;
  let appStateCallback: ((state: { isActive: boolean }) => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    viewport = new VisualViewportFixture();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) =>
      window.setTimeout(() => callback(performance.now()), 0));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) =>
      window.clearTimeout(id));
    appStateCallback = undefined;
    appListenerMock.mockReset();
    appListenerMock.mockImplementation(async (
      _event: string,
      callback: (state: { isActive: boolean }) => void,
    ) => {
      appStateCallback = callback;
      return { remove: vi.fn() };
    });
    document.documentElement.style.setProperty('--ts-keyboard-height', '0px');
    document.documentElement.removeAttribute('data-keyboard-open');
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens and closes from the visual viewport without retaining blank space', () => {
    render(<Harness />);
    const textarea = screen.getByLabelText('Message');
    act(() => {
      textarea.focus();
      viewport.height = 500;
      viewport.dispatchEvent(new Event('resize'));
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByTestId('keyboard-state')).toHaveTextContent('open:300');
    expect(document.documentElement).toHaveAttribute('data-keyboard-open', 'true');

    act(() => {
      textarea.blur();
      viewport.height = 800;
      viewport.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(180);
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByTestId('keyboard-state')).toHaveTextContent('closed:0');
    expect(document.documentElement).not.toHaveAttribute('data-keyboard-open');
  });

  it('clears keyboard state immediately when the app backgrounds', async () => {
    render(<Harness />);
    await act(async () => {
      await Promise.resolve();
    });
    const textarea = screen.getByLabelText('Message');
    act(() => {
      textarea.focus();
      viewport.height = 520;
      viewport.dispatchEvent(new Event('resize'));
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByTestId('keyboard-state')).toHaveTextContent('open:280');

    act(() => appStateCallback?.({ isActive: false }));
    expect(screen.getByTestId('keyboard-state')).toHaveTextContent('closed:0');
  });

  it('recomputes after orientation change and delayed focus-out restoration', () => {
    render(<Harness />);
    const textarea = screen.getByLabelText('Message');
    act(() => {
      textarea.focus();
      viewport.height = 500;
      window.dispatchEvent(new Event('orientationchange'));
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByTestId('keyboard-state')).toHaveTextContent('open:300');

    act(() => {
      textarea.blur();
      vi.advanceTimersByTime(80);
      viewport.height = 800;
      vi.advanceTimersByTime(100);
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByTestId('keyboard-state')).toHaveTextContent('closed:0');
  });

  it('removes document keyboard state on unmount', () => {
    const { unmount } = render(<Harness />);
    const textarea = screen.getByLabelText('Message');
    act(() => {
      textarea.focus();
      viewport.height = 500;
      viewport.dispatchEvent(new Event('resize'));
      vi.runOnlyPendingTimers();
    });
    unmount();
    expect(document.documentElement.style.getPropertyValue('--ts-keyboard-height')).toBe('0px');
    expect(document.documentElement).not.toHaveAttribute('data-keyboard-open');
  });

  it('cancels every delayed focus-out callback and animation frame on unmount', () => {
    const { unmount } = render(<Harness />);
    const textarea = screen.getByLabelText('Message');
    act(() => {
      textarea.focus();
      viewport.height = 500;
      viewport.dispatchEvent(new Event('resize'));
      vi.runOnlyPendingTimers();
      textarea.blur();
    });
    const queuedBeforeUnmount = vi.mocked(window.requestAnimationFrame).mock.calls.length;
    unmount();
    act(() => vi.runAllTimers());
    expect(vi.mocked(window.requestAnimationFrame)).toHaveBeenCalledTimes(queuedBeforeUnmount);
    expect(document.documentElement.style.getPropertyValue('--ts-keyboard-height')).toBe('0px');
    expect(document.documentElement).not.toHaveAttribute('data-keyboard-open');
  });

  it('removes a native listener that resolves after unmount', async () => {
    let resolveHandle: ((handle: { remove: () => Promise<void> }) => void) | undefined;
    const remove = vi.fn(async () => undefined);
    appListenerMock.mockReturnValue(new Promise((resolve) => {
      resolveHandle = resolve;
    }));
    const { unmount } = render(<Harness />);
    unmount();
    await act(async () => {
      resolveHandle?.({ remove });
      await Promise.resolve();
    });
    expect(remove).toHaveBeenCalledOnce();
  });

  it('cleans up every native listener across multiple hook mounts', async () => {
    const removers: Array<ReturnType<typeof vi.fn>> = [];
    appListenerMock.mockImplementation(async () => {
      const remove = vi.fn(async () => undefined);
      removers.push(remove);
      return { remove };
    });
    const first = render(<Harness />);
    const second = render(<Harness />);
    await act(async () => {
      await Promise.resolve();
    });
    first.unmount();
    second.unmount();
    expect(removers).toHaveLength(2);
    expect(removers.every((remove) => remove.mock.calls.length === 1)).toBe(true);
  });
});
