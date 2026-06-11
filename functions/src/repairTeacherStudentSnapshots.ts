import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const MAX_BATCH = 400;

type FirestoreRow = Record<string, unknown>;

interface RepairRequest {
  apply?: boolean;
  limit?: number;
  startAfterId?: string;
  enrollmentId?: string;
}

function toCleanText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => toCleanText(entry)).filter(Boolean)));
}

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      const next = maybeTimestamp.toDate();
      if (next instanceof Date && !Number.isNaN(next.getTime())) return next;
    }
    if (typeof maybeTimestamp.seconds === 'number') {
      const next = new Date(maybeTimestamp.seconds * 1000);
      if (!Number.isNaN(next.getTime())) return next;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const next = new Date(value);
    if (!Number.isNaN(next.getTime())) return next;
  }
  return null;
}

export function normalizeSnapshotStudentName(value: unknown): string {
  const text = toCleanText(value);
  if (!text) return '';
  if (/^unnamed student$/i.test(text)) return '';
  if (/^student name pending$/i.test(text)) return '';
  if (/^\d+\s+assigned$/i.test(text)) return '';
  if (/^assigned$/i.test(text)) return '';
  if (/^\d+\s+students?$/i.test(text)) return '';
  if (/^(student|child|kid)$/i.test(text)) return '';
  return text;
}

function readSnapshotName(value: unknown): string {
  return normalizeSnapshotStudentName((value as FirestoreRow | undefined)?.name);
}

function collectTeacherAliasIds(row: FirestoreRow): string[] {
  return Array.from(
    new Set([
      toCleanText(row.teacherId),
      ...toTextList(row.teacherIds),
      toCleanText(row.assignedTeacherId),
      toCleanText(row.primaryTeacherId),
      toCleanText(row.teacherUid),
      toCleanText(row.teacher_id),
    ].filter(Boolean)),
  );
}

function extractEntityIds(row: FirestoreRow): string[] {
  return Array.from(
    new Set([
      toCleanText(row.kidId),
      toCleanText(row.studentId),
      toCleanText(row.childId),
      ...toTextList(row.kidIds),
      ...toTextList(row.studentIds),
      ...toTextList(row.childIds),
      ...toTextList(row.childrenIds),
    ].filter(Boolean)),
  );
}

function resolveCanonicalStudentName(kid: FirestoreRow | null, row: FirestoreRow): string {
  return (
    normalizeSnapshotStudentName(kid?.studentName) ||
    normalizeSnapshotStudentName(kid?.fullName) ||
    normalizeSnapshotStudentName(kid?.displayName) ||
    normalizeSnapshotStudentName(kid?.name) ||
    normalizeSnapshotStudentName(row.studentName) ||
    normalizeSnapshotStudentName(row.childName) ||
    normalizeSnapshotStudentName(row.kidName) ||
    readSnapshotName(row.studentSnapshot) ||
    readSnapshotName(row.childSnapshot) ||
    readSnapshotName(row.kidSnapshot)
  );
}

function isMissingSnapshotName(value: unknown): boolean {
  return !normalizeSnapshotStudentName(value);
}

function mergeSnapshot(existing: unknown, canonicalName: string, entityId: string) {
  const base = typeof existing === 'object' && existing !== null ? { ...(existing as FirestoreRow) } : {};
  return {
    ...base,
    id: toCleanText(base.id) || entityId,
    kidId: toCleanText(base.kidId) || entityId,
    name: canonicalName,
  };
}

export function buildStudentSnapshotRepairPatch(
  row: FirestoreRow,
  canonicalName: string,
  entityId: string,
): Record<string, unknown> {
  if (!canonicalName || !entityId) return {};

  const patch: Record<string, unknown> = {};

  if (isMissingSnapshotName(row.studentName)) patch.studentName = canonicalName;
  if (isMissingSnapshotName(row.childName)) patch.childName = canonicalName;
  if (isMissingSnapshotName(row.kidName)) patch.kidName = canonicalName;
  if (isMissingSnapshotName((row.studentSnapshot as FirestoreRow | undefined)?.name)) {
    patch.studentSnapshot = mergeSnapshot(row.studentSnapshot, canonicalName, entityId);
  }
  if (isMissingSnapshotName((row.childSnapshot as FirestoreRow | undefined)?.name)) {
    patch.childSnapshot = mergeSnapshot(row.childSnapshot, canonicalName, entityId);
  }
  if (isMissingSnapshotName((row.kidSnapshot as FirestoreRow | undefined)?.name)) {
    patch.kidSnapshot = mergeSnapshot(row.kidSnapshot, canonicalName, entityId);
  }

  return patch;
}

