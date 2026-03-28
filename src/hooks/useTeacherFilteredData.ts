import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';

interface FilteredStudent {
  uid: string;
  fullName: string;
  studentName?: string;
  grade?: string;
  progressStatus?: 'on_track' | 'needs_attention';
  lastSessionDate?: string;
}

export function useTeacherFilteredStudents() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<FilteredStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStudents([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (user.role !== 'teacher') {
      setStudents([]);
      setError('Unauthorized role');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Keep compatibility with both legacy teacherId and canonical teacherIds array.
    const directTeacherQuery = query(
      collection(db, 'kids'),
      where('teacherId', '==', user.uid)
    );
    const teacherIdsQuery = query(
      collection(db, 'kids'),
      where('teacherIds', 'array-contains', user.uid)
    );

    let latestDirectDocs: QueryDocumentSnapshot[] = [];
    let latestTeacherIdsDocs: QueryDocumentSnapshot[] = [];

    const toFilteredStudent = (docSnap: QueryDocumentSnapshot): FilteredStudent => {
      const data = docSnap.data() as Record<string, any>;
      const resolvedName =
        data.fullName ||
        data.studentName ||
        data.displayName ||
        data.name ||
        '';
      return {
        uid: docSnap.id,
        fullName: resolvedName,
        studentName: resolvedName,
        grade: data.grade,
        progressStatus: data.progressStatus || 'on_track',
        lastSessionDate: data.lastSessionDate,
      };
    };

    const mergeAndPublish = () => {
      const byId = new Map<string, FilteredStudent>();
      [...latestDirectDocs, ...latestTeacherIdsDocs].forEach((docSnap) => {
        byId.set(docSnap.id, toFilteredStudent(docSnap));
      });
      setStudents(Array.from(byId.values()));
      setLoading(false);
      setError(null);
    };

    const unsubscribeDirect = onSnapshot(
      directTeacherQuery,
      (snapshot) => {
        latestDirectDocs = snapshot.docs;
        mergeAndPublish();
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching students:', err);
      }
    );

    const unsubscribeTeacherIds = onSnapshot(
      teacherIdsQuery,
      (snapshot) => {
        latestTeacherIdsDocs = snapshot.docs;
        mergeAndPublish();
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching students:', err);
      }
    );

    return () => {
      unsubscribeDirect();
      unsubscribeTeacherIds();
    };
  }, [user?.uid, user?.role]);

  return { students, loading, error };
}
