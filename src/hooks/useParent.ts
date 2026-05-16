import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { ParentChildSummary, ParentSession, ParentInvoice, ParentPayment } from '../types/Parent';

export const useParentChildren = (parentId: string) => {
  return useQuery({
    queryKey: ['parentChildren', parentId],
    queryFn: async () => {
      const q = query(collection(db, 'kids'), where('parentId', '==', parentId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParentChildSummary));
    },
    enabled: !!parentId,
  });
};

export const useParentSessions = (parentId: string) => {
  return useQuery({
    queryKey: ['parentSessions', parentId],
    queryFn: async () => {
      // Assuming sessions are linked via kids
      const children = await getDocs(query(collection(db, 'kids'), where('parentId', '==', parentId)));
      const kidIds = children.docs.map(doc => doc.id);
      if (kidIds.length === 0) return [];
      const classSessionsCol = collection(db, 'classSessions');
      const q = query(classSessionsCol, where('kidId', 'in', kidIds), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParentSession));
    },
    enabled: !!parentId,
  });
};

export const useParentInvoices = (parentId: string) => {
  return useQuery({
    queryKey: ['parentInvoices', parentId],
    queryFn: async () => {
      const q = query(collection(db, 'invoices'), where('parentId', '==', parentId), orderBy('dueDate', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParentInvoice));
    },
    enabled: !!parentId,
  });
};

export const useParentPayments = (parentId: string) => {
  return useQuery({
    queryKey: ['parentPayments', parentId],
    queryFn: async () => {
      const q = query(collection(db, 'payments'), where('parentId', '==', parentId), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ParentPayment & { archived?: boolean }))
        .filter((row) => row.archived !== true)
        .map((row) => row as ParentPayment);
    },
    enabled: !!parentId,
  });
};
