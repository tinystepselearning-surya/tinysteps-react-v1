/**
 * GamesGallery.tsx (Kids Zone)
 * Phase 0-10 phonics journey with multiple view modes:
 * - Cards: Grid of phase cards
 * - Arrow Roadmap: Serpentine path with numbered nodes (scroll-snap, active sync)
 * - Step List: Dot-leader style ordered list
 */

import { useEffect, useState } from "react";
import { PHASES } from "../../data/phases";
import type { Phase } from "../../data/phases";
import PhaseRail from "../../components/phases/PhaseRail";
import PhaseGrid from "../../components/phases/PhaseGrid";
import ParentViewToggle from "../../components/phases/ParentViewToggle";
import ViewModeTabs, { type ViewMode } from "../../components/phases/ViewModeTabs";
import { ArrowRoadmap } from "../../components/phases/arrow";
import StepList from "../../components/phases/StepList";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useActivePhase } from "../../hooks/useActivePhase";

export default function GamesGallery() {
  const [filter, setFilter] = useLocalStorage<string>("phaseFilter", "All");
  const [parentView, setParentView] = useLocalStorage<boolean>("parentView", false);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("viewMode", "arrow");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const visible: Phase[] = filter === "All" ? PHASES : PHASES.filter((p) => p.id === filter);
  const activePhase = useActivePhase(visible.map(p => p.id));

  // Mobile fallback: auto-switch to list view on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (window.matchMedia('(max-width: 768px)').matches && viewMode === 'arrow') {
        setViewMode('list');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode, setViewMode]);

  // Show back-to-top button on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              Phases 0–10 • Learn by doing • Auto-personalized next step
            </p>
          </div>
          <ParentViewToggle value={parentView} onChange={setParentView} />
        </div>

        {/* Phase rail navigation with active phase sync */}
        <PhaseRail value={filter} onChange={setFilter} activePhase={activePhase} />

        {/* View mode tabs with ARIA tablist */}
        <div className="mt-6">
          <ViewModeTabs value={viewMode} onChange={setViewMode} />
        </div>

        {/* Conditional view rendering */}
        <div className="mt-6 animate-fadeIn" role="tabpanel" id={`panel-${viewMode}`} aria-labelledby={`tab-${viewMode}`}>
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

      {/* Back to top FAB - positioned bottom-left to avoid reCAPTCHA */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-50 flex size-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-sky-400 text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Back to top"
          tabIndex={0}
        >
          <svg
            className="size-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
