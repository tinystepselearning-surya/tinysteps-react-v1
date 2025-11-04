/**
 * PhaseRail.tsx
 * Horizontal sticky chip rail for phase navigation
 * Features: All + P0-P10, circular progress rings, keyboard nav, active sync, auto-scroll
 */

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PHASES } from "../../data/phases";
import { calculatePhaseProgress } from "../../utils/progress";
import type { PhaseID } from "../../data/phases";

interface PhaseRailProps {
  value: string; // "All" or PhaseID
  onChange: (value: string) => void;
  activePhase?: PhaseID | null; // Track active phase from scroll
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
  isHighlighted,
  onClick,
  color,
  chipRef,
}: {
  id: string;
  label: string;
  progress?: number;
  isActive: boolean;
  isHighlighted?: boolean;
  onClick: () => void;
  color?: string;
  chipRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <motion.button
      ref={chipRef}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`
        group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-md
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${
          isActive
            ? "bg-white text-gray-900 shadow-lg ring-2 ring-blue-400"
            : isHighlighted
            ? "bg-white text-gray-900 shadow-lg ring-2 ring-orange-400"
            : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-lg"
        }
      `}
      role="tab"
      aria-selected={isActive || isHighlighted}
      aria-label={`${label}${progress !== undefined ? `, ${progress}% complete` : ""}`}
      style={
        (isActive || isHighlighted) && color && id !== "All"
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

export default function PhaseRail({ value, onChange, activePhase }: PhaseRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active chip into view
  useEffect(() => {
    if (activePhase && activeChipRef.current && railRef.current) {
      const chip = activeChipRef.current;
      const rail = railRef.current;
      const chipLeft = chip.offsetLeft;
      const chipWidth = chip.offsetWidth;
      const railWidth = rail.offsetWidth;
      const scrollLeft = chipLeft - railWidth / 2 + chipWidth / 2;
      
      rail.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activePhase]);

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
          const isActiveChip = activePhase === phase.id;
          
          return (
            <PhaseChip
              key={phase.id}
              id={phase.id}
              label={phase.id}
              progress={progress}
              isActive={value === phase.id}
              isHighlighted={isActiveChip && value === "All"}
              onClick={() => onChange(phase.id)}
              color={phase.color}
              chipRef={isActiveChip ? activeChipRef : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
