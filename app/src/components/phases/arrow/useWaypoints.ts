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
  height: number
): Waypoint[] {
  // Calculate grid dimensions
  // Fixed: 3 columns per row for horizontal scrolling
  const cols = 3;
  const rows = Math.ceil(count / cols);
  
  // Calculate spacing (leave margins)
  const hGap = width / (cols + 1);
  const vGap = height / (rows + 1);
  
  const waypoints: Waypoint[] = [];
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const colInRow = i % cols;
    
    // Reverse direction on odd rows (creates serpentine)
    const reversed = row % 2 === 1;
    const col = reversed ? cols - 1 - colInRow : colInRow;
    
    waypoints.push({
      x: hGap * (col + 1),
      y: vGap * (row + 1),
      index: i,
    });
  }
  
  return waypoints;
}

/**
 * Hook to compute responsive waypoints based on container size
 */
export function useWaypoints(count: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWaypoints = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      // Fixed width for horizontal scrolling: 3 phases per row with larger spacing
      const width = Math.max(rect.width, 1000); // Minimum width for 3 columns
      
      // Calculate height based on number of rows needed
      const cols = 3;
      const rows = Math.ceil(count / cols);
      const height = Math.max(500, rows * 280); // Increased: 280px per row for larger circles
      
      setDimensions({ width, height });
      setWaypoints(computeSerpentine(count, width, height));
    };
    
    updateWaypoints();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateWaypoints);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [count]);
  
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
