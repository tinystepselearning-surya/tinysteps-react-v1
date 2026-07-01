import { useQuery } from '@tanstack/react-query';
import { collection, doc, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { getDocLogged, getDocsLogged } from '../../../lib/firestoreReadLogging';
import { fetchTeacherSessionAliasFallbacks } from './teacherSessionOwnership';
import { TeacherStudent } from '../../../types/Teacher';

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

const fetchTeacherStudents = async (teacherId: string): Promise<TeacherStudent[]> => {
  const kidsByTeacherIdSnap = await getDocsLogged(
    'useTeacherStudents:kids-by-teacherId',
    query(collection(db, 'kids'), where('teacherId', '==', teacherId)),
    { source: 'src/pages/teacher/hooks/useTeacherStudents.ts' },
  );
  const kidDocMap = new Map<string, { id: string; data: any }>();
  kidsByTeacherIdSnap.docs.forEach((docSnap) => {
    kidDocMap.set(docSnap.id, { id: docSnap.id, data: docSnap.data() as any });
  });

  if (kidDocMap.size === 0) {
    const kidsByTeacherIdsSnap = await getDocsLogged(
      'useTeacherStudents:kids-by-teacherIds-fallback',
      query(collection(db, 'kids'), where('teacherIds', 'array-contains', teacherId)),
      { source: 'src/pages/teacher/hooks/useTeacherStudents.ts' },
    );
    kidsByTeacherIdsSnap.docs.forEach((docSnap) => {
      kidDocMap.set(docSnap.id, { id: docSnap.id, data: docSnap.data() as any });
    });
  }
  const kidDocs = Array.from(kidDocMap.values());
  const kidIds = kidDocs.map((k) => k.id);
  const kidIdSet = new Set(kidIds);

  const enrollmentsByKidId = new Map<string, any[]>();
  const enrollmentDocsById = new Map<string, any>();
  const enrollmentsBase = collection(db, 'enrollments');
  const primaryEnrollmentsSnap = await getDocsLogged(
    'useTeacherStudents:enrollments-teacherId',
    query(enrollmentsBase, where('teacherId', '==', teacherId)),
    { source: 'src/pages/teacher/hooks/useTeacherStudents.ts' },
  );
  primaryEnrollmentsSnap.docs.forEach((docSnap) => {
    enrollmentDocsById.set(docSnap.id, { id: docSnap.id, ...(docSnap.data() as any) });
  });

  if (enrollmentDocsById.size === 0) {
    const fallback = await fetchTeacherSessionAliasFallbacks<Record<string, any> & { id: string }>({
      buildScopedQuery: (field, operator) => query(enrollmentsBase, where(field, operator, teacherId)),
      includeAliases: ['teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'],
      mapDoc: (docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) }),
      rowMatchesTeacher: (row) => normalizeTeacherIds(row).includes(teacherId),
      source: 'src/pages/teacher/hooks/useTeacherStudents.ts',
      labelPrefix: 'useTeacherStudents:fallback',
    });
    fallback.rows.forEach((row) => {
      enrollmentDocsById.set(row.id, row);
    });
  }

  enrollmentDocsById.forEach((enrollment) => {
    const ids = new Set<string>();
    if (enrollment.kidId) ids.add(String(enrollment.kidId));
    if (enrollment.studentId) ids.add(String(enrollment.studentId));
    if (Array.isArray(enrollment.kidIds)) {
      enrollment.kidIds.forEach((id: any) => ids.add(String(id)));
    }
    ids.forEach((id) => {
      if (!kidIdSet.has(id)) return;
      if (!enrollmentsByKidId.has(id)) enrollmentsByKidId.set(id, []);
      enrollmentsByKidId.get(id)!.push(enrollment);
    });
  });

  const parentIds = new Set<string>();
  const courseIds = new Set<string>();
  kidDocs.forEach(({ data }) => {
    const parentId =
      data.primaryParentId ||
      data.parentId ||
      (Array.isArray(data.parentIds) ? data.parentIds[0] : null);
    if (parentId) parentIds.add(String(parentId));
  });
  enrollmentDocsById.forEach((enrollment) => {
    const courseId = String(enrollment.courseId || '').trim();
    if (courseId) courseIds.add(courseId);
  });

  const courseMap = new Map<string, string>();
  if (courseIds.size > 0) {
    const courseQueries = Array.from(courseIds).map((courseId) =>
      getDocLogged(
        'useTeacherStudents:course-by-id',
        doc(db, 'courses', courseId),
        { source: 'src/pages/teacher/hooks/useTeacherStudents.ts' },
      ),
    );
    const courseSnaps = await Promise.all(courseQueries);
    courseSnaps.forEach((courseSnap) => {
      if (!courseSnap.exists()) return;
      const data = courseSnap.data() as any;
      courseMap.set(courseSnap.id, data.title || data.name || courseSnap.id);
    });
  }

  const parentById = new Map<string, { name?: string; email?: string }>();
  await Promise.all(
    Array.from(parentIds).map(async (pid) => {
      const userSnap = await getDocLogged(
        'useTeacherStudents:parent-user-by-id',
        doc(db, 'users', pid),
        { source: 'src/pages/teacher/hooks/useTeacherStudents.ts' },
      );
      if (userSnap.exists()) {
        const u = userSnap.data() as any;
        parentById.set(pid, { name: u.displayName || u.name, email: u.email });
        return;
      }
      const parentSnap = await getDocLogged(
        'useTeacherStudents:parent-doc-by-id',
        doc(db, 'parents', pid),
        { source: 'src/pages/teacher/hooks/useTeacherStudents.ts' },
      );
      if (parentSnap.exists()) {
        const p = parentSnap.data() as any;
        parentById.set(pid, { name: p.displayName || p.name, email: p.email });
      }
    })
  );

  const statusPriority = new Set(['active', 'enrolled', 'current']);
  const toMillis = (value: any): number => {
    if (!value) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    return 0;
  };
  const recencyScore = (e: any) => {
    return (
      toMillis(e.updatedAt) ||
      toMillis(e.updated_at) ||
      toMillis(e.updatedOn) ||
      toMillis(e.updated_on) ||
      toMillis(e.createdAt) ||
      toMillis(e.created_at) ||
      toMillis(e.createdOn) ||
      toMillis(e.created_on) ||
      0
    );
  };
  const pickMostRecent = (arr: any[]) => {
    if (arr.length === 0) return undefined;
    return arr.reduce((best, curr) => (recencyScore(curr) > recencyScore(best) ? curr : best));
  };

  return kidDocs.map(({ id, data }) => {
    const enrollments = (enrollmentsByKidId.get(id) || []).filter((enrollment) =>
      normalizeTeacherIds(enrollment as Record<string, unknown>).includes(teacherId),
    );
    const preferredStatus = enrollments.filter((e) =>
      statusPriority.has(String(e.status || '').toLowerCase())
    );
    const preferred =
      pickMostRecent(preferredStatus) ||
      pickMostRecent(enrollments) ||
      enrollments[0];

    const enrollmentStatus = preferred?.status
      ? String(preferred.status).toLowerCase()
      : undefined;
    const courseId = preferred?.courseId;
    const courseName = preferred?.courseName || preferred?.courseLabel || courseMap.get(courseId) || courseId;

    const parentId =
      data.primaryParentId ||
      data.parentId ||
      (Array.isArray(data.parentIds) ? data.parentIds[0] : null);
    const parentInfo = parentId ? parentById.get(String(parentId)) : undefined;

    return {
      id,
      fullName: data.fullName || data.name || 'Unnamed',
      grade: data.grade || data.level,
      courseNames: courseName ? [courseName] : (data.courseNames || data.courses || []),
      enrollmentStatus,
      parentName: parentInfo?.name,
      parentEmail: parentInfo?.email,
      progressStatus: data.progressStatus || 'on_track',
      lastSessionDate: data.lastSessionDate,
      avatarUrl: data.avatarUrl,
    } as TeacherStudent;
  });
};

export const useTeacherStudents = (teacherId?: string) => {
  return useQuery<TeacherStudent[]>({
    queryKey: ['teacherStudents', teacherId],
    queryFn: () => (teacherId ? fetchTeacherStudents(teacherId) : Promise.resolve([])),
    enabled: Boolean(teacherId),
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
