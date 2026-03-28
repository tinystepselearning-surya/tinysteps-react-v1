import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { ensureAdmin } from './helpers/adminGuard';

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

export const runEnrollmentCanonicalCoverageDaily = onSchedule(
  {
    schedule: '45 2 * * *', // Daily 02:45 IST
    timeZone: 'Asia/Kolkata',
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    await computeCoverageSnapshot('scheduled', null);
  },
);
