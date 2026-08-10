import * as admin from 'firebase-admin';
import { createHash } from 'node:crypto';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (admin.apps.length === 0) admin.initializeApp();

type ResourceRecord = Record<string, unknown>;

const INACTIVE_ENROLLMENT_STATUSES = new Set([
  'inactive', 'cancelled', 'canceled', 'withdrawn', 'closed', 'completed', 'archived',
]);

const strings = (value: unknown): string[] => Array.isArray(value)
  ? Array.from(new Set(value.map((entry) => String(entry || '').trim()).filter(Boolean)))
  : [];

export function sanitizeWorksheetUrl(value: unknown): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function parentWorksheetIsAllowed(
  data: ResourceRecord,
  context: { parentId: string; kidId: string; courseIds: Set<string>; enrollmentIds: Set<string> },
): boolean {
  if (data.isActive === false || data.active === false || data.isArchived === true || data.archived === true) return false;
  const targetKids = [...strings(data.targetKidIds), ...strings(data.targetChildIds)];
  if (targetKids.length > 0 && !targetKids.includes(context.kidId)) return false;
  const targetCourses = strings(data.targetCourseIds);
  if (targetCourses.length > 0 && !targetCourses.some((id) => context.courseIds.has(id))) return false;
  if (targetCourses.length === 0) {
    const targetParents = strings(data.targetParentIds);
    if (!targetParents.includes(context.parentId) && !targetParents.includes('all_parents')) return false;
  }
  const targetEnrollments = strings(data.targetEnrollmentIds);
  return targetEnrollments.length === 0 || targetEnrollments.some((id) => context.enrollmentIds.has(id));
}

async function parentOwnsKid(db: admin.firestore.Firestore, parentId: string, kidId: string): Promise<boolean> {
  const [kidSnap, studentSnap, nestedSnap] = await Promise.all([
    db.collection('kids').doc(kidId).get(),
    db.collection('students').doc(kidId).get(),
    db.collection('parents').doc(parentId).collection('students').doc(kidId).get(),
  ]);
  for (const snap of [kidSnap, studentSnap]) {
    if (!snap.exists) continue;
    const data = snap.data() || {};
    const parentIds = [...strings(data.parentIds), ...(typeof data.parentIds === 'string' ? [data.parentIds.trim()] : [])];
    if (data.parentId === parentId || data.primaryParentId === parentId || parentIds.includes(parentId)) return true;
  }
  const canonicalKidId = String(studentSnap.data()?.kidId || '').trim();
  if (canonicalKidId && canonicalKidId !== kidId) {
    const canonicalKid = (await db.collection('kids').doc(canonicalKidId).get()).data() || {};
    const canonicalParents = [...strings(canonicalKid.parentIds), ...(typeof canonicalKid.parentIds === 'string' ? [canonicalKid.parentIds.trim()] : [])];
    if (canonicalKid.parentId === parentId || canonicalKid.primaryParentId === parentId || canonicalParents.includes(parentId)) return true;
  }
  return nestedSnap.exists;
}

async function activeEnrollmentContext(db: admin.firestore.Firestore, kidId: string) {
  const snapshots = await Promise.all([
    db.collection('enrollments').where('kidId', '==', kidId).get(),
    db.collection('enrollments').where('studentId', '==', kidId).get(),
    db.collection('enrollments').where('childId', '==', kidId).get(),
    db.collection('enrollments').where('kidIds', 'array-contains', kidId).get(),
  ]);
  const enrollments = new Map<string, ResourceRecord>();
  snapshots.forEach((snap) => snap.docs.forEach((entry) => enrollments.set(entry.id, entry.data())));
  const enrollmentIds = new Set<string>();
  const courseIds = new Set<string>();
  enrollments.forEach((data, id) => {
    const status = String(data.status || 'active').trim().toLowerCase();
    if (INACTIVE_ENROLLMENT_STATUSES.has(status)) return;
    enrollmentIds.add(id);
    const courseId = String(data.courseId || '').trim();
    if (courseId) courseIds.add(courseId);
  });
  return { enrollmentIds, courseIds };
}

const opaqueKey = (namespace: string, value: string) => createHash('sha256').update(`${namespace}:${value}`).digest('hex').slice(0, 24);

function parentFacingResource(id: string, data: ResourceRecord, courseTitleById: Map<string, string>) {
  const url = sanitizeWorksheetUrl(data.worksheetUrl || data.url);
  if (!url) return null;
  const rawLessonId = String(data.lessonId || '').trim();
  const rawCourseId = String(data.courseId || strings(data.targetCourseIds)[0] || '').trim();
  return {
    id: opaqueKey('worksheet', id),
    title: String(data.title || '').trim(),
    url,
    description: String(data.description || '').trim(),
    resourceType: String(data.resourceType || data.activityType || data.category || '').trim(),
    lessonId: rawLessonId ? opaqueKey('lesson', rawLessonId) : '',
    lessonTitle: String(data.lessonTitle || data.lessonName || '').trim(),
    lessonFolderId: String(data.lessonFolderId || '').trim(),
    lessonFolderTitle: String(data.lessonFolderTitle || '').trim(),
    courseId: rawCourseId ? opaqueKey('course', rawCourseId) : 'legacy',
    courseTitle: String(data.courseTitle || data.courseName || courseTitleById.get(rawCourseId) || 'Course resources').trim(),
    sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
  };
}

export async function loadParentWorksheetResources(
  db: admin.firestore.Firestore,
  parentId: string,
  kidId: string,
) {
  if (!(await parentOwnsKid(db, parentId, kidId))) {
    throw new HttpsError('permission-denied', 'This child is not linked to the authenticated parent.');
  }
  const context = await activeEnrollmentContext(db, kidId);
  const snapshot = await db.collection('parentWorksheetLibrary').get();
  const allowedDocs = snapshot.docs.filter((entry) => parentWorksheetIsAllowed(entry.data(), { parentId, kidId, ...context }));
  const courseIds = Array.from(new Set(allowedDocs.flatMap((entry) => strings(entry.data().targetCourseIds)).filter(Boolean)));
  const courseSnaps = await Promise.all(courseIds.map((courseId) => db.collection('courses').doc(courseId).get()));
  const courseTitleById = new Map(courseSnaps.map((snap, index) => {
    const data = snap.data() || {};
    return [courseIds[index], String(data.name || data.title || data.label || '').trim()];
  }));
  return allowedDocs
    .map((entry) => parentFacingResource(entry.id, entry.data(), courseTitleById))
    .filter(Boolean)
    .sort((a, b) => (a!.sortOrder - b!.sortOrder) || a!.title.localeCompare(b!.title));
}

export const getParentWorksheetResources = onCall({ region: 'asia-south1' }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in as a parent to view worksheets.');
  const tokenRole = String(request.auth.token?.role || '').trim().toLowerCase();
  const userRole = tokenRole || String((await admin.firestore().collection('users').doc(request.auth.uid).get()).data()?.role || '').trim().toLowerCase();
  if (userRole !== 'parent') throw new HttpsError('permission-denied', 'Parent access is required.');
  const kidId = String((request.data as { kidId?: unknown } | undefined)?.kidId || '').trim();
  if (!kidId || kidId.length > 200) throw new HttpsError('invalid-argument', 'A valid kidId is required.');

  const db = admin.firestore();
  const resources = await loadParentWorksheetResources(db, request.auth.uid, kidId);
  return { resources };
});
