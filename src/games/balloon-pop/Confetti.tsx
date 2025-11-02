/**
 * Confetti - CSS-based confetti burst animation
 */

interface ConfettiProps {
  x: number; // percentage
  y: number; // percentage
}

const CONFETTI_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#a8e6cf",
  "#ff8c42",
  "#95e1d3",
  "#f38181",
  "#aa96da",
];

export function Confetti({ x, y }: ConfettiProps) {
  const particleCount = 40; // Increased from 20

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Main burst particles */}
      {[...Array(particleCount)].map((_, i) => {
        const angle = (i * 360) / particleCount;
        const distance = 60 + Math.random() * 80; // Increased spread
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 8 + Math.random() * 10; // Larger particles
        const rotation = Math.random() * 360;
        const shape = Math.random();

        return (
          <div
            key={i}
            className="absolute animate-confettiBurst"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: shape > 0.66 ? "50%" : shape > 0.33 ? "0%" : "20%",
              transform: `rotate(${rotation}deg)`,
              animation: `confettiBurst 1.2s ease-out forwards`,
              animationDelay: `${i * 0.015}s`,
              left: "0",
              top: "0",
              "--angle": `${angle}deg`,
              "--distance": `${distance}px`,
              boxShadow: `0 0 4px ${color}`,
            } as React.CSSProperties}
          />
        );
      })}

      {/* Star burst effect */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute text-4xl animate-starBurst"
          style={{
            animation: `starBurst 1s ease-out forwards`,
            animationDelay: `${i * 0.05}s`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          ✨
        </div>
      ))}

      <style>{`
        @keyframes confettiBurst {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: 
              translate(
                calc(cos(var(--angle)) * var(--distance)),
                calc(sin(var(--angle)) * var(--distance) + 50px)
              )
              scale(0)
              rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes starBurst {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
