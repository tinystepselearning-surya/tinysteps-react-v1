import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';
export function useTeacherFilteredStudents() {
    const { user } = useAuthStore();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user || user.role !== 'teacher') {
            setError('Unauthorized role');
            setLoading(false);
            return;
        }
        // Query kids assigned to this teacher
        const studentsQuery = query(collection(db, 'kids'), where('teacherId', '==', user.uid));
        const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
            const studentsList = snapshot.docs.map(doc => ({
                uid: doc.id,
                fullName: doc.data().fullName || '',
                grade: doc.data().grade,
                progressStatus: doc.data().progressStatus || 'on_track',
                lastSessionDate: doc.data().lastSessionDate,
            }));
            setStudents(studentsList);
            setLoading(false);
            setError(null);
        }, (err) => {
            setError(err.message);
            setLoading(false);
            console.error('Error fetching students:', err);
        });
        return () => unsubscribe();
    }, [user]);
    return { students, loading, error };
}
