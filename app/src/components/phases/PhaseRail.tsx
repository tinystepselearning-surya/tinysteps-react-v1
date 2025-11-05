/**
 * PhaseRail.tsx
 * Horizontal sticky chip rail for phase navigation
 * Features: All + P0-P10, circular progress rings, keyboard nav, localStorage
 */

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PHASES } from "../../data/phases";
import { calculatePhaseProgress } from "../../utils/progress";

interface PhaseRailProps {
  value: string; // "All" or PhaseID
  onChange: (value: string) => void;
}

// Circular progress ring component
function ProgressRing({ progress, size = 32 }: { progress: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 80) return "#10b981"; // emerald
    if (progress >= 60) return "#3b82f6"; // blue
    if (progress >= 40) return "#f59e0b"; // amber
    if (progress >= 20) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={3}
        className="fill-none stroke-gray-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={3}
        className="fill-none transition-all duration-500"
        stroke={getColor()}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Individual chip
function PhaseChip({
  id,
  label,
  progress,
  isActive,
  onClick,
  color,
}: {
  id: string;
  label: string;
  progress?: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`
        group relative flex items-center gap-2 rounded-full px-3 py-2 min-h-[56px] text-sm font-semibold shadow-sm
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${
          isActive
            ? "bg-white text-gray-900 shadow-md ring-2 ring-blue-400"
            : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
        }
      `}
      aria-pressed={isActive}
      aria-label={`${label}${progress !== undefined ? `, ${progress}% complete` : ""}`}
      style={
        isActive && color && id !== "All"
          ? { borderLeft: `4px solid ${color}` }
          : {}
      }
    >
      {progress !== undefined ? (
        <ProgressRing progress={progress} size={28} />
      ) : (
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-r from-orange-400 to-sky-400 text-xs text-white shadow">
          ★
        </div>
      )}
      <span className="whitespace-nowrap">{label}</span>
      {progress !== undefined && progress >= 80 && (
        <span className="text-emerald-600">✓</span>
      )}
    </motion.button>
  );
}

export default function PhaseRail({ value, onChange }: PhaseRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!railRef.current?.contains(document.activeElement)) return;

      const allIds = ["All", ...PHASES.map((p) => p.id)];
      const currentIndex = allIds.indexOf(value);

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        onChange(allIds[currentIndex - 1]);
      } else if (e.key === "ArrowRight" && currentIndex < allIds.length - 1) {
        e.preventDefault();
        onChange(allIds[currentIndex + 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [value, onChange]);

  return (
    <div className="sticky top-16 z-20 -mx-4 bg-gradient-to-b from-white via-orange-50/30 to-transparent px-4 py-3 shadow-sm backdrop-blur-sm md:-mx-6 md:px-6">
      <div
        ref={railRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        role="tablist"
        aria-label="Phase navigation"
      >
        {/* All chip */}
        <PhaseChip
          id="All"
          label="All Phases"
          isActive={value === "All"}
          onClick={() => onChange("All")}
        />

        {/* Phase chips */}
        {PHASES.map((phase) => {
          const progress = calculatePhaseProgress(phase);
          return (
            <PhaseChip
              key={phase.id}
              id={phase.id}
              label={phase.id}
              progress={progress}
              isActive={value === phase.id}
              onClick={() => onChange(phase.id)}
              color={phase.color}
            />
          );
        })}
      </div>
    </div>
  );
}
