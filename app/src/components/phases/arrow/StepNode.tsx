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
  
  // SVG circle progress ring calculations - LARGER SIZE
  const radius = 40; // Increased from 24 to 40
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
      {/* Interactive button wrapper - LARGER SIZE */}
      <foreignObject x={-50} y={-50} width={100} height={100}>
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="size-[100px] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={`${phase.name}, ${progress}% complete`}
          aria-current="step"
          tabIndex={0}
        >
          {/* Background circle with phase color */}
          <svg viewBox="0 0 100 100" className="size-[100px]">
            {/* Background ring (faded) */}
            <circle
              cx={50}
              cy={50}
              r={radius}
              fill={phase.color}
              opacity={0.3}
              stroke={phase.color}
              strokeWidth={8}
            />
            
            {/* Progress ring */}
            <circle
              cx={50}
              cy={50}
              r={radius}
              fill="transparent"
              stroke={phase.color}
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="transition-all duration-500"
            />
            
            {/* Inner circle with phase ID */}
            <circle cx={50} cy={50} r={30} fill="white" />
            <text
              x={50}
              y={50}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-lg font-bold"
              fill="#1f2937"
            >
              {phase.id}
            </text>
          </svg>
        </motion.button>
      </foreignObject>
      
      {/* Caption card below node - ADJUSTED POSITION */}
      <foreignObject x={-80} y={55} width={160} height={80}>
        <div className="text-center">
          <div className="text-sm font-bold text-gray-900">{phase.name}</div>
          <div className="text-xs text-gray-500">{phase.age}</div>
          <div className="mt-1 line-clamp-2 text-xs italic text-gray-600">
            {phase.tagline}
          </div>
        </div>
      </foreignObject>
      
      {/* Tooltip on hover - ADJUSTED POSITION */}
      {showTooltip && (
        <foreignObject x={-100} y={-140} width={200} height={100}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900 p-4 text-white shadow-xl"
          >
            <div className="text-sm font-bold">{phase.name}</div>
            <div className="mt-1 text-xs text-gray-300">{phase.tagline}</div>
            <div className="mt-2 flex gap-3 text-xs">
              <span className="text-emerald-400">✓ {statusCounts.done}</span>
              <span className="text-blue-400">• {statusCounts.in_progress}</span>
              <span className="text-gray-400">🔒 {statusCounts.locked}</span>
            </div>
            <div className="mt-2 text-sm font-bold">{progress}% Complete</div>
          </motion.div>
        </foreignObject>
      )}
    </g>
  );
}
