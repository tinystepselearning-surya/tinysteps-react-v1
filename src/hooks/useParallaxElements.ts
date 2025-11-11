import { useEffect } from 'react';

const useParallaxElements = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const elements = Array.from(document.querySelectorAll('[data-parallax]')) as HTMLElement[];
    if (!elements.length) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      elements.forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed || '0.2');
        const offset = scrollY * speed;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      elements.forEach((el) => (el.style.transform = ''));
    };
  }, []);
};

export default useParallaxElements;
