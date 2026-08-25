import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

const REGION = 'asia-south1';
const { FieldValue } = admin.firestore;

type ProgressData = Record<string, unknown> | null;

type ProgressState = 'not_started' | 'in_progress' | 'completed';

type RecentProgressUpdate = {
  topicId: string;
  topicName: string;
  lessonNumber: number | null;
  stageLabel: string | null;
  mastery: string | number | null;
  strengthSubskills: string[];
  needsPracticeSubskills: string[];
  teacherRemark: string | null;
  updatedAtMs: number;
};

type CourseProgressSummary = {
  schemaVersion: number;
  modelType: 'child_course_progress_v1';
  kidId: string;
  courseId: string;
  courseLabel: string | null;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  overallPct: number;
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
  return Array.from(
    new Set(
      value
        .map((entry) => text(entry))
        .filter(Boolean),
    ),
  ).slice(0, limit);
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
    'public-speaking-foundations': 'basic-public-speaking',
    'public-speaking-excellence': 'advanced-public-speaking',
  };
  return aliases[raw] || raw;
}

export function progressState(data: ProgressData): ProgressState {
  if (!data) return 'not_started';

  const status = text(data.status).toLowerCase();
  const masteryRaw = data.masteryKey ?? data.masteryPct ?? data.mastery;
  const masteryText = text(masteryRaw).toLowerCase().replace(/\s+/g, '_');
  const masteryNumber = numeric(masteryRaw);

  if (
    status === 'completed' ||
    status === 'mastered' ||
    masteryText === 'mastered' ||
    (masteryNumber !== null && masteryNumber >= 100)
  ) {
    return 'completed';
  }

  const ratings =
    data.progressRatings && typeof data.progressRatings === 'object'
      ? Object.values(data.progressRatings as Record<string, unknown>)
      : [];
  const hasPositiveRating = ratings.some((rating) => (numeric(rating) ?? 0) > 0);
  const hasSignals =
    status === 'in_progress' ||
    ['emerging', 'developing', 'proficient'].includes(masteryText) ||
    (masteryNumber !== null && masteryNumber > 0) ||
    hasPositiveRating ||
    normalizeStringArray(data.strengthSubskills).length > 0 ||
    normalizeStringArray(data.needsPracticeSubskills).length > 0 ||
    Boolean(text(data.teacherRemark));

  return hasSignals ? 'in_progress' : 'not_started';
}

function contribution(state: ProgressState): { completed: number; inProgress: number } {
  if (state === 'completed') return { completed: 1, inProgress: 0 };
  if (state === 'in_progress') return { completed: 0, inProgress: 1 };
  return { completed: 0, inProgress: 0 };
}

function updateFromProgress(topicId: string, data: ProgressData): RecentProgressUpdate | null {
  if (!data) return null;
  const updatedAtMs =
    timestampMs(data.updatedAt) ||
    timestampMs(data.lastUpdatedAt) ||
    timestampMs(data.createdAt) ||
    Date.now();
  return {
    topicId,
    topicName: text(data.topicName) || topicId,
    lessonNumber: numeric(data.lessonNumber),
    stageLabel: text(data.stageLabel) || null,
    mastery: (data.masteryKey ?? data.mastery ?? null) as string | number | null,
    strengthSubskills: normalizeStringArray(data.strengthSubskills, 3),
    needsPracticeSubskills: normalizeStringArray(data.needsPracticeSubskills, 3),
    teacherRemark: text(data.teacherRemark) || null,
    updatedAtMs,
  };
}

function clampCounts(totalTopics: number, completedTopics: number, inProgressTopics: number) {
  const safeTotal = Math.max(0, Math.round(totalTopics));
  const safeCompleted = Math.max(0, Math.round(completedTopics));
  const safeInProgress = Math.max(0, Math.round(inProgressTopics));
  return {
    totalTopics: Math.max(safeTotal, safeCompleted + safeInProgress),
    completedTopics: safeCompleted,
    inProgressTopics: safeInProgress,
  };
}

