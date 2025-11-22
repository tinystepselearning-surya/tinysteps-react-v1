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
const defaultProgress = (studentId, studentName) => ({
    studentId,
    studentName,
    phonics: 0,
    grammar: 0,
    speaking: 0,
    attendanceRate: 0,
});
const fetchStudentProgress = (teacherId) => __awaiter(void 0, void 0, void 0, function* () {
    const q = query(collection(db, 'progress'), where('teacherId', '==', teacherId));
    const snapshot = yield getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map((doc) => {
        var _a, _b, _c, _d;
        const data = doc.data();
        return {
            studentId: data.studentId || doc.id,
            studentName: data.studentName || 'Student',
            phonics: (_a = data.phonics) !== null && _a !== void 0 ? _a : 0,
            grammar: (_b = data.grammar) !== null && _b !== void 0 ? _b : 0,
            speaking: (_c = data.speaking) !== null && _c !== void 0 ? _c : 0,
            lastSession: data.lastSessionDate,
            attendanceRate: (_d = data.attendanceRate) !== null && _d !== void 0 ? _d : 0,
        };
    });
});
export const useStudentProgress = (teacherId) => {
    return useQuery({
        queryKey: ['teacherProgress', teacherId],
        queryFn: () => (teacherId ? fetchStudentProgress(teacherId) : Promise.resolve([])),
        enabled: Boolean(teacherId),
        staleTime: 1000 * 60 * 5,
    });
};
