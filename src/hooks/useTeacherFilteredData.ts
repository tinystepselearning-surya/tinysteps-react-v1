import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';

interface FilteredStudent {
  uid: string;
  fullName: string;
  studentName?: string;
  grade?: string;
  progressStatus?: 'on_track' | 'needs_attention';
  lastSessionDate?: string;
  enrollmentStatus?: string;
}

type EnrollmentRow = Record<string, unknown> & {
  id: string;
};

type TeacherAliasField =
  | 'teacherId'
  | 'teacherIds'
  | 'assignedTeacherId'
  | 'primaryTeacherId'
  | 'teacherUid'
  | 'teacher_id';

type QueryError = Error & { code?: string | null };

const TEACHER_ALIAS_FIELDS: Array<{ field: TeacherAliasField; operator: '==' | 'array-contains' }> = [
  { field: 'teacherId', operator: '==' },
  { field: 'teacherIds', operator: 'array-contains' },
  { field: 'assignedTeacherId', operator: '==' },
  { field: 'primaryTeacherId', operator: '==' },
  { field: 'teacherUid', operator: '==' },
  { field: 'teacher_id', operator: '==' },
];

const ACTIVE_PROGRESS_STATUS = 'on_track';

const readName = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeTeacherIds = (row: Record<string, unknown> | undefined): string[] => {
  if (!row) return [];
  const teacherIds = Array.isArray(row.teacherIds) ? row.teacherIds : [];
  const singles = [row.teacherId, row.assignedTeacherId, row.primaryTeacherId, row.teacherUid, row.teacher_id];
  return Array.from(
    new Set(
      [...teacherIds, ...singles]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
};

const extractEntityIds = (row: Record<string, unknown> | undefined): string[] => {
  if (!row) return [];

  return Array.from(
    new Set(
      [
        row.kidId,
        row.studentId,
        row.childId,
        ...(Array.isArray(row.kidIds) ? row.kidIds : []),
        ...(Array.isArray(row.studentIds) ? row.studentIds : []),
        ...(Array.isArray(row.childIds) ? row.childIds : []),
        ...(Array.isArray(row.childrenIds) ? row.childrenIds : []),
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
};

const isPermissionDeniedError = (error: unknown): boolean => {
  const code = typeof (error as QueryError | undefined)?.code === 'string'
    ? String((error as QueryError).code).toLowerCase()
    : '';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
  return code.includes('permission-denied') || message.includes('missing or insufficient permissions');
};

const devLogStudentQuery = (
  phase: 'debug' | 'info',
  details: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return;
  const logger = phase === 'info' ? console.info : console.debug;
  logger('[useTeacherFilteredStudents]', details);
};

const resolveSnapshotName = (row: EnrollmentRow): string => {
  return (
    readName(row.studentName) ||
    readName(row.childName) ||
    readName(row.kidName) ||
    readName((row.studentSnapshot as Record<string, unknown> | undefined)?.name) ||
    readName((row.childSnapshot as Record<string, unknown> | undefined)?.name) ||
    readName((row.kidSnapshot as Record<string, unknown> | undefined)?.name) ||
    'Student name pending'
  );
};

async function fetchTeacherFilteredStudents(teacherId: string): Promise<FilteredStudent[]> {
  const base = collection(db, 'enrollments');
  const settled = await Promise.allSettled(
    TEACHER_ALIAS_FIELDS.map(async ({ field, operator }) => ({
      alias: field,
      snap: await getDocs(query(base, where(field, operator, teacherId))),
    })),
  );

  const merged = new Map<string, FilteredStudent>();
  const deniedAliases: TeacherAliasField[] = [];
  let successCount = 0;
  let firstError: unknown = null;

  settled.forEach((result, index) => {
    const alias = TEACHER_ALIAS_FIELDS[index].field;

    if (result.status === 'fulfilled') {
      successCount += 1;
      result.value.snap.docs.forEach((docSnap) => {
        const row = { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) } as EnrollmentRow;
        if (!normalizeTeacherIds(row).includes(teacherId)) return;

        const uid = extractEntityIds(row)[0];
        if (!uid) return;

        const fullName = resolveSnapshotName(row);
        const next: FilteredStudent = {
          uid,
          fullName,
          studentName: fullName,
          progressStatus: ACTIVE_PROGRESS_STATUS,
          enrollmentStatus: readName(row.status).toLowerCase() || undefined,
        };

        const previous = merged.get(uid);
        if (!previous) {
          merged.set(uid, next);
          return;
        }

        const preferNextName = previous.fullName === 'Student name pending' && next.fullName !== 'Student name pending';
        if (preferNextName) {
          merged.set(uid, { ...previous, ...next });
        }
      });
      return;
    }

    firstError ??= result.reason;
    if (isPermissionDeniedError(result.reason)) deniedAliases.push(alias);

    devLogStudentQuery('info', {
      phase: 'alias-query-skipped',
      alias,
      code: (result.reason as QueryError | undefined)?.code || null,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });

  if (successCount === 0) {
    if (deniedAliases.length > 0) {
      throw Object.assign(new Error('Unable to load teacher student snapshots due to permissions.'), {
        code: 'permission-denied',
      });
    }
    throw (firstError as Error) || new Error('Unable to load teacher student snapshots.');
  }

  devLogStudentQuery('debug', {
    phase: 'loaded',
    teacherId,
    rows: merged.size,
    deniedAliases,
  });

  return Array.from(merged.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function useTeacherFilteredStudents() {
  const { user } = useAuthStore();
  const teacherId = user?.role === 'teacher' ? user.uid : '';

  const queryResult = useQuery<FilteredStudent[]>({
    queryKey: ['teacherFilteredStudents', teacherId],
    enabled: Boolean(teacherId),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: () => fetchTeacherFilteredStudents(teacherId),
  });

  const error = useMemo(() => {
    if (!queryResult.error) return null;
    return queryResult.error.message;
  }, [queryResult.error]);

  if (!user) {
    return { students: [], loading: false, error: null };
  }

  if (user.role !== 'teacher') {
    return { students: [], loading: false, error: 'Unauthorized role' };
  }

  return {
    students: queryResult.data ?? [],
    loading: queryResult.isLoading,
    error,
  };
}
