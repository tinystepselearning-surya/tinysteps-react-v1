// src/hooks/useData.ts
import { useQuery } from '@tanstack/react-query';
import type { Timestamp } from 'firebase/firestore';
import type {
  Enrollment,
  Invoice,
  ProgressItem,
  Session,
  AttendanceRecord,
  Course,
  Topic,
} from '../types/models';

export interface KidRecord {
  id: string;
  birthdate?: any;
  [key: string]: any;
}

/** small helpers */
const chunk = <T,>(arr: T[], size = 10) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// Hook 1: useKidProgress
export function useKidProgress(kidId: string) {
  return useQuery({
    queryKey: ['progress', kidId],
    queryFn: async () => {
      const [{ collection, query, where, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const q = query(collection(db, 'progress'), where('studentId', '==', kidId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as ProgressItem[];
    },
    enabled: !!kidId,
  });
}

// Hook 2: useSessionsForTeacher
export function useSessionsForTeacher(teacherId: string) {
  return useQuery({
    queryKey: ['sessions', 'teacher', teacherId],
    queryFn: async () => {
      const [{ collection, query, where, orderBy, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const q = query(
        collection(db, 'sessions'),
        where('teacherId', '==', teacherId),
        where('status', 'in', ['scheduled', 'in_progress']),
        orderBy('date', 'asc'),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d: any) => ({ id: d.id, ...(d.data() as Session) }));
    },
    enabled: !!teacherId,
  });
}

// Hook 3: useKidAttendance
export function useKidAttendance(kidId: string, monthStart: string) {
  return useQuery({
    queryKey: ['attendance', kidId, monthStart],
    queryFn: async () => {
      const [{ collection, query, where, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      // NOTE: This is heavy (scans sessions then subcollections). OK for now; later we can denormalize.
      const q = query(collection(db, 'attendance'));
      const snapshot = await getDocs(q);

      let total = 0;
      let present = 0;
      let late = 0;
      let absent = 0;

      for (const sessionDoc of snapshot.docs) {
        const attendanceRef = collection(db, 'attendance', sessionDoc.id, 'attendanceRecords');
        const attQ = query(attendanceRef, where('kidId', '==', kidId));
        const attSnap = await getDocs(attQ);

        attSnap.forEach((d: any) => {
          const data = d.data() as AttendanceRecord;
          const markedAt = data.markedAt as Timestamp | undefined;
          const dateStr = markedAt ? markedAt.toDate().toISOString().split('T')[0] : undefined;
          if (!dateStr) return;
          if (dateStr >= monthStart) {
            total++;
            if (data.status === 'present') present++;
            else if (data.status === 'late') late++;
            else if (data.status === 'absent') absent++;
          }
        });
      }

      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { total, present, late, absent, percentage };
    },
    enabled: !!kidId && !!monthStart,
  });
}

// Hook 4: useEnrollments (Parent)
export function useEnrollments(parentId: string) {
  return useQuery({
    queryKey: ['enrollments', parentId],
    queryFn: async () => {
      // simple in-memory TTL cache to avoid refetching frequently during a dev session
      const CACHE_TTL = 60 * 1000; // 60 seconds
      const cacheKey = `enrollments:${parentId}`;

      // @ts-ignore
      if ((globalThis as any).__enrollmentsCache && (globalThis as any).__enrollmentsCache.has(cacheKey)) {
        // @ts-ignore
        const entry = (globalThis as any).__enrollmentsCache.get(cacheKey);
        if (entry.expiresAt > Date.now()) return entry.data;
      }

      const [{ collection, query, where, getDocs, documentId }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const q = query(
        collection(db, 'enrollments'),
        where('parentId', '==', parentId),
        where('status', '==', 'active'),
      );
      const snap = await getDocs(q);

      const batchFetch = async (collectionName: string, ids: string[]) => {
        const map = new Map<string, any>();
        if (!ids || ids.length === 0) return map;
        const idChunks = chunk(ids, 10);
        for (const c of idChunks) {
          const qd = query(collection(db, collectionName), where(documentId(), 'in', c));
          const s = await getDocs(qd);
          s.docs.forEach((d: any) => map.set(d.id, d.data()));
        }
        return map;
      };

      // gather ids to prefetch
      const allKidIds = new Set<string>();
      const courseIds = new Set<string>();
      const teacherIds = new Set<string>();

      snap.docs.forEach((d: any) => {
        const enrollment = d.data() as Enrollment;
        (enrollment.kidIds || []).forEach((k) => allKidIds.add(k));
        if ((enrollment as any).courseId) courseIds.add((enrollment as any).courseId);
        if ((enrollment as any).teacherId) teacherIds.add((enrollment as any).teacherId);
      });

      const [kidsMap, coursesMap, teachersMap] = await Promise.all([
        batchFetch('kids', Array.from(allKidIds)),
        batchFetch('courses', Array.from(courseIds)),
        batchFetch('users', Array.from(teacherIds)),
      ]);

      const results: any[] = [];
      for (const docSnap of snap.docs) {
        const enrollment = docSnap.data() as Enrollment;
        const enrAny = enrollment as any;

        const kids = (enrAny.kidIds || []).map((kidId: string) => ({
          id: kidId,
          ...(kidsMap.get(kidId) || {}),
        }));

        const course = enrAny.courseId ? coursesMap.get(enrAny.courseId) || null : null;
        const teacher = enrAny.teacherId ? teachersMap.get(enrAny.teacherId) || null : null;

        results.push({ id: docSnap.id, ...enrollment, kids, course, teacher });
      }

      // store in cache
      try {
        // @ts-ignore
        if (!(globalThis as any).__enrollmentsCache) (globalThis as any).__enrollmentsCache = new Map();
        // @ts-ignore
        (globalThis as any).__enrollmentsCache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL });
      } catch {
        // ignore caching errors
      }

      return results;
    },
    enabled: !!parentId,
  });
}

/**
 * Hook 5: useAllEnrollments (Admin usage)
 * - Use this in admin CourseList / Enrollment pages to avoid calling useCourseEnrollments per row.
 */
export function useAllEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'all'],
    queryFn: async () => {
      const [{ collection, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const snap = await getDocs(collection(db, 'enrollments'));
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Enrollment) })) as Enrollment[];
    },
    staleTime: 30_000,
  });
}

