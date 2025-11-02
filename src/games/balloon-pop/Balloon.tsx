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
  const [isPopping, setIsPopping] = useState(false);

  const handleClick = () => {
    if (isPopped || isPopping) return;
    setIsPopping(true);
    setShowConfetti(true);
    setTimeout(() => {
      onPop(id, ipa);
    }, 100);
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
        ${isPopping ? "animate-pop" : ""}
      `}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        width: "140px",
        height: "170px",
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
            inset -12px -12px 24px rgba(0,0,0,0.35),
            inset 10px 10px 24px rgba(255,255,255,0.5),
            0 25px 50px rgba(0,0,0,0.4),
            0 10px 20px rgba(0,0,0,0.2)
          `,
        }}
      >
        {/* Glossy highlight shine */}
        <div
          className="absolute top-4 left-4 w-10 h-14 bg-white/70 rounded-full blur-sm"
          style={{
            transform: "rotate(-25deg)",
          }}
        />

        {/* IPA text */}
        <span className="text-white font-bold text-2xl drop-shadow-lg z-10 select-none">
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
        
        @keyframes pop {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }
        .animate-pop {
          animation: pop 0.3s ease-out forwards;
        }
      `}</style>
    </button>
  );
}

export { BALLOON_COLORS };
