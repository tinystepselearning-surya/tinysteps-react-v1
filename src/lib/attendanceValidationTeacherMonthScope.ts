import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { monthDateRange } from './attendanceValidationMonthlyParentProgress';

export interface AvsMonthCloseTeacherOption {
  id: string;
  label: string;
}

// These are independent safety ceilings, not pagination cut-offs. Exceeding a
// ceiling must fail visibly rather than silently omitting parents or teachers.
export const AVS_MONTH_CLOSE_TEACHER_DIRECTORY_CAP = 500;
export const AVS_MONTH_CLOSE_TEACHER_SESSION_CAP = 1000;

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
export function parentIdsForAvsTeacherMonth(
  sessions: Array<Record<string, unknown>>,
  teacherId: string,
  monthKey: string,
): string[] {
  const ids = new Set<string>();
  sessions.forEach((session) => {
    if (cleanText(session.teacherId) !== teacherId) return;
    const date = cleanText(session.date);
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date) || date.slice(0, 7) !== monthKey) return;
    const parentId = cleanText(session.parentId);
    if (parentId && !parentId.includes('/')) ids.add(parentId);
  });
  return [...ids].sort();
}

/** A single bounded query is issued only when a specific teacher is selected. */
export async function loadAvsTeacherMonthParentIds(
  teacherId: string,
  monthKey: string,
): Promise<string[]> {
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
  return parentIdsForAvsTeacherMonth(
    snapshot.docs.map((docSnapshot) => docSnapshot.data() as Record<string, unknown>),
    canonicalTeacherId,
    monthKey,
  );
}
