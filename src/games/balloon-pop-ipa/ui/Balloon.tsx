/**
 * Balloon component - Individual glossy balloon with realistic visuals and pop animation
 */

import { motion } from 'framer-motion';

interface BalloonProps {
  labelIPA: string;
  hint: string;
  laneX: number;
  riseSec: number;
  selected?: boolean;
  onClick: () => void;
  reducedMotion?: boolean;
  isCorrect?: boolean;
  showHintGlow?: boolean;
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

const Balloon: React.FC<BalloonProps> = ({ 
  labelIPA, 
  laneX, 
  riseSec, 
  selected = false, 
  onClick, 
  isCorrect = false,
  showHintGlow = false,
}) => {
  const handleClick = () => {
    onClick();
  };

  // Randomly assign a color to this balloon
  const colorIndex = Math.floor(Math.random() * BALLOON_COLORS.length);
  const { gradient, hex } = BALLOON_COLORS[colorIndex];

  // Generate unique wobble animation ID
  const wobbleDuration = 4 + Math.random() * 2;

  // Show hint glow only if this balloon is correct AND hint should be shown
  const shouldGlow = isCorrect && showHintGlow;

  return (
    <>
      <motion.button
        onClick={handleClick}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`IPA ${labelIPA} balloon`}
        className={`
          absolute
          w-40 h-48
          transition-transform
          hover:scale-110
          active:scale-95
          focus:outline-none
          focus:ring-4
          focus:ring-yellow-400
          focus:ring-offset-2
          ${selected ? "ring-4 ring-green-400" : ""}
        `}
        style={{
          left: `${laneX}%`,
          transform: 'translateX(-50%)',
          minWidth: "64px",
          minHeight: "64px",
        }}
        initial={{ y: window.innerHeight + 100 }}
        animate={{ y: -200 }}
        transition={{
          duration: riseSec,
          ease: 'linear',
        }}
      >
        {/* Balloon body with ultra-glossy gradient and realistic shadows */}
        <div
          className={`
            relative w-full h-full
            bg-gradient-to-br ${gradient}
            shadow-2xl
            flex items-center justify-center
            ${isCorrect ? "ring-4 ring-green-400 ring-opacity-90" : ""}
            ${shouldGlow ? "ring-4 ring-green-400" : ""}
          `}
          style={{
            borderRadius: "50% 50% 47% 47%",
            boxShadow: `
              inset -10px -12px 25px rgba(0,0,0,0.35),
              inset 12px 12px 30px rgba(255,255,255,0.5),
              0 25px 50px rgba(0,0,0,0.4),
              0 5px 15px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Primary glossy highlight */}
          <div
            className="absolute top-5 left-5 w-12 h-16 bg-white/70 rounded-full blur-sm"
            style={{
              transform: "rotate(-30deg)",
            }}
          />
          
          {/* Secondary smaller highlight */}
          <div
            className="absolute top-8 left-4 w-6 h-8 bg-white/50 rounded-full blur-xs"
            style={{
              transform: "rotate(-20deg)",
            }}
          />

          {/* Subtle bottom reflection */}
          <div
            className="absolute bottom-8 right-6 w-8 h-5 bg-white/20 rounded-full blur-sm"
            style={{
              transform: "rotate(15deg)",
            }}
          />

          {/* IPA text with infinite sway */}
          <motion.div
            animate={{ x: [-5, 5, -5] }}
            transition={{
              duration: wobbleDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-white font-bold text-5xl drop-shadow-lg z-10 select-none text-center px-2"
          >
            {labelIPA}
          </motion.div>

          {/* Balloon knot - larger and more realistic */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-7 rounded-full"
            style={{
              backgroundColor: hex,
              filter: "brightness(0.6)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        {/* Balloon string - longer and more visible */}
        <div
          className="absolute left-1/2 top-full w-0.5 h-28 bg-gradient-to-b from-gray-500 via-gray-400 to-transparent -translate-x-1/2"
          style={{ transformOrigin: "top" }}
        />

        {/* Shake animation for wrong answers */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(-50%) rotate(0deg); }
            25% { transform: translateX(-50%) rotate(-8deg); }
            75% { transform: translateX(-50%) rotate(8deg); }
          }
        `}</style>
      </motion.button>
    </>
  );
};

export { BALLOON_COLORS };
export default Balloon;
