import {
  PHONICS_STAGE_DEFINITIONS,
  getPhonicsLessons,
  isPhonicsCourseId,
} from "../../../../content/phonicsCurriculum";
import {
  getProgressSkillsForLesson,
  type ProgressSkillDefinition,
} from "../../../../lib/progressSkills";
import {
  SKILL_RATING_MAX,
  skillRatingLegendLabel,
  type ProgressRatings,
} from "../../../../lib/skillRatings";

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

function normalizedUpdateIdentity(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function stripStagePrefix(value: string): string {
  return String(value || "")
    .trim()
    .replace(/^Stage\s+\d+\s*[—–-]\s*/i, "")
    .trim();
}

/**
 * Parent-facing "Recent skill updates" is a summary, not the historical ledger.
 * Within the already-selected course, collapse the same normalized skill in the same stage and
 * retain the newest observation. Lesson rating history remains untouched and continues to expose
 * each lesson-level record.
 */
export function consolidateParentSkillUpdates(
  updates: readonly ParentSkillUpdate[],
): ParentSkillUpdate[] {
  const latestByIdentity = new Map<string, ParentSkillUpdate>();

  updates.forEach((update) => {
    const label = normalizedUpdateIdentity(update.label);
    const stage = normalizedUpdateIdentity(update.stageLabel);
    if (!label) return;
    const identity = `${stage}__${label}`;
    const existing = latestByIdentity.get(identity);
    const nextMs = typeof update.updatedAtMs === "number" && Number.isFinite(update.updatedAtMs)
      ? update.updatedAtMs
      : 0;
    const existingMs = typeof existing?.updatedAtMs === "number" && Number.isFinite(existing.updatedAtMs)
      ? existing.updatedAtMs
      : 0;

    if (!existing || nextMs > existingMs) {
      latestByIdentity.set(identity, update);
    }
  });

  return Array.from(latestByIdentity.values()).sort((a, b) => {
    const aMs = typeof a.updatedAtMs === "number" && Number.isFinite(a.updatedAtMs) ? a.updatedAtMs : 0;
    const bMs = typeof b.updatedAtMs === "number" && Number.isFinite(b.updatedAtMs) ? b.updatedAtMs : 0;
    if (aMs !== bMs) return bMs - aMs;
    const stageCompare = a.stageLabel.localeCompare(b.stageLabel);
    return stageCompare !== 0 ? stageCompare : a.label.localeCompare(b.label);
  });
}

type CanonicalStageSkillContext = {
  label: string;
  displayLabel: string;
  allowedLabels: Set<string>;
};

function canonicalPhonicsSkillContextByOrder(
  courseId: string,
): Map<number, CanonicalStageSkillContext> | null {
  if (!isPhonicsCourseId(courseId)) return null;

  const definitions = PHONICS_STAGE_DEFINITIONS[courseId];
  const contexts = new Map<number, CanonicalStageSkillContext>();
  definitions.forEach((definition) => {
    contexts.set(definition.stageOrder, {
      label: definition.label,
      displayLabel: stripStagePrefix(definition.label),
      allowedLabels: new Set<string>(),
    });
  });

  getPhonicsLessons(courseId).forEach((lesson) => {
    const context = contexts.get(lesson.stageOrder);
    if (!context) return;
    getProgressSkillsForLesson({
      courseId: lesson.courseId,
      topicId: lesson.id,
      lessonId: lesson.lesson,
      rubricType: lesson.rubricType,
      stageLabel: lesson.stageLabel,
      lessonTitle: lesson.displayTitle,
      topicLabel: lesson.label,
      area: lesson.area,
    }).forEach((skill) => {
      context.allowedLabels.add(normalizedUpdateIdentity(skill.label));
    });
  });

  return contexts;
}

/**
 * Historical phonics skill tags were sometimes saved under an older stage/rubric map. P7 keeps
 * the history untouched, but canonical parent summaries must never assign those stale tags to the
 * current curriculum stage. Filter summary rows against the current lesson rubrics and replace
 * display labels with the canonical stage definition. Unmappable rows are excluded rather than
 * silently attached to the wrong stage.
 */
export function canonicalizeParentSkillsSummary(params: {
  courseId: string;
  stages: readonly ParentSkillsStage[];
  recentUpdates: readonly ParentSkillUpdate[];
}): { stages: ParentSkillsStage[]; recentUpdates: ParentSkillUpdate[] } {
  const canonicalContexts = canonicalPhonicsSkillContextByOrder(params.courseId);
  if (!canonicalContexts) {
    return {
      stages: [...params.stages],
      recentUpdates: consolidateParentSkillUpdates(params.recentUpdates),
    };
  }

  const stageLabelToOrder = new Map<string, number>();
  canonicalContexts.forEach((context, order) => {
    stageLabelToOrder.set(normalizedUpdateIdentity(context.label), order);
    stageLabelToOrder.set(normalizedUpdateIdentity(context.displayLabel), order);
  });

  const stages = params.stages
    .map((stage) => {
      const context = canonicalContexts.get(stage.order);
      if (!context) return null;
      const skills = stage.skills.filter((skill) =>
        context.allowedLabels.has(normalizedUpdateIdentity(skill.label)),
      );
      if (skills.length === 0) return null;
      return {
        ...stage,
        id: `${stage.order}__${context.label}`,
        label: context.label,
        displayLabel: context.displayLabel,
        skills,
      } satisfies ParentSkillsStage;
    })
    .filter((stage): stage is ParentSkillsStage => Boolean(stage));

  const recentUpdates = consolidateParentSkillUpdates(
    params.recentUpdates.filter((update) => {
      const stageIdentity = normalizedUpdateIdentity(update.stageLabel);
      const order = stageLabelToOrder.get(stageIdentity);
      if (!order) return false;
      const context = canonicalContexts.get(order);
      return Boolean(context?.allowedLabels.has(normalizedUpdateIdentity(update.label)));
    }),
  );

  return { stages, recentUpdates };
}
