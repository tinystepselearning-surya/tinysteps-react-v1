import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import callFunction from './callFunctions';
import { auth, db } from './firebaseConfig';

export type ParentProjectionBootstrapKind = 'course_progress' | 'class_attendance';
export type ParentProjectionBootstrapRequestResult =
  | 'created'
  | 'already_requested'
  | 'no_authenticated_parent'
  | 'invalid_input';

export type ParentClassAttendanceRepairResult = {
  mode: string;
  repairVersion?: number;
  childRowPresent?: boolean;
  queryMode?: string;
  sourceDocumentsRead?: number;
  sourceSessionCount?: number;
  migratedIdentityRecords?: number;
};

const inFlightRequests = new Set<string>();
const IST_OFFSET_MINUTES = 330;
const COURSE_ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const COURSE_ID_ALIASES: Record<string, string> = {
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

export function normalizeBootstrapCourseId(courseId: string): string | null {
  const raw = String(courseId || '').trim().toLowerCase();
  if (!COURSE_ID_RE.test(raw)) return null;
  return COURSE_ID_ALIASES[raw] || raw;
}

export function currentIndiaMonthKey(nowMs = Date.now()): string {
  const ist = new Date(nowMs + IST_OFFSET_MINUTES * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * V2 intentionally uses a new deterministic document id. Parents may already have a completed
 * v1 bootstrap request from the old lessonStatus completion contract; reusing that id would
 * permanently block the one-time saved-lesson repair.
 */
export function courseBootstrapRequestId(courseId: string): string | null {
  const normalized = normalizeBootstrapCourseId(courseId);
  return normalized ? `v2-course-${normalized}` : null;
}

// Retained for compatibility/tests documenting the original deterministic request path.
// Class-attendance repairs now use the authenticated bounded callable below so an old failed
// request document cannot permanently block a corrected repair implementation.
export function attendanceBootstrapRequestId(monthKey: string): string | null {
  const normalized = String(monthKey || '').trim();
  return MONTH_RE.test(normalized) ? `v1-attendance-${normalized}` : null;
}

async function createRequest(args: {
  kidId: string;
  kind: 'course_progress';
  courseId: string;
}): Promise<ParentProjectionBootstrapRequestResult> {
  const parentId = String(auth.currentUser?.uid || '').trim();
  const kidId = String(args.kidId || '').trim();
  if (!parentId) return 'no_authenticated_parent';
  if (!kidId || kidId.length > 200) return 'invalid_input';

  const normalizedCourseId = normalizeBootstrapCourseId(String(args.courseId || ''));
  const requestId = courseBootstrapRequestId(String(args.courseId || ''));
  if (!requestId || !normalizedCourseId) return 'invalid_input';

  const requestKey = `${parentId}:${kidId}:${requestId}`;
  if (inFlightRequests.has(requestKey)) return 'already_requested';
  inFlightRequests.add(requestKey);

  try {
    const requestRef = doc(
      db,
      'parentProjectionBootstrapRequests',
      parentId,
      'kids',
      kidId,
      'requests',
      requestId,
    );
    const existing = await getDoc(requestRef);
    if (existing.exists()) return 'already_requested';

    await setDoc(requestRef, {
      schemaVersion: 1,
      parentId,
      kidId,
      kind: 'course_progress',
      courseId: normalizedCourseId,
      repairVersion: 2,
      createdAt: serverTimestamp(),
    });
    return 'created';
  } finally {
    inFlightRequests.delete(requestKey);
  }
}

export function requestCourseProgressBootstrap(
  kidId: string,
  courseId: string,
): Promise<ParentProjectionBootstrapRequestResult> {
  return createRequest({ kidId, kind: 'course_progress', courseId });
}

export async function requestClassAttendanceBootstrap(
  kidId: string,
  monthKey = currentIndiaMonthKey(),
): Promise<ParentClassAttendanceRepairResult> {
  const parentId = String(auth.currentUser?.uid || '').trim();
  const normalizedKidId = String(kidId || '').trim();
  const normalizedMonthKey = String(monthKey || '').trim();

  if (!parentId) {
    return { mode: 'no_authenticated_parent', childRowPresent: false };
  }
  if (!normalizedKidId || normalizedKidId.length > 200 || !MONTH_RE.test(normalizedMonthKey)) {
    return { mode: 'invalid_input', childRowPresent: false };
  }

  return callFunction<ParentClassAttendanceRepairResult, { kidId: string; monthKey: string }>(
    'bootstrapParentClassAttendance',
    { kidId: normalizedKidId, monthKey: normalizedMonthKey },
  );
}
