/**
 * StepNode.tsx
 * Circular phase node with progress ring, label card, and tooltip
 * Used in Arrow Roadmap view
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { Phase } from "../../../data/phases";
import { calculatePhaseProgress, getMilestoneStatusCounts } from "../../../utils/progress";

interface StepNodeProps {
  phase: Phase;
  x: number;
  y: number;
  index: number;
  onClick: () => void;
  onFocus?: () => void;
}

export default function StepNode({ phase, x, y, onClick, onFocus }: StepNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const progress = calculatePhaseProgress(phase);
  const statusCounts = getMilestoneStatusCounts(phase);
  
  // SVG circle progress ring calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => {
        setShowTooltip(true);
        onFocus?.();
      }}
      onBlur={() => setShowTooltip(false)}
    >
      {/* Interactive button wrapper */}
      <foreignObject x={-28} y={-28} width={56} height={56}>
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="size-14 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={`${phase.name}, ${progress}% complete`}
          aria-current="step"
          tabIndex={0}
        >
          {/* Background circle with phase color */}
          <svg viewBox="0 0 56 56" className="size-14">
            {/* Background ring (faded) */}
            <circle
              cx={28}
              cy={28}
              r={radius}
              fill={phase.color}
              opacity={0.3}
              stroke={phase.color}
              strokeWidth={6}
            />
            
            {/* Progress ring */}
            <circle
              cx={28}
              cy={28}
              r={radius}
              fill="transparent"
              stroke={phase.color}
              strokeWidth={6}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              className="transition-all duration-500"
            />
            
            {/* Inner circle with phase ID */}
            <circle cx={28} cy={28} r={18} fill="white" />
            <text
              x={28}
              y={28}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-bold"
              fill="#1f2937"
            >
              {phase.id}
            </text>
          </svg>
        </motion.button>
      </foreignObject>
      
      {/* Caption card below node */}
      <foreignObject x={-60} y={35} width={120} height={60}>
        <div className="text-center">
          <div className="text-xs font-bold text-gray-900">{phase.name}</div>
          <div className="text-[10px] text-gray-500">{phase.age}</div>
          <div className="mt-1 line-clamp-1 text-[10px] italic text-gray-600">
            {phase.tagline}
          </div>
        </div>
      </foreignObject>
      
      {/* Tooltip on hover */}
      {showTooltip && (
        <foreignObject x={-80} y={-120} width={160} height={80}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900 p-3 text-white shadow-xl"
          >
            <div className="text-xs font-bold">{phase.name}</div>
            <div className="mt-1 text-[10px] text-gray-300">{phase.tagline}</div>
            <div className="mt-2 flex gap-2 text-[10px]">
              <span className="text-emerald-400">✓ {statusCounts.done}</span>
              <span className="text-blue-400">• {statusCounts.in_progress}</span>
              <span className="text-gray-400">🔒 {statusCounts.locked}</span>
            </div>
            <div className="mt-1 text-xs font-bold">{progress}% Complete</div>
          </motion.div>
        </foreignObject>
      )}
    </g>
  );
}
