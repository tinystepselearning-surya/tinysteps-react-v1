// @ts-nocheck
import React, { useEffect, useState } from 'react';

const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nextVisible = window.scrollY > 400;
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
      className="fixed bottom-6 left-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#59c3ff] via-[#ffb347] to-[#ff8f5c] px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.3)] transition-transform duration-150 hover:scale-105 active:scale-95"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      ↑ Back to top
    </button>
  );
};

export default BackToTopButton;
