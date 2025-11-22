import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { addDays, format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
const toTeacherSession = (doc) => ({
    id: doc.id,
    teacherId: doc.teacherId,
    courseId: doc.courseId,
    courseName: doc.courseName,
    date: doc.date,
    startTime: doc.startTime,
    endTime: doc.endTime,
    kidIds: doc.kidIds || [],
    status: doc.status || 'scheduled',
    joinUrl: doc.joinUrl,
    notes: doc.notes,
    attendance: doc.attendance,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
});
export const useUpcomingSessions = (teacherId) => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(!!teacherId);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!teacherId) {
            setIsLoading(false);
            return;
        }
        const today = new Date();
        const dates = [];
        for (let i = 1; i <= 7; i++) {
            dates.push(format(addDays(today, i), 'yyyy-MM-dd'));
        }
        const q = query(collection(db, 'sessions'), where('teacherId', '==', teacherId), where('date', 'in', dates), orderBy('date', 'asc'), orderBy('startTime', 'asc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((d) => toTeacherSession(Object.assign({ id: d.id }, d.data())));
            setSessions(data);
            setIsLoading(false);
        }, (err) => {
            console.error('useUpcomingSessions error', err);
            setError(err);
            setIsLoading(false);
        });
        return () => unsub();
    }, [teacherId]);
    return { sessions, isLoading, error };
};