export function isFutureSessionLike(session: FirestoreRow, nowMs: number): boolean {
  const startAt = toDateMaybe(session.startAt);
  if (startAt) return startAt.getTime() >= nowMs;

  const ymd = toCleanText(session.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  return ymd >= new Date(nowMs).toISOString().slice(0, 10);
}

export const adminRepairTeacherStudentSnapshots = onCall<RepairRequest>(
  { region: REGION, memory: '512MiB', timeoutSeconds: 300 },
  async (request) => {
    await ensureAdmin(request.auth);

    const apply = request.data?.apply === true;
    const limitRaw = Number(request.data?.limit);
    const docsLimit = Math.max(25, Math.min(500, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 100));
    const startAfterId = toCleanText(request.data?.startAfterId);
    const enrollmentIdFilter = toCleanText(request.data?.enrollmentId);
    const nowMs = Date.now();
    const db = admin.firestore();

    let enrollmentDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    if (enrollmentIdFilter) {
      const snap = await db.collection('enrollments').doc(enrollmentIdFilter).get();
      enrollmentDocs = snap.exists ? [snap as FirebaseFirestore.QueryDocumentSnapshot] : [];
    } else {
      let queryRef: FirebaseFirestore.Query = db
        .collection('enrollments')
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(docsLimit);
      if (startAfterId) {
        queryRef = queryRef.startAfter(startAfterId);
      }
      const snap = await queryRef.get();
      enrollmentDocs = snap.docs;
    }

    const kidCache = new Map<string, FirestoreRow | null>();
    const getKid = async (entityIds: string[]): Promise<{ entityId: string; kid: FirestoreRow | null } | null> => {
      for (const entityId of entityIds) {
        if (!entityId) continue;
        if (!kidCache.has(entityId)) {
          const snap = await db.collection('kids').doc(entityId).get();
          kidCache.set(entityId, snap.exists ? ({ id: snap.id, ...(snap.data() || {}) } as FirestoreRow) : null);
        }
        const kid = kidCache.get(entityId) || null;
        if (kid) return { entityId, kid };
      }
      return entityIds[0] ? { entityId: entityIds[0], kid: null } : null;
    };

    const enrollmentUpdates: Array<{ ref: FirebaseFirestore.DocumentReference; patch: Record<string, unknown> }> = [];
    const sessionUpdates: Array<{ ref: FirebaseFirestore.DocumentReference; patch: Record<string, unknown> }> = [];
    const repairedEnrollmentIds: string[] = [];
    const repairedSessionIds: string[] = [];
    const unresolvedEnrollmentIds: string[] = [];
    const skippedEnrollmentIds: string[] = [];

    for (const enrollmentSnap of enrollmentDocs) {
      const enrollment = { id: enrollmentSnap.id, ...(enrollmentSnap.data() || {}) } as FirestoreRow;
      if (collectTeacherAliasIds(enrollment).length === 0) {
        skippedEnrollmentIds.push(enrollmentSnap.id);
        continue;
      }

      const entityLookup = await getKid(extractEntityIds(enrollment));
      const resolvedEntityId = entityLookup?.entityId || '';
      const canonicalName = resolveCanonicalStudentName(entityLookup?.kid || null, enrollment);

      if (!resolvedEntityId || !canonicalName) {
        unresolvedEnrollmentIds.push(enrollmentSnap.id);
        continue;
      }

      const enrollmentPatch = buildStudentSnapshotRepairPatch(enrollment, canonicalName, resolvedEntityId);
      if (Object.keys(enrollmentPatch).length > 0) {
        enrollmentUpdates.push({
          ref: enrollmentSnap.ref,
          patch: {
            ...enrollmentPatch,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'adminRepairTeacherStudentSnapshots',
          },
        });
        repairedEnrollmentIds.push(enrollmentSnap.id);
      }

      const sessionsSnap = await db.collection('classSessions').where('enrollmentId', '==', enrollmentSnap.id).get();
      sessionsSnap.docs.forEach((sessionSnap) => {
        const session = { id: sessionSnap.id, ...(sessionSnap.data() || {}) } as FirestoreRow;
        if (!isFutureSessionLike(session, nowMs)) return;

        const sessionPatch = buildStudentSnapshotRepairPatch(session, canonicalName, resolvedEntityId);
        if (Object.keys(sessionPatch).length === 0) return;

        sessionUpdates.push({
          ref: sessionSnap.ref,
          patch: {
            ...sessionPatch,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'adminRepairTeacherStudentSnapshots',
          },
        });
        repairedSessionIds.push(sessionSnap.id);
      });
    }

    if (apply) {
      const allUpdates = [...enrollmentUpdates, ...sessionUpdates];
      for (let i = 0; i < allUpdates.length; i += MAX_BATCH) {
        const batch = db.batch();
        allUpdates.slice(i, i + MAX_BATCH).forEach((entry) => {
          batch.set(entry.ref, entry.patch, { merge: true });
        });
        await batch.commit();
      }
    }

    const lastDoc = enrollmentDocs[enrollmentDocs.length - 1] || null;
    const result = {
      ok: true,
      mode: apply ? 'apply' : 'dry_run',
      scannedEnrollments: enrollmentDocs.length,
      wouldRepairEnrollments: enrollmentUpdates.length,
      wouldRepairSessions: sessionUpdates.length,
      repairedEnrollmentIds,
      repairedSessionIds,
      unresolvedEnrollmentIds,
      skippedEnrollmentIds,
      hasMore: !enrollmentIdFilter && enrollmentDocs.length === docsLimit,
      nextStartAfterId: !enrollmentIdFilter && lastDoc ? lastDoc.id : null,
    };

    await db
      .collection('adminStats')
      .doc('teacherStudentSnapshotRepairRuns')
      .collection('runs')
      .doc()
      .set({
        ...result,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedCount: apply ? enrollmentUpdates.length + sessionUpdates.length : 0,
        wouldUpdateCount: enrollmentUpdates.length + sessionUpdates.length,
      });

    logger.info('adminRepairTeacherStudentSnapshots', result);
    return result;
  },
);
