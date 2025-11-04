/**
 * progress.ts
 * Utility functions for calculating phase and milestone progress
 */

import type { Phase, Milestone } from "../data/phases";

/**
 * Calculate overall progress percentage for a phase
 * based on average of all milestone progress values
 */
export function calculatePhaseProgress(phase: Phase): number {
  if (!phase.milestones || phase.milestones.length === 0) {
    return 0;
  }

  const total = phase.milestones.reduce((sum, milestone) => sum + milestone.progress, 0);
  return Math.round(total / phase.milestones.length);
}

/**
 * Get count of milestones by status
 */
export function getMilestoneStatusCounts(phase: Phase) {
  const counts = {
    done: 0,
    in_progress: 0,
    locked: 0,
  };

  phase.milestones.forEach((milestone) => {
    counts[milestone.status]++;
  });

  return counts;
}

/**
 * Determine if a phase is unlocked (has at least one non-locked milestone)
 */
export function isPhaseUnlocked(phase: Phase): boolean {
  return phase.milestones.some((m) => m.status !== "locked");
}

/**
 * Determine if a phase is completed (all milestones done)
 */
export function isPhaseComplete(phase: Phase): boolean {
  return phase.milestones.every((m) => m.status === "done");
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(progress: number): string {
  if (progress >= 80) return "#10b981"; // emerald-500
  if (progress >= 60) return "#3b82f6"; // blue-500
  if (progress >= 40) return "#f59e0b"; // amber-500
  if (progress >= 20) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

/**
 * Get status badge color
 */
export function getStatusColor(status: Milestone["status"]): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "done":
      return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" };
    case "in_progress":
      return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" };
    case "locked":
      return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-300" };
  }
}
