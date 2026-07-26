import { useEffect, useMemo, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type UseNativeIOSKeyboardOptions = {
  manageDocumentState?: boolean;
  hideAccessoryBar?: boolean;
};

const KEYBOARD_HEIGHT_VAR = '--ts-keyboard-height';
const KEYBOARD_OPEN_ATTR = 'data-keyboard-open';

const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false;
  if (!(element instanceof HTMLElement)) return false;
  const tag = element.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return element.isContentEditable;
};

export default function useNativeIOSKeyboard(
  options: UseNativeIOSKeyboardOptions = {},
) {
  const { manageDocumentState = true, hideAccessoryBar = false } = options;
  const isNativeIOS = useMemo(() => {
    try {
      return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    } catch {
      return false;
    }
  }, []);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isNativeIOS || typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    const root = document.documentElement;
    let rafId = 0;
    let appStateHandle: { remove: () => Promise<void> } | null = null;
    const delayedTimerIds = new Set<number>();
    let mounted = true;

    const applyKeyboardState = (open: boolean, height: number) => {
      if (!mounted) return;
      setKeyboardOpen(open);
      setKeyboardHeight(height);
      if (!manageDocumentState) return;
      root.style.setProperty(KEYBOARD_HEIGHT_VAR, `${height}px`);
      if (open) {
        root.setAttribute(KEYBOARD_OPEN_ATTR, 'true');
      } else {
        root.removeAttribute(KEYBOARD_OPEN_ATTR);
      }
    };

    const computeKeyboardState = () => {
      if (!mounted) return;
      const active = document.activeElement;
      const hasEditableFocus = isEditableElement(active);

      if (!viewport) {
        applyKeyboardState(false, 0);
        return;
      }

      const layoutHeight = window.innerHeight;
      const visualHeight = viewport.height;
      const offsetTop = viewport.offsetTop || 0;
      const heightDelta = Math.max(0, Math.round(layoutHeight - visualHeight - offsetTop));
      const likelyKeyboardOpen = hasEditableFocus && heightDelta > 40;

      applyKeyboardState(likelyKeyboardOpen, likelyKeyboardOpen ? heightDelta : 0);
    };

    const queueCompute = () => {
      if (!mounted) return;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        computeKeyboardState();
      });
    };

    const queueDelayedCompute = (delayMs: number) => {
      const timerId = window.setTimeout(() => {
        delayedTimerIds.delete(timerId);
        if (!mounted) return;
        queueCompute();
      }, delayMs);
      delayedTimerIds.add(timerId);
    };

    const queueFocusOutRecompute = () => {
      queueCompute();
      queueDelayedCompute(80);
      queueDelayedCompute(180);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        applyKeyboardState(false, 0);
        return;
      }
      queueCompute();
      queueDelayedCompute(80);
    };

    const handlePageShow = () => {
      applyKeyboardState(false, 0);
      queueCompute();
      queueDelayedCompute(80);
    };

    queueCompute();
    viewport?.addEventListener('resize', queueCompute);
    viewport?.addEventListener('scroll', queueCompute);
    window.addEventListener('resize', queueCompute);
    window.addEventListener('orientationchange', queueCompute);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('focusin', queueCompute);
    document.addEventListener('focusout', queueFocusOutRecompute);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!mounted) return;
      if (!isActive) {
        applyKeyboardState(false, 0);
        return;
      }
      queueCompute();
      queueDelayedCompute(80);
      queueDelayedCompute(180);
    }).then((handle) => {
      if (!mounted) {
        void handle.remove();
        return;
      }
      appStateHandle = handle;
    }).catch(() => {
      // Ignore an unavailable native bridge in browser tests and web builds.
    });

    return () => {
      mounted = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      delayedTimerIds.forEach((timerId) => window.clearTimeout(timerId));
      delayedTimerIds.clear();
      if (appStateHandle) void appStateHandle.remove();
      viewport?.removeEventListener('resize', queueCompute);
      viewport?.removeEventListener('scroll', queueCompute);
      window.removeEventListener('resize', queueCompute);
      window.removeEventListener('orientationchange', queueCompute);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('focusin', queueCompute);
      document.removeEventListener('focusout', queueFocusOutRecompute);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (manageDocumentState) {
        root.style.setProperty(KEYBOARD_HEIGHT_VAR, '0px');
        root.removeAttribute(KEYBOARD_OPEN_ATTR);
      }
    };
  }, [isNativeIOS, manageDocumentState]);

  useEffect(() => {
    if (!isNativeIOS || !hideAccessoryBar) return;

    const keyboardPlugin = (window as any)?.Capacitor?.Plugins?.Keyboard;
    if (!keyboardPlugin || typeof keyboardPlugin.setAccessoryBarVisible !== 'function') {
      return;
    }

    keyboardPlugin
      .setAccessoryBarVisible({ isVisible: false })
      .catch(() => {
        // Ignore plugin failures if Keyboard plugin is unavailable in this runtime.
      });

    return () => {
      keyboardPlugin
        .setAccessoryBarVisible({ isVisible: true })
        .catch(() => {
          // Ignore restore failures.
        });
    };
  }, [hideAccessoryBar, isNativeIOS]);

  return {
    isNativeIOS,
    keyboardOpen,
    keyboardHeight,
  };
}
