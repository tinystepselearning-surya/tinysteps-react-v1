import { useQuery } from '@tanstack/react-query';
import { Enrollment, Invoice, ProgressItem, Session, AttendanceRecord, Course, Topic } from '../types/models';
import type { Timestamp } from 'firebase/firestore';

export interface KidRecord {
  id: string;
  birthdate?: any;
  [key: string]: any;
}

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
        orderBy('date', 'asc')
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
      // monthStart should be YYYY-MM-DD
      const [{ collection, query, where, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);
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

// Hook 4: useEnrollments
export function useEnrollments(parentId: string) {
  return useQuery({
    queryKey: ['enrollments', parentId],
    queryFn: async () => {
      // simple in-memory TTL cache to avoid refetching frequently during a dev session
      const CACHE_TTL = 60 * 1000; // 60 seconds
      const cacheKey = `enrollments:${parentId}`;
      // @ts-ignore - module level cache
      if ((globalThis as any).__enrollmentsCache && (globalThis as any).__enrollmentsCache.has(cacheKey)) {
        const entry = (globalThis as any).__enrollmentsCache.get(cacheKey);
        if (entry.expiresAt > Date.now()) {
          return entry.data;
        }
      }
      const [{ collection, query, where, getDocs, documentId }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);
      const q = query(
        collection(db, 'enrollments'),
        where('parentId', '==', parentId),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      const results: any[] = [];

      // helper: chunk array
      const chunk = <T,>(arr: T[], size = 10) => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      // helper: batch fetch docs by ids using 'in' queries
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
        if (enrollment.courseId) courseIds.add(enrollment.courseId);
        if (enrollment.teacherId) teacherIds.add(enrollment.teacherId);
      });

      const [kidsMap, coursesMap, teachersMap] = await Promise.all([
        batchFetch('kids', Array.from(allKidIds)),
        batchFetch('courses', Array.from(courseIds)),
        batchFetch('users', Array.from(teacherIds)),
      ]);

      for (const docSnap of snap.docs) {
        const enrollment = docSnap.data() as Enrollment;
        const kids = (enrollment.kidIds || []).map((kidId: string) => ({ id: kidId, ...(kidsMap.get(kidId) || {}) }));
        const course = enrollment.courseId ? coursesMap.get(enrollment.courseId) || null : null;
        const teacher = enrollment.teacherId ? teachersMap.get(enrollment.teacherId) || null : null;
        results.push({ id: docSnap.id, ...enrollment, kids, course, teacher });
      }

      // store in cache
      try {
        if (!(globalThis as any).__enrollmentsCache) (globalThis as any).__enrollmentsCache = new Map();
        (globalThis as any).__enrollmentsCache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL });
      } catch (e) {
        // ignore caching errors
      }

      return results;
    },
    enabled: !!parentId,
  });
}

// Hook 6: useEnrollmentsForStudents
export function useEnrollmentsForStudents(studentIds: string[]) {
  return useQuery({
    queryKey: ['enrollments', 'students', studentIds.join(',')],
    queryFn: async () => {
      if (!studentIds || studentIds.length === 0) return [];
      const CACHE_TTL = 30 * 1000; // 30 seconds
      const cacheKey = `enrollments:students:${studentIds.join(',')}`;
      // @ts-ignore
      if ((globalThis as any).__enrollmentsCache && (globalThis as any).__enrollmentsCache.has(cacheKey)) {
        const entry = (globalThis as any).__enrollmentsCache.get(cacheKey);
        if (entry.expiresAt > Date.now()) return entry.data;
      }

      // Firestore 'in' supports up to 10 elements; we'll chunk if needed.
      const chunk = <T,>(arr: T[], size = 10) => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      const [{ collection, query, where, getDocs, documentId }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);
      const chunks = chunk(studentIds, 10);
      const allResults: any[] = [];
      for (const c of chunks) {
        const q1 = query(collection(db, 'enrollments'), where('studentId', 'in', c));
        const snap1 = await getDocs(q1);
        snap1.docs.forEach((d: any) => allResults.push({ id: d.id, ...(d.data() as any) }));
        // also check kidIds array contains any
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
      const allResultsFinal = uniqueResults;

      // Prefetch courses and teachers
      const courseIds = new Set<string>();
      const teacherIds = new Set<string>();
      allResults.forEach((enr: any) => {
        if (enr.courseId) courseIds.add(enr.courseId);
        if (enr.teacherId) teacherIds.add(enr.teacherId);
      });

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

      const [coursesMap, teachersMap] = await Promise.all([
        batchFetch('courses', Array.from(courseIds)),
        batchFetch('users', Array.from(teacherIds)),
      ]);

  const results = allResultsFinal.map((e: any) => ({ id: e.id, ...e, course: coursesMap.get(e.courseId) || null, teacher: teachersMap.get(e.teacherId) || null }));

      try {
        if (!(globalThis as any).__enrollmentsCache) (globalThis as any).__enrollmentsCache = new Map();
        (globalThis as any).__enrollmentsCache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL });
      } catch (err) {
        // ignore
      }

      return results;
    },
    enabled: Array.isArray(studentIds) && studentIds.length > 0,
  });
}

// Hook 5: useInvoices
export function useInvoices(parentId: string) {
  return useQuery({
    queryKey: ['invoices', parentId],
    queryFn: async () => {
      const [{ collection, query, where, orderBy, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);
      const q = query(collection(db, 'invoices'), where('parentId', '==', parentId), orderBy('dueDate', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Invoice) }));
    },
    enabled: !!parentId,
  });
}

// Hook 7: useCourses
export function useCourses(filters?: { area?: string; level?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const [{ collection, query, orderBy, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);
      let q = query(collection(db, 'courses'), orderBy('name', 'asc'));
      
      // Note: Firestore doesn't support complex filtering in a single query
      // We'll fetch all and filter client-side for now
      const snap = await getDocs(q);
      let courses = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Course) }));
      
      // Apply filters
      if (filters) {
        if (filters.area) {
          courses = courses.filter((c: any) => c.area === filters.area);
        }
        if (filters.level) {
          courses = courses.filter((c: any) => c.level === filters.level);
        }
        if (filters.status) {
          courses = courses.filter((c: any) => c.status === filters.status);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          courses = courses.filter((c: any) => 
            c.name.toLowerCase().includes(searchLower) || 
            c.description.toLowerCase().includes(searchLower)
          );
        }
      }
      
      return courses;
    },
  });
}

// Hook 8: useCourse
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
      if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as Course) };
      }
      return null;
    },
    enabled: !!courseId,
  });
}

// Hook 9: useTopics
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
        orderBy('sequenceNumber', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Topic) }));
    },
    enabled: !!courseId,
  });
}

// Hook 10: useCourseEnrollments
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
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Enrollment) }));
    },
    enabled: !!courseId,
  });
}

// Hook 11: useKid
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