function highlightList(updates: RecentProgressUpdate[], key: 'strengthSubskills' | 'needsPracticeSubskills'): string[] {
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

export function applyIncrementalSummary(args: {
  existing: Partial<CourseProgressSummary> | null;
  kidId: string;
  courseId: string;
  topicId: string;
  beforeData: ProgressData;
  afterData: ProgressData;
}): CourseProgressSummary {
  const { existing, kidId, courseId, topicId, beforeData, afterData } = args;
  const beforeContribution = contribution(progressState(beforeData));
  const afterContribution = contribution(progressState(afterData));

  const totalHint = Math.max(
    numeric(afterData?.courseTotalTopics) ?? 0,
    numeric(beforeData?.courseTotalTopics) ?? 0,
    numeric(existing?.totalTopics) ?? 0,
  );
  const nextCounts = clampCounts(
    totalHint,
    (numeric(existing?.completedTopics) ?? 0) - beforeContribution.completed + afterContribution.completed,
    (numeric(existing?.inProgressTopics) ?? 0) - beforeContribution.inProgress + afterContribution.inProgress,
  );

  const previousUpdates = Array.isArray(existing?.recentUpdates)
    ? (existing?.recentUpdates as RecentProgressUpdate[])
    : [];
  const withoutTopic = previousUpdates.filter((update) => update.topicId !== topicId);
  const nextUpdate = updateFromProgress(topicId, afterData);
  const recentUpdates = [...withoutTopic, ...(nextUpdate ? [nextUpdate] : [])]
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs)
    .slice(0, 6);
  const latest = recentUpdates[0] || null;

  return {
    schemaVersion: 1,
    modelType: 'child_course_progress_v1',
    kidId,
    courseId,
    courseLabel: text(afterData?.courseLabel) || text(beforeData?.courseLabel) || text(existing?.courseLabel) || null,
    ...nextCounts,
    overallPct: nextCounts.totalTopics > 0
      ? Math.round((nextCounts.completedTopics / nextCounts.totalTopics) * 100)
      : 0,
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

export function buildSummaryFromDocs(
  kidId: string,
  courseId: string,
  docs: admin.firestore.QueryDocumentSnapshot[],
  totalTopicsHint = 0,
): CourseProgressSummary {
  let summary: CourseProgressSummary = {
    schemaVersion: 1,
    modelType: 'child_course_progress_v1',
    kidId,
    courseId,
    courseLabel: null,
    totalTopics: 0,
    completedTopics: 0,
    inProgressTopics: 0,
    overallPct: 0,
    latestTopicId: null,
    latestTopicName: null,
    latestLessonNumber: null,
    latestMastery: null,
    strengthHighlights: [],
    practiceHighlights: [],
    latestTeacherRemark: null,
    recentUpdates: [],
    lastUpdatedAtMs: null,
  };

  docs.forEach((docSnap) => {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    summary = applyIncrementalSummary({
      existing: summary,
      kidId,
      courseId,
      topicId: docSnap.id,
      beforeData: null,
      afterData: data,
    });
  });

  const maxHint = docs.reduce(
    (max, docSnap) => Math.max(max, numeric(docSnap.data()?.courseTotalTopics) ?? 0),
    0,
  );
  const resolvedTotalHint = Math.max(maxHint, totalTopicsHint);
  if (resolvedTotalHint > summary.totalTopics) {
    summary.totalTopics = resolvedTotalHint;
    summary.overallPct = resolvedTotalHint > 0
      ? Math.round((summary.completedTopics / resolvedTotalHint) * 100)
      : 0;
  }
  summary.updatedAt = FieldValue.serverTimestamp();
  return summary;
}

export function courseTopicIds(
  curriculumData: Record<string, unknown> | undefined,
  courseId: string,
): Set<string> {
  const topics = Array.isArray(curriculumData?.topics) ? curriculumData.topics : [];
  return new Set(
    topics
      .filter((topic) => {
        if (!topic || typeof topic !== 'object') return false;
        const data = topic as Record<string, unknown>;
        return normalizeCourseId(data.courseId ?? data.course) === courseId;
      })
      .map((topic) => {
        const data = topic as Record<string, unknown>;
        return text(data.id ?? data.topicId);
      })
      .filter(Boolean),
  );
}

export function docsForCourse(
  docs: admin.firestore.QueryDocumentSnapshot[],
  courseId: string,
  topicIds: Set<string>,
): admin.firestore.QueryDocumentSnapshot[] {
  return docs.filter((docSnap) => {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const documentCourseId = normalizeCourseId(data.courseId ?? data.course);
    if (documentCourseId) return documentCourseId === courseId;
    return topicIds.has(text(data.topicId) || docSnap.id);
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
}): Promise<{ sourceDocumentsRead: number; mode: 'incremental' | 'bootstrap' | 'duplicate' }> {
  const { db, eventId, kidId, courseId, topicId, beforeData, afterData } = args;
  const summaryRef = db.collection('students').doc(kidId).collection('courseProgress').doc(courseId);
  const eventRef = db.collection('students').doc(kidId).collection('progressEvents').doc(eventId);

  return db.runTransaction(async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (eventSnap.exists) {
      return { sourceDocumentsRead: 1, mode: 'duplicate' as const };
    }

    const currentSnap = await transaction.get(summaryRef);
    if (currentSnap.exists) {
      const next = applyIncrementalSummary({
        existing: currentSnap.data() as Partial<CourseProgressSummary>,
        kidId,
        courseId,
        topicId,
        beforeData,
        afterData,
      });
      transaction.set(summaryRef, next, { merge: false });
      transaction.set(eventRef, {
        schemaVersion: 1,
        projectionAppliedAt: FieldValue.serverTimestamp(),
      });
      return { sourceDocumentsRead: 2, mode: 'incremental' as const };
    }

    const progressQuery = db
      .collection('students')
      .doc(kidId)
      .collection('progress');
    const curriculumRef = db.collection('config').doc('curriculumTopics');
    const progressSnap = await transaction.get(progressQuery);
    const curriculumSnap = await transaction.get(curriculumRef);
    const topicIds = courseTopicIds(curriculumSnap.data(), courseId);
    const relevantDocs = docsForCourse(progressSnap.docs, courseId, topicIds);
    const bootstrap = buildSummaryFromDocs(
      kidId,
      courseId,
      relevantDocs,
      topicIds.size,
    );
    transaction.set(summaryRef, bootstrap, { merge: false });
    transaction.set(eventRef, {
      schemaVersion: 1,
      projectionAppliedAt: FieldValue.serverTimestamp(),
    });
    return {
      sourceDocumentsRead: 3 + progressSnap.size,
      mode: 'bootstrap' as const,
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
  const topicIds = courseTopicIds(curriculumSnap.data(), courseId);
  const relevantDocs = docsForCourse(progressSnap.docs, courseId, topicIds);
  const summaryRef = db.collection('students').doc(kidId).collection('courseProgress').doc(courseId);
  if (relevantDocs.length === 0) {
    await summaryRef.delete().catch(() => undefined);
    return progressSnap.size + 1;
  }
  await summaryRef.set(
    buildSummaryFromDocs(kidId, courseId, relevantDocs, topicIds.size),
    { merge: false },
  );
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
      schemaVersion: 1,
      source: text(afterData.source) || 'teacher_topic_progress',
      kidId,
      topicId,
      courseId,
      courseLabel: text(afterData.courseLabel) || null,
      lessonNumber: numeric(afterData.lessonNumber),
      stageLabel: text(afterData.stageLabel) || null,
      previousState: progressState(beforeData),
      currentState: progressState(afterData),
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

    let sourceDocumentsRead = 0;
    const modes: string[] = [];

    if (beforeCourseId && afterCourseId && beforeCourseId === afterCourseId) {
      const result = await updateCourseSummary({
        db,
        eventId: event.id,
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
        modes.push('rebuild_previous_course');
      }
      if (afterCourseId) {
        const result = await updateCourseSummary({
          db,
          eventId: event.id,
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
        eventId: event.id || `${Date.now()}_${topicId}`,
        kidId,
        topicId,
        beforeData,
        afterData,
      });
    }

    logger.info('Updated child course progress projection', {
      kidId,
      topicId,
      beforeCourseId: beforeCourseId || null,
      afterCourseId: afterCourseId || null,
      modes,
      sourceDocumentsRead,
    });
  },
);
