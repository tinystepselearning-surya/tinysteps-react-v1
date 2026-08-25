import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import {
  buildSummaryFromDocs,
  curriculumTopicsForCourse,
  docsForCourse,
  normalizeCourseId,
  projectionMatchesCurriculum,
  type CourseProgressSummary,
} from './childCourseProgressProjectionV2';
import {
  MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS,
  MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
  buildParentMonthClassAttendanceProjection,
  classAttendanceProjectionInvariantErrors,
  isMissingAttendanceIndexError,
  resolveSessionMonthKey,
} from './parentMonthlyAttendanceProjection';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const MONTH_RE = /^\d{4}-\d{2}$/;
export const MAX_CHILD_PROGRESS_BOOTSTRAP_DOCS = 250;

export type ParentProjectionBootstrapKind = 'course_progress' | 'class_attendance';

type BootstrapRequestData = {
  schemaVersion?: unknown;
  parentId?: unknown;
  kidId?: unknown;
  kind?: unknown;
  courseId?: unknown;
  monthKey?: unknown;
  createdAt?: unknown;
};

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean)));
  }
  const single = text(value);
  return single ? [single] : [];
}

function parentMatches(data: Record<string, unknown>, parentId: string): boolean {
  return (
    text(data.parentId) === parentId ||
    text(data.primaryParentId) === parentId ||
    strings(data.parentIds).includes(parentId)
  );
}

export function normalizeBootstrapKind(value: unknown): ParentProjectionBootstrapKind | null {
  const kind = text(value);
  if (kind === 'course_progress' || kind === 'class_attendance') return kind;
  return null;
}

/**
 * Keep v1 valid for clients already loaded before this repair deploy, while v2 is the
 * deterministic saved-lesson repair id used to bypass an older completed v1 request.
 */
export function isSupportedCourseBootstrapRequestId(requestId: string, courseId: string): boolean {
  const normalizedCourseId = normalizeCourseId(courseId);
  if (!normalizedCourseId) return false;
  return (
    requestId === `v1-course-${normalizedCourseId}` ||
    requestId === `v2-course-${normalizedCourseId}`
  );
}

