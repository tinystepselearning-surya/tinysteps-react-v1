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

export default function ConfettiBurst({ x = 50, y = 50, onDone }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    // Generate particles
    const newParticles: Particle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 3 + Math.random() * 4;
      
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
    const maxFrames = 60; // ~1 second at 60fps
    
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
          vy: p.vy + 0.3, // Gravity
          rotation: p.rotation + p.rotationSpeed,
          vx: p.vx * 0.98, // Air resistance
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
            opacity: Math.max(0, 1 - currentFrame / 60),
          }}
        />
      ))}
    </div>
  );
}
