import { useQuery } from '@tanstack/react-query';
import { collection, doc, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { getDocLogged, getDocsLogged } from '../../../lib/firestoreReadLogging';
import { operationalTeacherRecordBelongsTo } from '../../../lib/teacherIdentity';
import { TeacherStudent } from '../../../types/Teacher';

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

  return kidDocs.flatMap(({ id, data }) => {
    const enrollments = (enrollmentsByKidId.get(id) || []).filter((enrollment) =>
      operationalTeacherRecordBelongsTo(enrollment as Record<string, unknown>, teacherId),
    );
    const parentId =
      data.primaryParentId ||
      data.parentId ||
      (Array.isArray(data.parentIds) ? data.parentIds[0] : null);
    const parentInfo = parentId ? parentById.get(String(parentId)) : undefined;

    return enrollments.map((enrollment) => {
      const courseId = String(enrollment.courseId || '').trim();
      const courseName =
        enrollment.courseName || enrollment.courseLabel || courseMap.get(courseId) || courseId;
      return {
        id,
        enrollmentId: String(enrollment.id),
        fullName: data.fullName || data.name || 'Unnamed',
        grade: data.grade || data.level,
        courseNames: courseName ? [courseName] : [],
        enrollmentStatus: enrollment.status ? String(enrollment.status).toLowerCase() : undefined,
        parentName: parentInfo?.name,
        parentEmail: parentInfo?.email,
        progressStatus: data.progressStatus || 'on_track',
        lastSessionDate: data.lastSessionDate,
        avatarUrl: data.avatarUrl,
      } as TeacherStudent;
    });
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
