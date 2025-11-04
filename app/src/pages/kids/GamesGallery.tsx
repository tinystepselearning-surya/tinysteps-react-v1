/**
 * GamesGallery.tsx (Kids Zone)
 * Phase 0-10 phonics journey with multiple view modes:
 * - Cards: Grid of phase cards
 * - Arrow Roadmap: Serpentine path with numbered nodes
 * - Step List: Dot-leader style ordered list
 */

import { useEffect } from "react";
import { PHASES } from "../../data/phases";
import type { Phase } from "../../data/phases";
import PhaseRail from "../../components/phases/PhaseRail";
import PhaseGrid from "../../components/phases/PhaseGrid";
import ParentViewToggle from "../../components/phases/ParentViewToggle";
import ViewModeTabs, { type ViewMode } from "../../components/phases/ViewModeTabs";
import { ArrowRoadmap } from "../../components/phases/arrow";
import StepList from "../../components/phases/StepList";
import { useLocalStorage } from "../../hooks/useLocalStorage";

export default function GamesGallery() {
  const [filter, setFilter] = useLocalStorage<string>("phaseFilter", "All");
  const [parentView, setParentView] = useLocalStorage<boolean>("parentView", false);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("viewMode", "arrow");

  const visible: Phase[] = filter === "All" ? PHASES : PHASES.filter((p) => p.id === filter);

  // Update localStorage when states change
  useEffect(() => {
    localStorage.setItem("phaseFilter", filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem("parentView", parentView.toString());
  }, [parentView]);

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

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

        {/* View mode tabs */}
        <div className="mt-6">
          <ViewModeTabs value={viewMode} onChange={setViewMode} />
        </div>

        {/* Conditional view rendering */}
  <div className="mt-6 animate-fadeIn" role="tabpanel" id={`panel-${viewMode}`}>
          {viewMode === "cards" && (
            <PhaseGrid phases={visible} parentView={parentView} />
          )}
          
          {viewMode === "arrow" && (
            <ArrowRoadmap phases={visible} parentView={parentView} />
          )}
          
          {viewMode === "list" && (
            <StepList phases={visible} parentView={parentView} />
          )}
        </div>
      </div>
    </div>
  );
}
