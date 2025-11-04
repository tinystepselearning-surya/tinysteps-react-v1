/**
 * ArrowRoadmap.tsx
 * Serpentine arrow roadmap visualization with StepNodes and milestone dots
 * Desktop: S-curve path with horizontal scrolling (3 phases per row)
 * Mobile: vertical zig-zag
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Phase } from "../../../data/phases";
import { useWaypoints, createCurvedPath } from "./useWaypoints";
import StepNode from "./StepNode";

interface ArrowRoadmapProps {
  phases: Phase[];
  parentView: boolean;
}

// Milestone dots removed (now labeled chips rendered in StepNode)

export default function ArrowRoadmap({ phases }: ArrowRoadmapProps) {
  // Compute a dynamic row gap based on the maximum number of labeled chips per phase
  // We render up to 6 chips and roughly fit 2 per row; adjust gap to avoid overlap between rows
  const maxChips = Math.max(0, ...phases.map(p => Math.min(6, p.milestones.length)));
  const estimatedChipRows = Math.ceil(maxChips / 2) || 1;
  const dynamicRowGap = 300 + estimatedChipRows * 36; // base + per-row increment
  const { containerRef, waypoints, dimensions } = useWaypoints(phases.length, {
    // cols omitted → 1 on small phones, 2 otherwise (inside hook)
    top: 120,
    rowGap: dynamicRowGap,
    bottom: 340,
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
      `}</style>
      <div
        ref={containerRef}
  className="arrow-roadmap-scroll overflow-x-hidden overflow-y-visible rounded-2xl bg-gradient-to-br from-[#FFE8CC] via-[#E6F3FF] to-[#F7E8FF] p-8 shadow-md md:p-10 reveal-on-scroll animate-fadeIn"
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
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Segment arrows between successive circles (flowing along curves) */}
          {waypoints.map((wp, i) => {
            if (i === waypoints.length - 1) return null;
            const next = waypoints[i + 1];
            const dx = next.x - wp.x;
            const dy = next.y - wp.y;
            const midX = (wp.x + next.x) / 2;
            const midY = (wp.y + next.y) / 2;
            const offsetX = -dy * 0.2;
            const offsetY = dx * 0.2;
            const d = `M ${wp.x} ${wp.y} Q ${midX + offsetX} ${midY + offsetY}, ${next.x} ${next.y}`;
            return (
              <path
                key={`seg-${i}`}
                d={d}
                fill="none"
                stroke="#6ec1e4"
                strokeWidth={3}
                markerEnd="url(#arrowheadSegment)"
                opacity={0.6}
              />
            );
          })}

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
                onClick={() => openPhaseDetail(phase)}
                onFocus={() => setFocusedIndex(index)}
              />
            );
          })}
          
          {/* Labeled chips are now rendered below each node inside StepNode; SVG dots omitted to reduce clutter */}
        </svg>
      </div>
    </>
  );
}
