import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { ensureAdmin } from './helpers/adminGuard';
import {
  MAX_CHILD_PROGRESS_REBUILD_DOCS,
  buildSummaryFromDocs,
  curriculumTopicsForCourse,
  docsForCourse,
  normalizeCourseId,
} from './childCourseProgressProjectionV3';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const ACTIVE_LIKE = new Set([
  'trial',
  'active',
  'paused',
  'pending_teacher',
  'pending_payment',
  'enrolled',
  'current',
  'ongoing',
]);

const PROGRESS_MIGRATION_MARKER = 'globalProgressEnrollment20260901';
const EXPECTED_UNMAPPED_PROGRESS_ROWS = 50;
const MAX_PROGRESS_MIGRATION_DOCS = 50000;
const MAX_PROGRESS_MIGRATION_ENROLLMENTS = 20000;

type EnrollmentEntry = {
  id: string;
  data: Record<string, unknown>;
};

type MigrationCandidate = {
  ref: FirebaseFirestore.DocumentReference;
  kidId: string;
  topicId: string;
  courseId: string;
  targetEnrollmentId: string;
};

type ProjectionPair = {
  kidId: string;
  courseId: string;
};

type MigrationInputs = {
  progressDocs: FirebaseFirestore.QueryDocumentSnapshot[];
  enrollments: EnrollmentEntry[];
  curriculumData: Record<string, unknown>;
};

type MigrationPlan = {
  safe: MigrationCandidate[];
  canonicalPairs: Map<string, ProjectionPair>;
  summary: {
    totalExamined: number;
    withEnrollmentId: number;
    missingEnrollmentId: number;
    alreadyCorrect: number;
    safeBackfill: number;
    blockedUnique: number;
    ambiguous: number;
    unmapped: number;
    conflicting: number;
    missingCourseId: number;
  };
};

function toOptionalId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  value.forEach((item) => {
    if (typeof item !== 'string') return;
    const text = item.trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    normalized.push(text);
  });
  return normalized;
}

function normalizeStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function hasAmbiguousCanonicalState(data: Record<string, unknown>): boolean {
  const rawKidId = toOptionalId(data.kidId);
  const rawStudentId = toOptionalId(data.studentId);
  const rawKidIds = toStringList(data.kidIds);
  if (rawKidId && rawStudentId && rawKidId !== rawStudentId) return true;
  if (rawKidId && rawKidIds.length > 0 && !rawKidIds.includes(rawKidId)) return true;
  if (!rawKidId && !rawStudentId && rawKidIds.length > 1) return true;

  const rawParentId = toOptionalId(data.parentId);
  const rawParentIds = toStringList(data.parentIds);
  if (!rawParentId && rawParentIds.length > 1) return true;

  const rawTeacherId = toOptionalId(data.teacherId);
  const rawTeacherIds = toStringList(data.teacherIds);
  if (!rawTeacherId && rawTeacherIds.length > 1) return true;

  return false;
}

function percentage(part: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((part / total) * 10000) / 100;
}

function enrollmentBelongsToKid(data: Record<string, unknown>, kidId: string): boolean {
  const canonicalKidId = toOptionalId(data.kidId);
  if (canonicalKidId) return canonicalKidId === kidId;
  return (
    toOptionalId(data.studentId) === kidId
    || toOptionalId(data.childId) === kidId
    || toStringList(data.kidIds).includes(kidId)
  );
}

function enrollmentCourseMatches(data: Record<string, unknown>, courseId: string): boolean {
  return toOptionalId(data.courseId) === courseId;
}

function resolveProgressPath(path: string): { kidId: string; topicId: string } | null {
  const parts = path.split('/').filter(Boolean);
  if (
    parts.length === 4
    && parts[0] === 'students'
    && parts[2] === 'progress'
    && parts[1]
    && parts[3]
  ) {
    return { kidId: parts[1], topicId: parts[3] };
  }
  return null;
}

function pairKey(kidId: string, courseId: string): string {
  return `${kidId}::${normalizeCourseId(courseId)}`;
}

