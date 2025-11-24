          import { useEffect, useState } from 'react';
          import type { QueryConstraint } from 'firebase/firestore';

export function useRealtimeData(collectionName: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    try {
      (async () => {
        const [{ onSnapshot, query, collection }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('../lib/firebaseConfig'),
        ] as any);
        const q = query(collection(db, collectionName), ...constraints);
        const unsubscribe = onSnapshot(
          q,
          (snapshot: any) => {
            if (!mounted) return;
            setData(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
          },
          (err: any) => {
            if (!mounted) return;
            // Provide a friendlier error message if the client is unauthorized to read the collection
            if (err?.code === 'permission-denied') {
              setError(new Error('Access denied. You do not have permission to read this data.'));
            } else {
              setError(err as Error);
            }
            setIsLoading(false);
          }
        );

        // cleanup
        return () => {
          mounted = false;
          unsubscribe();
        };
      })();
    } catch (err) {
      if (mounted) {
        setError(err as Error);
        setIsLoading(false);
      }
    }
  // Use direct references as deps; callers should memoize `constraints` when passing inline arrays
  }, [collectionName, constraints]);

  return { data, error, isLoading };
}
