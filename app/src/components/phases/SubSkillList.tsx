/**
 * SubSkillList.tsx
 * Compact two-column list of sub-skills (milestones)
 * Shows tiny progress ring, label, and percentage
 */

import type { Milestone } from '../../data/phases';

interface SubSkillListProps {
  milestones: Milestone[];
  compact?: boolean;
}

// Tiny progress ring component
function ProgressRing({
  value,
  size = 18,
  strokeWidth = 3,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value >= 90) return '#3b82f6'; // blue
    if (value >= 70) return '#10b981'; // emerald
    if (value >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="fill-none stroke-gray-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="fill-none transition-all duration-300"
        stroke={getColor()}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SubSkillList({ milestones, compact = false }: SubSkillListProps) {
  return (
    <ul
      className={`grid gap-2 ${
        compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
      }`}
    >
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="flex items-center gap-2 rounded-lg bg-white/60 px-2 py-1.5 text-sm transition-colors hover:bg-white/90"
          title={milestone.desc}
        >
          <ProgressRing value={milestone.progress} size={18} strokeWidth={3} />
          <span className="min-w-0 flex-1 truncate text-sm leading-tight">
            {milestone.title}
          </span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-600">
            {milestone.progress}%
          </span>
        </li>
      ))}
    </ul>
  );
}
