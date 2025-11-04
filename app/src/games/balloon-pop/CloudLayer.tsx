/**
 * CloudLayer - Parallax background clouds
 */

interface CloudLayerProps {
  layer: 1 | 2;
}

export function CloudLayer({ layer }: CloudLayerProps) {
  const clouds = layer === 1 ? 4 : 3;
  const duration = layer === 1 ? 60 : 80; // seconds
  const opacity = layer === 1 ? 0.6 : 0.4;
  const size = layer === 1 ? "scale-100" : "scale-75";

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${
        layer === 1 ? "z-0" : "z-10"
      }`}
      style={{ opacity }}
    >
      {[...Array(clouds)].map((_, i) => (
        <div
          key={i}
          className={`absolute ${size}`}
          style={{
            top: `${15 + i * 20}%`,
            animation: `cloudDrift ${duration}s linear infinite`,
            animationDelay: `${-i * (duration / clouds)}s`,
          }}
        >
          {/* SVG cloud shape */}
          <svg
            width="100"
            height="60"
            viewBox="0 0 100 60"
            fill="white"
            className="drop-shadow-sm"
          >
            <ellipse cx="25" cy="40" rx="20" ry="15" />
            <ellipse cx="40" cy="30" rx="25" ry="20" />
            <ellipse cx="65" cy="35" rx="20" ry="18" />
            <ellipse cx="75" cy="40" rx="15" ry="12" />
          </svg>
        </div>
      ))}

      <style>{`
        @keyframes cloudDrift {
          from {
            transform: translateX(-150px);
          }
          to {
            transform: translateX(calc(100vw + 150px));
          }
        }
      `}</style>
    </div>
  );
}
