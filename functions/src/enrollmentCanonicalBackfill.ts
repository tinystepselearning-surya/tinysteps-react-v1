import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

interface BackfillRequest {
  apply?: boolean;
  limit?: number;
  startAfterId?: string;
}

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

function arrayEquals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

type PlanResult = {
  patch: Record<string, unknown>;
  ambiguousReasons: string[];
  unresolvedReasons: string[];
};

function buildBackfillPlan(docId: string, data: Record<string, unknown>): PlanResult {
  const patch: Record<string, unknown> = {};
  const ambiguousReasons: string[] = [];
  const unresolvedReasons: string[] = [];

  const enrollmentId = toOptionalId(data.enrollmentId);
  if (!enrollmentId) {
    patch.enrollmentId = docId;
  }

  const rawKidId = toOptionalId(data.kidId);
  const rawStudentId = toOptionalId(data.studentId);
  const rawKidIds = toStringList(data.kidIds);
  let resolvedKidId = rawKidId || rawStudentId || null;
  if (!resolvedKidId && rawKidIds.length === 1) {
    resolvedKidId = rawKidIds[0];
  }

  if (rawKidId && rawStudentId && rawKidId !== rawStudentId) {
    ambiguousReasons.push('kidId_studentId_mismatch');
  }
  if (rawKidId && rawKidIds.length > 0 && !rawKidIds.includes(rawKidId)) {
    ambiguousReasons.push('kidId_not_in_kidIds');
  }
  if (!resolvedKidId && rawKidIds.length > 1) {
    ambiguousReasons.push('kidId_ambiguous_from_kidIds');
  }
  if (!resolvedKidId) {
    unresolvedReasons.push('kidId_unresolved');
  }

  const rawParentId = toOptionalId(data.parentId);
  const rawParentIds = toStringList(data.parentIds);
  let resolvedParentId = rawParentId || null;
  if (!resolvedParentId && rawParentIds.length === 1) {
    resolvedParentId = rawParentIds[0];
  }

  if (!resolvedParentId && rawParentIds.length > 1) {
    ambiguousReasons.push('parentId_ambiguous_from_parentIds');
  }
  if (!resolvedParentId) {
    unresolvedReasons.push('parentId_unresolved');
  }

  const rawTeacherId = toOptionalId(data.teacherId);
  const rawTeacherIds = toStringList(data.teacherIds);
  let resolvedTeacherId = rawTeacherId || null;
  if (!resolvedTeacherId && rawTeacherIds.length === 1) {
    resolvedTeacherId = rawTeacherIds[0];
  }

  if (!resolvedTeacherId && rawTeacherIds.length > 1) {
    ambiguousReasons.push('teacherId_ambiguous_from_teacherIds');
  }
  if (!resolvedTeacherId) {
    unresolvedReasons.push('teacherId_unresolved');
  }

  if (ambiguousReasons.length > 0) {
    return { patch: {}, ambiguousReasons, unresolvedReasons };
  }

  if (resolvedKidId) {
    if (!rawKidId) patch.kidId = resolvedKidId;
    const nextKidIds = Array.from(new Set([...rawKidIds, resolvedKidId]));
    if (nextKidIds.length > 0 && !arrayEquals(rawKidIds, nextKidIds)) {
      patch.kidIds = nextKidIds;
    }
  }

  if (resolvedParentId) {
    if (!rawParentId) patch.parentId = resolvedParentId;
    const nextParentIds = Array.from(new Set([...rawParentIds, resolvedParentId]));
    if (nextParentIds.length > 0 && !arrayEquals(rawParentIds, nextParentIds)) {
      patch.parentIds = nextParentIds;
    }
  }

  if (resolvedTeacherId) {
    if (!rawTeacherId) patch.teacherId = resolvedTeacherId;
    const nextTeacherIds = Array.from(new Set([...rawTeacherIds, resolvedTeacherId]));
    if (nextTeacherIds.length > 0 && !arrayEquals(rawTeacherIds, nextTeacherIds)) {
      patch.teacherIds = nextTeacherIds;
    }
  }

  return { patch, ambiguousReasons, unresolvedReasons };
}

