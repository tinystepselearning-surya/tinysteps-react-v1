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
  const formatPhaseLabel = (id: string) => id.replace(/^P(\d+)([A-Z])?$/, (_m, n, s) => `Phase ${n}${s ?? ""}`);
  const placeTooltipBelow = y < 260; // if near top, show tooltip below the node
  
  // Circular node metrics (10% larger)
  const radius = 99; // was 90
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Circular phase node with progress ring (restored) */}
      <foreignObject x={-125} y={-125} width={250} height={250}>
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="size-[250px] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 reveal-on-scroll"
          aria-label={`${phase.name}, ${progress}% complete`}
          aria-current="step"
          tabIndex={0}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => {
            setShowTooltip(true);
            onFocus?.();
          }}
          onBlur={() => setShowTooltip(false)}
        >
          <svg viewBox="0 0 250 250" className="size-[250px]">
            {/* Background ring (faded) */}
            <circle
              cx={125}
              cy={125}
              r={radius}
              fill={phase.color}
              opacity={0.3}
              stroke={phase.color}
              strokeWidth={13}
            />
            {/* Progress ring */}
            <circle
              cx={125}
              cy={125}
              r={radius}
              fill="transparent"
              stroke={phase.color}
              strokeWidth={13}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 125 125)"
              className="transition-all duration-500"
            />
            {/* Inner circle with phase ID */}
            <circle cx={125} cy={125} r={75} fill="white" />
            <text
              x={125}
              y={125}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-2xl font-bold"
              fill="#1f2937"
            >
              {formatPhaseLabel(phase.id)}
            </text>
          </svg>
        </motion.button>
      </foreignObject>
      
      {/* Phase label under the circle */}
      <foreignObject x={-110} y={118} width={220} height={48}>
        <div className="text-center">
          <div className="text-base md:text-lg font-extrabold text-gray-800 leading-tight break-words">
            {phase.name}
          </div>
        </div>
      </foreignObject>

      {/* Labeled 'game' chips below the node (using milestones) */}
      <foreignObject x={-160} y={155} width={320} height={190}>
        <div className="mx-auto max-w-[300px] text-center">
          <div className="grid grid-cols-2 gap-2">
            {phase.milestones.slice(0, 6).map((m) => {
              const text = m.status === 'done' ? 'text-emerald-900' : m.status === 'in_progress' ? 'text-amber-900' : 'text-gray-800';
              const ring = m.status === 'done' ? 'ring-emerald-200' : m.status === 'in_progress' ? 'ring-amber-200' : 'ring-gray-200';
              return (
                <span
                  key={m.id}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white ring-1 ${ring} ${text} shadow-sm overflow-hidden w-full`}
                  title={`${m.title} — ${m.progress}% • ${m.desc}`}
                  style={{ minWidth: 0 }}
                >
                  <span
                    className="absolute inset-0 -z-10 rounded-full opacity-40"
                    style={{
                      width: `${Math.max(0, Math.min(100, m.progress))}%`,
                      background: m.status === 'locked' ? '#9ca3af' : undefined,
                      backgroundImage:
                        m.status !== 'locked'
                          ? `linear-gradient(90deg, ${m.status === 'done' ? '#10b981' : '#f59e0b'} 0%, ${m.status === 'done' ? '#065f46' : '#b45309'} 100%)`
                          : undefined,
                    }}
                    aria-hidden="true"
                  />
                  <span className="whitespace-normal break-words leading-tight line-clamp-2">{m.title}</span>
                  <span className="ml-1 text-[10px] opacity-80">{m.progress}%</span>
                </span>
              );
            })}
          </div>
        </div>
      </foreignObject>
      
      {/* Tooltip on hover - MUCH LARGER with all details */}
      {showTooltip && (
        <foreignObject x={-160} y={placeTooltipBelow ? 190 : -220} width={320} height={220}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900 p-5 text-white shadow-2xl"
          >
            <div className="border-b border-gray-700 pb-3">
              <div className="text-lg font-bold">{phase.name}</div>
              <div className="mt-1 text-sm text-gray-300">{phase.age} • {phase.tagline}</div>
            </div>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Overall Progress:</span>
                <span className="text-lg font-bold text-emerald-400">{progress}%</span>
              </div>
              
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="text-base">✓</span> {statusCounts.done} Complete
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="text-base">•</span> {statusCounts.in_progress} Active
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <span className="text-base">🔒</span> {statusCounts.locked} Locked
                </span>
              </div>
              
              <div className="mt-3 text-xs text-gray-400">
                {phase.milestones.length} Milestone{phase.milestones.length !== 1 ? 's' : ''} Total
              </div>
            </div>
            
            <div className="mt-3 text-center text-xs font-medium text-blue-300">
              Click to view details →
            </div>
          </motion.div>
        </foreignObject>
      )}
    </g>
  );
}
