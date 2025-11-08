import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Ticket } from "../types/models";
import { useAuth } from "../contexts/AuthContext";

export function useParentTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const q = query(collection(db, "tickets"), where("parentId", "==", user.uid));
    getDocs(q).then((snap) => {
      setTickets(snap.docs.map((doc) => ({ ticketId: doc.id, ...doc.data() } as Ticket)));
      setLoading(false);
    });
  }, [user?.uid]);

  return { tickets, loading };
}
