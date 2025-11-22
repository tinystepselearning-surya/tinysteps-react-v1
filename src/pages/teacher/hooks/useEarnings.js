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
const defaultSummary = {
    month: '',
    totalSessions: 0,
    sessionsCompleted: 0,
    sessionsPending: 0,
    ratePerSession: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    breakdownByCourse: [],
    payments: [],
};
const fetchEarnings = (teacherId) => __awaiter(void 0, void 0, void 0, function* () {
    const ref = doc(db, 'teacherEarnings', teacherId);
    const snapshot = yield getDoc(ref);
    if (!snapshot.exists()) {
        return Object.assign(Object.assign({}, defaultSummary), { month: '' });
    }
    return snapshot.data();
});
export const useEarnings = (teacherId) => {
    return useQuery({
        queryKey: ['teacherEarnings', teacherId],
        queryFn: () => (teacherId ? fetchEarnings(teacherId) : Promise.resolve(defaultSummary)),
        enabled: Boolean(teacherId),
        staleTime: 1000 * 60 * 10,
    });
};
