/**
 * GamesGallery.tsx (Kids Zone)
 * Phase 0-10 phonics journey with milestones, timeline, and parent view
 */

import { useEffect } from "react";
import { PHASES } from "../../data/phases";
import type { Phase } from "../../data/phases";
import PhaseRail from "../../components/phases/PhaseRail";
import PhaseTimeline from "../../components/phases/PhaseTimeline";
import PhaseGrid from "../../components/phases/PhaseGrid";
import ParentViewToggle from "../../components/phases/ParentViewToggle";
import { useLocalStorage } from "../../hooks/useLocalStorage";

export default function GamesGallery() {
  const [filter, setFilter] = useLocalStorage<string>("phaseFilter", "All");
  const [parentView, setParentView] = useLocalStorage<boolean>("parentView", false);

  const visible: Phase[] = filter === "All" ? PHASES : PHASES.filter((p) => p.id === filter);

  // Update localStorage when filter changes
  useEffect(() => {
    localStorage.setItem("phaseFilter", filter);
  }, [filter]);

  // Update localStorage when parentView changes
  useEffect(() => {
    localStorage.setItem("parentView", parentView.toString());
  }, [parentView]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-rose-50">
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              🎮 Phonics Journey
            </h1>
            <p className="mt-1 text-sm text-gray-600 md:text-base">
              Phases 0–10: Master phonics through engaging milestones
            </p>
          </div>
          <ParentViewToggle value={parentView} onChange={setParentView} />
        </div>

        {/* Phase rail navigation */}
        <PhaseRail value={filter} onChange={setFilter} />

        {/* Timeline view */}
        <div className="mt-6">
          <PhaseTimeline phases={visible} parentView={parentView} />
        </div>

        {/* Grid view */}
        <div className="mt-8">
          <PhaseGrid phases={visible} parentView={parentView} />
        </div>
      </div>
    </div>
  );
}
