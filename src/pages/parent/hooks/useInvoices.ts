import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { ParentInvoice, ParentPayment } from '../../../types/Parent';

const mapInvoice = (doc: any): ParentInvoice => ({
  id: doc.id,
  parentId: doc.parentId,
  amount: doc.amount,
  dueDate: doc.dueDate,
  status: doc.status,
  lineItems: doc.lineItems || [],
  createdAt: doc.createdAt,
  paidAt: doc.paidAt,
});

const fetchInvoices = async (parentId: string): Promise<ParentInvoice[]> => {
  const q = query(collection(db, 'invoices'), where('parentId', '==', parentId), orderBy('dueDate', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => mapInvoice({ id: docSnap.id, ...docSnap.data() }));
};

const fetchPayments = async (parentId: string): Promise<ParentPayment[]> => {
  const q = query(collection(db, 'payments'), where('parentId', '==', parentId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    invoiceId: (docSnap.data() as any).invoiceId,
    amount: (docSnap.data() as any).amount,
    date: (docSnap.data() as any).date,
    method: (docSnap.data() as any).method,
    status: (docSnap.data() as any).status,
    receiptUrl: (docSnap.data() as any).receiptUrl,
  }));
};

export const useInvoices = (parentId?: string) => {
  return useQuery<ParentInvoice[]>({
    queryKey: ['parentInvoices', parentId],
    queryFn: () => (parentId ? fetchInvoices(parentId) : Promise.resolve([])),
    enabled: Boolean(parentId),
    staleTime: 1000 * 60 * 5,
  });
};

export const usePaymentHistory = (parentId?: string) => {
  return useQuery<ParentPayment[]>({
    queryKey: ['parentPayments', parentId],
    queryFn: () => (parentId ? fetchPayments(parentId) : Promise.resolve([])),
    enabled: Boolean(parentId),
    staleTime: 1000 * 60 * 5,
  });
};
