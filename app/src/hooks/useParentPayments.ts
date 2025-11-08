import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Payment } from "../types/models";
import { useAuth } from "../contexts/AuthContext";

export function useParentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const q = query(collection(db, "payments"), where("parentId", "==", user.uid));
    getDocs(q).then((snap) => {
      setPayments(snap.docs.map((doc) => ({ paymentId: doc.id, ...doc.data() } as Payment)));
      setLoading(false);
    });
  }, [user?.uid]);

  return { payments, loading };
}
