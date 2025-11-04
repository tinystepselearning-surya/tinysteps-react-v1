/**
 * PhaseGrid.tsx
 * Responsive grid of phase cards with progress bars and quick actions
 * 3 columns desktop, 1-2 mobile
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { Phase } from "../../data/phases";
import { calculatePhaseProgress, getMilestoneStatusCounts } from "../../utils/progress";
import MilestoneDialog from "./MilestoneDialog";

interface PhaseGridProps {
  phases: Phase[];
  parentView: boolean;
}

export default function PhaseGrid({ phases, parentView }: PhaseGridProps) {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = (phase: Phase) => {
    setSelectedPhase(phase);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {phases.map((phase, index) => {
          const progress = calculatePhaseProgress(phase);
          const statusCounts = getMilestoneStatusCounts(phase);

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow hover:shadow-xl"
            >
              {/* Header with phase color */}
              <div
                className="p-4"
                style={{ backgroundColor: phase.color }}
              >
                <h3 className="text-xl font-bold text-gray-900">{phase.id}</h3>
                <p className="text-sm font-medium text-gray-700">{phase.name}</p>
                <p className="mt-1 text-xs text-gray-600">{phase.age}</p>
              </div>

              {/* Card body */}
              <div className="p-4">
                <p className="text-sm italic text-gray-600">{phase.tagline}</p>

                {/* Stats badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 border-2 border-emerald-300">
                    ✓ {statusCounts.done} done
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 border-2 border-blue-300">
                    ⏳ {statusCounts.in_progress} active
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 border-2 border-gray-300">
                    🔒 {statusCounts.locked} locked
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Overall Progress</span>
                    <span className="text-sm font-bold text-gray-900">{progress}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200 border-2 border-gray-300">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Quick actions */}
                <div className="mt-4 space-y-2">
                  {parentView ? (
                    <>
                      <button
                        onClick={() => openDialog(phase)}
                        className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      >
                        📊 View Evidence & Badges
                      </button>
                      <button
                        className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        📥 Download Progress Report
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="w-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 px-4 py-2 text-sm font-bold text-white shadow-md hover:from-orange-500 hover:to-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        🎮 {progress > 0 ? "Resume Learning" : "Start Phase"}
                      </button>
                      <button
                        onClick={() => openDialog(phase)}
                        className="w-full rounded-full border-2 border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      >
                        📋 View Milestones
                      </button>
                    </>
                  )}
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
