import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from './firebaseConfig';

export type ParentProjectionBootstrapKind = 'course_progress' | 'class_attendance';
export type ParentProjectionBootstrapRequestResult =
  | 'created'
  | 'already_requested'
  | 'no_authenticated_parent'
  | 'invalid_input';

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

export function courseBootstrapRequestId(courseId: string): string | null {
  const normalized = normalizeBootstrapCourseId(courseId);
  return normalized ? `v1-course-${normalized}` : null;
}

export function attendanceBootstrapRequestId(monthKey: string): string | null {
  const normalized = String(monthKey || '').trim();
  return MONTH_RE.test(normalized) ? `v1-attendance-${normalized}` : null;
}

async function createRequest(args: {
  kidId: string;
  kind: ParentProjectionBootstrapKind;
  courseId?: string;
  monthKey?: string;
}): Promise<ParentProjectionBootstrapRequestResult> {
  const parentId = String(auth.currentUser?.uid || '').trim();
  const kidId = String(args.kidId || '').trim();
  if (!parentId) return 'no_authenticated_parent';
  if (!kidId || kidId.length > 200) return 'invalid_input';

  const normalizedCourseId = args.kind === 'course_progress'
    ? normalizeBootstrapCourseId(String(args.courseId || ''))
    : null;
  const requestId = args.kind === 'course_progress'
    ? courseBootstrapRequestId(String(args.courseId || ''))
    : attendanceBootstrapRequestId(String(args.monthKey || ''));
  if (!requestId || (args.kind === 'course_progress' && !normalizedCourseId)) return 'invalid_input';

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

    const base = {
      schemaVersion: 1,
      parentId,
      kidId,
      kind: args.kind,
      createdAt: serverTimestamp(),
    } as const;

    if (args.kind === 'course_progress') {
      await setDoc(requestRef, {
        ...base,
        courseId: normalizedCourseId,
      });
    } else {
      await setDoc(requestRef, {
        ...base,
        monthKey: String(args.monthKey || '').trim(),
      });
    }
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

export function requestClassAttendanceBootstrap(
  kidId: string,
  monthKey = currentIndiaMonthKey(),
): Promise<ParentProjectionBootstrapRequestResult> {
  return createRequest({ kidId, kind: 'class_attendance', monthKey });
}
