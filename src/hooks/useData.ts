import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  documentId,
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { Enrollment, Invoice, ProgressItem, Session, AttendanceRecord } from '../types/models';

// Hook 1: useKidProgress
export function useKidProgress(kidId: string) {
  return useQuery({
    queryKey: ['progress', kidId],
    queryFn: async () => {
      const q = query(collection(db, 'progress'), where('studentId', '==', kidId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ProgressItem[];
    },
    enabled: !!kidId,
  });
}

// Hook 2: useSessionsForTeacher
export function useSessionsForTeacher(teacherId: string) {
  return useQuery({
    queryKey: ['sessions', 'teacher', teacherId],
    queryFn: async () => {
      const q = query(
        collection(db, 'sessions'),
        where('teacherId', '==', teacherId),
        where('status', 'in', ['scheduled', 'in_progress']),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Session) }));
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
        attSnap.forEach((d) => {
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
          s.docs.forEach((d) => map.set(d.id, d.data()));
        }
        return map;
      };

      // gather ids to prefetch
      const allKidIds = new Set<string>();
      const courseIds = new Set<string>();
      const teacherIds = new Set<string>();

      snap.docs.forEach((d) => {
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

// Hook 5: useInvoices
export function useInvoices(parentId: string) {
  return useQuery({
    queryKey: ['invoices', parentId],
    queryFn: async () => {
      const q = query(collection(db, 'invoices'), where('parentId', '==', parentId), orderBy('dueDate', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Invoice) }));
    },
    enabled: !!parentId,
  });
}
