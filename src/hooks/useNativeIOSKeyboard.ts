import { useEffect, useMemo, useState } from 'react';
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

    const applyKeyboardState = (open: boolean, height: number) => {
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
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        computeKeyboardState();
      });
    };

    queueCompute();
    viewport?.addEventListener('resize', queueCompute);
    viewport?.addEventListener('scroll', queueCompute);
    window.addEventListener('orientationchange', queueCompute);
    document.addEventListener('focusin', queueCompute);
    document.addEventListener('focusout', queueCompute);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      viewport?.removeEventListener('resize', queueCompute);
      viewport?.removeEventListener('scroll', queueCompute);
      window.removeEventListener('orientationchange', queueCompute);
      document.removeEventListener('focusin', queueCompute);
      document.removeEventListener('focusout', queueCompute);

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
