/**
 * Balloon component - Individual balloon with glossy visuals and pop animation
 */

import { useState } from "react";

interface BalloonProps {
  id: string;
  ipa: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  color: string;
  onPop: (id: string, ipa: string) => void;
  isPopped: boolean;
  shake?: boolean;
}

const BALLOON_COLORS = [
  { gradient: "from-red-400 via-red-500 to-red-700", hex: "#f87171" },
  { gradient: "from-blue-400 via-blue-500 to-blue-700", hex: "#60a5fa" },
  { gradient: "from-green-400 via-green-500 to-green-700", hex: "#4ade80" },
  { gradient: "from-yellow-400 via-yellow-500 to-yellow-600", hex: "#facc15" },
  { gradient: "from-purple-400 via-purple-500 to-purple-700", hex: "#c084fc" },
  { gradient: "from-pink-400 via-pink-500 to-pink-700", hex: "#f472b6" },
  { gradient: "from-orange-400 via-orange-500 to-orange-700", hex: "#fb923c" },
];

export function Balloon({
  id,
  ipa,
  x,
  y,
  color,
  onPop,
  isPopped,
  shake = false,
}: BalloonProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClick = () => {
    if (isPopped) return;
    setShowConfetti(true);
    onPop(id, ipa);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  if (isPopped && !showConfetti) {
    return null; // Fully removed after confetti
  }

  const colorIndex = parseInt(color, 10) || 0;
  const { gradient, hex } = BALLOON_COLORS[colorIndex % BALLOON_COLORS.length];

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`IPA ${ipa} balloon`}
      className={`
        absolute transition-transform hover:scale-110 active:scale-95 
        focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2
        ${shake ? "animate-shake" : ""}
      `}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        width: "90px",
        height: "110px",
        minWidth: "64px", // Accessibility hit target
        minHeight: "64px",
      }}
    >
      {/* Balloon body with glossy gradient */}
      <div
        className={`
          relative w-full h-full bg-gradient-to-br ${gradient}
          shadow-2xl flex items-center justify-center
        `}
        style={{
          borderRadius: "50% 50% 47% 47%",
          boxShadow: `
            inset -8px -8px 20px rgba(0,0,0,0.3),
            inset 8px 8px 20px rgba(255,255,255,0.4),
            0 20px 40px rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Glossy highlight shine */}
        <div
          className="absolute top-3 left-3 w-7 h-10 bg-white/60 rounded-full blur-sm"
          style={{
            transform: "rotate(-25deg)",
          }}
        />

        {/* IPA text */}
        <span className="text-white font-bold text-xl drop-shadow-lg z-10 select-none">
          {ipa}
        </span>

        {/* Balloon knot */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-4 rounded-full"
          style={{
            backgroundColor: hex,
            filter: "brightness(0.7)",
          }}
        />
      </div>

      {/* Balloon string */}
      <div
        className="absolute left-1/2 top-full w-0.5 h-16 bg-gradient-to-b from-gray-400 to-transparent -translate-x-1/2"
        style={{ transformOrigin: "top" }}
      />

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(-8deg); }
          75% { transform: translate(-50%, -50%) rotate(8deg); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </button>
  );
}

export { BALLOON_COLORS };