// Hook 6: useEnrollmentsForStudents
export function useEnrollmentsForStudents(studentIds: string[]) {
  return useQuery({
    queryKey: ['enrollments', 'students', Array.isArray(studentIds) ? studentIds.join(',') : ''],
    queryFn: async () => {
      if (!studentIds || studentIds.length === 0) return [];

      const CACHE_TTL = 30 * 1000; // 30 seconds
      const cacheKey = `enrollments:students:${studentIds.join(',')}`;

      // @ts-ignore
      if ((globalThis as any).__enrollmentsCache && (globalThis as any).__enrollmentsCache.has(cacheKey)) {
        // @ts-ignore
        const entry = (globalThis as any).__enrollmentsCache.get(cacheKey);
        if (entry.expiresAt > Date.now()) return entry.data;
      }

      const [{ collection, query, where, getDocs, documentId }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      // Firestore 'in' supports up to 10 elements; we'll chunk if needed.
      const idChunks = chunk(studentIds, 10);

      const allResults: any[] = [];
      for (const c of idChunks) {
        // direct field
        const q1 = query(collection(db, 'enrollments'), where('studentId', 'in', c));
        const snap1 = await getDocs(q1);
        snap1.docs.forEach((d: any) => allResults.push({ id: d.id, ...(d.data() as any) }));

        // array membership
        const q2 = query(collection(db, 'enrollments'), where('kidIds', 'array-contains-any', c));
        const snap2 = await getDocs(q2);
        snap2.docs.forEach((d: any) => allResults.push({ id: d.id, ...(d.data() as any) }));
      }

      // dedupe by id
      const uniqueResults: any[] = [];
      const seen = new Set<string>();
      for (const r of allResults) {
        if (!seen.has(r.id)) {
          uniqueResults.push(r);
          seen.add(r.id);
        }
      }

      // Prefetch courses and teachers
      const courseIds = new Set<string>();
      const teacherIds = new Set<string>();
      uniqueResults.forEach((enr: any) => {
        if (enr.courseId) courseIds.add(enr.courseId);
        if (enr.teacherId) teacherIds.add(enr.teacherId);
      });

      const batchFetch = async (collectionName: string, ids: string[]) => {
        const map = new Map<string, any>();
        if (!ids || ids.length === 0) return map;
        const chunks10 = chunk(ids, 10);
        for (const c of chunks10) {
          const qd = query(collection(db, collectionName), where(documentId(), 'in', c));
          const s = await getDocs(qd);
          s.docs.forEach((d: any) => map.set(d.id, d.data()));
        }
        return map;
      };

      const [coursesMap, teachersMap] = await Promise.all([
        batchFetch('courses', Array.from(courseIds)),
        batchFetch('users', Array.from(teacherIds)),
      ]);

      const results = uniqueResults.map((e: any) => ({
        id: e.id,
        ...e,
        course: e.courseId ? coursesMap.get(e.courseId) || null : null,
        teacher: e.teacherId ? teachersMap.get(e.teacherId) || null : null,
      }));

      try {
        // @ts-ignore
        if (!(globalThis as any).__enrollmentsCache) (globalThis as any).__enrollmentsCache = new Map();
        // @ts-ignore
        (globalThis as any).__enrollmentsCache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL });
      } catch {
        // ignore
      }

      return results;
    },
    enabled: Array.isArray(studentIds) && studentIds.length > 0,
  });
}

