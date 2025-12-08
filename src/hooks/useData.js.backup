var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, doc, getDoc, documentId, } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
// Hook 1: useKidProgress
export function useKidProgress(kidId) {
    return useQuery({
        queryKey: ['progress', kidId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            const q = query(collection(db, 'progress'), where('studentId', '==', kidId));
            const snapshot = yield getDocs(q);
            return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        }),
        enabled: !!kidId,
    });
}
// Hook 2: useSessionsForTeacher
export function useSessionsForTeacher(teacherId) {
    return useQuery({
        queryKey: ['sessions', 'teacher', teacherId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            const q = query(collection(db, 'sessions'), where('teacherId', '==', teacherId), where('status', 'in', ['scheduled', 'in_progress']), orderBy('date', 'asc'));
            const snapshot = yield getDocs(q);
            return snapshot.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
        }),
        enabled: !!teacherId,
    });
}
// Hook 3: useKidAttendance
export function useKidAttendance(kidId, monthStart) {
    return useQuery({
        queryKey: ['attendance', kidId, monthStart],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            // monthStart should be YYYY-MM-DD
            const q = query(collection(db, 'attendance'));
            const snapshot = yield getDocs(q);
            let total = 0;
            let present = 0;
            let late = 0;
            let absent = 0;
            for (const sessionDoc of snapshot.docs) {
                const attendanceRef = collection(db, 'attendance', sessionDoc.id, 'attendanceRecords');
                const attQ = query(attendanceRef, where('kidId', '==', kidId));
                const attSnap = yield getDocs(attQ);
                attSnap.forEach((d) => {
                    const data = d.data();
                    const markedAt = data.markedAt;
                    const dateStr = markedAt ? markedAt.toDate().toISOString().split('T')[0] : undefined;
                    if (!dateStr)
                        return;
                    if (dateStr >= monthStart) {
                        total++;
                        if (data.status === 'present')
                            present++;
                        else if (data.status === 'late')
                            late++;
                        else if (data.status === 'absent')
                            absent++;
                    }
                });
            }
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            return { total, present, late, absent, percentage };
        }),
        enabled: !!kidId && !!monthStart,
    });
}
// Hook 4: useEnrollments
export function useEnrollments(parentId) {
    return useQuery({
        queryKey: ['enrollments', parentId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            // simple in-memory TTL cache to avoid refetching frequently during a dev session
            const CACHE_TTL = 60 * 1000; // 60 seconds
            const cacheKey = `enrollments:${parentId}`;
            // @ts-ignore - module level cache
            if (globalThis.__enrollmentsCache && globalThis.__enrollmentsCache.has(cacheKey)) {
                const entry = globalThis.__enrollmentsCache.get(cacheKey);
                if (entry.expiresAt > Date.now()) {
                    return entry.data;
                }
            }
            const q = query(collection(db, 'enrollments'), where('parentId', '==', parentId), where('status', '==', 'active'));
            const snap = yield getDocs(q);
            const results = [];
            // helper: chunk array
            const chunk = (arr, size = 10) => {
                const out = [];
                for (let i = 0; i < arr.length; i += size)
                    out.push(arr.slice(i, i + size));
                return out;
            };
            // helper: batch fetch docs by ids using 'in' queries
            const batchFetch = (collectionName, ids) => __awaiter(this, void 0, void 0, function* () {
                const map = new Map();
                if (!ids || ids.length === 0)
                    return map;
                const idChunks = chunk(ids, 10);
                for (const c of idChunks) {
                    const qd = query(collection(db, collectionName), where(documentId(), 'in', c));
                    const s = yield getDocs(qd);
                    s.docs.forEach((d) => map.set(d.id, d.data()));
                }
                return map;
            });
            // gather ids to prefetch
            const allKidIds = new Set();
            const courseIds = new Set();
            const teacherIds = new Set();
            snap.docs.forEach((d) => {
                const enrollment = d.data();
                (enrollment.kidIds || []).forEach((k) => allKidIds.add(k));
                if (enrollment.courseId)
                    courseIds.add(enrollment.courseId);
                if (enrollment.teacherId)
                    teacherIds.add(enrollment.teacherId);
            });
            const [kidsMap, coursesMap, teachersMap] = yield Promise.all([
                batchFetch('kids', Array.from(allKidIds)),
                batchFetch('courses', Array.from(courseIds)),
                batchFetch('users', Array.from(teacherIds)),
            ]);
            for (const docSnap of snap.docs) {
                const enrollment = docSnap.data();
                const kids = (enrollment.kidIds || []).map((kidId) => (Object.assign({ id: kidId }, (kidsMap.get(kidId) || {}))));
                const course = enrollment.courseId ? coursesMap.get(enrollment.courseId) || null : null;
                const teacher = enrollment.teacherId ? teachersMap.get(enrollment.teacherId) || null : null;
                results.push(Object.assign(Object.assign({ id: docSnap.id }, enrollment), { kids, course, teacher }));
            }
            // store in cache
            try {
                if (!globalThis.__enrollmentsCache)
                    globalThis.__enrollmentsCache = new Map();
                globalThis.__enrollmentsCache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL });
            }
            catch (e) {
                // ignore caching errors
            }
            return results;
        }),
        enabled: !!parentId,
    });
}
// Hook 6: useEnrollmentsForStudents
export function useEnrollmentsForStudents(studentIds) {
    return useQuery({
        queryKey: ['enrollments', 'students', studentIds.join(',')],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            if (!studentIds || studentIds.length === 0)
                return [];
            const CACHE_TTL = 30 * 1000; // 30 seconds
            const cacheKey = `enrollments:students:${studentIds.join(',')}`;
            // @ts-ignore
            if (globalThis.__enrollmentsCache && globalThis.__enrollmentsCache.has(cacheKey)) {
                const entry = globalThis.__enrollmentsCache.get(cacheKey);
                if (entry.expiresAt > Date.now())
                    return entry.data;
            }
            // Firestore 'in' supports up to 10 elements; we'll chunk if needed.
            const chunk = (arr, size = 10) => {
                const out = [];
                for (let i = 0; i < arr.length; i += size)
                    out.push(arr.slice(i, i + size));
                return out;
            };
            const chunks = chunk(studentIds, 10);
            const allResults = [];
            for (const c of chunks) {
                const q1 = query(collection(db, 'enrollments'), where('studentId', 'in', c));
                const snap1 = yield getDocs(q1);
                snap1.docs.forEach((d) => allResults.push(Object.assign({ id: d.id }, d.data())));
                // also check kidIds array contains any
                const q2 = query(collection(db, 'enrollments'), where('kidIds', 'array-contains-any', c));
                const snap2 = yield getDocs(q2);
                snap2.docs.forEach((d) => allResults.push(Object.assign({ id: d.id }, d.data())));
            }
            // dedupe by id
            const uniqueResults = [];
            const seen = new Set();
            for (const r of allResults) {
                if (!seen.has(r.id)) {
                    uniqueResults.push(r);
                    seen.add(r.id);
                }
            }
            const allResultsFinal = uniqueResults;
            // Prefetch courses and teachers
            const courseIds = new Set();
            const teacherIds = new Set();
            allResults.forEach((enr) => {
                if (enr.courseId)
                    courseIds.add(enr.courseId);
                if (enr.teacherId)
                    teacherIds.add(enr.teacherId);
            });
            const batchFetch = (collectionName, ids) => __awaiter(this, void 0, void 0, function* () {
                const map = new Map();
                if (!ids || ids.length === 0)
                    return map;
                const idChunks = chunk(ids, 10);
                for (const c of idChunks) {
                    const qd = query(collection(db, collectionName), where(documentId(), 'in', c));
                    const s = yield getDocs(qd);
                    s.docs.forEach((d) => map.set(d.id, d.data()));
                }
                return map;
            });
            const [coursesMap, teachersMap] = yield Promise.all([
                batchFetch('courses', Array.from(courseIds)),
                batchFetch('users', Array.from(teacherIds)),
            ]);
            const results = allResultsFinal.map((e) => (Object.assign(Object.assign({ id: e.id }, e), { course: coursesMap.get(e.courseId) || null, teacher: teachersMap.get(e.teacherId) || null })));
            try {
                if (!globalThis.__enrollmentsCache)
                    globalThis.__enrollmentsCache = new Map();
                globalThis.__enrollmentsCache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL });
            }
            catch (err) {
                // ignore
            }
            return results;
        }),
        enabled: Array.isArray(studentIds) && studentIds.length > 0,
    });
}
// Hook 5: useInvoices
export function useInvoices(parentId) {
    return useQuery({
        queryKey: ['invoices', parentId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            const q = query(collection(db, 'invoices'), where('parentId', '==', parentId), orderBy('dueDate', 'desc'));
            const snap = yield getDocs(q);
            return snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
        }),
        enabled: !!parentId,
    });
}
// Hook 7: useCourses
export function useCourses(filters) {
    return useQuery({
        queryKey: ['courses', filters],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            let q = query(collection(db, 'courses'), orderBy('name', 'asc'));
            // Note: Firestore doesn't support complex filtering in a single query
            // We'll fetch all and filter client-side for now
            const snap = yield getDocs(q);
            let courses = snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
            // Apply filters
            if (filters) {
                if (filters.area) {
                    courses = courses.filter(c => c.area === filters.area);
                }
                if (filters.level) {
                    courses = courses.filter(c => c.level === filters.level);
                }
                if (filters.status) {
                    courses = courses.filter(c => c.status === filters.status);
                }
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    courses = courses.filter(c => c.name.toLowerCase().includes(searchLower) ||
                        c.description.toLowerCase().includes(searchLower));
                }
            }
            return courses;
        }),
    });
}
// Hook 8: useCourse
export function useCourse(courseId) {
    return useQuery({
        queryKey: ['course', courseId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            if (!courseId)
                return null;
            const docRef = doc(db, 'courses', courseId);
            const docSnap = yield getDoc(docRef);
            if (docSnap.exists()) {
                return Object.assign({ id: docSnap.id }, docSnap.data());
            }
            return null;
        }),
        enabled: !!courseId,
    });
}
// Hook 9: useTopics
export function useTopics(courseId) {
    return useQuery({
        queryKey: ['topics', courseId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            if (!courseId)
                return [];
            const q = query(collection(db, 'curriculum'), where('courseId', '==', courseId), orderBy('sequenceNumber', 'asc'));
            const snap = yield getDocs(q);
            return snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
        }),
        enabled: !!courseId,
    });
}
// Hook 10: useCourseEnrollments
export function useCourseEnrollments(courseId) {
    return useQuery({
        queryKey: ['course-enrollments', courseId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            if (!courseId)
                return [];
            const q = query(collection(db, 'enrollments'), where('courseId', '==', courseId));
            const snap = yield getDocs(q);
            return snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
        }),
        enabled: !!courseId,
    });
}
// Hook 11: useKid
export function useKid(kidId) {
    return useQuery({
        queryKey: ['kid', kidId],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            if (!kidId)
                return null;
            const docRef = doc(db, 'kids', kidId);
            const docSnap = yield getDoc(docRef);
            if (!docSnap.exists())
                return null;
            const data = docSnap.data();
            return Object.assign(Object.assign({}, data), { id: docSnap.id });
        }),
        enabled: !!kidId,
    });
}