export function currentIndiaMonthKey(nowMs = Date.now()): string {
  const ist = new Date(nowMs + IST_OFFSET_MINUTES * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function isCurrentIndiaMonthKey(monthKey: string, nowMs = Date.now()): boolean {
  return MONTH_RE.test(monthKey) && monthKey === currentIndiaMonthKey(nowMs);
}

function monthDateRangeFromKey(monthKey: string): { startYmd: string; endYmd: string } | null {
  if (!MONTH_RE.test(monthKey)) return null;
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startYmd: `${yearRaw}-${monthRaw}-01`,
    endYmd: `${yearRaw}-${monthRaw}-${String(lastDay).padStart(2, '0')}`,
  };
}

async function parentOwnsKid(
  db: admin.firestore.Firestore,
  parentId: string,
  kidId: string,
): Promise<boolean> {
  const [kidSnap, studentSnap, nestedSnap] = await Promise.all([
    db.collection('kids').doc(kidId).get(),
    db.collection('students').doc(kidId).get(),
    db.collection('parents').doc(parentId).collection('students').doc(kidId).get(),
  ]);

  if (kidSnap.exists && parentMatches((kidSnap.data() || {}) as Record<string, unknown>, parentId)) {
    return true;
  }
  if (studentSnap.exists && parentMatches((studentSnap.data() || {}) as Record<string, unknown>, parentId)) {
    return true;
  }
  return nestedSnap.exists;
}

async function bootstrapCourseProgress(args: {
  db: admin.firestore.Firestore;
  kidId: string;
  courseId: string;
}): Promise<Record<string, unknown>> {
  const { db, kidId } = args;
  const courseId = normalizeCourseId(args.courseId);
  if (!courseId) throw new Error('course_id_required');

  const summaryRef = db.collection('students').doc(kidId).collection('courseProgress').doc(courseId);
  const curriculumRef = db.collection('config').doc('curriculumTopics');
  const [summarySnap, curriculumSnap] = await Promise.all([
    summaryRef.get(),
    curriculumRef.get(),
  ]);
  const curriculumData = curriculumSnap.data() as Record<string, unknown> | undefined;
  const topics = curriculumTopicsForCourse(curriculumData, courseId);
  const existing = summarySnap.exists
    ? (summarySnap.data() as Partial<CourseProgressSummary>)
    : null;

  if (projectionMatchesCurriculum(existing, courseId, topics)) {
    return {
      mode: 'already_current',
      courseId,
      sourceDocumentsRead: 2,
      totalTopics: Number(existing?.totalTopics ?? 0),
    };
  }

  // Missing curriculum definition is itself a canonical state. Do not scan the child's
  // progress history when the denominator is unavailable.
  if (topics.length === 0) {
    const summary = buildSummaryFromDocs(kidId, courseId, [], curriculumData);
    await summaryRef.set(summary, { merge: false });
    return {
      mode: 'definition_missing',
      courseId,
      sourceDocumentsRead: 2,
      totalTopics: 0,
    };
  }

  const progressSnap = await db
    .collection('students')
    .doc(kidId)
    .collection('progress')
    .limit(MAX_CHILD_PROGRESS_BOOTSTRAP_DOCS + 1)
    .get();

  if (progressSnap.size > MAX_CHILD_PROGRESS_BOOTSTRAP_DOCS) {
    throw new Error(`progress_bootstrap_cap_exceeded:${progressSnap.size}`);
  }

  const topicIds = new Set(topics.map((topic) => topic.id));
  const relevantDocs = docsForCourse(progressSnap.docs, courseId, topicIds);
  const summary = buildSummaryFromDocs(kidId, courseId, relevantDocs, curriculumData);
  await summaryRef.set(summary, { merge: false });

  return {
    mode: 'bootstrapped',
    courseId,
    sourceDocumentsRead: 2 + progressSnap.size,
    relevantProgressDocuments: relevantDocs.length,
    totalTopics: summary.totalTopics,
    completedTopics: summary.completedTopics,
    inProgressTopics: summary.inProgressTopics,
  };
}

async function loadParentMonthSessions(
  db: admin.firestore.Firestore,
  parentId: string,
  monthKey: string,
): Promise<{
  sessions: Array<Record<string, unknown>>;
  sourceDocumentsRead: number;
  queryMode: 'parentId_date_month_bounded' | 'parentId_capped_compatibility';
}> {
  const range = monthDateRangeFromKey(monthKey);
  if (!range) throw new Error('invalid_month_key');

  try {
    const boundedSnap = await db
      .collection('classSessions')
      .where('parentId', '==', parentId)
      .where('date', '>=', range.startYmd)
      .where('date', '<=', range.endYmd)
      .limit(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS + 1)
      .get();

    if (boundedSnap.size > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
      throw new Error(`attendance_bootstrap_cap_exceeded:${boundedSnap.size}`);
    }

    return {
      sessions: boundedSnap.docs.map((docSnap) => (docSnap.data() || {}) as Record<string, unknown>),
      sourceDocumentsRead: boundedSnap.size,
      queryMode: 'parentId_date_month_bounded',
    };
  } catch (error) {
    if (!isMissingAttendanceIndexError(error)) throw error;
  }

  const compatibilitySnap = await db
    .collection('classSessions')
    .where('parentId', '==', parentId)
    .limit(MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS + 1)
    .get();

  if (compatibilitySnap.size > MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS) {
    throw new Error(`attendance_compatibility_cap_exceeded:${compatibilitySnap.size}`);
  }

  const sessions = compatibilitySnap.docs
    .map((docSnap) => (docSnap.data() || {}) as Record<string, unknown>)
    .filter((session) => resolveSessionMonthKey(session) === monthKey);

  if (sessions.length > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
    throw new Error(`attendance_bootstrap_cap_exceeded:${sessions.length}`);
  }

  return {
    sessions,
    sourceDocumentsRead: compatibilitySnap.size,
    queryMode: 'parentId_capped_compatibility',
  };
}

async function bootstrapClassAttendance(args: {
  db: admin.firestore.Firestore;
  parentId: string;
  kidId: string;
  monthKey: string;
}): Promise<Record<string, unknown>> {
  const { db, parentId, kidId, monthKey } = args;
  if (!isCurrentIndiaMonthKey(monthKey)) throw new Error('attendance_bootstrap_month_not_current');

  const readModelRef = db
    .collection('parentMonthlyReadModels')
    .doc(parentId)
    .collection('months')
    .doc(monthKey);
  const currentSnap = await readModelRef.get();
  const currentAttendance = currentSnap.data()?.attendance as Record<string, unknown> | undefined;
  const currentByKid = currentAttendance?.byKid as Record<string, unknown> | undefined;
  if (
    Number(currentAttendance?.schemaVersion) === 3 &&
    currentAttendance?.modelType === 'class_attendance_v3' &&
    currentAttendance?.childRowsAuthoritative === true &&
    Boolean(currentByKid?.[kidId])
  ) {
    return {
      mode: 'already_current',
      monthKey,
      sourceDocumentsRead: 1,
      childRowPresent: true,
    };
  }

  const source = await loadParentMonthSessions(db, parentId, monthKey);
  const generatedAtMs = Date.now();
  const projection = buildParentMonthClassAttendanceProjection(source.sessions, monthKey, generatedAtMs);
  const invariantErrors = classAttendanceProjectionInvariantErrors(projection);
  if (invariantErrors.length > 0) {
    throw new Error(`attendance_projection_invariant_failure:${invariantErrors.join('|')}`);
  }

  await readModelRef.set(
    {
      parentId,
      monthKey,
      attendance: {
        schemaVersion: 3,
        modelType: 'class_attendance_v3',
        classAuthority: 'class_sessions',
        attendanceAuthority: 'completed_session_attendance',
        childRowsAuthoritative: true,
        totalsScope: 'parent_month_child_session_instances',
        timeClassificationAsOfMs: generatedAtMs,
        timeBucketsRecomputableFromPendingStarts: true,
        queryMode: source.queryMode,
        sourceSessionCount: source.sessions.length,
        sourceDocumentsRead: source.sourceDocumentsRead,
        maxSourceSessionCount: MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
        unassignedSessionRecords: projection.unassignedSessionRecords,
        legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
        refreshedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedAtMs,
        totals: projection.totals,
        byKid: projection.byKid,
      },
    },
    { merge: true },
  );

  return {
    mode: 'bootstrapped',
    monthKey,
    sourceDocumentsRead: 1 + source.sourceDocumentsRead,
    sourceSessionCount: source.sessions.length,
    childRowPresent: Boolean(projection.byKid[kidId]),
    legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
    unassignedSessionRecords: projection.unassignedSessionRecords,
  };
}

export const onParentProjectionBootstrapRequest = onDocumentCreated(
  {
    document: 'parentProjectionBootstrapRequests/{parentId}/kids/{kidId}/requests/{requestId}',
    region: REGION,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const parentId = text(event.params.parentId);
    const kidId = text(event.params.kidId);
    const requestId = text(event.params.requestId);
    const data = (snapshot.data() || {}) as BootstrapRequestData;
    const kind = normalizeBootstrapKind(data.kind);
    const db = admin.firestore();

    const fail = async (code: string) => {
      logger.warn('Rejected parent canonical projection bootstrap request', {
        parentId,
        kidId,
        requestId,
        code,
      });
      await snapshot.ref.set(
        {
          status: 'failed',
          failureCode: code,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    };

    if (
      Number(data.schemaVersion) !== 1 ||
      text(data.parentId) !== parentId ||
      text(data.kidId) !== kidId ||
      !kind
    ) {
      await fail('invalid_request_shape');
      return;
    }

    if (!(await parentOwnsKid(db, parentId, kidId))) {
      await fail('parent_kid_mismatch');
      return;
    }

    try {
      let result: Record<string, unknown>;
      if (kind === 'course_progress') {
        const courseId = normalizeCourseId(data.courseId);
        if (!courseId || !isSupportedCourseBootstrapRequestId(requestId, courseId)) {
          await fail('invalid_course_request');
          return;
        }
        result = await bootstrapCourseProgress({ db, kidId, courseId });
      } else {
        const monthKey = text(data.monthKey);
        if (!MONTH_RE.test(monthKey) || requestId !== `v1-attendance-${monthKey}`) {
          await fail('invalid_attendance_request');
          return;
        }
        result = await bootstrapClassAttendance({ db, parentId, kidId, monthKey });
      }

      await snapshot.ref.set(
        {
          status: 'completed',
          result,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      logger.info('Completed parent canonical projection bootstrap request', {
        parentId,
        kidId,
        requestId,
        kind,
        ...result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Parent canonical projection bootstrap failed', {
        parentId,
        kidId,
        requestId,
        kind,
        message,
      });
      await snapshot.ref.set(
        {
          status: 'failed',
          failureCode: message.slice(0, 180),
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  },
);
