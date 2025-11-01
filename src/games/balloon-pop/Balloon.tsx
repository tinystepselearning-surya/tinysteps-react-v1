/**
 * Balloon component - Individual balloon with pop animation
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
}

const BALLOON_COLORS = [
  "from-red-400 to-red-600",
  "from-blue-400 to-blue-600",
  "from-green-400 to-green-600",
  "from-yellow-400 to-yellow-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-orange-400 to-orange-600",
];

export function Balloon({
  id,
  ipa,
  x,
  y,
  color,
  onPop,
  isPopped,
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

  if (isPopped) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {showConfetti && (
          <div className="relative">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-ping"
                style={{
                  backgroundColor: ["#ff6b6b", "#4ecdc4", "#ffe66d", "#a8e6cf"][
                    i % 4
                  ],
                  left: `${Math.cos((i * Math.PI) / 4) * 30}px`,
                  top: `${Math.sin((i * Math.PI) / 4) * 30}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const colorClass = BALLOON_COLORS[color as unknown as number] || BALLOON_COLORS[0];

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`IPA ${ipa} balloon`}
      className="absolute transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-400"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        width: "80px",
        height: "100px",
      }}
    >
      {/* Balloon body */}
      <div
        className={`
          relative w-full h-full rounded-full bg-gradient-to-br ${colorClass}
          shadow-2xl flex items-center justify-center
          before:absolute before:inset-2 before:rounded-full
          before:bg-white/20 before:blur-sm
        `}
        style={{
          borderRadius: "50% 50% 45% 45%",
        }}
      >
        <span className="text-white font-bold text-lg drop-shadow-lg z-10">
          {ipa}
        </span>
      </div>

      {/* Balloon string */}
      <div className="absolute left-1/2 top-full w-0.5 h-12 bg-gray-400 -translate-x-1/2" />
    </button>
  );
}

export { BALLOON_COLORS };
