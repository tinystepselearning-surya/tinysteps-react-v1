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
  const particleCount = 20;

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {[...Array(particleCount)].map((_, i) => {
        const angle = (i * 360) / particleCount;
        const distance = 40 + Math.random() * 40;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 6 + Math.random() * 6;
        const rotation = Math.random() * 360;

        return (
          <div
            key={i}
            className="absolute animate-confettiBurst"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "0%",
              transform: `rotate(${rotation}deg)`,
              animation: `confettiBurst 0.8s ease-out forwards`,
              animationDelay: `${i * 0.02}s`,
              left: "0",
              top: "0",
              "--angle": `${angle}deg`,
              "--distance": `${distance}px`,
            } as React.CSSProperties}
          />
        );
      })}

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
                calc(sin(var(--angle)) * var(--distance))
              )
              scale(0)
              rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
