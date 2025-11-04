/**
 * GamesGallery.tsx (Kids Zone)
 * Phase 0-10 phonics journey with multiple view modes:
 * - Cards: Grid of phase cards
 * - Arrow Roadmap: Serpentine path with numbered nodes (scroll-snap, active sync)
 * - Step List: Dot-leader style ordered list
 */

import { useEffect, useState, useRef } from "react";
import { PHASES } from "../../data/phases";
import type { Phase } from "../../data/phases";
import PhaseChip from "../../components/gallery/PhaseChip";
import SegmentedControl, { type SegmentedOption } from "../../components/gallery/SegmentedControl";
import PhaseGrid from "../../components/phases/PhaseGrid";
import ParentViewToggle from "../../components/phases/ParentViewToggle";
import { ArrowRoadmap } from "../../components/phases/arrow";
import StepList from "../../components/phases/StepList";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useActivePhase } from "../../hooks/useActivePhase";
import { calculatePhaseProgress } from "../../utils/progress";

export type ViewMode = "cards" | "arrow" | "list";

const VIEW_OPTIONS: SegmentedOption[] = [
  { id: "cards", label: "Cards", icon: "▦" },
  { id: "arrow", label: "Arrow", icon: "↝" },
  { id: "list", label: "List", icon: "☰" },
];

export default function GamesGallery() {
  const [filter, setFilter] = useLocalStorage<string>("phaseFilter", "All");
  const [parentView, setParentView] = useLocalStorage<boolean>("parentView", false);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("viewMode", "arrow");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  const visible: Phase[] = filter === "All" ? PHASES : PHASES.filter((p) => p.id === filter);
  const activePhase = useActivePhase(visible.map(p => p.id));

  // Auto-scroll active chip into view
  useEffect(() => {
    if (activePhase && activeChipRef.current && railRef.current) {
      const chip = activeChipRef.current;
      const rail = railRef.current;
      const chipLeft = chip.offsetLeft;
      const chipWidth = chip.offsetWidth;
      const railWidth = rail.offsetWidth;
      const scrollLeft = chipLeft - railWidth / 2 + chipWidth / 2;
      
      rail.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activePhase]);

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
      <div className="mx-auto max-w-[1152px] px-4 pb-24 md:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              🎮 Phonics Journey
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Phases 0–10 • Learn by doing • Auto-personalized next step
            </p>
          </div>
          <ParentViewToggle value={parentView} onChange={setParentView} />
        </div>

        {/* Phase chip navigation rail with active phase sync */}
        <div
          ref={railRef}
          className="sticky top-16 z-20 -mx-4 mb-6 overflow-x-auto bg-gradient-to-b from-white/80 via-white/60 to-transparent px-4 py-3 backdrop-blur-sm scrollbar-hide md:-mx-6 md:px-6"
        >
          <div className="flex gap-2" role="tablist" aria-label="Phase navigation">
            {/* All chip */}
            <PhaseChip
              id="All"
              label="All"
              progress={100}
              isActive={filter === "All"}
              onClick={() => setFilter("All")}
            />

            {/* Phase chips */}
            {PHASES.map((phase) => {
              const progress = calculatePhaseProgress(phase);
              const isActiveChip = activePhase === phase.id;

              return (
                <PhaseChip
                  key={phase.id}
                  id={phase.id}
                  label={phase.id}
                  progress={progress}
                  isActive={filter === phase.id}
                  isHighlighted={isActiveChip && filter === "All"}
                  onClick={() => setFilter(phase.id)}
                  color={phase.color}
                  chipRef={isActiveChip ? activeChipRef : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* View mode segmented control */}
        <div className="mb-6 flex justify-center">
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            ariaLabel="View mode selection"
          />
        </div>

        {/* Conditional view rendering */}
        <div className="animate-fadeIn" role="tabpanel" id={`panel-${viewMode}`} aria-labelledby={`tab-${viewMode}`}>
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
          className="fixed bottom-6 left-6 z-50 flex size-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
              strokeWidth={2.5}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
