/**
 * MilestoneDialog.tsx
 * Modal showing full milestone list with progress and CTAs
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Phase } from "../../data/phases";
import { getStatusColor } from "../../utils/progress";

interface MilestoneDialogProps {
  phase: Phase | null;
  isOpen: boolean;
  onClose: () => void;
  parentView: boolean;
}

export default function MilestoneDialog({
  phase,
  isOpen,
  onClose,
  parentView,
}: MilestoneDialogProps) {
  if (!phase) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              {/* Header */}
              <div
                className="p-6"
                style={{ backgroundColor: phase.color }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{phase.name}</h2>
                    <p className="mt-1 text-sm text-gray-700">{phase.age} • {phase.tagline}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full bg-white/80 p-2 text-gray-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                    aria-label="Close dialog"
                  >
                    <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Milestones list */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                <div className="space-y-4">
                  {phase.milestones.map((milestone) => {
                    const colors = getStatusColor(milestone.status);

                    return (
                      <div
                        key={milestone.id}
                        className={`rounded-2xl border-2 p-4 ${colors.bg} ${colors.border}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-lg font-bold ${colors.text}`}>
                                {milestone.title}
                              </h3>
                              {milestone.status === "done" && (
                                <span className="text-emerald-600">✓</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{milestone.desc}</p>

                            {milestone.kpi && milestone.kpi.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {milestone.kpi.map((k) => (
                                  <span
                                    key={k}
                                    className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-gray-700"
                                  >
                                    📊 {k}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {milestone.progress}%
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {milestone.status === "done" && "Complete"}
                              {milestone.status === "in_progress" && "In Progress"}
                              {milestone.status === "locked" && "Locked"}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 transition-all duration-500"
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>

                        {/* CTA button */}
                        <div className="mt-3">
                          {parentView ? (
                            <button
                              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                              disabled={milestone.status === "locked"}
                            >
                              📄 View Evidence & Reports
                            </button>
                          ) : (
                            <button
                              className="w-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 px-4 py-2 text-sm font-bold text-white hover:from-orange-500 hover:to-sky-500 disabled:opacity-50"
                              disabled={milestone.status === "locked"}
                            >
                              {milestone.status === "done" ? "🎮 Play Again" : "🎮 Play This Game"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
