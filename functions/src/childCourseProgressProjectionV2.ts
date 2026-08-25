import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

const REGION = 'asia-south1';
const { FieldValue } = admin.firestore;

type ProgressData = Record<string, unknown> | null;
export type ProgressState = 'not_started' | 'in_progress' | 'completed';

type RecentProgressUpdate = {
  topicId: string;
  topicName: string;
  lessonNumber: number | null;
  stageLabel: string | null;
  lessonStatus: ProgressState;
  mastery: string | number | null;
  strengthSubskills: string[];
  needsPracticeSubskills: string[];
  teacherRemark: string | null;
  updatedAtMs: number;
};

export type StageProgressSummary = {
  key: string;
  label: string;
  order: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  completionPct: number;
};

export type CourseProgressSummary = {
  schemaVersion: 2;
  modelType: 'child_course_progress_v2';
  completionAuthority: 'teacher_lesson_status';
  definitionStatus: 'configured' | 'missing';
  kidId: string;
  courseId: string;
  courseLabel: string | null;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  overallPct: number;
  totalStages: number;
  completedStages: number;
  stageSummaries: StageProgressSummary[];
  latestTopicId: string | null;
  latestTopicName: string | null;
  latestLessonNumber: number | null;
  latestMastery: string | number | null;
  strengthHighlights: string[];
  practiceHighlights: string[];
  latestTeacherRemark: string | null;
  recentUpdates: RecentProgressUpdate[];
  lastUpdatedAtMs: number | null;
  updatedAt?: admin.firestore.FieldValue;
};

type CurriculumTopic = {
  id: string;
  courseId: string;
  courseLabel: string | null;
  label: string;
  lessonNumber: number | null;
  stageLabel: string;
  stageOrder: number;
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

function normalizeStringArray(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean))).slice(0, limit);
}

function normalizeLessonStatus(value: unknown): ProgressState | null {
  const raw = text(value).toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'notstarted') return 'not_started';
  if (raw === 'inprogress') return 'in_progress';
  if (raw === 'not_started' || raw === 'in_progress' || raw === 'completed') return raw;
  return null;
}

function hasTeacherLearningEvidence(data: ProgressData): boolean {
  if (!data) return false;
  const masteryRaw = data.masteryKey ?? data.masteryPct ?? data.mastery;
  const masteryText = text(masteryRaw).toLowerCase().replace(/\s+/g, '_');
  const masteryNumber = numeric(masteryRaw);
  const ratings =
    data.progressRatings && typeof data.progressRatings === 'object'
      ? Object.values(data.progressRatings as Record<string, unknown>)
      : [];
  const hasPositiveRating = ratings.some((rating) => (numeric(rating) ?? 0) > 0);

  return Boolean(
    (masteryText && masteryText !== 'not_started') ||
      (masteryNumber !== null && masteryNumber > 0) ||
      hasPositiveRating ||
      normalizeStringArray(data.strengthSubskills).length > 0 ||
      normalizeStringArray(data.needsPracticeSubskills).length > 0 ||
      text(data.teacherRemark),
  );
}

/**
 * Canonical curriculum state for the parent course projection.
 * Mastery, proficient ratings, legacy status fields, and attendance never complete a lesson.
 */
export function progressState(data: ProgressData): ProgressState {
  const explicit = normalizeLessonStatus(data?.lessonStatus);
  if (explicit) return explicit;
  return hasTeacherLearningEvidence(data) ? 'in_progress' : 'not_started';
}

