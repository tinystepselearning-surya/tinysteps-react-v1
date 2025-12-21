/**
 * Tiny Steps Games Engine - HintGlow Component
 * 
 * Generic wrapper component that adds a pulsing glow effect to children when active.
 * Used for adaptive scaffolding hints (e.g., highlighting the correct answer when kid is stuck).
 * 
 * Key features:
 * - Non-breaking: preserves child layout and pointer events
 * - Configurable intensity (scale) and color
 * - Pure CSS animations (no external dependencies)
 * - Scoped animation to avoid global conflicts
 * 
 * @example
 * ```tsx
 * <HintGlow active={isStuck && isCorrect} intensity="high" color="amber">
 *   <button>Click me</button>
 * </HintGlow>
 * ```
 */

import React from 'react';

export interface HintGlowProps {
  /** Whether the hint glow is currently active */
  active: boolean;
  
  /** Content to wrap with glow effect */
  children: React.ReactNode;
  
  /** Additional CSS classes for the wrapper */
  className?: string;
  
  /** Glow intensity (affects scale) */
  intensity?: 'low' | 'medium' | 'high';
  
  /** Predefined color preset */
  color?: 'amber' | 'green' | 'red';
  
  /** Custom glow color override (CSS color string, e.g., 'rgba(...)' or '#FBBF24') */
  glowColorOverride?: string;
  
  /** Animation duration in milliseconds */
  durationMs?: number;
}

/**
 * HintGlow wrapper component for adaptive scaffolding hints.
 * 
 * Wraps children with a pulsing glow animation when active.
 * Does not interfere with layout, sizing, or pointer events.
 */
export const HintGlow: React.FC<HintGlowProps> = ({
  active,
  children,
  className = '',
  intensity = 'medium',
  color = 'amber',
  glowColorOverride,
  durationMs = 800,
}) => {
  // Map intensity to scale factor
  const scaleMap: Record<NonNullable<HintGlowProps['intensity']>, number> = {
    low: 1.05,
    medium: 1.10,
    high: 1.15,
  };
  const scale = scaleMap[intensity];

  // Map color presets to RGBA values
  const colorMap: Record<NonNullable<HintGlowProps['color']>, string> = {
    amber: '251, 191, 36',   // rgba(251, 191, 36, ...)
    green: '45, 212, 191',   // rgba(45, 212, 191, ...)
    red: '239, 68, 68',      // rgba(239, 68, 68, ...)
  };

  // Use override if provided, otherwise use preset
  const glowColor = glowColorOverride || `rgb(${colorMap[color]})`;
  const glowColorRgba = glowColorOverride || colorMap[color]; // for rgba() in box-shadow

  return (
    <>
      <style>{`
        @keyframes tsHintGlowPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(${glowColorRgba}, 0);
          }
          50% {
            transform: scale(var(--ts-hint-scale));
            box-shadow: 0 0 40px rgba(${glowColorRgba}, 0.8), 0 0 80px rgba(${glowColorRgba}, 0.4);
          }
        }
      `}</style>
      
      <div
        className={className}
        style={{
          display: 'inline-block',
          // @ts-ignore - CSS custom properties
          '--ts-hint-scale': scale,
          '--ts-hint-duration': `${durationMs}ms`,
          animation: active ? `tsHintGlowPulse var(--ts-hint-duration) ease-in-out infinite` : 'none',
          willChange: active ? 'transform' : 'auto',
          pointerEvents: 'auto', // Preserve pointer events
        }}
      >
        {children}
      </div>
    </>
  );
};
