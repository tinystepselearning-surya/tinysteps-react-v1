// Minimal ScrollReveal component used by a few sections.
// Keeps behavior light-weight: reveals children when they enter viewport.
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'none';
  threshold?: number;
};

const VARIANTS: Record<string, any> = {
  fadeUp: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
  },
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
};

export const ScrollReveal: React.FC<Props> = ({ children, className = '', variant = 'fadeUp', threshold = 0.12 }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const chosen = VARIANTS[variant] || VARIANTS.fadeUp;

  return (
    <motion.section
      ref={ref as any}
      className={className}
      initial="hidden"
      animate={visible ? 'visible' : 'hidden'}
      variants={chosen}
    >
      {children}
    </motion.section>
  );
};

export default ScrollReveal;
