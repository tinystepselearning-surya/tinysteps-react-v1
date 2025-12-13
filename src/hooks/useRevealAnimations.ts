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

    const trackElements = () => {
      const elements = document.querySelectorAll<HTMLElement>('[data-animate]');
      elements.forEach((el) => {
        const delay = el.dataset.animateDelay;
        if (delay) {
          el.style.transitionDelay = delay;
        }
        observer.observe(el);
      });
    };

    trackElements();

    const mutationObserver = new MutationObserver(() => {
      trackElements();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
};

export default useRevealAnimations;
