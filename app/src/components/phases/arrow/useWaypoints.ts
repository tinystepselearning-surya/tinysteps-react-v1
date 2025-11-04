/**
 * useWaypoints.ts
 * Computes serpentine (S-curve) grid coordinates for arrow roadmap
 * Alternates direction per row: left→right, then right→left
 */

import { useState, useEffect, useRef } from "react";

export interface Waypoint {
  x: number;
  y: number;
  index: number;
}

/**
 * Compute serpentine waypoints for a given number of phases
 * Creates a zig-zag pattern across rows
 */
export function computeSerpentine(
  count: number,
  width: number,
  cols: number,
  top: number,
  rowGap: number,
  colPositions?: number[] // normalized [0..1] positions for columns, optional
): Waypoint[] {
  const hGap = width / (cols + 1);

  const waypoints: Waypoint[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const colInRow = i % cols;
    const reversed = row % 2 === 1;
    const col = reversed ? cols - 1 - colInRow : colInRow;
    const x = Array.isArray(colPositions) && colPositions[col] != null
      ? colPositions[col] * width
      : hGap * (col + 1);
    waypoints.push({
      x,
      y: top + row * rowGap,
      index: i,
    });
  }
  return waypoints;
}

/**
 * Hook to compute responsive waypoints based on container size
 */
export interface WaypointOptions {
  cols?: number;
  top?: number;
  rowGap?: number;
  bottom?: number;
}

export function useWaypoints(count: number, options: WaypointOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWaypoints = () => {
      const container = containerRef.current;
      if (!container) return;
      
  const rect = container.getBoundingClientRect();
      // Fit within container width to avoid horizontal scrolling
  const width = rect.width;

      // Use provided options or defaults
  const cols = options.cols ?? (width < 480 ? 1 : 2); // 1 on small phones, else 2
      const top = options.top ?? 100;
      const rowGap = options.rowGap ?? 320;
      const bottom = options.bottom ?? 300;
      const rows = Math.ceil(count / cols);
      const height = Math.max(top + (rows - 1) * rowGap + bottom, 500);

      setDimensions({ width, height });
  // Slightly decrease horizontal gap between two columns (was [0.2, 0.8])
  const colPositions = cols === 2 ? [0.27, 0.73] : undefined;
  setWaypoints(computeSerpentine(count, width, cols, top, rowGap, colPositions));
    };
    
    updateWaypoints();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateWaypoints);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [count, options.cols, options.top, options.rowGap, options.bottom]);
  
  return { containerRef, waypoints, dimensions };
}

/**
 * Generate SVG path string for curved serpentine
 */
export function createCurvedPath(waypoints: Waypoint[]): string {
  if (waypoints.length === 0) return "";
  
  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;
  
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    
    // Calculate control points for smooth curves
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    
    // Smooth curve using quadratic bezier
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    
    // Add some perpendicular offset for organic curves
    const offsetX = -dy * 0.2;
    const offsetY = dx * 0.2;
    
    path += ` Q ${midX + offsetX} ${midY + offsetY}, ${curr.x} ${curr.y}`;
  }
  
  return path;
}
