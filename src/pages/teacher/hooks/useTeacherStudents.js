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
const fetchTeacherStudents = (teacherId) => __awaiter(void 0, void 0, void 0, function* () {
    const q = query(collection(db, 'kids'), where('teacherIds', 'array-contains', teacherId));
    const snapshot = yield getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            fullName: data.fullName || data.name || 'Unnamed',
            grade: data.grade || data.level,
            courseNames: data.courseNames || data.courses || [],
            progressStatus: data.progressStatus || 'on_track',
            lastSessionDate: data.lastSessionDate,
            avatarUrl: data.avatarUrl,
        };
    });
});
export const useTeacherStudents = (teacherId) => {
    return useQuery({
        queryKey: ['teacherStudents', teacherId],
        queryFn: () => (teacherId ? fetchTeacherStudents(teacherId) : Promise.resolve([])),
        enabled: Boolean(teacherId),
        staleTime: 1000 * 60 * 5,
    });
};
