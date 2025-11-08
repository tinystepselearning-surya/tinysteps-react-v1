import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { TeacherNote } from "../types/models";
import { useAuth } from "../contexts/AuthContext";

export function useParentTeacherNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const q = query(collection(db, "teacherNotes"), where("parentId", "==", user.uid));
    getDocs(q).then((snap) => {
      setNotes(snap.docs.map((doc) => ({ noteId: doc.id, ...doc.data() } as TeacherNote)));
      setLoading(false);
    });
  }, [user?.uid]);

  return { notes, loading };
}
