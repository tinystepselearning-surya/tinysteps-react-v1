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
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
export const useParentChildren = (parentId) => {
    return useQuery({
        queryKey: ['parentChildren', parentId],
        queryFn: () => __awaiter(void 0, void 0, void 0, function* () {
            const q = query(collection(db, 'kids'), where('parentId', '==', parentId));
            const snapshot = yield getDocs(q);
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }),
        enabled: !!parentId,
    });
};
export const useParentSessions = (parentId) => {
    return useQuery({
        queryKey: ['parentSessions', parentId],
        queryFn: () => __awaiter(void 0, void 0, void 0, function* () {
            // Assuming sessions are linked via kids
            const children = yield getDocs(query(collection(db, 'kids'), where('parentId', '==', parentId)));
            const kidIds = children.docs.map(doc => doc.id);
            if (kidIds.length === 0)
                return [];
            const q = query(collection(db, 'sessions'), where('kidId', 'in', kidIds), orderBy('date', 'desc'));
            const snapshot = yield getDocs(q);
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }),
        enabled: !!parentId,
    });
};
export const useParentInvoices = (parentId) => {
    return useQuery({
        queryKey: ['parentInvoices', parentId],
        queryFn: () => __awaiter(void 0, void 0, void 0, function* () {
            const q = query(collection(db, 'invoices'), where('parentId', '==', parentId), orderBy('dueDate', 'desc'));
            const snapshot = yield getDocs(q);
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }),
        enabled: !!parentId,
    });
};
export const useParentPayments = (parentId) => {
    return useQuery({
        queryKey: ['parentPayments', parentId],
        queryFn: () => __awaiter(void 0, void 0, void 0, function* () {
            const q = query(collection(db, 'payments'), where('parentId', '==', parentId), orderBy('date', 'desc'));
            const snapshot = yield getDocs(q);
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }),
        enabled: !!parentId,
    });
};
