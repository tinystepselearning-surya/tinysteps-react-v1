import React from 'react';
import { Star } from 'lucide-react';
import {
  SKILL_RATING_MAX,
  skillRatingLegendLabel,
  type ProgressRatings,
} from '../../lib/skillRatings';
import { type ProgressSkillDefinition } from '../../lib/progressSkills';

interface ChildSkillRatingCardProps {
  title?: string | null;
  subtitle?: string;
  skills: ProgressSkillDefinition[];
  values: ProgressRatings;
  onChange?: (key: string, value: number) => void;
  readOnly?: boolean;
  className?: string;
  showLegend?: boolean;
  compact?: boolean;
}

export function ChildSkillRatingCard({
  title = 'Child Progress',
  subtitle,
  skills,
  values,
  onChange,
  readOnly = false,
  className = '',
  showLegend = true,
  compact = false,
}: ChildSkillRatingCardProps) {
  const hasHeader = Boolean(title || subtitle);
  return (
    <div className={`rounded-xl border border-emerald-100 bg-emerald-50/40 ${compact ? 'p-2.5' : 'p-3'} ${className}`}>
      {hasHeader ? (
        <div>
          {title ? <div className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-slate-900`}>{title}</div> : null}
          {subtitle ? <div className="mt-0.5 text-xs text-slate-600">{subtitle}</div> : null}
        </div>
      ) : null}

      <div className={`${hasHeader ? 'mt-3' : ''} grid gap-2 md:grid-cols-2`}>
        {skills.map((skill) => {
          const currentValue = values[skill.key] ?? 0;
          return (
            <div
              key={skill.key}
              className={`rounded-xl border border-slate-200 bg-white/90 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className={`${compact ? 'text-[13px]' : 'text-sm'} truncate font-semibold text-slate-800`}>{skill.label}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {currentValue === 0 ? 'Not started' : skillRatingLegendLabel(currentValue)}
                  </div>
                </div>
                <div className="flex items-center gap-1" aria-label={`${skill.label} rating`}>
                  {Array.from({ length: SKILL_RATING_MAX }, (_, idx) => {
                    const value = idx + 1;
                    const active = value <= currentValue;
                    const commonClassName = `${compact ? 'h-4.5 w-4.5' : 'h-5 w-5'} transition ${
                      active ? 'fill-amber-300 text-amber-400' : 'fill-transparent text-slate-300'
                    }`;
                    if (readOnly || !onChange) {
                      return (
                        <span
                          key={`${skill.key}-${value}`}
                          aria-hidden="true"
                          className="inline-flex"
                        >
                          <Star className={commonClassName} />
                        </span>
                      );
                    }
                    return (
                      <button
                        key={`${skill.key}-${value}`}
                        type="button"
                        onClick={() => onChange(skill.key, value)}
                        aria-label={`${skill.label} rating ${value} of ${SKILL_RATING_MAX}`}
                        aria-pressed={currentValue === value}
                        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                      >
                        <Star className={commonClassName} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showLegend ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
          <span>0 stars = Not started</span>
          <span>1 star = Emerging</span>
          <span>2 stars = Developing</span>
          <span>3 stars = Proficient</span>
          <span>4 stars = Mastered</span>
        </div>
      ) : null}
    </div>
  );
}

export default ChildSkillRatingCard;
