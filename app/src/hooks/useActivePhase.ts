/**
 * useActivePhase.ts
 * Track which phase section is currently visible in viewport
 * Uses IntersectionObserver to sync with scroll position
 */

import { useState, useEffect } from 'react';
import type { PhaseID } from '../data/phases';

export function useActivePhase(phaseIds: PhaseID[]) {
  const [activePhase, setActivePhase] = useState<PhaseID | null>(
    phaseIds[0] || null
  );

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('section[data-phase]')
    );

    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntry = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          const phaseId = visibleEntry.target.getAttribute(
            'data-phase'
          ) as PhaseID;
          setActivePhase(phaseId);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [phaseIds.join(',')]);

  return activePhase;
}
