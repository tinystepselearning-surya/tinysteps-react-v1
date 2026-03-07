import { masteryKeyFromValue, masteryPctFromKey } from './mastery';
import {
  buildProgressSkillKey,
  LEGACY_PROGRESS_SKILLS,
  normalizeProgressSkillDefinitions,
  type ProgressSkillDefinition,
} from './progressSkills';

export const SKILL_RATING_MAX = 4;

export type ProgressRatings = Record<string, number>;

type LegacyChecks = Record<string, unknown> | null | undefined;

const RATING_TO_MASTERY_KEY = [
  'not_started',
  'emerging',
  'developing',
  'proficient',
  'mastered',
] as const;

function clampSkillRating(value: unknown): number {
  const num =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : Number.isFinite(Number(value))
        ? Number(value)
        : 0;
  return Math.max(0, Math.min(SKILL_RATING_MAX, Math.round(num)));
}

function legacyValueToRating(value: unknown): number {
  const masteryKey = masteryKeyFromValue(value);
  const percent = masteryPctFromKey(masteryKey);
  return Math.max(0, Math.min(SKILL_RATING_MAX, Math.round(percent / 25)));
}

function inferLegacyBucket(skill: ProgressSkillDefinition): 'recognise' | 'say' | 'read' | 'write' | 'other' {
  const raw = `${skill.key} ${skill.label}`.toLowerCase();
  if (/(recogn|identify|spot|sound recall|rule spotting|choose|understand rule)/.test(raw)) {
    return 'recognise';
  }
  if (/(say|pronoun|clarity|confidence|fluency|voice|eye contact|volume|gestures|expression|speak|pace|pause)/.test(raw)) {
    return 'say';
  }
  if (/(write|spell|dictation|formation|punctuation|edit|rewrite)/.test(raw)) {
    return 'write';
  }
  if (/(read|sentence|blend|segment|apply|word reading|comprehension|understand)/.test(raw)) {
    return 'read';
  }
  return 'other';
}

function fallbackRatingForSkill(
  skill: ProgressSkillDefinition,
  options?: { mastery?: unknown; checks?: LegacyChecks; legacyRatings?: unknown },
): number {
  const masteryRating = legacyValueToRating(options?.mastery);
  const checks = options?.checks ?? {};
  const legacyRatings =
    options?.legacyRatings && typeof options.legacyRatings === 'object'
      ? (options.legacyRatings as Record<string, unknown>)
      : {};

  if (legacyRatings[skill.key] != null) {
    return clampSkillRating(legacyRatings[skill.key]);
  }

  const legacyLabelMatch = LEGACY_PROGRESS_SKILLS.find(
    (legacySkill) =>
      legacySkill.key === skill.key
      || legacySkill.label.toLowerCase() === skill.label.toLowerCase()
      || buildProgressSkillKey(legacySkill.label) === skill.key,
  );
  if (legacyLabelMatch && legacyRatings[legacyLabelMatch.key] != null) {
    return clampSkillRating(legacyRatings[legacyLabelMatch.key]);
  }

  switch (inferLegacyBucket(skill)) {
    case 'recognise':
      return legacyValueToRating(checks?.recognise ?? masteryRating);
    case 'say':
      return legacyValueToRating(checks?.say ?? masteryRating);
    case 'read':
      return legacyValueToRating(checks?.read ?? masteryRating);
    case 'write':
      return legacyValueToRating(checks?.write ?? masteryRating);
    default:
      return masteryRating;
  }
}

export function createEmptyProgressRatings(skills: ProgressSkillDefinition[]): ProgressRatings {
  return skills.reduce<ProgressRatings>((acc, skill) => {
    acc[skill.key] = 0;
    return acc;
  }, {});
}

