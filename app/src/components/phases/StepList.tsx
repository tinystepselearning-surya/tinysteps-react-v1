/**
 * StepList.tsx
 * Dot-leader style ordered list of phases
 * Numbered circles on left, thin leader line, right-aligned label with milestone counts
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { Phase } from "../../data/phases";
import { calculatePhaseProgress, getMilestoneStatusCounts } from "../../utils/progress";
import MilestoneDialog from "./MilestoneDialog";

interface StepListProps {
  phases: Phase[];
  parentView: boolean;
}

export default function StepList({ phases, parentView }: StepListProps) {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const openDialog = (phase: Phase) => {
    setSelectedPhase(phase);
    setIsDialogOpen(true);
  };
  
  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-md md:p-6">
        <ol className="space-y-4">
          {phases.map((phase, index) => {
            const progress = calculatePhaseProgress(phase);
            const statusCounts = getMilestoneStatusCounts(phase);
            
            return (
              <motion.li
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <button
                  onClick={() => openDialog(phase)}
                  className="flex w-full items-center gap-4 rounded-2xl p-4 transition-all hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  {/* Left: Numbered circle */}
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-full text-lg font-bold text-white shadow-md"
                    style={{ backgroundColor: phase.color }}
                  >
                    {index + 1}
                  </div>
                  
                  {/* Center: Leader line */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                      <div
                        className="h-[2px] w-full"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${phase.color}20 0%, ${phase.color}40 50%, ${phase.color}20 100%)`,
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Right: Label block */}
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-3">
                      {/* Phase info */}
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {phase.id} • {phase.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {phase.age} • {phase.tagline}
                        </div>
                      </div>
                      
                      {/* Milestone badges */}
                      <div className="flex gap-2">
                        {statusCounts.done > 0 && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 border border-emerald-300">
                            ✓ {statusCounts.done}
                          </span>
                        )}
                        {statusCounts.in_progress > 0 && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700 border border-blue-300">
                            • {statusCounts.in_progress}
                          </span>
                        )}
                        {statusCounts.locked > 0 && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 border border-gray-300">
                            🔒 {statusCounts.locked}
                          </span>
                        )}
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ol>
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
