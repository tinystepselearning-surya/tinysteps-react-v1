
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Student } from "../types/models";
import { useAuth } from "../contexts/AuthContext";

const useParentChildren = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    const q = query(collection(db, "students"), where("parentIds", "array-contains", user.uid));
    getDocs(q)
      .then((snap) => {
        setChildren(snap.docs.map((doc) => ({ sid: doc.id, ...doc.data() } as Student)));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching children:", err);
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [user?.uid]);

  return { children, loading, error };
};

export default useParentChildren;
