import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { TeacherStudent } from '../../../types/Teacher';

const fetchTeacherStudents = async (teacherId: string): Promise<TeacherStudent[]> => {
  const kidsQuery = query(collection(db, 'kids'), where('teacherIds', 'array-contains', teacherId));
  const kidsSnap = await getDocs(kidsQuery);
  const kidDocs = kidsSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() as any }));
  const kidIds = kidDocs.map((k) => k.id);

  const courseMap = new Map<string, string>();
  const coursesSnap = await getDocs(collection(db, 'courses'));
  coursesSnap.docs.forEach((doc) => {
    const data = doc.data() as any;
    const title = data.title || data.name || doc.id;
    courseMap.set(doc.id, title);
  });

  const enrollmentsByKidId = new Map<string, any[]>();
  const enrollmentDocsById = new Map<string, any>();
  const chunkSize = 10;
  for (let i = 0; i < kidIds.length; i += chunkSize) {
    const chunk = kidIds.slice(i, i + chunkSize);
    const [snapByArray, snapById, snapByStudentId] = await Promise.all([
      getDocs(query(collection(db, 'enrollments'), where('kidIds', 'array-contains-any', chunk))),
      getDocs(query(collection(db, 'enrollments'), where('kidId', 'in', chunk))),
      getDocs(query(collection(db, 'enrollments'), where('studentId', 'in', chunk))),
    ]);
    [...snapByArray.docs, ...snapById.docs, ...snapByStudentId.docs].forEach((doc) => {
      if (enrollmentDocsById.has(doc.id)) return;
      enrollmentDocsById.set(doc.id, { id: doc.id, ...(doc.data() as any) });
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
      if (!enrollmentsByKidId.has(id)) enrollmentsByKidId.set(id, []);
      enrollmentsByKidId.get(id)!.push(enrollment);
    });
  });

  const parentIds = new Set<string>();
  kidDocs.forEach(({ data }) => {
    const parentId =
      data.primaryParentId ||
      data.parentId ||
      (Array.isArray(data.parentIds) ? data.parentIds[0] : null);
    if (parentId) parentIds.add(String(parentId));
  });

  const parentById = new Map<string, { name?: string; email?: string }>();
  await Promise.all(
    Array.from(parentIds).map(async (pid) => {
      const userSnap = await getDoc(doc(db, 'users', pid));
      if (userSnap.exists()) {
        const u = userSnap.data() as any;
        parentById.set(pid, { name: u.displayName || u.name, email: u.email });
        return;
      }
      const parentSnap = await getDoc(doc(db, 'parents', pid));
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
    const enrollments = enrollmentsByKidId.get(id) || [];
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
    staleTime: 1000 * 60 * 5,
  });
};
