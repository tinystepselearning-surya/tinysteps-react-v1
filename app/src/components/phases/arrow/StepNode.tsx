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
      <foreignObject x={-110} y={118} width={220} height={50}>
        <div className="text-center">
          <div className="text-base font-extrabold text-gray-800 leading-tight break-words">
            {phase.name}
          </div>
        </div>
      </foreignObject>

      {/* Labeled 'game' chips below the node (using milestones) */}
      <foreignObject x={-160} y={165} width={320} height={180}>
        <div className="mx-auto max-w-[300px] text-center">
          <div className="grid grid-cols-2 gap-2">
            {phase.milestones.slice(0, 6).map((m) => {
              const fillColor = m.status === 'done' ? '#10b981' : m.status === 'in_progress' ? '#f59e0b' : '#9ca3af';
              const text = m.status === 'done' ? 'text-emerald-900' : m.status === 'in_progress' ? 'text-amber-900' : 'text-gray-700';
              const ring = m.status === 'done' ? 'ring-emerald-200' : m.status === 'in_progress' ? 'ring-amber-200' : 'ring-gray-200';
              return (
                <button
                  key={m.id}
                  className={`group relative flex flex-col items-start justify-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold bg-white ring-1 ${ring} ${text} shadow-sm overflow-hidden w-full text-left min-h-[2.5rem] hover:ring-2 hover:ring-blue-400 transition-all`}
                  title={`${m.title} — ${m.progress}%`}
                >
                  <span
                    className="absolute inset-0 -z-10 rounded-lg opacity-40"
                    style={{ width: `${Math.max(0, Math.min(100, m.progress))}%`, background: fillColor }}
                    aria-hidden="true"
                  />
                  <span className="line-clamp-2 leading-tight pr-1">{m.title}</span>
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-70">{m.progress}%</span>
                  
                  {/* Game insights tooltip on hover */}
                  <span className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-48 rounded-lg bg-gray-800 px-3 py-2 text-[10px] text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="font-bold text-xs mb-1">{m.title}</div>
                    <div className="text-gray-300">{m.desc}</div>
                    <div className="mt-1 flex items-center justify-between text-[9px]">
                      <span className="capitalize">{m.status.replace('_', ' ')}</span>
                      <span className="font-semibold">{m.progress}%</span>
                    </div>
                    {m.kpi && m.kpi.length > 0 && (
                      <div className="mt-1 text-[9px] text-blue-300">
                        KPIs: {m.kpi.join(', ')}
                      </div>
                    )}
                  </span>
                </button>
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
