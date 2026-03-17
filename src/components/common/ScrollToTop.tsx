import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const hashId = decodeURIComponent(hash.replace('#', ''));
      if (!hashId) return;

      const scrollToHashTarget = () => {
        const target = document.getElementById(hashId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      // Run once immediately and once after paint for sections rendered below the fold.
      scrollToHashTarget();
      const timer = window.setTimeout(scrollToHashTarget, 60);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
