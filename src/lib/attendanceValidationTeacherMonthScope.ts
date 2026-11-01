import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { monthDateRange } from './attendanceValidationMonthlyParentProgress';

export interface AvsMonthCloseTeacherOption {
  id: string;
  label: string;
}

export interface AvsTeacherMonthParentScope {
  parentIds: string[];
  unmatchedSessionCount: number;
  unknownTeacherSessionCount?: number;
}

// These are independent safety ceilings, not pagination cut-offs. Exceeding a
// ceiling must fail visibly rather than silently omitting parents or teachers.
export const AVS_MONTH_CLOSE_TEACHER_DIRECTORY_CAP = 500;
export const AVS_MONTH_CLOSE_TEACHER_SESSION_CAP = 1000;
export const AVS_UNKNOWN_TEACHER_FILTER_ID = '__avs_unknown_teacher__';
export const AVS_MONTH_CLOSE_UNKNOWN_SCAN_PAGE_SIZE = 500;
export const AVS_MONTH_CLOSE_UNKNOWN_SCAN_CAP = 10000;

const cleanText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const teacherLabel = (teacherId: string, data: Record<string, unknown>): string =>
  [data.displayName, data.fullName, data.name, data.email]
    .map(cleanText)
    .find(Boolean) || `Teacher ${teacherId.slice(0, 8)}…`;

