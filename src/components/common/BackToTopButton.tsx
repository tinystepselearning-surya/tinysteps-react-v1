// @ts-nocheck
import React, { useEffect, useState } from 'react';

const BackToTopButton = () => {
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
      className="fixed bottom-4 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#59c3ff] via-[#ffb347] to-[#ff8f5c] text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.3)] transition-transform duration-150 hover:scale-105 active:scale-95 sm:bottom-6 sm:left-4 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <span aria-hidden="true">↑</span>
      <span className="sr-only sm:not-sr-only">Back to top</span>
    </button>
  );
};

export default BackToTopButton;
