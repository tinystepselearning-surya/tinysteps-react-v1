/**
 * SkillTags.tsx
 * Compact skill/badge chips with icon and label
 */

import type { SkillTag } from "../../types/game";

interface SkillTagsProps {
  skills: SkillTag[];
  maxDisplay?: number;
  size?: "sm" | "md";
}

export default function SkillTags({ skills, maxDisplay = 3, size = "sm" }: SkillTagsProps) {
  const displayedSkills = skills.slice(0, maxDisplay);
  const remainingCount = skills.length - maxDisplay;
  
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1"
  };
  
  return (
    <div className="flex flex-wrap items-center gap-1">
      {displayedSkills.map((skill) => (
        <span
          key={skill.id}
          className={`inline-flex items-center gap-1 rounded-md bg-blue-50 font-semibold text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
          style={skill.color ? { backgroundColor: `${skill.color}20`, borderColor: skill.color, color: skill.color } : {}}
        >
          {skill.label}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className={`inline-flex items-center rounded-md bg-gray-100 font-semibold text-gray-600 border border-gray-200 ${sizeClasses[size]}`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