async function loadMigrationInputs(db: FirebaseFirestore.Firestore): Promise<MigrationInputs> {
  const [progressSnap, enrollmentSnap, curriculumSnap] = await Promise.all([
    db.collectionGroup('progress').limit(MAX_PROGRESS_MIGRATION_DOCS + 1).get(),
    db.collection('enrollments').limit(MAX_PROGRESS_MIGRATION_ENROLLMENTS + 1).get(),
    db.collection('config').doc('curriculumTopics').get(),
  ]);

  if (progressSnap.size > MAX_PROGRESS_MIGRATION_DOCS) {
    throw new Error(`progress_migration_cap_exceeded:${progressSnap.size}`);
  }
  if (enrollmentSnap.size > MAX_PROGRESS_MIGRATION_ENROLLMENTS) {
    throw new Error(`progress_migration_enrollment_cap_exceeded:${enrollmentSnap.size}`);
  }
  if (!curriculumSnap.exists) {
    throw new Error('progress_migration_curriculum_missing');
  }

  return {
    progressDocs: progressSnap.docs.filter((docSnap) => Boolean(resolveProgressPath(docSnap.ref.path))),
    enrollments: enrollmentSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      data: (docSnap.data() || {}) as Record<string, unknown>,
    })),
    curriculumData: (curriculumSnap.data() || {}) as Record<string, unknown>,
  };
}

function buildMigrationPlan(inputs: MigrationInputs): MigrationPlan {
  const enrollmentById = new Map(inputs.enrollments.map((entry) => [entry.id, entry]));
  const topicIdsByCourse = new Map<string, Set<string>>();
  const safe: MigrationCandidate[] = [];
  const canonicalPairs = new Map<string, ProjectionPair>();

  let alreadyCorrect = 0;
  let blockedUnique = 0;
  let ambiguous = 0;
  let unmapped = 0;
  let conflicting = 0;
  let missingCourseId = 0;

  const topicIdsForCourse = (courseId: string): Set<string> => {
    const normalized = normalizeCourseId(courseId);
    const cached = topicIdsByCourse.get(normalized);
    if (cached) return cached;
    const ids = new Set(
      curriculumTopicsForCourse(inputs.curriculumData, normalized).map((topic) => topic.id),
    );
    topicIdsByCourse.set(normalized, ids);
    return ids;
  };

  for (const progressSnap of inputs.progressDocs) {
    const identity = resolveProgressPath(progressSnap.ref.path);
    if (!identity) continue;
    const data = (progressSnap.data() || {}) as Record<string, unknown>;
    const courseId = toOptionalId(data.courseId);
    const enrollmentId = toOptionalId(data.enrollmentId);

    if (!courseId) {
      missingCourseId += 1;
      continue;
    }

    const canonicalTopic = topicIdsForCourse(courseId).has(identity.topicId);

    if (enrollmentId) {
      const enrollment = enrollmentById.get(enrollmentId);
      if (
        !enrollment
        || !enrollmentBelongsToKid(enrollment.data, identity.kidId)
        || !enrollmentCourseMatches(enrollment.data, courseId)
      ) {
        conflicting += 1;
        continue;
      }
      alreadyCorrect += 1;
      if (canonicalTopic) {
        const normalizedCourseId = normalizeCourseId(courseId);
        canonicalPairs.set(pairKey(identity.kidId, normalizedCourseId), {
          kidId: identity.kidId,
          courseId: normalizedCourseId,
        });
      }
      continue;
    }

    const candidates = inputs.enrollments.filter((entry) => (
      enrollmentBelongsToKid(entry.data, identity.kidId)
      && enrollmentCourseMatches(entry.data, courseId)
    ));

    if (candidates.length > 1) {
      ambiguous += 1;
      continue;
    }
    if (candidates.length === 0) {
      unmapped += 1;
      continue;
    }

    const target = candidates[0];
    if (!toOptionalId(target.data.teacherId) || !canonicalTopic) {
      blockedUnique += 1;
      continue;
    }

    safe.push({
      ref: progressSnap.ref,
      kidId: identity.kidId,
      topicId: identity.topicId,
      courseId,
      targetEnrollmentId: target.id,
    });
  }

  const missingEnrollmentId = safe.length + blockedUnique + ambiguous + unmapped + missingCourseId;
  return {
    safe,
    canonicalPairs,
    summary: {
      totalExamined: inputs.progressDocs.length,
      withEnrollmentId: inputs.progressDocs.length - missingEnrollmentId,
      missingEnrollmentId,
      alreadyCorrect,
      safeBackfill: safe.length,
      blockedUnique,
      ambiguous,
      unmapped,
      conflicting,
      missingCourseId,
    },
  };
}