export function normalizeProgressRatings(
  raw: unknown,
  skills: ProgressSkillDefinition[],
  options?: { mastery?: unknown; checks?: LegacyChecks; legacyRatings?: unknown },
): ProgressRatings {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return skills.reduce<ProgressRatings>((acc, skill) => {
    acc[skill.key] =
      source[skill.key] != null
        ? clampSkillRating(source[skill.key])
        : fallbackRatingForSkill(skill, options);
    return acc;
  }, {});
}

export function getAverageProgressRating(progressRatings: ProgressRatings): number {
  const entries = Object.values(progressRatings);
  if (entries.length === 0) return 0;
  return entries.reduce((sum, value) => sum + clampSkillRating(value), 0) / entries.length;
}

export function summarizeProgressRatings(
  progressRatings: ProgressRatings,
  progressSkills: ProgressSkillDefinition[],
) {
  const entries = progressSkills.map((skill) => ({
    skill,
    rating: clampSkillRating(progressRatings[skill.key] ?? 0),
  }));
  const ratedEntries = entries.filter((entry) => entry.rating > 0);
  const averageRating =
    ratedEntries.length > 0
      ? ratedEntries.reduce((sum, entry) => sum + entry.rating, 0) / ratedEntries.length
      : 0;

  return {
    averageRating,
    roundedAverageRating:
      ratedEntries.length > 0
        ? Math.max(0, Math.min(SKILL_RATING_MAX, Math.round(averageRating)))
        : 0,
    ratedSkillCount: ratedEntries.length,
    totalSkillCount: entries.length,
    strongestSkills: [...entries]
      .filter((entry) => entry.rating >= 3)
      .sort((a, b) => b.rating - a.rating || a.skill.label.localeCompare(b.skill.label))
      .slice(0, 3)
      .map((entry) => ({ key: entry.skill.key, label: entry.skill.label, rating: entry.rating })),
    needsPracticeSkills: [...entries]
      .filter((entry) => entry.rating > 0 && entry.rating <= 2)
      .sort((a, b) => a.rating - b.rating || a.skill.label.localeCompare(b.skill.label))
      .slice(0, 3)
      .map((entry) => ({ key: entry.skill.key, label: entry.skill.label, rating: entry.rating })),
  };
}

export function deriveLegacyProgressFromRatings(
  progressRatings: ProgressRatings,
  progressSkills: ProgressSkillDefinition[],
) {
  const average = Math.round(getAverageProgressRating(progressRatings));
  const masteryKey = RATING_TO_MASTERY_KEY[Math.max(0, Math.min(SKILL_RATING_MAX, average))];

  const bucketed = {
    recognise: [] as number[],
    say: [] as number[],
    read: [] as number[],
    write: [] as number[],
  };

  progressSkills.forEach((skill) => {
    const rating = clampSkillRating(progressRatings[skill.key] ?? 0);
    const bucket = inferLegacyBucket(skill);
    if (bucket !== 'other') bucketed[bucket].push(rating);
  });

  const bucketAverage = (bucket: number[]) =>
    bucket.length > 0
      ? Math.round(bucket.reduce((sum, value) => sum + value, 0) / bucket.length)
      : average;

  return {
    mastery: masteryKey,
    masteryKey,
    masteryPct: masteryPctFromKey(masteryKey),
    checks: {
      recognise: RATING_TO_MASTERY_KEY[bucketAverage(bucketed.recognise)],
      say: RATING_TO_MASTERY_KEY[bucketAverage(bucketed.say)],
      read: RATING_TO_MASTERY_KEY[bucketAverage(bucketed.read)],
      write: RATING_TO_MASTERY_KEY[bucketAverage(bucketed.write)],
    },
  };
}

export function hasExplicitProgressRatings(value: unknown): boolean {
  return !!value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0;
}

export function skillRatingLegendLabel(rating: number): string {
  return RATING_TO_MASTERY_KEY[Math.max(0, Math.min(SKILL_RATING_MAX, Math.round(rating)))]
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeProgressSkillsMeta(value: unknown): ProgressSkillDefinition[] {
  return normalizeProgressSkillDefinitions(Array.isArray(value) ? value : []);
}
