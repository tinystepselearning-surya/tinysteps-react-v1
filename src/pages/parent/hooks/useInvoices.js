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
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
const mapInvoice = (doc) => ({
    id: doc.id,
    parentId: doc.parentId,
    amount: doc.amount,
    dueDate: doc.dueDate,
    status: doc.status,
    lineItems: doc.lineItems || [],
    createdAt: doc.createdAt,
    paidAt: doc.paidAt,
});
const fetchInvoices = (parentId) => __awaiter(void 0, void 0, void 0, function* () {
    const q = query(collection(db, 'invoices'), where('parentId', '==', parentId), orderBy('dueDate', 'asc'));
    const snapshot = yield getDocs(q);
    return snapshot.docs.map((docSnap) => mapInvoice(Object.assign({ id: docSnap.id }, docSnap.data())));
});
const fetchPayments = (parentId) => __awaiter(void 0, void 0, void 0, function* () {
    const q = query(collection(db, 'payments'), where('parentId', '==', parentId), orderBy('date', 'desc'));
    const snapshot = yield getDocs(q);
    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        invoiceId: docSnap.data().invoiceId,
        amount: docSnap.data().amount,
        date: docSnap.data().date,
        method: docSnap.data().method,
        status: docSnap.data().status,
        receiptUrl: docSnap.data().receiptUrl,
    }));
});
export const useInvoices = (parentId) => {
    return useQuery({
        queryKey: ['parentInvoices', parentId],
        queryFn: () => (parentId ? fetchInvoices(parentId) : Promise.resolve([])),
        enabled: Boolean(parentId),
        staleTime: 1000 * 60 * 5,
    });
};
export const usePaymentHistory = (parentId) => {
    return useQuery({
        queryKey: ['parentPayments', parentId],
        queryFn: () => (parentId ? fetchPayments(parentId) : Promise.resolve([])),
        enabled: Boolean(parentId),
        staleTime: 1000 * 60 * 5,
    });
};