/** Include inactive teachers still present in users so older months remain selectable. */
export async function loadAvsMonthCloseTeacherOptions(): Promise<AvsMonthCloseTeacherOption[]> {
  const users = collection(db, 'users');
  const [primary, additionalRoles] = await Promise.all([
    getDocs(query(users, where('role', '==', 'teacher'), limit(AVS_MONTH_CLOSE_TEACHER_DIRECTORY_CAP + 1))),
    getDocs(query(users, where('roles', 'array-contains', 'teacher'), limit(AVS_MONTH_CLOSE_TEACHER_DIRECTORY_CAP + 1))),
  ]);
  if (
    primary.size > AVS_MONTH_CLOSE_TEACHER_DIRECTORY_CAP
    || additionalRoles.size > AVS_MONTH_CLOSE_TEACHER_DIRECTORY_CAP
  ) {
    throw new Error('Teacher directory exceeds the monthly-close safety limit.');
  }

  const options = new Map<string, AvsMonthCloseTeacherOption>();
  [...primary.docs, ...additionalRoles.docs].forEach((snapshot) => {
    const data = snapshot.data() as Record<string, unknown>;
    options.set(snapshot.id, { id: snapshot.id, label: teacherLabel(snapshot.id, data) });
  });
  if (options.size > AVS_MONTH_CLOSE_TEACHER_DIRECTORY_CAP) {
    throw new Error('Teacher directory exceeds the monthly-close safety limit.');
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Parent Month Close is a parent-month workflow. A teacher selects the parents
 * whose actual class sessions have canonical ownership by that teacher in the
 * selected month, including cancelled/rescheduled session records.
 *
 * A parent may legitimately appear under multiple teachers (different children,
 * courses or reassignment). Never allocate or divide billing here.
 */
export function resolveAvsTeacherMonthParentScope(
  sessions: Array<Record<string, unknown>>,
  teacherId: string,
  monthKey: string,
): AvsTeacherMonthParentScope {
  const ids = new Set<string>();
  let unmatchedSessionCount = 0;
  sessions.forEach((session) => {
    if (cleanText(session.teacherId) !== teacherId) return;
    const date = cleanText(session.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.slice(0, 7) !== monthKey) return;
    const candidateIds = [
      session.parentId,
      ...(Array.isArray(session.parentIds) ? session.parentIds : []),
    ];
    const validParentIds = candidateIds
      .map(cleanText)
      .filter((id) => id && !id.includes('/'));
    if (!validParentIds.length) {
      unmatchedSessionCount += 1;
      return;
    }
    validParentIds.forEach((id) => ids.add(id));
  });
  return { parentIds: [...ids].sort(), unmatchedSessionCount };
}

export function parentIdsForAvsTeacherMonth(
  sessions: Array<Record<string, unknown>>,
  teacherId: string,
  monthKey: string,
): string[] {
  return resolveAvsTeacherMonthParentScope(sessions, teacherId, monthKey).parentIds;
}

/** A single bounded query is issued only when a specific teacher is selected. */
export async function loadAvsTeacherMonthParentScope(
  teacherId: string,
  monthKey: string,
): Promise<AvsTeacherMonthParentScope> {
  const canonicalTeacherId = cleanText(teacherId);
  if (!canonicalTeacherId || canonicalTeacherId.includes('/')) {
    throw new Error('Invalid monthly-close teacher.');
  }
  const { fromDate, toDate } = monthDateRange(monthKey);
  const snapshot = await getDocs(query(
    collection(db, 'classSessions'),
    where('teacherId', '==', canonicalTeacherId),
    where('date', '>=', fromDate),
    where('date', '<=', toDate),
    limit(AVS_MONTH_CLOSE_TEACHER_SESSION_CAP + 1),
  ));
  if (snapshot.size > AVS_MONTH_CLOSE_TEACHER_SESSION_CAP) {
    throw new Error('Teacher-month session scope exceeds the 1,000-record safety limit. No partial results are shown.');
  }
  return resolveAvsTeacherMonthParentScope(
    snapshot.docs.map((docSnapshot) => docSnapshot.data() as Record<string, unknown>),
    canonicalTeacherId,
    monthKey,
  );
}


/**
 * "Unknown / Unmapped teacher" is a reconciliation bucket, not a teacher.
 * Include every parent with at least one month session whose canonical teacherId
 * is blank or has no matching selectable teacher profile. A parent may also
 * appear under a known teacher when their other sessions have valid ownership.
 * Never infer missing teacher identity from current student assignments.
 */
export function resolveAvsUnknownTeacherMonthParentScope(
  sessions: Array<Record<string, unknown>>,
  knownTeacherIds: ReadonlySet<string>,
  monthKey: string,
): AvsTeacherMonthParentScope {
  const ids = new Set<string>();
  let unmatchedSessionCount = 0;
  let unknownTeacherSessionCount = 0;
  sessions.forEach((session) => {
    const date = cleanText(session.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.slice(0, 7) !== monthKey) return;
    const teacherId = cleanText(session.teacherId);
    if (teacherId && knownTeacherIds.has(teacherId)) return;
    unknownTeacherSessionCount += 1;
    const candidateIds = [
      session.parentId,
      ...(Array.isArray(session.parentIds) ? session.parentIds : []),
    ];
    const validIds = candidateIds.map(cleanText).filter((id) => id && !id.includes('/'));
    if (!validIds.length) {
      unmatchedSessionCount += 1;
      return;
    }
    validIds.forEach((id) => ids.add(id));
  });
  return { parentIds: [...ids].sort(), unmatchedSessionCount, unknownTeacherSessionCount };
}

/**
 * Only triggered by the explicit Unknown / Unmapped option. Missing Firestore
 * fields cannot be filtered server-side, so scan date-indexed session records
 * in bounded pages and resolve teacher directory ownership client-side.
 *
 * The query uses snapshot cursors, not date-only offsets, so same-day sessions
 * are not skipped. Fail closed if the safety cap is exceeded.
 */
export async function loadAvsUnknownTeacherMonthParentScope(
  knownTeacherIds: ReadonlySet<string>,
  monthKey: string,
): Promise<AvsTeacherMonthParentScope> {
  const { fromDate, toDate } = monthDateRange(monthKey);
  const ids = new Set<string>();
  let unmatchedSessionCount = 0;
  let unknownTeacherSessionCount = 0;
  let total = 0;
  let cursor = null as Awaited<ReturnType<typeof getDocs>>['docs'][number] | null;
  while (true) {
    const remaining = AVS_MONTH_CLOSE_UNKNOWN_SCAN_CAP - total;
    const pageLimit = Math.min(AVS_MONTH_CLOSE_UNKNOWN_SCAN_PAGE_SIZE, remaining + 1);
    const snapshot = await getDocs(query(
      collection(db, 'classSessions'),
      where('date', '>=', fromDate),
      where('date', '<=', toDate),
      orderBy('date', 'asc'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(pageLimit),
    ));
    if (snapshot.docs.length > remaining) {
      throw new Error('Unknown teacher month scan exceeds the 10,000-session safety limit. No partial results are shown.');
    }
    total += snapshot.docs.length;
    const partial = resolveAvsUnknownTeacherMonthParentScope(
      snapshot.docs.map((docSnapshot) => docSnapshot.data() as Record<string, unknown>),
      knownTeacherIds,
      monthKey,
    );
    partial.parentIds.forEach((id) => ids.add(id));
    unmatchedSessionCount += partial.unmatchedSessionCount;
    unknownTeacherSessionCount += partial.unknownTeacherSessionCount ?? 0;
    if (snapshot.docs.length < pageLimit) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }
  return { parentIds: [...ids].sort(), unmatchedSessionCount, unknownTeacherSessionCount };
}
