/**
 * PhaseGrid.tsx
 * Responsive grid of phase cards with progress bars and quick actions
 * Optimized with lazy loading, prefetch, and accessibility
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Phase } from "../../data/phases";
import { calculatePhaseProgress, getMilestoneStatusCounts } from "../../utils/progress";
import MilestoneDialog from "./MilestoneDialog";
import EmptyState from "./EmptyState";

interface PhaseGridProps {
  phases: Phase[];
  parentView: boolean;
}

export default function PhaseGrid({ phases, parentView }: PhaseGridProps) {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const openDialog = (phase: Phase) => {
    setSelectedPhase(phase);
    setIsDialogOpen(true);
  };

  const handlePhaseClick = (phaseId: string) => {
    navigate(`/kids/phase/${phaseId}`);
  };

  const prefetchPhase = (phaseId: string) => {
    // Prefetch route on hover for faster navigation
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/kids/phase/${phaseId}`;
    document.head.appendChild(link);
  };

  if (phases.length === 0) {
    return <EmptyState message="No phases match your current filter" icon="🔍" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {phases.map((phase, index) => {
          const progress = calculatePhaseProgress(phase);
          const statusCounts = getMilestoneStatusCounts(phase);

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => prefetchPhase(phase.id)}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-orange-100/50 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Phase badge - top left */}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-gray-900 shadow-sm border border-gray-200">
                  {phase.id}
                </span>
              </div>

              {/* Header with phase color */}
              <div
                className="px-4 pt-12 pb-4 border-b border-gray-100"
                style={{ backgroundColor: phase.color, opacity: 0.15 }}
              >
                <div className="relative" style={{ backgroundColor: phase.color }}>
                  <h3 className="text-xl font-semibold tracking-tight text-gray-900">{phase.name}</h3>
                  <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">{phase.tagline}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500">Age {phase.age}</p>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                {/* Stats badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {statusCounts.done}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    {statusCounts.in_progress}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600 border border-gray-200">
                    <span className="size-1.5 rounded-full bg-gray-400" />
                    {statusCounts.locked}
                  </span>
                </div>

                {/* Quick actions */}
                <div className="mt-4 space-y-2">
                  {parentView ? (
                    <>
                      <button
                        onClick={() => openDialog(phase)}
                        className="w-full min-h-[56px] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
                      >
                        📊 View Evidence & Badges
                      </button>
                      <button
                        className="w-full min-h-[56px] rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                      >
                        📥 Download Progress Report
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePhaseClick(phase.id)}
                        className="w-full min-h-[56px] rounded-xl bg-gradient-to-r from-orange-400 to-sky-400 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-orange-500 hover:to-sky-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all"
                      >
                        🎮 {progress > 0 ? "Resume Learning" : "Start Phase"}
                      </button>
                      <button
                        onClick={() => openDialog(phase)}
                        className="w-full min-h-[56px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                      >
                        📋 View Milestones
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom progress bar */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-600">Progress</span>
                  <span className="font-bold text-gray-900">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Milestone dialog */}
      <MilestoneDialog
        phase={selectedPhase}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        parentView={parentView}
      />
    </>
  );
}
