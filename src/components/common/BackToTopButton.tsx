// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.button
      className="fixed bottom-6 left-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#59c3ff] via-[#ffb347] to-[#ff8f5c] px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.3)]"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Back to top"
    >
      ↑ Back to top
    </motion.button>
  );
};

export default BackToTopButton;
