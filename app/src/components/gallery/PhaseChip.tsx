/**
 * PhaseChip.tsx
 * Compact phase navigation chip with tiny circular progress ring
 * Lighter styling with subtle active state
 */

import { motion } from 'framer-motion';

interface PhaseChipProps {
  id: string;
  label: string;
  progress: number;
  isActive: boolean;
  isHighlighted?: boolean;
  onClick: () => void;
  color?: string;
  chipRef?: React.RefObject<HTMLButtonElement | null>;
}

// Tiny circular progress ring
function TinyProgressRing({ progress, size = 24 }: { progress: number; size?: number }) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 90) return '#3b82f6'; // blue
    if (progress >= 70) return '#10b981'; // emerald
    if (progress >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={2}
        className="fill-none stroke-slate-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={2}
        className="fill-none transition-all duration-300"
        stroke={getColor()}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PhaseChip({
  id,
  label,
  progress,
  isActive,
  isHighlighted,
  onClick,
  color,
  chipRef,
}: PhaseChipProps) {
  return (
    <motion.button
      ref={chipRef}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`
        group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
        ${
          isActive
            ? 'border-orange-400 bg-orange-50 text-orange-900 shadow-sm'
            : isHighlighted
            ? 'border-sky-400 bg-sky-50 text-sky-900 shadow-sm'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        }
      `}
      role="tab"
      aria-selected={isActive || isHighlighted}
      aria-label={`${label}, ${progress}% complete`}
      style={
        (isActive || isHighlighted) && color && id !== 'All'
          ? { boxShadow: `0 0 0 1px ${color}20` }
          : {}
      }
    >
      <TinyProgressRing progress={progress} size={24} />
      <span className="whitespace-nowrap">{label}</span>
      {progress >= 90 && (
        <span className="text-xs text-emerald-600">✓</span>
      )}
    </motion.button>
  );
}
