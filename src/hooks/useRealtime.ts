import { useEffect, useState } from 'react';
import { onSnapshot, query, collection, QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export function useRealtimeData(collectionName: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setIsLoading(false);
        },
        (err) => {
          setError(err as Error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, error, isLoading };
}
