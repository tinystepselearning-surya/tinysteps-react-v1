import { useEffect, useState } from 'react';

interface DeferredActivationOptions {
  disabled?: boolean;
  idleTimeout?: number;
}

export default function useDeferredActivation({
  disabled = false,
  idleTimeout = 2400,
}: DeferredActivationOptions = {}) {
  const [isActive, setIsActive] = useState(disabled);

  useEffect(() => {
    if (disabled || isActive) return;
    if (typeof window === 'undefined') return;
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;

    const activate = () => setIsActive(true);
    const win = window as Window & {
      cancelIdleCallback?: (id: number) => void;
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const cleanupInteractions = () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };

    const onFirstInteraction = () => {
      activate();
      cleanupInteractions();
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction, { passive: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true });

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(activate, { timeout: idleTimeout });
    } else {
      timeoutId = window.setTimeout(activate, idleTimeout);
    }

    return () => {
      cleanupInteractions();
      if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [disabled, idleTimeout, isActive]);

  return isActive;
}
