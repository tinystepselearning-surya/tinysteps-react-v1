import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';
export function useParentFilteredChildren() {
    const { user } = useAuthStore();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user || user.role !== 'parent') {
            setError('Unauthorized role');
            setLoading(false);
            return;
        }
        // Query kids where parentId matches
        const childrenQuery = query(collection(db, 'kids'), where('parentId', '==', user.uid));
        const unsubscribe = onSnapshot(childrenQuery, (snapshot) => {
            const childrenList = snapshot.docs.map(doc => ({
                uid: doc.id,
                fullName: doc.data().fullName || '',
                grade: doc.data().grade,
                courses: doc.data().courses || [],
                status: doc.data().status || 'active',
                phonicsMastery: doc.data().phonicsMastery,
                grammarMastery: doc.data().grammarMastery,
                speakingMastery: doc.data().speakingMastery,
            }));
            setChildren(childrenList);
            setLoading(false);
            setError(null);
        }, (err) => {
            setError(err.message);
            setLoading(false);
            console.error('Error fetching children:', err);
        });
        return () => unsubscribe();
    }, [user]);
    return { children, loading, error };
}
