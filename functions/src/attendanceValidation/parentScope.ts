import type { Firestore, Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export const AVS_PARENT_ENROLLMENT_LIMIT = 300;
export function normalizeAvsParentId(value: unknown): string | null {
  if (value === undefined || value === null || value === '' || value === 'all') return null;
  if (typeof value !== 'string' || value !== value.trim() || !value
    || Buffer.byteLength(value, 'utf8') > 240 || (value.includes('/') || [...value].some((char) => char.charCodeAt(0) < 32))
    || value === '.' || value === '..' || /^__.*__$/.test(value)) {
    throw new HttpsError('invalid-argument', 'parentId must be a safe Firestore document ID.');
  }
  return value;
}

export async function resolveAvsParentEnrollments(db: Firestore, parentId: string | null) {
  if (!parentId) return null;
  // Enrollment.parentId is the canonical ownership link; kids.parentIds is not an enrollment contract.
  const snapshot = await db.collection('enrollments').where('parentId', '==', parentId)
    .limit(AVS_PARENT_ENROLLMENT_LIMIT + 1).get();
  if (snapshot.size > AVS_PARENT_ENROLLMENT_LIMIT) {
    throw new HttpsError('failed-precondition', 'Parent exceeds the safe enrollment query bound.');
  }
  return snapshot.docs.map((doc) => doc.id);
}

/** Every query is scoped before execution; null means all, [] means no matches. */
export async function getAvsScopedDocuments(
  base: Query, enrollmentIds: readonly string[] | null, perQueryLimit: number,
): Promise<QueryDocumentSnapshot[]> {
  const scopes: Array<readonly string[] | null> = enrollmentIds === null ? [null] : [];
  if (enrollmentIds) {
    for (let i = 0; i < enrollmentIds.length; i += 30) scopes.push(enrollmentIds.slice(i, i + 30));
  }
  const docs: QueryDocumentSnapshot[] = [];
  for (const scope of scopes) {
    const snapshot = await (scope ? base.where('enrollmentId', 'in', scope) : base)
      .limit(perQueryLimit).get();
    docs.push(...snapshot.docs);
  }
  return docs;
}
