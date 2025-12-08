import { useEffect, useState } from 'react';
import { onSnapshot, query, collection } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
export function useRealtimeData(collectionName, constraints = []) {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        let mounted = true;
        try {
            const q = query(collection(db, collectionName), ...constraints);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!mounted)
                    return;
                setData(snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data()))));
                setIsLoading(false);
            }, (err) => {
                if (!mounted)
                    return;
                // Provide a friendlier error message if the client is unauthorized to read the collection
                if ((err === null || err === void 0 ? void 0 : err.code) === 'permission-denied') {
                    setError(new Error('Access denied. You do not have permission to read this data.'));
                }
                else {
                    setError(err);
                }
                setIsLoading(false);
            });
            return () => {
                mounted = false;
                unsubscribe();
            };
        }
        catch (err) {
            if (mounted) {
                setError(err);
                setIsLoading(false);
            }
        }
        // Use direct references as deps; callers should memoize `constraints` when passing inline arrays
    }, [collectionName, constraints]);
    return { data, error, isLoading };
}
