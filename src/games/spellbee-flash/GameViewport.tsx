/**
 * GameViewport - Compact viewport wrapper for SpellBee Flash
 * 
 * Prevents page scrolling by fitting everything in one screen view.
 * Uses h-dvh (dynamic viewport height) to handle iOS Safari's collapsing URL bar.
 */

import type { ReactNode } from "react";

interface GameViewportProps {
  children: ReactNode;
}

export default function GameViewport({ children }: GameViewportProps) {
  return (
    <div
      className="relative mx-auto max-w-[980px] h-dvh overflow-hidden px-3 sm:px-4 py-3 sm:py-4 bg-white rounded-none sm:rounded-3xl"
    >
      <div className="flex h-full flex-col gap-2 sm:gap-3">
        {children}
      </div>
    </div>
  );
}
