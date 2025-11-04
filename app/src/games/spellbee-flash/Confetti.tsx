/**
 * Confetti Component
 * Lightweight confetti burst animation for celebrating correct answers
 */

import { useEffect, useState } from "react";

interface ConfettiBurstProps {
  x?: number; // X position (percentage or px)
  y?: number; // Y position (percentage or px)
  onDone?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
}

const COLORS = [
  "#FFD700", // Gold
  "#FF6B6B", // Red
  "#4ECDC4", // Cyan
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
];

export default function ConfettiBurst({ x = 50, y = 10, onDone }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    // Generate particles
    const newParticles: Particle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 3; // Reduced from 3-7 to 2-5 for gentler burst
      
      newParticles.push({
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2, // Slight upward bias
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        size: 6 + Math.random() * 6,
      });
    }

    setParticles(newParticles);
    setCurrentFrame(0);

    // Animate particles
    let frame = 0;
    const maxFrames = 180; // Changed from 60 to 180 for 3-second duration (60fps × 3s)
    
    const animate = () => {
      frame++;
      setCurrentFrame(frame);
      
      if (frame >= maxFrames) {
        setParticles([]);
        if (onDone) onDone();
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15, // Reduced gravity from 0.3 to 0.15 for slower, more graceful fall
          rotation: p.rotation + p.rotationSpeed,
          vx: p.vx * 0.99, // Reduced air resistance from 0.98 to 0.99 for gentler deceleration
        }))
      );

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [x, y, onDone]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            borderRadius: "2px",
            opacity: Math.max(0, 1 - currentFrame / 180), // Updated to match new maxFrames
          }}
        />
      ))}
    </div>
  );
}
