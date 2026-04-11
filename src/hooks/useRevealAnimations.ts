import { useEffect } from 'react';
import { normalizePathname, shouldShowPublicSupportWidgets } from '../utils/publicRouteGuards';

const useRevealAnimations = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const pathname = normalizePathname(window.location.pathname);
    if (!shouldShowPublicSupportWidgets(pathname)) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
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

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(initialize, { timeout: 1600 });
    } else {
      timeoutId = window.setTimeout(initialize, 1100);
    }

    return () => {
      if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);
};

export default useRevealAnimations;
