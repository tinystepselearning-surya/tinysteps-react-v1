import {
  SKILL_RATING_MAX,
  skillRatingLegendLabel,
  type ProgressRatings,
} from "../../../../lib/skillRatings";
import type { ProgressSkillDefinition } from "../../../../lib/progressSkills";

export type ParentSkillRatingOrigin = "explicit" | "legacy" | "none";
export type ParentLessonRatingState =
  | "no_skills"
  | "unrated"
  | "explicit_not_started"
  | "partially_rated"
  | "rated";

export type ParentSkillRatingDisplay = {
  key: string;
  label: string;
  value: number | null;
  text: string;
  state: "unrated" | "not_started" | "rated";
  origin: ParentSkillRatingOrigin;
};

export type ParentSkillsLesson = {
  id: string;
  label: string;
  courseId: string | null;
  courseLabel: string | null;
  stageLabel: string | null;
  updatedAtMs: number | null;
  ratedSkillCount: number;
  totalSkillCount: number;
  averageRating: number;
  roundedAverageRating: number;
  ratingState: ParentLessonRatingState;
  ratingStateLabel: string;
  ratingEntries: ParentSkillRatingDisplay[];
  strengthChips: string[];
  practiceChips: string[];
  remark: string;
  source: unknown;
};

export type ParentSkillsStage = {
  id: string;
  label: string;
  order: number;
  displayLabel: string;
  skills: Array<{ tag: string; label: string; count: number }>;
};

export type ParentSkillUpdate = {
  id: string;
  label: string;
  stageLabel: string;
  updatedAtMs: number | null;
};

const hasOwn = (value: Record<string, unknown> | null, key: string): boolean =>
  Boolean(value && Object.prototype.hasOwnProperty.call(value, key));

const clampRating = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(SKILL_RATING_MAX, Math.round(numeric)));
};

export function buildParentSkillRatingDisplay(params: {
  skills: ProgressSkillDefinition[];
  normalizedRatings: ProgressRatings;
  explicitRatings?: Record<string, unknown> | null;
  origin: ParentSkillRatingOrigin;
}): {
  entries: ParentSkillRatingDisplay[];
  state: ParentLessonRatingState;
  stateLabel: string;
} {
  const { skills, normalizedRatings, explicitRatings = null, origin } = params;
  if (skills.length === 0) {
    return { entries: [], state: "no_skills", stateLabel: "No rating data" };
  }

  let supportedEntryCount = 0;
  let positiveEntryCount = 0;
  let explicitZeroCount = 0;

  const entries = skills.map<ParentSkillRatingDisplay>((skill) => {
    const explicit = origin === "explicit" && hasOwn(explicitRatings, skill.key);
    const normalized = clampRating(normalizedRatings[skill.key]);
    const legacySupported = origin === "legacy" && normalized > 0;

    if (!explicit && !legacySupported) {
      return {
        key: skill.key,
        label: skill.label,
        value: null,
        text: "Not rated yet",
        state: "unrated",
        origin,
      };
    }

    supportedEntryCount += 1;
    if (normalized === 0) {
      explicitZeroCount += 1;
      return {
        key: skill.key,
        label: skill.label,
        value: 0,
        text: "Not started",
        state: "not_started",
        origin,
      };
    }

    positiveEntryCount += 1;
    return {
      key: skill.key,
      label: skill.label,
      value: normalized,
      text: skillRatingLegendLabel(normalized),
      state: "rated",
      origin,
    };
  });

  if (supportedEntryCount === 0) {
    return { entries, state: "unrated", stateLabel: "Not rated yet" };
  }
  if (origin === "explicit" && supportedEntryCount === skills.length && positiveEntryCount === 0) {
    return {
      entries,
      state: "explicit_not_started",
      stateLabel: "Explicitly marked Not started",
    };
  }
  if (supportedEntryCount < skills.length || (origin === "legacy" && explicitZeroCount > 0)) {
    return { entries, state: "partially_rated", stateLabel: "Partially rated" };
  }
  return { entries, state: "rated", stateLabel: "Rated" };
}

export const dedupeParentSkillLabels = (values: string[], limit = 3): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const label = String(value || "").trim();
    if (!label || seen.has(label) || result.length >= limit) return;
    seen.add(label);
    result.push(label);
  });
  return result;
};

export function formatParentSkillTag(tag: string): string {
  const raw = String(tag || "").trim();
  if (!raw) return "Unnamed skill";
  if (raw.startsWith("letter:")) return `Letter ${raw.slice(7).toUpperCase()}`;
  if (raw.startsWith("sound:")) return `Sound ${raw.slice(6)}`;
  const value = raw.startsWith("subtopic:") ? raw.slice(9) : raw;
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export const parentSkillUpdateId = (params: {
  tag: string;
  stageLabel: string;
  stageOrder: number;
  updatedAtMs: number | null;
}): string =>
  [
    String(params.tag || "").trim(),
    String(params.stageLabel || "").trim(),
    String(params.stageOrder || 0),
    String(params.updatedAtMs || 0),
  ].join("__");
