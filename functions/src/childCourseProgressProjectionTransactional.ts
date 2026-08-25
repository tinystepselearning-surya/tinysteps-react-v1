import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import {
  MAX_CHILD_PROGRESS_REBUILD_DOCS,
  applyIncrementalSummary,
  buildSummaryFromDocs,
  curriculumTopicsForCourse,
  docsForCourse,
  normalizeCourseId,
  progressState,
  projectionMatchesCurriculum,
  type CourseProgressSummary,
} from './childCourseProgressProjectionV3';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const { FieldValue } = admin.firestore;

type ProgressData = Record<string, unknown> | null;
type ProjectionUpdateResult = {
  sourceDocumentsRead: number;
  mode: 'incremental_v3' | 'bootstrap_v3' | 'duplicate';
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStringArray(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean))).slice(0, limit);
}

function normalizeLessonStatus(value: unknown): 'not_started' | 'in_progress' | 'completed' | null {
  const raw = text(value).toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'notstarted') return 'not_started';
  if (raw === 'inprogress') return 'in_progress';
  if (raw === 'not_started' || raw === 'in_progress' || raw === 'completed') return raw;
  return null;
}

function boundedProgressQuery(db: admin.firestore.Firestore, kidId: string) {
  return db
    .collection('students')
    .doc(kidId)
    .collection('progress')
    .limit(MAX_CHILD_PROGRESS_REBUILD_DOCS + 1);
}

function assertProgressRebuildWithinCap(snap: admin.firestore.QuerySnapshot) {
  if (snap.size > MAX_CHILD_PROGRESS_REBUILD_DOCS) {
    throw new Error(`progress_rebuild_cap_exceeded:${snap.size}`);
  }
}

/**
 * Applies one source progress write to the canonical V3 course projection under a Firestore
 * transaction. Reading the event marker, current summary, curriculum definition, and (only
 * when needed) bounded source-progress query inside the transaction prevents two concurrent
 * teacher saves from reading the same summary and overwriting each other.
 *
 * The transaction also keeps bootstrap/rebuild writes serializable with incremental writes:
 * if another save changes either the course summary or any queried progress document while
 * this callback is running, Firestore retries the transaction against the newer state.
 */
async function updateCourseSummary(args: {
  db: admin.firestore.Firestore;
  eventId: string;
  kidId: string;
  courseId: string;
  topicId: string;
  beforeData: ProgressData;
  afterData: ProgressData;
}): Promise<ProjectionUpdateResult> {
  const { db, eventId, kidId, courseId, topicId, beforeData, afterData } = args;
  const summaryRef = db.collection('students').doc(kidId).collection('courseProgress').doc(courseId);
  const eventRef = db.collection('students').doc(kidId).collection('progressEvents').doc(eventId);
  const curriculumRef = db.collection('config').doc('curriculumTopics');
  const progressQuery = boundedProgressQuery(db, kidId);

  return db.runTransaction(async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (eventSnap.exists) {
      return { sourceDocumentsRead: 1, mode: 'duplicate' as const };
    }

    const currentSnap = await transaction.get(summaryRef);
    const curriculumSnap = await transaction.get(curriculumRef);
    const curriculumData = curriculumSnap.data() as Record<string, unknown> | undefined;
    const topics = curriculumTopicsForCourse(curriculumData, courseId);
    const existing = currentSnap.exists
      ? (currentSnap.data() as Partial<CourseProgressSummary>)
      : null;

    if (projectionMatchesCurriculum(existing, courseId, topics)) {
      const next = applyIncrementalSummary({
        existing,
        kidId,
        courseId,
        topicId,
        beforeData,
        afterData,
        curriculumData,
      });
      transaction.set(summaryRef, next, { merge: false });
      transaction.set(eventRef, {
        schemaVersion: 3,
        projectionAppliedAt: FieldValue.serverTimestamp(),
      });
      return { sourceDocumentsRead: 3, mode: 'incremental_v3' as const };
    }

    const progressSnap = await transaction.get(progressQuery);
    assertProgressRebuildWithinCap(progressSnap);
    const topicIds = new Set(topics.map((topic) => topic.id));
    const relevantDocs = docsForCourse(progressSnap.docs, courseId, topicIds);
    const bootstrap = buildSummaryFromDocs(kidId, courseId, relevantDocs, curriculumData);

    transaction.set(summaryRef, bootstrap, { merge: false });
    transaction.set(eventRef, {
      schemaVersion: 3,
      projectionAppliedAt: FieldValue.serverTimestamp(),
    });
    return {
      sourceDocumentsRead: 3 + progressSnap.size,
      mode: 'bootstrap_v3' as const,
    };
  });
}

/**
 * Rebuilds a previous course after a lesson moves courses or is removed. The summary and the
 * bounded source query are both transaction reads so this rebuild cannot clobber a concurrent
 * incremental save for the same child/course.
 */
async function rebuildCourseAfterRemoval(args: {
  db: admin.firestore.Firestore;
  kidId: string;
  courseId: string;
}): Promise<number> {
  const { db, kidId, courseId } = args;
  const summaryRef = db.collection('students').doc(kidId).collection('courseProgress').doc(courseId);
  const curriculumRef = db.collection('config').doc('curriculumTopics');
  const progressQuery = boundedProgressQuery(db, kidId);

  return db.runTransaction(async (transaction) => {
    // Reading summaryRef deliberately serializes this rebuild with incremental V3 updates.
    await transaction.get(summaryRef);
    const curriculumSnap = await transaction.get(curriculumRef);
    const progressSnap = await transaction.get(progressQuery);
    assertProgressRebuildWithinCap(progressSnap);

    const curriculumData = curriculumSnap.data() as Record<string, unknown> | undefined;
    const topics = curriculumTopicsForCourse(curriculumData, courseId);
    const relevantDocs = docsForCourse(
      progressSnap.docs,
      courseId,
      new Set(topics.map((topic) => topic.id)),
    );

    if (topics.length === 0 && relevantDocs.length === 0) {
      transaction.delete(summaryRef);
    } else {
      transaction.set(
        summaryRef,
        buildSummaryFromDocs(kidId, courseId, relevantDocs, curriculumData),
        { merge: false },
      );
    }

    return progressSnap.size + 2;
  });
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
      schemaVersion: 3,
      completionAuthority: 'teacher_progress_save',
      source: text(afterData.source) || 'teacher_topic_progress',
      kidId,
      topicId,
      courseId,
      courseLabel: text(afterData.courseLabel) || null,
      lessonNumber: numeric(afterData.lessonNumber),
      stageLabel: text(afterData.stageLabel) || null,
      previousState: progressState(beforeData),
      currentState: progressState(afterData),
      learningStatus: normalizeLessonStatus(afterData.lessonStatus),
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
 * Canonical parent course/stage projection.
 *
 * The public export name intentionally remains `onStudentProgressReadModelWrite`, so Firebase
 * deploys this as the existing P3 writer rather than a second projection trigger.
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
        modes.push('rebuild_previous_course_v3_transactional');
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

    logger.info('Updated canonical child course progress projection', {
      eventId,
      kidId,
      topicId,
      beforeCourseId: beforeCourseId || null,
      afterCourseId: afterCourseId || null,
      modes,
      sourceDocumentsRead,
      schemaVersion: 3,
      completionAuthority: 'teacher_progress_save',
      concurrencyMode: 'firestore_transaction',
    });
  },
);
