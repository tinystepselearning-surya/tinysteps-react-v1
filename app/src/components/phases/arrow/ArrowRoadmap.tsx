/**
 * ArrowRoadmap.tsx
 * Serpentine arrow roadmap visualization with StepNodes
 * Features: scroll-snap sections, next recommended actions, legend
 * Desktop: S-curve path with horizontal scrolling (3 phases per row)
 * Mobile: vertical zig-zag
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Phase } from "../../../data/phases";
import { useWaypoints, createCurvedPath } from "./useWaypoints";
import StepNode from "./StepNode";
import SubSkillList from "../SubSkillList";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

interface ArrowRoadmapProps {
  phases: Phase[];
  parentView: boolean;
}

// Helper: Find next recommended milestone (<80% progress)
function getNextRecommended(phase: Phase) {
  return phase.milestones.find((m) => m.progress < 80 && m.status !== 'locked');
}

// Helper: Format phase header with name
function formatPhaseHeader(phase: Phase) {
  const code = phase.id.replace(/^P(\d+)([A-Z])?$/, (_m, n, s) => `P${n}${s ?? ""}`);
  return `${code} — ${phase.name}`;
}

export default function ArrowRoadmap({ phases, parentView }: ArrowRoadmapProps) {
  const reducedMotion = useReducedMotion();
  
  // Compute a dynamic row gap based on the maximum number of labeled chips per phase
  // We render up to 6 chips and roughly fit 2 per row; adjust gap to avoid overlap between rows
  const maxChips = Math.max(0, ...phases.map(p => Math.min(6, p.milestones.length)));
  const estimatedChipRows = Math.ceil(maxChips / 2) || 1;
  const dynamicRowGap = 450 + estimatedChipRows * 36; // increased base for sub-skill list
  const { containerRef, waypoints, dimensions } = useWaypoints(phases.length, {
    // cols omitted → 1 on small phones, 2 otherwise (inside hook)
    top: 160,
    rowGap: dynamicRowGap,
    bottom: 400,
  });
  const navigate = useNavigate();
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const pathData = createCurvedPath(waypoints);
  
  // Navigate to phase detail page
  const openPhaseDetail = (phase: Phase) => {
    navigate(`/kids/phase/${phase.id}`);
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      if (e.key === "ArrowRight" && focusedIndex < phases.length - 1) {
        e.preventDefault();
        setFocusedIndex(focusedIndex + 1);
      } else if (e.key === "ArrowLeft" && focusedIndex > 0) {
        e.preventDefault();
        setFocusedIndex(focusedIndex - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        openPhaseDetail(phases[focusedIndex]);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, phases, containerRef, navigate]);

  // Scroll-reveal fade-in for roadmap container and child nodes
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal-on-scroll'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add('is-visible');
          obs.unobserve(el);
        }
      });
    }, { root, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [containerRef, waypoints.length]);
  
  if (waypoints.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex min-h-[500px] items-center justify-center rounded-2xl bg-white p-6 shadow-md"
      >
        <div className="text-gray-500">Loading roadmap...</div>
      </div>
    );
  }
  
  return (
    <>
      <style>{`
        .arrow-roadmap-scroll::-webkit-scrollbar {
          height: 12px;
        }
        .arrow-roadmap-scroll::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 10px;
        }
        .arrow-roadmap-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #ffa94d, #6ec1e4);
          border-radius: 10px;
        }
        .arrow-roadmap-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #ff9020, #5ab0d8);
        }
        .phase-section {
          scroll-snap-align: start;
          scroll-margin-top: 2rem;
        }
      `}</style>
      
      {/* Legend - shows progress thresholds */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-white/80 px-4 py-2 text-xs font-medium shadow-sm backdrop-blur">
        <span className="text-gray-600">Progress:</span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-full bg-red-500" />
          0–39%
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-full bg-amber-500" />
          40–69%
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-full bg-emerald-500" />
          70–89%
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-full bg-blue-500" />
          90–100%
        </span>
      </div>
      
      <div
        ref={containerRef}
        className="arrow-roadmap-scroll overflow-x-hidden overflow-y-visible rounded-2xl bg-gradient-to-br from-[#FFE8CC] via-[#E6F3FF] to-[#F7E8FF] p-8 shadow-md md:p-10 reveal-on-scroll animate-fadeIn"
        style={{
          scrollBehavior: "smooth",
          scrollbarWidth: "thin",
          scrollbarColor: "#6ec1e4 #f0f0f0",
          scrollSnapType: "y proximity",
        }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="min-w-full"
          style={{ display: "block" }}
        >
          {/* Gradient definition for path */}
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffa94d" stopOpacity={0.6} />
              <stop offset="50%" stopColor="#6ec1e4" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#c084fc" stopOpacity={0.6} />
            </linearGradient>
            
            {/* Arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#6ec1e4" />
            </marker>
            {/* Segment arrow marker for connectors between circles */}
            <marker
              id="arrowheadSegment"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#5ab0d8" />
            </marker>
          </defs>
          
          {/* Main serpentine path */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerMid="url(#arrowhead)"
            initial={reducedMotion ? {} : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Step nodes wrapped in sections with data-phase */}
          {waypoints.map((waypoint, index) => {
            const phase = phases[index];
            if (!phase) return null;
            
            const nextRec = getNextRecommended(phase);
            
            return (
              <g key={phase.id}>
                <StepNode
                  phase={phase}
                  x={waypoint.x}
                  y={waypoint.y}
                  index={index}
                  onClick={() => openPhaseDetail(phase)}
                  onFocus={() => setFocusedIndex(index)}
                />
                
                {/* Phase detail card below node */}
                <foreignObject
                  x={waypoint.x - 200}
                  y={waypoint.y + 200}
                  width={400}
                  height={300}
                  data-phase={phase.id}
                  className="phase-section"
                >
                  <section
                    id={`phase-${phase.id}`}
                    data-phase={phase.id}
                    className="rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur"
                  >
                    {/* Phase header with renamed label */}
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      {formatPhaseHeader(phase)}
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">{phase.tagline}</p>
                    
                    {/* Next recommended action */}
                    {nextRec && (
                      <div className="mb-3 rounded-lg bg-gradient-to-r from-orange-50 to-sky-50 p-3">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Next Recommended
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold text-gray-900">
                              {nextRec.title}
                            </div>
                            <div className="text-xs text-gray-600">{nextRec.progress}% complete</div>
                          </div>
                          <button
                            onClick={() => navigate(`/kids/game/${nextRec.id}`)}
                            className="shrink-0 rounded-full bg-gradient-to-r from-orange-400 to-sky-400 px-4 py-2 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          >
                            {nextRec.progress > 0 ? 'Resume' : 'Play'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Sub-skills list */}
                    {!parentView && phase.milestones.length > 0 && (
                      <div className="max-h-40 overflow-y-auto">
                        <SubSkillList milestones={phase.milestones} compact />
                      </div>
                    )}
                    
                    {parentView && (
                      <div className="text-xs text-gray-500">
                        {phase.milestones.length} skills • Ages {phase.age}
                      </div>
                    )}
                  </section>
                </foreignObject>
              </g>
            );
          })}
          
          {/* Labeled chips are now rendered below each node inside StepNode; SVG dots omitted to reduce clutter */}
        </svg>
      </div>
    </>
  );
}
