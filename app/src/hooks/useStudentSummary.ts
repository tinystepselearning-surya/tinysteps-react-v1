import { useState, useEffect } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserSummary } from "../engine/types";

export function useStudentSummary(studentId: string) {
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studentId) {
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, `students/${studentId}/summary/overall`),
      (snapshot) => {
        if (snapshot.exists()) {
          setSummary(snapshot.data() as UserSummary);
        } else {
          setSummary(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [studentId]);

  return { summary, loading, error };
}