// Hook 7: useInvoices
export function useInvoices(parentId: string) {
  return useQuery({
    queryKey: ['invoices', parentId],
    queryFn: async () => {
      const [{ collection, query, where, orderBy, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const q = query(
        collection(db, 'invoices'),
        where('parentId', '==', parentId),
        orderBy('dueDate', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Invoice) }));
    },
    enabled: !!parentId,
  });
}

// Hook 8: useCourses
export function useCourses(filters?: { area?: string; level?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const [{ collection, query, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      // Fetch all courses and perform client-side normalization + filtering.
      const snap = await getDocs(collection(db, 'courses'));
      let courses = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Course) })) as any[];

      // Normalize fields so the admin UI can rely on `name`, `area`, `level`, `status`.
      courses = courses.map((c: any) => {
        const name = c.name || c.title || c.code || c.id;
        // area historically used 'Phonics'/'Grammar' etc.; stored docs use 'track' (phonics, grammar)
        const area = c.area || (c.track ? (typeof c.track === 'string' ?
          // humanize known tracks
          (c.track === 'phonics' ? 'Phonics' : c.track === 'grammar' ? 'Grammar' : c.track === 'public_speaking' ? 'Speaking' : c.track === 'spoken_english' ? 'Speaking' : c.track) : c.track) : undefined);
        // status previously stored as 'status' string; newer docs use boolean 'active'
        const status = c.status || (typeof c.active === 'boolean' ? (c.active ? 'active' : 'inactive') : undefined);

        return { ...c, name, area, status };
      });

      if (import.meta.env?.DEV) console.debug('[courses] list fetched', courses.length, courses.map((d: any) => d.id));

      if (filters) {
        if (filters.area) {
          const areaFilter = String(filters.area).toLowerCase();
          courses = courses.filter((c: any) => String(c.area || '').toLowerCase() === areaFilter);
        }
        if (filters.level) {
          // allow numeric or string comparison
          courses = courses.filter((c: any) => String(c.level) === String(filters.level));
        }
        if (filters.status) {
          const statusFilter = String(filters.status).toLowerCase();
          courses = courses.filter((c: any) => (String(c.status || '') === statusFilter) || (statusFilter === 'active' && c.active === true) || (statusFilter === 'inactive' && c.active === false));
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          courses = courses.filter((c: any) => {
            const name = (c.name || '').toLowerCase();
            const desc = (c.description || c.shortDescription || '').toLowerCase();
            return name.includes(searchLower) || desc.includes(searchLower);
          });
        }
      }

      if (import.meta.env?.DEV) console.debug('[courses] list after filter', courses.length, courses.map((d: any) => d.id));

      return courses;
    },
  });
}

// Hook 9: useCourse
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const [{ doc, getDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const docRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return { id: docSnap.id, ...(docSnap.data() as Course) };
      return null;
    },
    enabled: !!courseId,
  });
}

// Hook 10: useTopics
export function useTopics(courseId: string) {
  return useQuery({
    queryKey: ['topics', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const [{ collection, query, where, orderBy, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const q = query(
        collection(db, 'curriculum'),
        where('courseId', '==', courseId),
        orderBy('sequenceNumber', 'asc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Topic) })) as Topic[];
    },
    enabled: !!courseId,
  });
}

// Hook 11: useCourseEnrollments
export function useCourseEnrollments(courseId: string) {
  return useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const [{ collection, query, where, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const q = query(collection(db, 'enrollments'), where('courseId', '==', courseId));
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Enrollment) })) as Enrollment[];
    },
    enabled: !!courseId,
  });
}

// Hook 12: useKid
export function useKid(kidId: string) {
  return useQuery<KidRecord | null>({
    queryKey: ['kid', kidId],
    queryFn: async () => {
      if (!kidId) return null;
      const [{ doc, getDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);

      const docRef = doc(db, 'kids', kidId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const data = docSnap.data() as KidRecord;
      return { ...data, id: docSnap.id };
    },
    enabled: !!kidId,
  });
}
