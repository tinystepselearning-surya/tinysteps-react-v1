// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const BackToTopButton = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nextVisible = window.scrollY > 650;
      setVisible((current) => (current === nextVisible ? current : nextVisible));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={
        isHomePage
          ? 'fixed bottom-4 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-[#102A43] shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43] sm:bottom-6 sm:left-4 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2'
          : 'fixed bottom-4 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#59c3ff] via-[#ffb347] to-[#ff8f5c] text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.3)] transition-transform duration-150 hover:scale-105 active:scale-95 sm:bottom-6 sm:left-4 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2'
      }
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })}
      aria-label="Back to top"
    >
      <span aria-hidden="true">↑</span>
      <span className="sr-only sm:not-sr-only">Back to top</span>
    </button>
  );
};

export default BackToTopButton;
