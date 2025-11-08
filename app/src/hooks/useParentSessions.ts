import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Session } from "../types/models";
import useParentChildren from "./useParentChildren";

export function useParentSessions() {
  const { children } = useParentChildren();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!children.length) return;
    setLoading(true);
    const sids = children.map((c) => c.sid);
    const q = query(collection(db, "sessions"), where("studentId", "in", sids));
    getDocs(q).then((snap) => {
      setSessions(snap.docs.map((doc) => ({ sessionId: doc.id, ...doc.data() } as Session)));
      setLoading(false);
    });
  }, [children]);

  return { sessions, loading };
}