function assertMigrationPlanSafe(plan: MigrationPlan, phase: 'before' | 'after'): void {
  const { summary } = plan;
  if (summary.ambiguous !== 0) throw new Error(`progress_migration_ambiguous:${summary.ambiguous}`);
  if (summary.conflicting !== 0) throw new Error(`progress_migration_conflicting:${summary.conflicting}`);
  if (summary.blockedUnique !== 0) throw new Error(`progress_migration_blocked:${summary.blockedUnique}`);
  if (summary.missingCourseId !== 0) throw new Error(`progress_migration_missing_course:${summary.missingCourseId}`);
  if (summary.unmapped !== EXPECTED_UNMAPPED_PROGRESS_ROWS) {
    throw new Error(`progress_migration_unmapped_drift:${summary.unmapped}`);
  }
  if (phase === 'before' && summary.safeBackfill <= 0) {
    throw new Error('progress_migration_no_safe_rows_before_apply');
  }
  if (phase === 'after' && summary.safeBackfill !== 0) {
    throw new Error(`progress_migration_safe_rows_remain:${summary.safeBackfill}`);
  }
}

async function applyMigrationCandidates(
  db: FirebaseFirestore.Firestore,
  inputs: MigrationInputs,
  plan: MigrationPlan,
): Promise<{ updated: number; skippedAfterRecheck: number }> {
  const enrollmentById = new Map(inputs.enrollments.map((entry) => [entry.id, entry]));
  const topicIdsByCourse = new Map<string, Set<string>>();
  let updated = 0;
  let skippedAfterRecheck = 0;

  const topicIdsForCourse = (courseId: string): Set<string> => {
    const normalized = normalizeCourseId(courseId);
    const cached = topicIdsByCourse.get(normalized);
    if (cached) return cached;
    const ids = new Set(
      curriculumTopicsForCourse(inputs.curriculumData, normalized).map((topic) => topic.id),
    );
    topicIdsByCourse.set(normalized, ids);
    return ids;
  };

  for (const candidate of plan.safe) {
    let didUpdate = false;
    await db.runTransaction(async (transaction) => {
      const enrollmentRef = db.collection('enrollments').doc(candidate.targetEnrollmentId);
      const [progressSnap, enrollmentSnap] = await Promise.all([
        transaction.get(candidate.ref),
        transaction.get(enrollmentRef),
      ]);

      if (!progressSnap.exists || !enrollmentSnap.exists) return;
      const progressData = (progressSnap.data() || {}) as Record<string, unknown>;
      const enrollmentData = (enrollmentSnap.data() || {}) as Record<string, unknown>;
      const currentEnrollmentId = toOptionalId(progressData.enrollmentId);
      const currentCourseId = toOptionalId(progressData.courseId);

      if (currentEnrollmentId) {
        if (currentEnrollmentId !== candidate.targetEnrollmentId) {
          throw new Error(`progress_migration_recheck_enrollment_conflict:${candidate.ref.path}`);
        }
        return;
      }

      const expectedEnrollment = enrollmentById.get(candidate.targetEnrollmentId);
      if (
        !expectedEnrollment
        || currentCourseId !== candidate.courseId
        || !toOptionalId(enrollmentData.teacherId)
        || !enrollmentBelongsToKid(enrollmentData, candidate.kidId)
        || !enrollmentCourseMatches(enrollmentData, candidate.courseId)
        || !topicIdsForCourse(candidate.courseId).has(candidate.topicId)
      ) {
        return;
      }

      transaction.update(candidate.ref, { enrollmentId: candidate.targetEnrollmentId });
      didUpdate = true;
    });

    if (didUpdate) updated += 1;
    else skippedAfterRecheck += 1;
  }

  return { updated, skippedAfterRecheck };
}

