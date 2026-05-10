import { useEffect } from 'react';
import { normalizePathname, shouldShowPublicSupportWidgets } from '../utils/publicRouteGuards';

const useRevealAnimations = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;

    const pathname = normalizePathname(window.location.pathname);
    if (!shouldShowPublicSupportWidgets(pathname)) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia?.('(max-width: 767px)').matches) return;
    const connection = (navigator as any)?.connection;
    const effectiveType =
      typeof connection?.effectiveType === 'string' ? connection.effectiveType.toLowerCase() : '';
    const isConstrainedNetwork =
      Boolean(connection?.saveData) || effectiveType === 'slow-2g' || effectiveType === '2g';
    const fallbackActivationDelayMs = isConstrainedNetwork ? 14000 : 10000;
    const fallbackIdleTimeoutMs = isConstrainedNetwork ? 12000 : 8000;
    const interactionIdleTimeoutMs = 2400;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let bootstrapTimeoutId: number | undefined;
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const initialize = () => {
      if (observer) return;

      observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting) target.classList.add('is-visible');
          else target.classList.remove('is-visible');
        });
      },
      { threshold: 0.15 }
    );

      const observedElements = new WeakSet<HTMLElement>();

      const registerElement = (element: HTMLElement) => {
        if (observedElements.has(element)) return;

        const delay = element.dataset.animateDelay;
        if (delay) {
          element.style.transitionDelay = delay;
        }

        observer?.observe(element);
        observedElements.add(element);
      };

      const registerTree = (root: Element | Document | DocumentFragment) => {
        if (root instanceof HTMLElement && root.matches('[data-animate]')) {
          registerElement(root);
        }

        root.querySelectorAll<HTMLElement>('[data-animate]').forEach(registerElement);
      };

      registerTree(document);

      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            registerTree(node);
          });
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    };

    const clearScheduledInitialization = () => {
      if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
        idleId = undefined;
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };

    const scheduleInitialization = (idleTimeoutMs: number, timeoutMs: number) => {
      if (observer || idleId !== undefined || timeoutId !== undefined) return;

      if (typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(initialize, { timeout: idleTimeoutMs });
      } else {
        timeoutId = window.setTimeout(initialize, timeoutMs);
      }
    };

    const onFirstInteraction = () => {
      if (bootstrapTimeoutId !== undefined) {
        window.clearTimeout(bootstrapTimeoutId);
        bootstrapTimeoutId = undefined;
      }
      removeInteractionListeners();
      scheduleInitialization(interactionIdleTimeoutMs, 900);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true, once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true, once: true });
    bootstrapTimeoutId = window.setTimeout(() => {
      bootstrapTimeoutId = undefined;
      removeInteractionListeners();
      scheduleInitialization(fallbackIdleTimeoutMs, 2400);
    }, fallbackActivationDelayMs);

    return () => {
      removeInteractionListeners();
      if (bootstrapTimeoutId !== undefined) {
        window.clearTimeout(bootstrapTimeoutId);
        bootstrapTimeoutId = undefined;
      }
      clearScheduledInitialization();
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);
};

export default useRevealAnimations;