export const adminBackfillEnrollmentCanonicalFields = onCall<BackfillRequest>(
  { region: REGION, memory: '512MiB', timeoutSeconds: 300 },
  async (request) => {
    await ensureAdmin(request.auth);
    const startedAtMs = Date.now();

    const apply = request.data?.apply === true;
    const limitRaw = Number(request.data?.limit);
    const limitValue = Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 300;
    const docsLimit = Math.max(25, Math.min(1000, limitValue));
    const startAfterId = toOptionalId(request.data?.startAfterId);
    const db = admin.firestore();

    let queryRef: FirebaseFirestore.Query = db
      .collection('enrollments')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(docsLimit);
    if (startAfterId) {
      queryRef = queryRef.startAfter(startAfterId);
    }

    const snap = await queryRef.get();
    const docs = snap.docs;

    const updates: Array<{ ref: FirebaseFirestore.DocumentReference; patch: Record<string, unknown> }> = [];
    const ambiguous: Array<{ enrollmentId: string; reasons: string[] }> = [];
    const unresolved: Array<{ enrollmentId: string; reasons: string[] }> = [];
    const errors: Array<{ enrollmentId: string; reason: string }> = [];
    let alreadyCanonical = 0;

    docs.forEach((docSnap) => {
      try {
        const data = (docSnap.data() || {}) as Record<string, unknown>;
        const plan = buildBackfillPlan(docSnap.id, data);

        if (plan.ambiguousReasons.length > 0) {
          ambiguous.push({ enrollmentId: docSnap.id, reasons: plan.ambiguousReasons });
          return;
        }

        if (Object.keys(plan.patch).length === 0) {
          alreadyCanonical += 1;
          return;
        }

        if (plan.unresolvedReasons.length > 0) {
          unresolved.push({ enrollmentId: docSnap.id, reasons: plan.unresolvedReasons });
        }

        updates.push({ ref: docSnap.ref, patch: plan.patch });
      } catch (error: any) {
        errors.push({
          enrollmentId: docSnap.id,
          reason: error?.message || 'plan_build_failed',
        });
      }
    });

    if (apply && updates.length > 0) {
      for (let i = 0; i < updates.length; i += 400) {
        const slice = updates.slice(i, i + 400);
        const batch = db.batch();
        slice.forEach((entry) => {
          batch.set(entry.ref, entry.patch, { merge: true });
        });
        await batch.commit();
      }
    }

    const lastDoc = docs[docs.length - 1] || null;
    const completedAtMs = Date.now();
    const durationMs = Math.max(0, completedAtMs - startedAtMs);
    const skippedCount = alreadyCanonical + ambiguous.length + errors.length;
    const updatedCount = apply ? updates.length : 0;
    const warningCount = ambiguous.length + unresolved.length + errors.length;
    const result = {
      ok: true,
      triggerType: 'manual',
      runStatus: 'success',
      mode: apply ? 'apply' : 'dry_run',
      scanned: docs.length,
      updated: updatedCount,
      wouldUpdate: updates.length,
      skippedCount,
      alreadyCanonical,
      ambiguousCount: ambiguous.length,
      unresolvedCount: unresolved.length,
      errorCount: errors.length,
      warningCount,
      warningState: warningCount > 0 ? 'warnings_present' : 'clean',
      startedAtMs,
      completedAtMs,
      durationMs,
      hasMore: docs.length === docsLimit,
      nextStartAfterId: lastDoc ? lastDoc.id : null,
      counts: {
        scanned: docs.length,
        updated: updatedCount,
        wouldUpdate: updates.length,
        skipped: skippedCount,
        alreadyCanonical,
        ambiguous: ambiguous.length,
        unresolved: unresolved.length,
        errors: errors.length,
      },
      ambiguousSample: ambiguous.slice(0, 25),
      unresolvedSample: unresolved.slice(0, 25),
      errorSample: errors.slice(0, 25),
      updatedSample: updates.slice(0, 25).map((entry) => ({
        enrollmentId: entry.ref.id,
        patchKeys: Object.keys(entry.patch),
      })),
    };

    const runRef = db
      .collection('adminStats')
      .doc('enrollmentCanonicalBackfillRuns')
      .collection('runs')
      .doc();
    await runRef.set(
      {
        ...result,
        createdBy: request.auth?.uid || null,
        actorUid: request.auth?.uid || null,
        startedAt: admin.firestore.Timestamp.fromMillis(startedAtMs),
        completedAt: admin.firestore.Timestamp.fromMillis(completedAtMs),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: false },
    );

    return {
      ...result,
      runId: runRef.id,
      runPath: runRef.path,
    };
  },
);
