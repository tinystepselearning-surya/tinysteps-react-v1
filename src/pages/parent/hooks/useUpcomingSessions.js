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
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
const todayIso = () => new Date().toISOString().slice(0, 10);
const fetchSessions = (childIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (!childIds.length)
        return [];
    const sessions = [];
    yield Promise.all(childIds.map((childId) => __awaiter(void 0, void 0, void 0, function* () {
        const q = query(collection(db, 'sessions'), where('kidIds', 'array-contains', childId));
        const snapshot = yield getDocs(q);
        snapshot.forEach((docSnap) => {
            var _a;
            const data = docSnap.data();
            if (data.date >= todayIso()) {
                sessions.push({
                    id: docSnap.id,
                    kidId: childId,
                    kidName: ((_a = data.kidNames) === null || _a === void 0 ? void 0 : _a[childId]) || data.kidName || 'Child',
                    courseName: data.courseName || data.courseId,
                    date: data.date,
                    startTime: data.startTime,
                    status: data.status || 'scheduled',
                    teacherName: data.teacherName,
                });
            }
        });
    })));
    return sessions.sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
});
export const useUpcomingSessions = (childIds) => {
    return useQuery({
        queryKey: ['parentSessions', childIds.sort().join('-')],
        queryFn: () => fetchSessions(childIds),
        enabled: childIds.length > 0,
        staleTime: 1000 * 60 * 5,
    });
};
