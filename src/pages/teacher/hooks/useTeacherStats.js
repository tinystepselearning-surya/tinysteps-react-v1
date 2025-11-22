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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
const fallbackStats = {
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0,
    averageSatisfaction: 0,
    completionRate: 0,
    sessionsByCourse: [],
    sessionsByMonth: [],
    studentProgress: [],
};
const fetchTeacherStats = (teacherId) => __awaiter(void 0, void 0, void 0, function* () {
    const ref = doc(db, 'teacherStats', teacherId);
    const snapshot = yield getDoc(ref);
    if (!snapshot.exists()) {
        return fallbackStats;
    }
    return snapshot.data();
});
export const useTeacherStats = (teacherId) => {
    return useQuery({
        queryKey: ['teacherStats', teacherId],
        queryFn: () => (teacherId ? fetchTeacherStats(teacherId) : Promise.resolve(fallbackStats)),
        enabled: Boolean(teacherId),
        staleTime: 1000 * 60 * 10,
    });
};
