import { summarizeProgressRatings, type ProgressRatings } from './skillRatings';
import type { ProgressSkillDefinition } from './progressSkills';

export type SubskillSelectionSource = 'stars' | 'teacher';

export type ProgressSubskillSelection = {
  source: SubskillSelectionSource;
  strengths: string[];
  needsPractice: string[];
};

function sanitizeLabels(value: unknown, allowedLabels: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .filter((item): item is string => typeof item === 'string' && allowedLabels.has(item))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 3);
}

export function deriveProgressSubskillSuggestions(
  progressRatings: ProgressRatings,
  progressSkills: ProgressSkillDefinition[],
): Omit<ProgressSubskillSelection, 'source'> {
  const summary = summarizeProgressRatings(progressRatings, progressSkills);
  const strengths = summary.strongestSkills.map((entry) => entry.label).slice(0, 3);
  const strengthSet = new Set(strengths);
  const needsPractice = summary.needsPracticeSkills
    .map((entry) => entry.label)
    .filter((label) => !strengthSet.has(label))
    .slice(0, 3);

  return { strengths, needsPractice };
}

export function resolveProgressSubskillSelection(options: {
  progressRatings: ProgressRatings;
  progressSkills: ProgressSkillDefinition[];
  savedSource?: unknown;
  savedStrengths?: unknown;
  savedNeedsPractice?: unknown;
}): ProgressSubskillSelection {
  const allowedLabels = new Set(options.progressSkills.map((skill) => skill.label));
  const savedStrengths = sanitizeLabels(options.savedStrengths, allowedLabels);
  const savedStrengthSet = new Set(savedStrengths);
  const savedNeedsPractice = sanitizeLabels(options.savedNeedsPractice, allowedLabels)
    .filter((label) => !savedStrengthSet.has(label));

  const source = options.savedSource === 'stars' || options.savedSource === 'teacher'
    ? options.savedSource
    : null;
  const hasLegacySavedSelection = Array.isArray(options.savedStrengths)
    || Array.isArray(options.savedNeedsPractice);

  if (source === 'teacher' || (!source && hasLegacySavedSelection)) {
    return {
      source: 'teacher',
      strengths: savedStrengths,
      needsPractice: savedNeedsPractice,
    };
  }

  return {
    source: 'stars',
    ...deriveProgressSubskillSuggestions(options.progressRatings, options.progressSkills),
  };
}