async function rebuildProjectionPair(
  db: FirebaseFirestore.Firestore,
  pair: ProjectionPair,
): Promise<{ completedTopics: number; totalTopics: number }> {
  const summaryRef = db
    .collection('students')
    .doc(pair.kidId)
    .collection('courseProgress')
    .doc(pair.courseId);
  const curriculumRef = db.collection('config').doc('curriculumTopics');
  const progressQuery = db
    .collection('students')
    .doc(pair.kidId)
    .collection('progress')
    .limit(MAX_CHILD_PROGRESS_REBUILD_DOCS + 1);

  return db.runTransaction(async (transaction) => {
    await transaction.get(summaryRef);
    const curriculumSnap = await transaction.get(curriculumRef);
    const progressSnap = await transaction.get(progressQuery);
    if (progressSnap.size > MAX_CHILD_PROGRESS_REBUILD_DOCS) {
      throw new Error(`progress_migration_projection_cap_exceeded:${pair.kidId}:${progressSnap.size}`);
    }

    const curriculumData = (curriculumSnap.data() || {}) as Record<string, unknown>;
    const topics = curriculumTopicsForCourse(curriculumData, pair.courseId);
    if (topics.length === 0) {
      throw new Error(`progress_migration_projection_curriculum_missing:${pair.courseId}`);
    }
    const relevantDocs = docsForCourse(
      progressSnap.docs,
      pair.courseId,
      new Set(topics.map((topic) => topic.id)),
    );
    const summary = buildSummaryFromDocs(
      pair.kidId,
      pair.courseId,
      relevantDocs,
      curriculumData,
    );
    transaction.set(summaryRef, summary, { merge: false });
    return {
      completedTopics: summary.completedTopics,
      totalTopics: summary.totalTopics,
    };
  });
}

