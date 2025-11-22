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
const fetchProgress = (childIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (!childIds.length)
        return [];
    const snapshot = yield getDocs(query(collection(db, 'progress'), where('studentId', 'in', childIds.slice(0, 10))));
    return snapshot.docs.map((docSnap) => {
        var _a, _b, _c;
        const data = docSnap.data();
        return {
            childId: data.studentId || docSnap.id,
            childName: data.studentName || 'Child',
            phonics: (_a = data.phonics) !== null && _a !== void 0 ? _a : 0,
            grammar: (_b = data.grammar) !== null && _b !== void 0 ? _b : 0,
            speaking: (_c = data.speaking) !== null && _c !== void 0 ? _c : 0,
            recommendations: data.recommendations,
            recentActivities: data.recentActivities,
            timeline: data.timeline,
        };
    });
});
export const useChildProgress = (childIds) => {
    return useQuery({
        queryKey: ['parentProgress', childIds.sort().join('-')],
        queryFn: () => fetchProgress(childIds),
        enabled: childIds.length > 0,
        staleTime: 1000 * 60 * 5,
    });
};
