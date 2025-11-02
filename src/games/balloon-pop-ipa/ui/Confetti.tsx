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
  const particleCount = 35; // More particles for richer effect

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Star burst particles */}
      {[...Array(particleCount)].map((_, i) => {
        const angle = (i * 360) / particleCount;
        const distance = 60 + Math.random() * 80;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 8 + Math.random() * 10;
        const rotation = Math.random() * 360;
        const shape = Math.random();
        
        // Mix of circles, squares, and stars
        const borderRadius = shape > 0.66 ? "50%" : shape > 0.33 ? "0%" : "30%";

        return (
          <div
            key={i}
            className="absolute animate-confettiBurst"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius,
              transform: `rotate(${rotation}deg)`,
              animation: `confettiBurst 1.2s ease-out forwards`,
              animationDelay: `${i * 0.015}s`,
              left: "0",
              top: "0",
              boxShadow: `0 0 8px ${color}`,
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
          50% {
            opacity: 1;
          }
          100% {
            transform: 
              translate(
                calc(cos(var(--angle)) * var(--distance)),
                calc(sin(var(--angle)) * var(--distance) + 50px)
              )
              scale(0.3)
              rotate(1080deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Confetti;
