import { useEffect } from 'react';

const useRevealAnimations = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
          else entry.target.classList.remove('is-visible');
        });
      },
      { threshold: 0.15 }
    );

    const trackElements = () => {
      const elements = document.querySelectorAll('[data-animate]');
      elements.forEach((el) => {
        if (el.dataset.revealObserved) return;
        const delay = (el as HTMLElement).dataset.animateDelay;
        if (delay) {
          (el as HTMLElement).style.transitionDelay = delay;
        }
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          el.classList.add('is-visible');
        }
        observer.observe(el);
        el.dataset.revealObserved = '1';
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
