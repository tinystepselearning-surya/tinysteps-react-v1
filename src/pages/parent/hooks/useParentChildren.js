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
const mapChild = (doc) => {
    var _a, _b, _c, _d, _e, _f;
    return ({
        id: doc.id,
        fullName: doc.fullName || doc.name || 'Child',
        grade: doc.grade,
        courses: doc.courseNames || doc.courses || [],
        status: doc.status || 'active',
        phonicsMastery: (_b = (_a = doc.summary) === null || _a === void 0 ? void 0 : _a.phonicsMastery) !== null && _b !== void 0 ? _b : doc.phonicsMastery,
        grammarMastery: (_d = (_c = doc.summary) === null || _c === void 0 ? void 0 : _c.grammarMastery) !== null && _d !== void 0 ? _d : doc.grammarMastery,
        speakingMastery: (_f = (_e = doc.summary) === null || _e === void 0 ? void 0 : _e.speakingMastery) !== null && _f !== void 0 ? _f : doc.speakingMastery,
        avatarUrl: doc.avatarUrl,
    });
};
const fetchParentChildren = (parentId) => __awaiter(void 0, void 0, void 0, function* () {
    const q = query(collection(db, 'kids'), where('parentIds', 'array-contains', parentId));
    const snapshot = yield getDocs(q);
    return snapshot.docs.map((docSnap) => mapChild(Object.assign({ id: docSnap.id }, docSnap.data())));
});
export const useParentChildren = (parentId) => {
    return useQuery({
        queryKey: ['parentChildren', parentId],
        queryFn: () => (parentId ? fetchParentChildren(parentId) : Promise.resolve([])),
        enabled: Boolean(parentId),
        staleTime: 1000 * 60 * 5,
    });
};
