/**
 * PhaseTimeline.tsx
 * Arrow timeline with milestone dots
 * Desktop: chevron arrows with milestone indicators
 * Mobile: stacked cards
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Phase, Milestone } from "../../data/phases";
import { getStatusColor } from "../../utils/progress";

interface PhaseTimelineProps {
  phases: Phase[];
  parentView: boolean;
}

// Milestone dot indicator
function MilestoneDot({ milestone }: { milestone: Milestone }) {
  const colors = getStatusColor(milestone.status);
  
  return (
    <div className="group relative">
      <motion.div
        className={`
          size-3 rounded-full border-2 transition-all duration-200
          ${milestone.status === "done" ? `${colors.bg} border-emerald-500` : ""}
          ${milestone.status === "in_progress" ? "animate-pulse border-blue-500 bg-blue-200" : ""}
          ${milestone.status === "locked" ? "border-gray-300 bg-white" : ""}
        `}
        whileHover={{ scale: 1.3 }}
      />
      
      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 group-hover:block">
        <div className="rounded-2xl bg-gray-900 px-3 py-2 text-xs text-white shadow-xl">
          <div className="font-bold">{milestone.title}</div>
          <div className="mt-1 text-gray-300">{milestone.desc}</div>
          {milestone.kpi && milestone.kpi.length > 0 && (
            <div className="mt-1 flex gap-1">
              {milestone.kpi.map((k) => (
                <span key={k} className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                  {k}
                </span>
              ))}
            </div>
          )}
          <div className="mt-1 text-gray-400">{milestone.progress}%</div>
        </div>
        <div className="mx-auto h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

// Chevron arrow connector
function ChevronArrow({ color, isLast }: { color: string; isLast?: boolean }) {
  if (isLast) return null;
  
  return (
    <div className="relative flex items-center">
      <div
        className="h-1 w-12 rounded-full"
        style={{ backgroundColor: color }}
      />
      <svg
        className="absolute right-0"
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
      >
        <path
          d="M1 1L14 10L1 19"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Desktop timeline view
function DesktopTimeline({ phases }: { phases: Phase[] }) {
  return (
    <div className="hidden md:block">
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex items-start gap-4">
            {/* Phase section */}
            <div className="min-w-[240px]">
              {/* Phase header */}
              <div
                className="mb-3 rounded-2xl p-4 shadow-md"
                style={{ backgroundColor: phase.color }}
              >
                <div className="text-lg font-bold text-gray-900">{phase.id}</div>
                <div className="text-xs text-gray-700">{phase.age}</div>
              </div>
              
              {/* Milestones grid */}
              <div className="grid grid-cols-3 gap-2">
                {phase.milestones.map((milestone) => (
                  <MilestoneDot key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
            
            {/* Arrow connector */}
            <ChevronArrow color={phase.color} isLast={idx === phases.length - 1} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile stacked cards view
function MobileTimeline({ phases }: { phases: Phase[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4 md:hidden">
      {phases.map((phase) => {
        const isExpanded = expandedId === phase.id;
        
        return (
          <motion.div
            key={phase.id}
            className="overflow-hidden rounded-2xl shadow-lg"
            initial={false}
          >
            {/* Card header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : phase.id)}
              className="w-full p-4 text-left transition-colors"
              style={{ backgroundColor: phase.color }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900">{phase.id}</div>
                  <div className="text-sm text-gray-700">{phase.name}</div>
                  <div className="text-xs text-gray-600">{phase.age}</div>
                </div>
                <motion.svg
                  className="size-6 text-gray-700"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </button>

            {/* Expandable content */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-white"
                >
                  <div className="space-y-3 p-4">
                    <p className="text-sm italic text-gray-600">{phase.tagline}</p>
                    
                    {/* Milestones list */}
                    <div className="space-y-2">
                      {phase.milestones.map((milestone) => {
                        const colors = getStatusColor(milestone.status);
                        
                        return (
                          <div
                            key={milestone.id}
                            className={`rounded-xl border-2 p-3 ${colors.bg} ${colors.border}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${colors.text}`}>
                                    {milestone.title}
                                  </span>
                                  {milestone.status === "done" && (
                                    <span className="text-emerald-600">✓</span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-gray-600">{milestone.desc}</p>
                                
                                {milestone.kpi && milestone.kpi.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {milestone.kpi.map((k) => (
                                      <span
                                        key={k}
                                        className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                                      >
                                        {k}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {milestone.progress}%
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 transition-all duration-500"
                                style={{ width: `${milestone.progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function PhaseTimeline({ phases }: PhaseTimelineProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-md md:p-6">
      <h2 className="mb-4 text-xl font-bold text-gray-900 md:text-2xl">
        Milestone Journey
      </h2>
      <DesktopTimeline phases={phases} />
      <MobileTimeline phases={phases} />
    </div>
  );
}