async function executeGlobalProgressEnrollmentMigration(): Promise<Record<string, unknown>> {
  const db = admin.firestore();
  const markerRef = db.collection('opsMigrations').doc(PROGRESS_MIGRATION_MARKER);
  const markerSnap = await markerRef.get();
  if (markerSnap.data()?.status === 'completed') {
    return {
      mode: 'already_completed',
      markerPath: markerRef.path,
      ...(markerSnap.data() || {}),
    };
  }

  await markerRef.set({
    status: 'running',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
    attemptCount: admin.firestore.FieldValue.increment(1),
  }, { merge: true });

  try {
    const beforeInputs = await loadMigrationInputs(db);
    const beforePlan = buildMigrationPlan(beforeInputs);
    assertMigrationPlanSafe(beforePlan, 'before');

    const applyResult = await applyMigrationCandidates(db, beforeInputs, beforePlan);

    const afterInputs = await loadMigrationInputs(db);
    const afterPlan = buildMigrationPlan(afterInputs);
    assertMigrationPlanSafe(afterPlan, 'after');

    const pairs = Array.from(afterPlan.canonicalPairs.values())
      .sort((a, b) => a.kidId.localeCompare(b.kidId) || a.courseId.localeCompare(b.courseId));
    const rebuilt: Array<ProjectionPair & { completedTopics: number; totalTopics: number }> = [];
    for (const pair of pairs) {
      const result = await rebuildProjectionPair(db, pair);
      rebuilt.push({ ...pair, ...result });
    }

    const projectionRefs = rebuilt.map((pair) => (
      db.collection('students').doc(pair.kidId).collection('courseProgress').doc(pair.courseId)
    ));
    const projectionSnaps = projectionRefs.length ? await db.getAll(...projectionRefs) : [];
    let projectionsVerified = 0;
    projectionSnaps.forEach((snap, index) => {
      const expected = rebuilt[index];
      const data = (snap.data() || {}) as Record<string, unknown>;
      if (
        snap.exists
        && Number(data.schemaVersion) === 3
        && data.modelType === 'child_course_progress_v3'
        && data.completionAuthority === 'teacher_progress_save'
        && Number(data.completedTopics) === expected.completedTopics
        && Number(data.totalTopics) === expected.totalTopics
      ) {
        projectionsVerified += 1;
      }
    });
    if (projectionsVerified !== rebuilt.length) {
      throw new Error(`progress_migration_projection_verification_failed:${projectionsVerified}/${rebuilt.length}`);
    }

    const result = {
      mode: 'completed',
      before: beforePlan.summary,
      apply: {
        candidates: beforePlan.safe.length,
        updated: applyResult.updated,
        skippedAfterRecheck: applyResult.skippedAfterRecheck,
      },
      after: afterPlan.summary,
      projectionsRebuilt: rebuilt.length,
      projectionsVerified,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await markerRef.set({ status: 'completed', ...result }, { merge: true });
    logger.info('Global progress enrollment migration completed', {
      before: beforePlan.summary,
      apply: result.apply,
      after: afterPlan.summary,
      projectionsRebuilt: rebuilt.length,
      projectionsVerified,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markerRef.set({
      status: 'failed',
      lastError: message,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    logger.error('Global progress enrollment migration failed', { error: message });
    throw error;
  }
}

async function computeCoverageSnapshot(triggerType: 'manual' | 'scheduled', createdBy: string | null) {
  const startedAtMs = Date.now();
  const db = admin.firestore();
  const pageSize = 1000;
  let queryRef: FirebaseFirestore.Query = db
    .collection('enrollments')
    .orderBy(admin.firestore.FieldPath.documentId())
    .limit(pageSize);

  let totalEnrollments = 0;
  let kidIdPresent = 0;
  let kidIdsPresent = 0;
  let parentIdPresent = 0;
  let teacherIdPresent = 0;
  let activeLikeCount = 0;
  let activeLikeTeacherIdPresent = 0;
  let ambiguousCount = 0;
  let unresolvedKidIdCount = 0;
  let unresolvedParentIdCount = 0;
  let unresolvedTeacherIdCount = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    const snap = await queryRef.get();
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      const data = (docSnap.data() || {}) as Record<string, unknown>;
      totalEnrollments += 1;

      const rawKidId = toOptionalId(data.kidId);
      const rawStudentId = toOptionalId(data.studentId);
      const rawKidIds = toStringList(data.kidIds);
      const resolvedKidId = rawKidId || rawStudentId || (rawKidIds.length === 1 ? rawKidIds[0] : null);
      if (rawKidId) kidIdPresent += 1;
      if (rawKidIds.length > 0) kidIdsPresent += 1;
      if (!resolvedKidId) unresolvedKidIdCount += 1;

      const rawParentId = toOptionalId(data.parentId);
      const rawParentIds = toStringList(data.parentIds);
      const resolvedParentId = rawParentId || (rawParentIds.length === 1 ? rawParentIds[0] : null);
      if (rawParentId) parentIdPresent += 1;
      if (!resolvedParentId) unresolvedParentIdCount += 1;

      const rawTeacherId = toOptionalId(data.teacherId);
      const rawTeacherIds = toStringList(data.teacherIds);
      const resolvedTeacherId = rawTeacherId || (rawTeacherIds.length === 1 ? rawTeacherIds[0] : null);
      if (rawTeacherId) teacherIdPresent += 1;
      if (!resolvedTeacherId) unresolvedTeacherIdCount += 1;

      if (hasAmbiguousCanonicalState(data)) ambiguousCount += 1;

      const status = normalizeStatus(data.status);
      if (ACTIVE_LIKE.has(status)) {
        activeLikeCount += 1;
        if (rawTeacherId) activeLikeTeacherIdPresent += 1;
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < pageSize) break;
    queryRef = db
      .collection('enrollments')
      .orderBy(admin.firestore.FieldPath.documentId())
      .startAfter(lastDoc.id)
      .limit(pageSize);
  }

  const coverage = {
    kidIdPct: percentage(kidIdPresent, totalEnrollments),
    kidIdsPct: percentage(kidIdsPresent, totalEnrollments),
    parentIdPct: percentage(parentIdPresent, totalEnrollments),
    teacherIdPct: percentage(teacherIdPresent, totalEnrollments),
    activeLikeTeacherIdPct: percentage(activeLikeTeacherIdPresent, activeLikeCount),
  };

  const thresholds = {
    kidIdPctMin: 99.0,
    kidIdsPctMin: 99.0,
    parentIdPctMin: 99.0,
    activeLikeTeacherIdPctMin: 95.0,
    ambiguousCountMax: 0,
  };

  const readiness = {
    kidIdReady: coverage.kidIdPct >= thresholds.kidIdPctMin,
    kidIdsReady: coverage.kidIdsPct >= thresholds.kidIdsPctMin,
    parentIdReady: coverage.parentIdPct >= thresholds.parentIdPctMin,
    activeLikeTeacherReady:
      coverage.activeLikeTeacherIdPct >= thresholds.activeLikeTeacherIdPctMin,
    ambiguityReady: ambiguousCount <= thresholds.ambiguousCountMax,
  };

  const legacyRemovalReady =
    readiness.kidIdReady &&
    readiness.kidIdsReady &&
    readiness.parentIdReady &&
    readiness.activeLikeTeacherReady &&
    readiness.ambiguityReady;
  const completedAtMs = Date.now();
  const durationMs = Math.max(0, completedAtMs - startedAtMs);

  const snapshot = {
    ok: true,
    runStatus: 'success',
    warningState: ambiguousCount > 0 ? 'warnings_present' : 'clean',
    warningCount: ambiguousCount,
    triggerType,
    createdBy,
    generatedAt: new Date().toISOString(),
    startedAtMs,
    completedAtMs,
    durationMs,
    totals: {
      totalEnrollments,
      activeLikeCount,
      kidIdPresent,
      kidIdsPresent,
      parentIdPresent,
      teacherIdPresent,
      activeLikeTeacherIdPresent,
      ambiguousCount,
      unresolvedKidIdCount,
      unresolvedParentIdCount,
      unresolvedTeacherIdCount,
    },
    coverage,
    thresholds,
    readiness: {
      ...readiness,
      legacyRemovalReady,
    },
  };

  const rootRef = db.collection('adminStats').doc('enrollmentCanonicalCoverage');
  const runRef = rootRef.collection('runs').doc();
  const writePayload = {
    ...snapshot,
    startedAt: admin.firestore.Timestamp.fromMillis(startedAtMs),
    completedAt: admin.firestore.Timestamp.fromMillis(completedAtMs),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await Promise.all([
    rootRef.set(writePayload, { merge: true }),
    runRef.set(writePayload, { merge: false }),
  ]);

  return {
    ...snapshot,
    runId: runRef.id,
    runPath: runRef.path,
  };
}

export const runEnrollmentCanonicalCoverage = onCall(
  { region: REGION, memory: '512MiB', timeoutSeconds: 300 },
  async (request) => {
    await ensureAdmin(request.auth);
    return computeCoverageSnapshot('manual', request.auth?.uid || null);
  },
);

/**
 * TEMPORARY one-shot production runner for the approved global progress enrollment migration.
 * The workflow restores this export to the normal 02:45 IST coverage audit immediately after
 * the migration marker and post-migration audit are green.
 */
export const runEnrollmentCanonicalCoverageDaily = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'Asia/Kolkata',
    region: REGION,
    memory: '1GiB',
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async () => {
    await executeGlobalProgressEnrollmentMigration();
  },
);