export function normalizeCourseId(value: unknown): string {
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

export function curriculumTopicsForCourse(
  curriculumData: Record<string, unknown> | undefined,
  courseId: string,
): CurriculumTopic[] {
  const normalizedCourseId = normalizeCourseId(courseId);
  const topics = Array.isArray(curriculumData?.topics) ? curriculumData.topics : [];
  const raw = topics
    .filter((topic): topic is Record<string, unknown> => Boolean(topic && typeof topic === 'object'))
    .filter((topic) => normalizeCourseId(topic.courseId ?? topic.course) === normalizedCourseId)
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

export function courseTopicIds(
  curriculumData: Record<string, unknown> | undefined,
  courseId: string,
): Set<string> {
  return new Set(curriculumTopicsForCourse(curriculumData, courseId).map((topic) => topic.id));
}

function progressTopicId(docId: string, data: ProgressData): string {
  return text(data?.topicId) || docId;
}

export function docsForCourse(
  docs: admin.firestore.QueryDocumentSnapshot[],
  courseId: string,
  topicIds: Set<string>,
): admin.firestore.QueryDocumentSnapshot[] {
  const normalizedCourseId = normalizeCourseId(courseId);
  return docs.filter((docSnap) => {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const candidateTopicId = progressTopicId(docSnap.id, data);
    if (topicIds.size > 0) return topicIds.has(candidateTopicId);
    return normalizeCourseId(data.courseId ?? data.course) === normalizedCourseId;
  });
}

function stageKey(order: number, label: string): string {
  return `${order}__${label}`;
}

function emptyStageSummaries(topics: CurriculumTopic[]): StageProgressSummary[] {
  const groups = new Map<string, StageProgressSummary>();
  topics.forEach((topic) => {
    const key = stageKey(topic.stageOrder, topic.stageLabel);
    const current = groups.get(key);
    if (current) {
      current.totalTopics += 1;
      current.notStartedTopics += 1;
      return;
    }
    groups.set(key, {
      key,
      label: topic.stageLabel,
      order: topic.stageOrder,
      totalTopics: 1,
      completedTopics: 0,
      inProgressTopics: 0,
      notStartedTopics: 1,
      completionPct: 0,
    });
  });
  return Array.from(groups.values()).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

function stageCountsValid(stage: StageProgressSummary): boolean {
  return (
    stage.totalTopics >= 0 &&
    stage.completedTopics >= 0 &&
    stage.inProgressTopics >= 0 &&
    stage.notStartedTopics >= 0 &&
    stage.completedTopics + stage.inProgressTopics + stage.notStartedTopics === stage.totalTopics
  );
}

export function projectionMatchesCurriculum(
  existing: Partial<CourseProgressSummary> | null,
  courseId: string,
  topics: CurriculumTopic[],
): boolean {
  if (!existing || existing.schemaVersion !== 2 || existing.modelType !== 'child_course_progress_v2') return false;
  if (normalizeCourseId(existing.courseId) !== normalizeCourseId(courseId)) return false;
  if (topics.length === 0) return existing.definitionStatus === 'missing';
  if (existing.definitionStatus !== 'configured') return false;
  if (Number(existing.totalTopics ?? -1) !== topics.length) return false;
  const expectedStages = emptyStageSummaries(topics);
  const actualStages = Array.isArray(existing.stageSummaries) ? existing.stageSummaries : [];
  if (actualStages.length !== expectedStages.length) return false;
  return expectedStages.every((expected) => {
    const actual = actualStages.find((stage) => stage.key === expected.key);
    return Boolean(actual && actual.totalTopics === expected.totalTopics && stageCountsValid(actual));
  });
}

function contribution(state: ProgressState): { completed: number; inProgress: number; notStarted: number } {
  if (state === 'completed') return { completed: 1, inProgress: 0, notStarted: 0 };
  if (state === 'in_progress') return { completed: 0, inProgress: 1, notStarted: 0 };
  return { completed: 0, inProgress: 0, notStarted: 1 };
}

function resolveTopic(topics: CurriculumTopic[], docId: string, data: ProgressData): CurriculumTopic | null {
  const candidate = progressTopicId(docId, data);
  return topics.find((topic) => topic.id === candidate) || null;
}

function normalizeStage(stage: StageProgressSummary): StageProgressSummary {
  const total = Math.max(0, Math.trunc(stage.totalTopics));
  const completed = Math.max(0, Math.min(total, Math.trunc(stage.completedTopics)));
  const inProgress = Math.max(0, Math.min(total - completed, Math.trunc(stage.inProgressTopics)));
  const notStarted = Math.max(0, total - completed - inProgress);
  return {
    ...stage,
    totalTopics: total,
    completedTopics: completed,
    inProgressTopics: inProgress,
    notStartedTopics: notStarted,
    completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function updateFromProgress(
  topicId: string,
  data: ProgressData,
  curriculumTopic?: CurriculumTopic | null,
): RecentProgressUpdate | null {
  if (!data) return null;
  const updatedAtMs =
    timestampMs(data.updatedAt) ||
    timestampMs(data.lastUpdatedAt) ||
    timestampMs(data.createdAt) ||
    Date.now();
  return {
    topicId: curriculumTopic?.id || progressTopicId(topicId, data),
    topicName: curriculumTopic?.label || text(data.topicName) || progressTopicId(topicId, data),
    lessonNumber: curriculumTopic?.lessonNumber ?? numeric(data.lessonNumber),
    stageLabel: curriculumTopic?.stageLabel || text(data.stageLabel) || null,
    lessonStatus: progressState(data),
    mastery: (data.masteryKey ?? data.mastery ?? null) as string | number | null,
    strengthSubskills: normalizeStringArray(data.strengthSubskills, 3),
    needsPracticeSubskills: normalizeStringArray(data.needsPracticeSubskills, 3),
    teacherRemark: text(data.teacherRemark) || null,
    updatedAtMs,
  };
}

function highlightList(
  updates: RecentProgressUpdate[],
  key: 'strengthSubskills' | 'needsPracticeSubskills',
): string[] {
  const counts = new Map<string, { count: number; lastUpdatedAtMs: number }>();
  updates.forEach((update) => {
    update[key].forEach((label) => {
      const current = counts.get(label) || { count: 0, lastUpdatedAtMs: 0 };
      current.count += 1;
      current.lastUpdatedAtMs = Math.max(current.lastUpdatedAtMs, update.updatedAtMs);
      counts.set(label, current);
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count || b[1].lastUpdatedAtMs - a[1].lastUpdatedAtMs)
    .slice(0, 4)
    .map(([label]) => label);
}

function finalizeSummary(args: {
  kidId: string;
  courseId: string;
  courseLabel: string | null;
  definitionStatus: 'configured' | 'missing';
  stageSummaries: StageProgressSummary[];
  recentUpdates: RecentProgressUpdate[];
}): CourseProgressSummary {
  const stageSummaries = args.stageSummaries.map(normalizeStage);
  const totalTopics = stageSummaries.reduce((sum, stage) => sum + stage.totalTopics, 0);
  const completedTopics = stageSummaries.reduce((sum, stage) => sum + stage.completedTopics, 0);
  const inProgressTopics = stageSummaries.reduce((sum, stage) => sum + stage.inProgressTopics, 0);
  const notStartedTopics = stageSummaries.reduce((sum, stage) => sum + stage.notStartedTopics, 0);
  const recentUpdates = [...args.recentUpdates]
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs)
    .slice(0, 6);
  const latest = recentUpdates[0] || null;

  return {
    schemaVersion: 2,
    modelType: 'child_course_progress_v2',
    completionAuthority: 'teacher_lesson_status',
    definitionStatus: args.definitionStatus,
    kidId: args.kidId,
    courseId: args.courseId,
    courseLabel: args.courseLabel,
    totalTopics,
    completedTopics,
    inProgressTopics,
    notStartedTopics,
    overallPct: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    totalStages: stageSummaries.length,
    completedStages: stageSummaries.filter(
      (stage) => stage.totalTopics > 0 && stage.completedTopics === stage.totalTopics,
    ).length,
    stageSummaries,
    latestTopicId: latest?.topicId || null,
    latestTopicName: latest?.topicName || null,
    latestLessonNumber: latest?.lessonNumber ?? null,
    latestMastery: latest?.mastery ?? null,
    strengthHighlights: highlightList(recentUpdates, 'strengthSubskills'),
    practiceHighlights: highlightList(recentUpdates, 'needsPracticeSubskills'),
    latestTeacherRemark: latest?.teacherRemark || null,
    recentUpdates,
    lastUpdatedAtMs: latest?.updatedAtMs || null,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function applyIncrementalSummary(args: {
  existing: Partial<CourseProgressSummary> | null;
  kidId: string;
  courseId: string;
  topicId: string;
  beforeData: ProgressData;
  afterData: ProgressData;
  curriculumData?: Record<string, unknown>;
}): CourseProgressSummary {
  const { existing, kidId, courseId, topicId, beforeData, afterData, curriculumData } = args;
  const topics = curriculumTopicsForCourse(curriculumData, courseId);
  if (topics.length === 0) {
    const priorUpdates = Array.isArray(existing?.recentUpdates)
      ? (existing?.recentUpdates as RecentProgressUpdate[])
      : [];
    const next = updateFromProgress(topicId, afterData, null);
    const recentUpdates = [
      ...priorUpdates.filter((update) => update.topicId !== progressTopicId(topicId, beforeData)),
      ...(next ? [next] : []),
    ];
    return finalizeSummary({
      kidId,
      courseId,
      courseLabel: text(afterData?.courseLabel) || text(beforeData?.courseLabel) || text(existing?.courseLabel) || null,
      definitionStatus: 'missing',
      stageSummaries: [],
      recentUpdates,
    });
  }

  const stageSummaries = projectionMatchesCurriculum(existing, courseId, topics)
    ? (existing?.stageSummaries || []).map((stage) => ({ ...stage }))
    : emptyStageSummaries(topics);
  const byKey = new Map(stageSummaries.map((stage) => [stage.key, stage]));
  const beforeTopic = resolveTopic(topics, topicId, beforeData);
  const afterTopic = resolveTopic(topics, topicId, afterData);

  const adjust = (topic: CurriculumTopic | null, state: ProgressState, direction: -1 | 1) => {
    if (!topic) return;
    const key = stageKey(topic.stageOrder, topic.stageLabel);
    const stage = byKey.get(key);
    if (!stage) return;
    const delta = contribution(state);
    stage.completedTopics += direction * delta.completed;
    stage.inProgressTopics += direction * delta.inProgress;
    stage.notStartedTopics += direction * delta.notStarted;
  };

  if (beforeTopic) adjust(beforeTopic, progressState(beforeData), -1);
  if (afterTopic) adjust(afterTopic, progressState(afterData), 1);

  const priorUpdates = Array.isArray(existing?.recentUpdates)
    ? (existing?.recentUpdates as RecentProgressUpdate[])
    : [];
  const previousCanonicalId = beforeTopic?.id || progressTopicId(topicId, beforeData);
  const nextUpdate = updateFromProgress(topicId, afterData, afterTopic);
  const recentUpdates = [
    ...priorUpdates.filter((update) => update.topicId !== previousCanonicalId),
    ...(nextUpdate ? [nextUpdate] : []),
  ];

  return finalizeSummary({
    kidId,
    courseId,
    courseLabel:
      afterTopic?.courseLabel ||
      beforeTopic?.courseLabel ||
      text(afterData?.courseLabel) ||
      text(beforeData?.courseLabel) ||
      text(existing?.courseLabel) ||
      null,
    definitionStatus: 'configured',
    stageSummaries: Array.from(byKey.values()),
    recentUpdates,
  });
}

export function buildSummaryFromDocs(
  kidId: string,
  courseId: string,
  docs: admin.firestore.QueryDocumentSnapshot[],
  curriculumData?: Record<string, unknown>,
): CourseProgressSummary {
  const topics = curriculumTopicsForCourse(curriculumData, courseId);
  if (topics.length === 0) {
    const recentUpdates = docs
      .map((docSnap) => updateFromProgress(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>, null))
      .filter((update): update is RecentProgressUpdate => Boolean(update));
    return finalizeSummary({
      kidId,
      courseId,
      courseLabel: docs.map((docSnap) => text(docSnap.data()?.courseLabel)).find(Boolean) || null,
      definitionStatus: 'missing',
      stageSummaries: [],
      recentUpdates,
    });
  }

  const selectedByTopic = new Map<string, admin.firestore.QueryDocumentSnapshot>();
  docs.forEach((docSnap) => {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const topic = resolveTopic(topics, docSnap.id, data);
    if (!topic) return;
    const current = selectedByTopic.get(topic.id);
    if (!current) {
      selectedByTopic.set(topic.id, docSnap);
      return;
    }
    const currentData = (current.data() || {}) as Record<string, unknown>;
    const currentTime = timestampMs(currentData.updatedAt) || timestampMs(currentData.createdAt);
    const nextTime = timestampMs(data.updatedAt) || timestampMs(data.createdAt);
    if (nextTime >= currentTime) selectedByTopic.set(topic.id, docSnap);
  });

  const stageSummaries = emptyStageSummaries(topics);
  const stageByKey = new Map(stageSummaries.map((stage) => [stage.key, stage]));
  const recentUpdates: RecentProgressUpdate[] = [];

  topics.forEach((topic) => {
    const docSnap = selectedByTopic.get(topic.id);
    if (!docSnap) return;
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const state = progressState(data);
    const stage = stageByKey.get(stageKey(topic.stageOrder, topic.stageLabel));
    if (stage) {
      stage.notStartedTopics -= 1;
      if (state === 'completed') stage.completedTopics += 1;
      else if (state === 'in_progress') stage.inProgressTopics += 1;
      else stage.notStartedTopics += 1;
    }
    const update = updateFromProgress(docSnap.id, data, topic);
    if (update) recentUpdates.push(update);
  });

  return finalizeSummary({
    kidId,
    courseId,
    courseLabel:
      topics.map((topic) => topic.courseLabel).find((label): label is string => Boolean(label)) ||
      docs.map((docSnap) => text(docSnap.data()?.courseLabel)).find(Boolean) ||
      null,
    definitionStatus: 'configured',
    stageSummaries: Array.from(stageByKey.values()),
    recentUpdates,
  });
}

async function updateCourseSummary(args: {
  db: admin.firestore.Firestore;
  eventId: string;
  kidId: string;
  courseId: string;
  topicId: string;
  beforeData: ProgressData;
  afterData: ProgressData;
}): Promise<{ sourceDocumentsRead: number; mode: 'incremental_v2' | 'bootstrap_v2' | 'duplicate' }> {
  const { db, eventId, kidId, courseId, topicId, beforeData, afterData } = args;
  const summaryRef = db.collection('students').doc(kidId).collection('courseProgress').doc(courseId);
  const eventRef = db.collection('students').doc(kidId).collection('progressEvents').doc(eventId);
  const curriculumRef = db.collection('config').doc('curriculumTopics');

  return db.runTransaction(async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (eventSnap.exists) return { sourceDocumentsRead: 1, mode: 'duplicate' as const };

    const [currentSnap, curriculumSnap] = await Promise.all([
      transaction.get(summaryRef),
      transaction.get(curriculumRef),
    ]);
    const curriculumData = curriculumSnap.data() as Record<string, unknown> | undefined;
    const topics = curriculumTopicsForCourse(curriculumData, courseId);

    if (projectionMatchesCurriculum(currentSnap.exists ? currentSnap.data() as Partial<CourseProgressSummary> : null, courseId, topics)) {
      const next = applyIncrementalSummary({
        existing: currentSnap.data() as Partial<CourseProgressSummary>,
        kidId,
        courseId,
        topicId,
        beforeData,
        afterData,
        curriculumData,
      });
      transaction.set(summaryRef, next, { merge: false });
      transaction.set(eventRef, {
        schemaVersion: 2,
        projectionAppliedAt: FieldValue.serverTimestamp(),
      });
      return { sourceDocumentsRead: 3, mode: 'incremental_v2' as const };
    }

    const progressQuery = db.collection('students').doc(kidId).collection('progress');
    const progressSnap = await transaction.get(progressQuery);
    const topicIds = new Set(topics.map((topic) => topic.id));
    const relevantDocs = docsForCourse(progressSnap.docs, courseId, topicIds);
    const bootstrap = buildSummaryFromDocs(kidId, courseId, relevantDocs, curriculumData);
    transaction.set(summaryRef, bootstrap, { merge: false });
    transaction.set(eventRef, {
      schemaVersion: 2,
      projectionAppliedAt: FieldValue.serverTimestamp(),
    });
    return {
      sourceDocumentsRead: 3 + progressSnap.size,
      mode: 'bootstrap_v2' as const,
    };
  });
}

async function rebuildCourseAfterRemoval(args: {
  db: admin.firestore.Firestore;
  kidId: string;
  courseId: string;
}): Promise<number> {
  const { db, kidId, courseId } = args;
  const [progressSnap, curriculumSnap] = await Promise.all([
    db.collection('students').doc(kidId).collection('progress').get(),
    db.collection('config').doc('curriculumTopics').get(),
  ]);
  const curriculumData = curriculumSnap.data() as Record<string, unknown> | undefined;
  const topics = curriculumTopicsForCourse(curriculumData, courseId);
  const relevantDocs = docsForCourse(progressSnap.docs, courseId, new Set(topics.map((topic) => topic.id)));
  const summaryRef = db.collection('students').doc(kidId).collection('courseProgress').doc(courseId);

  if (topics.length === 0 && relevantDocs.length === 0) {
    await summaryRef.delete().catch(() => undefined);
    return progressSnap.size + 1;
  }

  await summaryRef.set(buildSummaryFromDocs(kidId, courseId, relevantDocs, curriculumData), { merge: false });
  return progressSnap.size + 1;
}

async function writeProgressEvent(args: {
  db: admin.firestore.Firestore;
  eventId: string;
  kidId: string;
  topicId: string;
  beforeData: ProgressData;
  afterData: ProgressData;
}) {
  const { db, eventId, kidId, topicId, beforeData, afterData } = args;
  if (!afterData) return;
  const courseId = normalizeCourseId(afterData.courseId);
  if (!courseId) return;
  const eventRef = db.collection('students').doc(kidId).collection('progressEvents').doc(eventId);
  await eventRef.set(
    {
      schemaVersion: 2,
      source: text(afterData.source) || 'teacher_topic_progress',
      kidId,
      topicId,
      courseId,
      courseLabel: text(afterData.courseLabel) || null,
      lessonNumber: numeric(afterData.lessonNumber),
      stageLabel: text(afterData.stageLabel) || null,
      previousState: progressState(beforeData),
      currentState: progressState(afterData),
      lessonStatus: normalizeLessonStatus(afterData.lessonStatus),
      mastery: afterData.mastery ?? null,
      progressRatings: afterData.progressRatings ?? null,
      strengthSubskills: normalizeStringArray(afterData.strengthSubskills, 3),
      needsPracticeSubskills: normalizeStringArray(afterData.needsPracticeSubskills, 3),
      teacherRemark: text(afterData.teacherRemark) || null,
      updatedBy: text(afterData.updatedBy) || null,
      enrollmentId: text(afterData.enrollmentId) || null,
      occurredAt: afterData.updatedAt || FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: false },
  );
}

/**
 * Brick P3 canonical parent course/stage projection.
 * The exported function name intentionally matches V1 so deployment replaces the old trigger
 * instead of running two writers against the same read model.
 */
export const onStudentProgressReadModelWrite = onDocumentWritten(
  {
    document: 'students/{kidId}/progress/{topicId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const kidId = text(event.params.kidId);
    const topicId = text(event.params.topicId);
    if (!kidId || !topicId) return;

    const beforeData = change.before.exists ? (change.before.data() as Record<string, unknown>) : null;
    const afterData = change.after.exists ? (change.after.data() as Record<string, unknown>) : null;
    const beforeCourseId = normalizeCourseId(beforeData?.courseId);
    const afterCourseId = normalizeCourseId(afterData?.courseId);
    const db = admin.firestore();
    const eventId = text(event.id) || `${kidId}_${topicId}_${Date.now()}`;

    let sourceDocumentsRead = 0;
    const modes: string[] = [];

    if (beforeCourseId && afterCourseId && beforeCourseId === afterCourseId) {
      const result = await updateCourseSummary({
        db,
        eventId,
        kidId,
        courseId: afterCourseId,
        topicId,
        beforeData,
        afterData,
      });
      sourceDocumentsRead += result.sourceDocumentsRead;
      modes.push(result.mode);
    } else {
      if (beforeCourseId) {
        sourceDocumentsRead += await rebuildCourseAfterRemoval({ db, kidId, courseId: beforeCourseId });
        modes.push('rebuild_previous_course_v2');
      }
      if (afterCourseId) {
        const result = await updateCourseSummary({
          db,
          eventId,
          kidId,
          courseId: afterCourseId,
          topicId,
          beforeData: null,
          afterData,
        });
        sourceDocumentsRead += result.sourceDocumentsRead;
        modes.push(result.mode);
      }
    }

    if (afterData) {
      await writeProgressEvent({
        db,
        eventId,
        kidId,
        topicId,
        beforeData,
        afterData,
      });
    }

    logger.info('Updated canonical child course progress projection v2', {
      kidId,
      topicId,
      beforeCourseId: beforeCourseId || null,
      afterCourseId: afterCourseId || null,
      modes,
      sourceDocumentsRead,
      completionAuthority: 'teacher_lesson_status',
    });
  },
);
