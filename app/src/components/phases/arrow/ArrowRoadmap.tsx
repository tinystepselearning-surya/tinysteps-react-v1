/**
 * ArrowRoadmap.tsx
 * Serpentine arrow roadmap visualization with StepNodes and milestone dots
 * Desktop: S-curve path with horizontal scrolling (3 phases per row)
 * Mobile: vertical zig-zag
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Phase, Milestone } from "../../../data/phases";
import { useWaypoints, createCurvedPath } from "./useWaypoints";
import StepNode from "./StepNode";
import MilestoneDialog from "../MilestoneDialog";

interface ArrowRoadmapProps {
  phases: Phase[];
  parentView: boolean;
}

// Milestone dot component
function MilestoneDot({
  milestone,
  x,
  y,
}: {
  milestone: Milestone;
  x: number;
  y: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getColorClass = () => {
    if (milestone.status === "done") return "fill-emerald-500";
    if (milestone.status === "in_progress") return "fill-amber-400";
    return "fill-gray-300";
  };
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Milestone dot */}
      <circle
        r={milestone.status === "in_progress" ? 5 : 4}
        className={`${getColorClass()} ${
          milestone.status === "in_progress" ? "animate-pulse" : ""
        }`}
        stroke={milestone.status === "locked" ? "#cbd5e1" : "none"}
        strokeWidth={milestone.status === "locked" ? 2 : 0}
      />
      
      {/* Tooltip */}
      {showTooltip && (
        <foreignObject x={-60} y={-50} width={120} height={40}>
          <div className="rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white shadow-lg">
            <div className="font-bold">{milestone.title}</div>
            <div className="text-gray-300">{milestone.progress}%</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default function ArrowRoadmap({ phases, parentView }: ArrowRoadmapProps) {
  const { containerRef, waypoints, dimensions } = useWaypoints(phases.length);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const pathData = createCurvedPath(waypoints);
  
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
        openDialog(phases[focusedIndex]);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, phases, containerRef]);
  
  const openDialog = (phase: Phase) => {
    setSelectedPhase(phase);
    setIsDialogOpen(true);
  };
  
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
      `}</style>
      <div
        ref={containerRef}
        className="arrow-roadmap-scroll overflow-x-auto overflow-y-hidden rounded-2xl bg-gradient-to-br from-[#FFE8CC] via-[#E6F3FF] to-[#F7E8FF] p-6 shadow-md md:p-8"
        style={{
          scrollBehavior: "smooth",
          scrollbarWidth: "thin",
          scrollbarColor: "#6ec1e4 #f0f0f0",
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
          </defs>
          
          {/* Main serpentine path */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerMid="url(#arrowhead)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Step nodes */}
          {waypoints.map((waypoint, index) => {
            const phase = phases[index];
            if (!phase) return null;
            
            return (
              <StepNode
                key={phase.id}
                phase={phase}
                x={waypoint.x}
                y={waypoint.y}
                index={index}
                onClick={() => openDialog(phase)}
                onFocus={() => setFocusedIndex(index)}
              />
            );
          })}
          
          {/* Milestone dots under each phase */}
          {waypoints.map((waypoint, phaseIndex) => {
            const phase = phases[phaseIndex];
            if (!phase) return null;
            
            const milestoneCount = Math.min(6, phase.milestones.length);
            const spacing = 16; // Increased spacing for larger layout
            const startX = waypoint.x - ((milestoneCount - 1) * spacing) / 2;
            const dotY = waypoint.y + 140; // Adjusted for larger circles
            
            return phase.milestones.slice(0, 6).map((milestone, mIndex) => (
              <MilestoneDot
                key={`${phase.id}-${milestone.id}`}
                milestone={milestone}
                x={startX + mIndex * spacing}
                y={dotY}
              />
            ));
          })}
        </svg>
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
