import { motion } from 'framer-motion';

function cellKey(r, c) {
  return `${r}-${c}`;
}

export default function MazeRenderer({ rows, cols, path, currentIndex, showPlayer = true }) {
  if (!rows || !cols) return null;
  const pathSet = new Set((path || []).map(([r, c]) => cellKey(r, c)));
  const current = path?.[currentIndex] || null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow min-w-0">
      <svg width="100%" viewBox={`0 0 ${cols * 20} ${rows * 20}`} preserveAspectRatio="xMidYMid meet">
        {[...Array(rows)].map((_, r) =>
          [...Array(cols)].map((_, c) => {
            const active = pathSet.has(cellKey(r, c));
            const isCurrent = current && current[0] === r && current[1] === c;
            return (
              <rect
                key={cellKey(r, c)}
                x={c * 20}
                y={r * 20}
                width={20}
                height={20}
                fill={isCurrent ? '#fde047' : active ? '#bfdbfe' : '#e5e7eb'}
                stroke="#cbd5e1"
                strokeWidth={0.5}
                rx={3}
              />
            );
          })
        )}
        {showPlayer && current && (
          <motion.circle
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            cx={current[1] * 20 + 10}
            cy={current[0] * 20 + 10}
            r={6}
            fill="#f97316"
            stroke="#fb923c"
            strokeWidth={2}
          />
        )}
      </svg>
    </div>
  );
}
