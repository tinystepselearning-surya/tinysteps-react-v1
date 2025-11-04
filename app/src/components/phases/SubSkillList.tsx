/**
 * SubSkillList.tsx
 * Compact two-column grid of sub-skills (milestones)
 * Shows tiny progress ring, truncated label, and percentage
 * Refined styling with lighter backgrounds
 */

import type { Milestone } from '../../data/phases';

interface SubSkillListProps {
  milestones: Milestone[];
  compact?: boolean;
}

// Tiny progress ring component
function ProgressRing({
  value,
  size = 16,
  strokeWidth = 2,
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
        className="fill-none stroke-slate-200"
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

export default function SubSkillList({ milestones }: SubSkillListProps) {
  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="flex items-center gap-1.5 rounded-md bg-slate-50/60 px-2 py-1 text-xs transition-colors hover:bg-slate-100/80"
          title={milestone.desc}
        >
          <ProgressRing value={milestone.progress} size={16} strokeWidth={2} />
          <span className="min-w-0 flex-1 truncate text-xs leading-snug text-slate-700">
            {milestone.title}
          </span>
          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-500">
            {milestone.progress}%
          </span>
        </li>
      ))}
    </ul>
  );
}
