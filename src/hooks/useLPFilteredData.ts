import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';

interface FilteredTeacher {
  uid: string;
  displayName: string;
  email: string;
  specialization?: string;
  yearsExperience?: number;
}

interface FilteredParent {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  childCount?: number;
}

export function useLPFilteredTeachers() {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState<FilteredTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'learningPartner') {
      setError('Unauthorized role');
      setLoading(false);
      return;
    }

    // Get LP's assignedTeachers
    const lpDocRef = doc(db, 'users', user.uid);
    const unsubscribeLP = onSnapshot(
      lpDocRef,
      async (lpSnapshot) => {
        if (!lpSnapshot.exists()) {
          setError('LP profile not found');
          setLoading(false);
          return;
        }

        const lpData = lpSnapshot.data();
        const assignedTeacherIds: string[] = lpData.assignedTeachers || [];

        if (assignedTeacherIds.length === 0) {
          setTeachers([]);
          setLoading(false);
          return;
        }

        // Fetch each teacher
        const teacherQueries = assignedTeacherIds.map(teacherId =>
          getDoc(doc(db, 'users', teacherId))
        );

        Promise.all(teacherQueries)
          .then((snapshots) => {
            const teachersList = snapshots
              .filter(snap => snap.exists())
              .map(snap => ({
                uid: snap.id,
                displayName: snap.data().displayName,
                email: snap.data().email,
                specialization: snap.data().specialization,
                yearsExperience: snap.data().yearsExperience
              }));
            setTeachers(teachersList);
            setError(null);
          })
          .catch((err) => {
            setError(err.message);
            console.error('Error fetching teachers:', err);
          })
          .finally(() => {
            setLoading(false);
          });
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribeLP();
  }, [user]);

  return { teachers, loading, error };
}

export function useLPFilteredParents() {
  const { user } = useAuthStore();
  const [parents, setParents] = useState<FilteredParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'learningPartner') {
      setError('Unauthorized role');
      setLoading(false);
      return;
    }

    // Get LP's assignedParents
    const lpDocRef = doc(db, 'users', user.uid);
    const unsubscribeLP = onSnapshot(
      lpDocRef,
      async (lpSnapshot) => {
        if (!lpSnapshot.exists()) {
          setError('LP profile not found');
          setLoading(false);
          return;
        }

        const lpData = lpSnapshot.data();
        const assignedParentIds: string[] = lpData.assignedParents || [];

        if (assignedParentIds.length === 0) {
          setParents([]);
          setLoading(false);
          return;
        }

        // Fetch each parent with child count
        const parentQueries = assignedParentIds.map(async (parentId) => {
          const parentSnap = await getDoc(doc(db, 'users', parentId));
          if (parentSnap.exists()) {
            const childrenQuery = query(
              collection(db, 'kids'),
              where('parentId', '==', parentId)
            );
            const childrenSnap = await getDocs(childrenQuery);
            const childCount = childrenSnap.size;
            return {
              uid: parentSnap.id,
              displayName: parentSnap.data().displayName,
              email: parentSnap.data().email,
              phone: parentSnap.data().phone,
              childCount
            };
          }
          return null;
        });

        Promise.all(parentQueries)
          .then((parentsList) => {
            setParents(parentsList.filter((p) => p !== null) as FilteredParent[]);
            setError(null);
          })
          .catch((err) => {
            setError(err.message);
            console.error('Error fetching parents:', err);
          })
          .finally(() => {
            setLoading(false);
          });
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribeLP();
  }, [user]);

  return { parents, loading, error };
}