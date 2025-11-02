/**
 * GameViewport - Mobile-safe viewport wrapper for SpellBee Flash
 * 
 * Fits content in one screen view on mobile devices.
 * Uses svh on mobile (handles iOS Safari URL bar) and dvh on desktop.
 * Allows minimal internal scroll as fallback for very small devices.
 */

import type { ReactNode } from "react";

interface GameViewportProps {
  children: ReactNode;
}

export default function GameViewport({ children }: GameViewportProps) {
  return (
    <div
      className="relative mx-auto max-w-[980px] h-[100svh] md:h-dvh overflow-x-hidden overflow-y-auto px-3 sm:px-4 pt-2 pb-3 sm:pt-2 sm:pb-4 bg-white rounded-none sm:rounded-3xl"
    >
      <div className="flex h-full flex-col gap-2 sm:gap-3">
        {children}
      </div>
    </div>
  );
}
