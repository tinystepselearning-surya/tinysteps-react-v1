import { useEffect } from 'react';

const useRevealAnimations = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const observer = new IntersectionObserver(
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

      observer.observe(element);
      observedElements.add(element);
    };

    const registerTree = (root: Element | Document | DocumentFragment) => {
      if (root instanceof HTMLElement && root.matches('[data-animate]')) {
        registerElement(root);
      }

      root.querySelectorAll<HTMLElement>('[data-animate]').forEach(registerElement);
    };

    registerTree(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          registerTree(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
};

export default useRevealAnimations;
