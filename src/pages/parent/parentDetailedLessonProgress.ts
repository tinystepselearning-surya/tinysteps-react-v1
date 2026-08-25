import type { ChildCourseProgressProjection } from '../../hooks/useChildCourseProgressProjection';
import {
  hasTeacherLearningEvidence,
  normalizeLessonStatus,
  type LessonStatus,
  type TeacherLessonProgressLike,
} from '../../lib/parentDashboardDataContract';
import {
  selectCanonicalParentOverviewCourse,
  type ParentOverviewCourseSummary,
} from './parentOverviewProjection';

type CurriculumTopic = {
  id: string;
  courseId: string;
  courseLabel: string | null;
  label: string;
  lessonNumber: number | null;
  stageLabel: string;
  stageOrder: number;
};

export type ParentDetailedLessonProgressLesson = {
  id: string;
  label: string;
  lessonNumber: number | null;
  stageKey: string;
  stageLabel: string;
  stageOrder: number;
  lessonStatus: LessonStatus;
  updatedAtMs: number | null;
};

export type ParentDetailedLessonProgressStage = {
  key: string;
  label: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  completionPct: number;
  lessons: ParentDetailedLessonProgressLesson[];
};

export type ParentDetailedLessonProgress = {
  courseId: string;
  courseLabel: string | null;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  completionPct: number;
  totalStages: number;
  completedStages: number;
  stages: ParentDetailedLessonProgressStage[];
  activeStage: ParentDetailedLessonProgressStage | null;
  nextStage: ParentDetailedLessonProgressStage | null;
  lastUpdatedAtMs: number | null;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function timestampMs(value: unknown): number {
  if (!value) return 0;
  const candidate = value as { toMillis?: () => number; toDate?: () => Date };
  if (typeof candidate.toMillis === 'function') return candidate.toMillis();
  if (typeof candidate.toDate === 'function') return candidate.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeParentDetailedCourseId(value: unknown): string {
  const raw = text(value).toLowerCase();
  if (!raw) return '';
  const aliases: Record<string, string> = {
    'phonics-foundation': 'phonics-foundations',
    foundational: 'phonics-foundations',
    foundation: 'phonics-foundations',
    'phonics-early': 'early-phonics',
    early: 'early-phonics',
    'phonics-advanced': 'advanced-phonics',
    advanced: 'advanced-phonics',
    'grammar-essentials': 'basic-grammar',
    'grammar-mastery': 'advanced-grammar',
    'intermediate-grammar': 'basic-grammar',
    'public-speaking-foundations': 'basic-public-speaking',
    'public-speaking-excellence': 'advanced-public-speaking',
    'intermediate-public-speaking': 'basic-public-speaking',
  };
  return aliases[raw] || raw;
}

function parseStageOrder(label: string): number | null {
  const match = /\bstage\s*(\d+)\b/i.exec(label);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parentDetailedCurriculumTopicsForCourse(
  curriculumData: Record<string, unknown> | null | undefined,
  courseId: string,
): CurriculumTopic[] {
  const normalizedCourseId = normalizeParentDetailedCourseId(courseId);
  const topics = Array.isArray(curriculumData?.topics) ? curriculumData.topics : [];
  const raw = topics
    .filter((topic): topic is Record<string, unknown> => Boolean(topic && typeof topic === 'object'))
    .filter((topic) => normalizeParentDetailedCourseId(topic.courseId ?? topic.course) === normalizedCourseId)
    .map((topic) => {
      const id = text(topic.id ?? topic.topicId);
      if (!id) return null;
      const stageLabel = text(topic.stageLabel) || 'Lessons';
      const explicitStageOrder = numeric(topic.stageOrder);
      const lessonNumber = numeric(topic.lessonNumber ?? topic.order);
      return {
        id,
        courseId: normalizedCourseId,
        courseLabel: text(topic.courseLabel) || null,
        label: text(topic.displayTitle ?? topic.label ?? topic.topicName ?? topic.name) || id,
        lessonNumber,
        stageLabel,
        stageOrder:
          explicitStageOrder !== null && explicitStageOrder > 0
            ? Math.trunc(explicitStageOrder)
            : parseStageOrder(stageLabel) ?? 0,
      } satisfies CurriculumTopic;
    })
    .filter((topic): topic is CurriculumTopic => Boolean(topic));

  const stageOrderByLabel = new Map<string, number>();
  let nextOrder = 1;
  raw
    .sort((a, b) => {
      const aLesson = a.lessonNumber ?? Number.MAX_SAFE_INTEGER;
      const bLesson = b.lessonNumber ?? Number.MAX_SAFE_INTEGER;
      return aLesson - bLesson || a.id.localeCompare(b.id);
    })
    .forEach((topic) => {
      if (topic.stageOrder > 0) {
        stageOrderByLabel.set(topic.stageLabel, topic.stageOrder);
        nextOrder = Math.max(nextOrder, topic.stageOrder + 1);
      } else if (!stageOrderByLabel.has(topic.stageLabel)) {
        stageOrderByLabel.set(topic.stageLabel, nextOrder);
        nextOrder += 1;
      }
    });

  return raw
    .map((topic) => ({
      ...topic,
      stageOrder: stageOrderByLabel.get(topic.stageLabel) || topic.stageOrder || 1,
    }))
    .sort((a, b) => {
      const aLesson = a.lessonNumber ?? Number.MAX_SAFE_INTEGER;
      const bLesson = b.lessonNumber ?? Number.MAX_SAFE_INTEGER;
      return aLesson - bLesson || a.id.localeCompare(b.id);
    });
}

function canonicalDetailLessonStatus(progress: Record<string, unknown> | null): LessonStatus {
  const explicit = normalizeLessonStatus(progress?.lessonStatus);
  if (explicit) return explicit;

  const masteryRaw = progress?.masteryKey ?? progress?.masteryPct ?? progress?.mastery;
  const evidence: TeacherLessonProgressLike = {
    topicId: text(progress?.topicId),
    lessonStatus: progress?.lessonStatus,
    mastery: masteryRaw,
    progressRatings:
      progress?.progressRatings && typeof progress.progressRatings === 'object'
        ? (progress.progressRatings as Record<string, unknown>)
        : null,
    teacherRemark: progress?.teacherRemark,
    strengthSubskills: progress?.strengthSubskills,
    needsPracticeSubskills: progress?.needsPracticeSubskills,
    updatedAt: progress?.updatedAt,
    createdAt: progress?.createdAt,
  };

  if (hasTeacherLearningEvidence(evidence)) return 'in_progress';
  const numericMastery = numeric(masteryRaw);
  return numericMastery !== null && numericMastery > 0 ? 'in_progress' : 'not_started';
}

function stageKey(order: number, label: string): string {
  return `${order}__${label}`;
}

function progressTopicId(row: Record<string, unknown>): string {
  return text(row.topicId) || text(row.id);
}

function latestProgressByTopic(
  progressDocs: readonly Record<string, unknown>[],
  topicIds: Set<string>,
): Map<string, Record<string, unknown>> {
  const selected = new Map<string, Record<string, unknown>>();
  progressDocs.forEach((row) => {
    const topicId = progressTopicId(row);
    if (!topicId || !topicIds.has(topicId)) return;
    const current = selected.get(topicId);
    if (!current) {
      selected.set(topicId, row);
      return;
    }
    const currentTime = timestampMs(current.updatedAt) || timestampMs(current.createdAt);
    const nextTime = timestampMs(row.updatedAt) || timestampMs(row.createdAt);
    if (nextTime >= currentTime) selected.set(topicId, row);
  });
  return selected;
}

function courseCountsMatch(
  detail: ParentDetailedLessonProgress,
  course: ParentOverviewCourseSummary,
): boolean {
  return (
    detail.totalLessons === course.totalTopics &&
    detail.completedLessons === course.completedTopics &&
    detail.inProgressLessons === course.inProgressTopics &&
    detail.notStartedLessons === course.notStartedTopics &&
    detail.completionPct === course.overallPct &&
    detail.completedLessons + detail.inProgressLessons + detail.notStartedLessons === detail.totalLessons
  );
}

function stagesMatchProjection(
  detailStages: ParentDetailedLessonProgressStage[],
  course: ParentOverviewCourseSummary,
): boolean {
  if (detailStages.length !== course.stageSummaries.length) return false;
  return detailStages.every((stage) => {
    const canonical = course.stageSummaries.find((candidate) => candidate.key === stage.key);
    return Boolean(
      canonical &&
        canonical.label === stage.label &&
        canonical.order === stage.order &&
        canonical.totalTopics === stage.totalLessons &&
        canonical.completedTopics === stage.completedLessons &&
        canonical.inProgressTopics === stage.inProgressLessons &&
        canonical.notStartedTopics === stage.notStartedLessons &&
        canonical.completionPct === stage.completionPct,
    );
  });
}

function resolveStageFrontier(
  stages: ParentDetailedLessonProgressStage[],
): { activeStage: ParentDetailedLessonProgressStage | null; nextStage: ParentDetailedLessonProgressStage | null } {
  if (stages.length === 0) return { activeStage: null, nextStage: null };
  const progressed = stages.filter(
    (stage) => stage.completedLessons > 0 || stage.inProgressLessons > 0,
  );
  const frontier = progressed[progressed.length - 1] || null;
  let activeStage: ParentDetailedLessonProgressStage | null = null;

  if (!frontier) {
    activeStage = stages[0];
  } else if (frontier.completedLessons < frontier.totalLessons || frontier.inProgressLessons > 0) {
    activeStage = frontier;
  } else {
    activeStage =
      stages.find(
        (stage) =>
          stage.order > frontier.order && stage.completedLessons < stage.totalLessons,
      ) || frontier;
  }

  const activeIndex = activeStage ? stages.findIndex((stage) => stage.key === activeStage?.key) : -1;
  const nextStage =
    activeIndex >= 0
      ? stages
          .slice(activeIndex + 1)
          .find((stage) => stage.completedLessons < stage.totalLessons) || null
      : null;

  return { activeStage, nextStage };
}

/**
 * Brick P6 detailed lesson selector.
 *
 * P3 remains the semantic owner of course/stage completion. P6 reconstructs lesson rows from
 * canonical curriculum topics and teacher progress only to provide detail. The detail is
 * accepted only when every lesson-state count reconciles exactly with the P3 V2 projection.
 * No mastery-derived percentage or legacy screen calculation is allowed as a fallback.
 */
export function buildCanonicalParentDetailedLessonProgress(params: {
  courseProjection: ChildCourseProgressProjection | null | undefined;
  expectedCourseId: string | null | undefined;
  curriculumData: Record<string, unknown> | null | undefined;
  progressDocs: readonly Record<string, unknown>[] | null | undefined;
}): ParentDetailedLessonProgress | null {
  const expectedCourseId = normalizeParentDetailedCourseId(params.expectedCourseId);
  const course = selectCanonicalParentOverviewCourse(params.courseProjection, expectedCourseId);
  if (!course || !expectedCourseId) return null;

  const topics = parentDetailedCurriculumTopicsForCourse(params.curriculumData, expectedCourseId);
  if (topics.length === 0 || topics.length !== course.totalTopics) return null;

  const topicIds = new Set(topics.map((topic) => topic.id));
  const progressByTopic = latestProgressByTopic(params.progressDocs ?? [], topicIds);
  const stageGroups = new Map<string, ParentDetailedLessonProgressStage>();
  let lastUpdatedAtMs: number | null = null;

  topics.forEach((topic) => {
    const progress = progressByTopic.get(topic.id) || null;
    const lessonStatus = canonicalDetailLessonStatus(progress);
    const updatedAtMs = progress
      ? timestampMs(progress.updatedAt) || timestampMs(progress.lastUpdatedAt) || timestampMs(progress.createdAt) || null
      : null;
    if (updatedAtMs) lastUpdatedAtMs = Math.max(lastUpdatedAtMs ?? 0, updatedAtMs);

    const key = stageKey(topic.stageOrder, topic.stageLabel);
    const lesson: ParentDetailedLessonProgressLesson = {
      id: topic.id,
      label: topic.label,
      lessonNumber: topic.lessonNumber,
      stageKey: key,
      stageLabel: topic.stageLabel,
      stageOrder: topic.stageOrder,
      lessonStatus,
      updatedAtMs,
    };

    const existing = stageGroups.get(key);
    if (!existing) {
      stageGroups.set(key, {
        key,
        label: topic.stageLabel,
        order: topic.stageOrder,
        totalLessons: 0,
        completedLessons: 0,
        inProgressLessons: 0,
        notStartedLessons: 0,
        completionPct: 0,
        lessons: [],
      });
    }
    const stage = stageGroups.get(key)!;
    stage.totalLessons += 1;
    if (lessonStatus === 'completed') stage.completedLessons += 1;
    else if (lessonStatus === 'in_progress') stage.inProgressLessons += 1;
    else stage.notStartedLessons += 1;
    stage.lessons.push(lesson);
  });

  const stages = Array.from(stageGroups.values())
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map((stage) => ({
      ...stage,
      completionPct:
        stage.totalLessons > 0
          ? Math.round((stage.completedLessons / stage.totalLessons) * 100)
          : 0,
      lessons: [...stage.lessons].sort((a, b) => {
        const aLesson = a.lessonNumber ?? Number.MAX_SAFE_INTEGER;
        const bLesson = b.lessonNumber ?? Number.MAX_SAFE_INTEGER;
        return aLesson - bLesson || a.id.localeCompare(b.id);
      }),
    }));

  const totalLessons = stages.reduce((sum, stage) => sum + stage.totalLessons, 0);
  const completedLessons = stages.reduce((sum, stage) => sum + stage.completedLessons, 0);
  const inProgressLessons = stages.reduce((sum, stage) => sum + stage.inProgressLessons, 0);
  const notStartedLessons = stages.reduce((sum, stage) => sum + stage.notStartedLessons, 0);
  const completionPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const { activeStage, nextStage } = resolveStageFrontier(stages);

  const detail: ParentDetailedLessonProgress = {
    courseId: course.courseId,
    courseLabel: course.courseLabel,
    totalLessons,
    completedLessons,
    inProgressLessons,
    notStartedLessons,
    completionPct,
    totalStages: stages.length,
    completedStages: stages.filter(
      (stage) => stage.totalLessons > 0 && stage.completedLessons === stage.totalLessons,
    ).length,
    stages,
    activeStage,
    nextStage,
    lastUpdatedAtMs: course.lastUpdatedAtMs ?? lastUpdatedAtMs,
  };

  if (!courseCountsMatch(detail, course)) return null;
  if (!stagesMatchProjection(stages, course)) return null;
  return detail;
}
